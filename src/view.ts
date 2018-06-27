import tinybind from './tinybind';
import { Binder, ITwoWayBinder } from './binders';
import { Binding } from './binding';
import { ComponentBinding } from './component-binding';
import { parseTemplate } from './parsers';
import { IViewOptions } from './export';
// import { Node } from 'babel-types';

export type TBlock = boolean;

export interface IDataElement extends Element {
  data?: string;
  _bound?: boolean
}

const textBinder: ITwoWayBinder<string> = {
  routine: (node: IDataElement, value: string) => {
    node.data = (value != null) ? value : '';
  }
};

const DECLARATION_SPLIT = /((?:'[^']*')*(?:(?:[^\|']*(?:'[^']*')+[^\|']*)+|[^\|]+))|^$/g;

const parseNode = (view: View, node: IDataElement) => {
  let block: TBlock = false;

  // if node.nodeType === Node.TEXT_NODE
  node = ( node as IDataElement);
  if (node.nodeType === 3) {
    if(!node.data) {
      throw new Error('node has no data');
    }
    let tokens = parseTemplate(node.data, tinybind.templateDelimiters);

    if (tokens) {
      if(!node.parentNode) {
        throw new Error('Node has no parent node');
      }
      for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];
        let text = document.createTextNode(token.value);
        node.parentNode.insertBefore(text, node);
        if (token.type === 1) {
          view.buildBinding(text, null, token.value, textBinder, null);
        }
      }
      node.parentNode.removeChild(node);
    }
    block = true;
  } else if (node.nodeType === 1) {
    block = view.traverse(node);
  }

  if (!block) {
    for (let i = 0; i < node.childNodes.length; i++) {
      parseNode(view, (node.childNodes[i] as IDataElement));
    }
  }
};

const bindingComparator = (a: Binding, b: Binding) => {
  let aPriority = a.binder ? ((a.binder as ITwoWayBinder<any>).priority || 0) : 0;
  let bPriority = b.binder ? ((b.binder as ITwoWayBinder<any>).priority || 0) : 0;
  return bPriority - aPriority;
};

const trimStr = (str: string) => {
  return str.trim();
};

// A collection of bindings built from a set of parent nodes.
export class View {

  els: HTMLCollection | Element[] | Node[];
  models: any;
  options: IViewOptions;
  bindings: Binding[] = [];
  componentView: View | null = null;

  // The DOM elements and the model objects for binding are passed into the
  // constructor along with any local options that should be used throughout the
  // context of the view and it's bindings.
  constructor(els: HTMLCollection | Element | Node, models: any, options: IViewOptions) {
    if (els instanceof Array) {
      this.els = els;
    } else {
      this.els = ([els] as Element[] | Node[] );
    }

    this.models = models;
    this.options = options;

    this.build();
  }

  public buildBinding(node: Element | Text, type: string | null, declaration: string, binder: Binder<any>, args: string[] | null) {
    let matches = declaration.match(DECLARATION_SPLIT);
    if(matches === null) {
      throw new Error('no matches');
    }
    let pipes = matches.map(trimStr);
    let keypath = pipes.shift();
    this.bindings.push(new Binding((this as View), node, type, keypath, binder, args, pipes));
  }

  // Parses the DOM tree and builds `Binding` instances for every matched
  // binding declaration.
  build() {
    this.bindings = [];

    let elements = this.els, i, len;
    for (i = 0, len = elements.length; i < len; i++) {
      parseNode(this, (elements[i] as IDataElement));
    }

    this.bindings.sort(bindingComparator);
  }

  traverse(node: IDataElement): TBlock {
    let bindingPrefix = tinybind._fullPrefix;
    let block = node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE';
    let attributes = node.attributes;
    let bindInfos = [];
    let starBinders = this.options.starBinders;
    var type, binder, identifier, args;


    for (let i = 0, len = attributes.length; i < len; i++) {
      let attribute = attributes[i];
      // if attribute starts with the binding prefix. E.g. rv
      if (attribute.name.indexOf(bindingPrefix) === 0) {
        type = attribute.name.slice(bindingPrefix.length);
        binder = this.options.binders[type];
        args = [];

        if (!binder) {
          for (let k = 0; k < starBinders.length; k++) {
            identifier = starBinders[k];
            if (type.slice(0, identifier.length - 1) === identifier.slice(0, -1)) {
              binder = this.options.binders[identifier];
              args.push(type.slice(identifier.length - 1));
              break;
            }
          }
        }

        if (!binder) {
          binder = tinybind.fallbackBinder;
        }

        if ((binder as ITwoWayBinder<any>).block) {
          this.buildBinding(node, type, attribute.value, binder, args);
          node.removeAttribute(attribute.name);
          return true;
        }

        bindInfos.push({attr: attribute, binder: binder, type: type, args: args});
      }
    }

    for (let i = 0; i < bindInfos.length; i++) {
      let bindInfo = bindInfos[i];
      this.buildBinding(node, bindInfo.type, bindInfo.attr.value, bindInfo.binder, bindInfo.args);
      node.removeAttribute(bindInfo.attr.name);
    }

    // bind components
    if (!block) {
      type = node.nodeName.toLowerCase();

      if (this.options.components[type] && !node._bound) {
        this.bindings.push(new ComponentBinding((this as View), node, type));
        block = true;
      }
    }

    return block;
  }

  // Binds all of the current bindings for this view.
  bind() {
    this.bindings.forEach(binding => {
      binding.bind();
    });
  }

  // Unbinds all of the current bindings for this view.
  unbind() {
    if(Array.isArray(this.bindings)) {
      this.bindings.forEach(binding => {
        binding.unbind();
      });
    }
    if(this.componentView) {
      this.componentView.unbind();
    }
  }

  // Syncs up the view with the model by running the routines on all bindings.
  sync() {
    this.bindings.forEach(binding => {
      binding.sync();
    });
  }

  // Publishes the input values from the view back to the model (reverse sync).
  publish() {
    this.bindings.forEach(binding => {
      if (binding.binder && (binding.binder as ITwoWayBinder<any>).publishes) {
        binding.publish();
      }
    });
  }

  // Updates the view's models along with any affected bindings.
  update(models: any = {}) {
    Object.keys(models).forEach(key => {
      this.models[key] = models[key];
    });

    this.bindings.forEach(binding => {
      if (binding.update) {
        binding.update(models);
      }
    });
  }
}