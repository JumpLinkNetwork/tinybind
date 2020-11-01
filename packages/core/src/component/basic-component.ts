/**
 * Autoparse custom element attributes and add fallback support for browser with no native custom element support
 *
 * @see https://developer.mozilla.org/de/docs/Web/Web_Components/Using_custom_elements
 */
import "@ribajs/types";
import {
  EventHandler,
  ObservedAttributesToCheck,
  HMRStatus,
  TypeOfComponent,
} from "../interfaces";
import { Binding } from "../binding";
import { parseJsonString, camelCase } from "@ribajs/utils/src/type";
import { getRandomColor } from "@ribajs/utils/src/color";
import { FakeHTMLElement } from "./fake-html-element";

export abstract class BasicComponent extends FakeHTMLElement {
  public static tagName: string;

  public _debug = false;
  public _color?: string;
  public _fallback = false;

  protected templateLoaded = false;

  /**
   * Used to check if all passed observedAttributes are initialized
   */
  protected observedAttributesToCheck: ObservedAttributesToCheck = {};

  protected observedAttributes: string[] = [];

  protected el: HTMLElement;

  protected abstract scope: any;

  protected attributeObserverFallback?: MutationObserver;

  protected onHMRStatusChanged?: (status: HMRStatus | string) => void;

  constructor(element?: HTMLUnknownElement) {
    super(element);

    if (this._debug) {
      this._color = getRandomColor();
    }

    if (element) {
      this.el = element;
    } else if (window.customElements) {
      this.el = (this as unknown) as HTMLElement;
    } else {
      throw new Error(
        `element is required on browsers without custom elements support`
      );
    }
    this.onParentChanged = this.onParentChanged.bind(this);
    this.onRibaAttributeChanged = this.onRibaAttributeChanged.bind(this);
  }

  /**
   * Init HMR support
   * @see https://webpack.js.org/api/hot-module-replacement/
   */
  protected initHMR(module: NodeModule, updatedClass: TypeOfComponent) {
    if (module?.hot) {
      console.debug("HMR mode detected");
      module?.hot?.accept();
      // Remove the old status changed listener if defined
      if (this.onHMRStatusChanged) {
        module.hot.removeStatusHandler(this.onHMRStatusChanged);
      }

      this.onHMRStatusChanged = this._onHMRStatusChanged.bind(
        this,
        module,
        updatedClass
      );
      module.hot.addStatusHandler(this.onHMRStatusChanged);
    }
  }

  protected _onHMRStatusChanged(
    module: NodeModule,
    updatedClass: TypeOfComponent,
    status: HMRStatus | string
  ) {
    console.debug("HMR status changed: " + status);
    module?.hot?.accept();
    if (status === "apply") {
      console.debug("HMR reload..");
      this.patch(updatedClass);
      this.reload();
      // this.connectedCallback();
    }
  }

  /**
   * Remove this custom element
   */
  public remove() {
    if (this.el && this.el.parentElement) {
      this.el.parentElement.removeChild(this.el);
      if (!(window as any).customElements || this._fallback) {
        this.disconnectedFallbackCallback();
      }
    }
  }

  /**
   * see https://github.com/vegarringdal/custom-elements-hmr-polyfill/blob/master/src/package/polyfill/patch.ts
   * @param updatedClass
   */
  protected patch(updatedClass: TypeOfComponent) {
    const BLACKLISTED_PATCH_METHODS = ["observedAttributes"];
    const probNames = Object.getOwnPropertyNames(updatedClass).filter(
      (propName) => BLACKLISTED_PATCH_METHODS.indexOf(propName) === -1
    );
    for (const propName of probNames) {
      const propertyDescriptor = Object.getOwnPropertyDescriptor(
        updatedClass,
        propName
      );
      if (propertyDescriptor) {
        Object.defineProperty(this, propName, propertyDescriptor);
      }
    }
    // Object.setPrototypeOf(this, updatedClass.prototype);
  }

  public reload() {
    console.log("reload");
    this.el.parentElement?.replaceChild(this.el, this.el);
  }

  public connectedFallbackCallback() {
    // this.debug(`Called connectedFallbackCallback`);
    this.connectedCallback();
  }

  public disconnectedFallbackCallback() {
    // this.debug(`Called disconnectedFallbackCallback`);
    this.disconnectedCallback();
  }

  protected abstract template():
    | HTMLElement
    | string
    | null
    | Promise<HTMLElement | string | null>;

  protected debug(...args: unknown[]) {
    if (!this._debug) {
      return;
    }
    if (typeof args[0] === "string") {
      const name = this.constructor.name || this.el.tagName;
      if (this._color) {
        args[0] = `%c[${name}] ${args[0]}`;
        args.splice(1, 0, `color: ${this._color};`);
      } else {
        args[0] = `[${name}] ${args[0]}`;
      }
    }
    console.debug(...args);
  }

  /**
   * returns a list of attributes wich are required until the riba binding starts
   */
  protected requiredAttributes(): string[] {
    return [];
  }

  protected async init(observedAttributes: string[]) {
    this.initAttributeObserver(observedAttributes);
    this.initRibaAttributeObserver(observedAttributes);
    this.getPassedObservedAttributes(observedAttributes);
    return;
  }

  protected ready() {
    return (
      this.allPassedObservedAttributesAreInitialized() &&
      this.checkRequiredAttributes()
    );
  }

  /**
   * Check if the attribute (e.g. `src`) is passed to this custom element
   * @param observedAttribute
   */
  protected attributeIsPassed(observedAttribute: string) {
    return this.el.hasAttribute(observedAttribute);
  }

  /**
   * Get passed observed attributes, used to check if all passed attributes are initialized
   * @param observedAttributes
   */
  protected getPassedObservedAttributes(observedAttributes: string[]) {
    const oa2c = this.observedAttributesToCheck;
    for (const observedAttribute of observedAttributes) {
      if (!oa2c[observedAttribute]) {
        oa2c[observedAttribute] = { passed: false, initialized: false };
      } else {
        if (!oa2c[observedAttribute].passed) {
          oa2c[observedAttribute].passed = this.attributeIsPassed(
            observedAttribute
          );
        }
      }
    }
  }

  /**
   * Checks if all passed observed attributes are initialized
   */
  protected allPassedObservedAttributesAreInitialized() {
    return Object.keys(this.observedAttributesToCheck).every(
      (key) =>
        !this.observedAttributesToCheck[key]?.passed ||
        this.observedAttributesToCheck[key]?.initialized
    );
  }

  /**
   * Required attributes before the view is bound
   *
   * The attributeChangedCallback is called for each attribute wich updates the riba view each time
   * which can have a big impact on performance or required attributes are not yet available which can lead to errors.
   * So define required attriutes and the view is ony bind the first time after all this attributes are transmitted.
   */
  protected checkRequiredAttributes() {
    return this.requiredAttributes().every(
      // eslint-disable-next-line no-prototype-builtins
      (requiredAttribute) => this.scope.hasOwnProperty(requiredAttribute)
    );
  }

  protected parseAttribute(attr: string | null) {
    let value: any = attr;
    if (attr === "true") {
      value = true;
    } else if (attr === "false") {
      value = false;
    } else if (attr === "null") {
      value = null;
    } else if (attr === "undefined") {
      value = undefined;
    } else if (attr === "") {
      value = undefined;
    } else if (!isNaN(Number(attr))) {
      value = Number(attr);
      // If number is too large store the value as string
      if (value >= Number.MAX_SAFE_INTEGER) {
        value = attr;
      }
    } else {
      const jsonString = parseJsonString(value);
      value = jsonString ? jsonString : value;
    }
    return value;
  }

  /**
   * Returns an event handler for the bindings (most on-*) inside this component.
   */
  protected eventHandler(self: BasicComponent): EventHandler {
    // IMPORTANT this must be a function and not a Arrow Functions
    return function (
      context: Binding,
      event: Event,
      binding: Binding,
      el: HTMLElement
    ) {
      if (!this || !this.call) {
        const error = new Error(
          `[rv-${binding.type}="${binding.keypath}"] Event handler "${binding.keypath}" not found!"`
        );
        console.error(binding, el);
        throw error;
      }

      this.call(self, event, binding.view.models, el);
    };
  }

  /**
   * Default custom Element method
   * Invoked when the custom element is first connected to the document's DOM.
   */
  protected connectedCallback() {
    // console.warn('connectedCallback called');
    console.log("connectedCallback");
  }

  /**
   * Default custom Element method
   * Invoked when the custom element is disconnected from the document's DOM.
   */
  protected disconnectedCallback() {
    console.log("disconnectedCallback");
    // if (this.bound && this.view) {
    //   // IMPORTANT ROUTE FIXME, if we unbind the component then it will no longer work if it is retrieved from the cache and the connectedCallback is called
    //   // because the riba attributes are removed. We need a solution for that, maybe we do not remove the attributes or we recreate the attributes
    //   // See view bind / unbind methods for that.
    //   // only unbind if cache is not enabled?
    //   this.unbind();
    // }

    if (this.attributeObserverFallback) {
      this.attributeObserverFallback.disconnect();
    }

    this.removeEventListenerForRibaParent();
    this.removeEventListenersForRibaAttributes(this.observedAttributes);
  }

  /**
   * Default custom Element method
   * Invoked when one of the custom element's attributes is added, removed, or changed.
   * @param attributeName
   * @param oldValue
   * @param newValue
   * @param namespace
   */
  protected attributeChangedCallback(
    attributeName: string,
    oldValue: any,
    newValue: any,
    namespace: string | null
  ) {
    // this.debug("attributeChangedCallback", attributeName, newValue);
    if (
      this.observedAttributesToCheck &&
      this.observedAttributesToCheck[attributeName]
    ) {
      this.observedAttributesToCheck[attributeName].initialized = true;
    }

    newValue = this.parseAttribute(newValue);

    if (oldValue !== newValue) {
      this.notifyRibaAttributeChanged(
        attributeName,
        oldValue,
        newValue,
        namespace
      );
    }

    const parsedAttributeName = camelCase(attributeName);

    if (this.scope && this.scope[parsedAttributeName]) {
      oldValue = this.scope[parsedAttributeName];
    }

    // automatically inject observed attributes to view scope
    this.scope[parsedAttributeName] = newValue;

    // call custom attribute changed callback with parsed values
    this.parsedAttributeChangedCallback(
      parsedAttributeName,
      oldValue,
      newValue,
      namespace
    );
  }

  /**
   * Similar to attributeChangedCallback but attribute arguments are already parsed as they are stored in the scope
   * @param attributeName
   * @param oldValue
   * @param newValue
   * @param namespace
   */
  protected parsedAttributeChangedCallback(
    attributeName: string,
    oldValue: any,
    newValue: any,
    namespace: string | null
  ) {
    this.debug(
      "parsedAttributeChangedCallback called",
      attributeName,
      oldValue,
      newValue,
      namespace
    );
  }

  /**
   * Default custom Element method
   * Invoked when one of the custom element's attributes is added, removed, or changed.
   * Note: Not supported on polyfill: https://github.com/webcomponents/custom-elements#known-bugs-and-limitations
   * @param oldDocument
   * @param newDocument
   */
  protected adoptedCallback(oldDocument: Document, newDocument: Document) {
    this.debug("adoptedCallback called", oldDocument, newDocument);
  }

  protected async loadTemplate(): Promise<HTMLElement | string | null> {
    if (this.templateLoaded === true) {
      // this.debug("template already loaded");
      return null;
    }

    if (!this.checkRequiredAttributes()) {
      this.debug("Not all required attributes are set to load the template");
      return null;
    }

    this.templateLoaded = true;

    // if innerHTML is null this component uses the innerHTML which he already has!
    return Promise.resolve(this.template())
      .then((template) => {
        if (template instanceof HTMLElement) {
          this.el.innerHTML = "";
          this.el.appendChild(template as HTMLElement);
        } else if (template !== null) {
          this.el.innerHTML = template as string;
        }

        return template;
      })
      .catch((error) => {
        console.error(error);
        this.templateLoaded = false;
        return null;
      });
  }

  protected async beforeTemplate(): Promise<any> {
    // this.debug('beforeTemplate');
  }

  protected async afterTemplate(
    template: HTMLElement | string | null
  ): Promise<any> {
    this.debug("afterTemplate", template);
  }

  protected async onReady(): Promise<any> {
    // this.debug('onReady', this.bound);
  }

  /**
   * This is for the rv-co-attribute binder
   * TODO only notify attributes wich are passed as rv-co-*="*"
   * @param attrName
   * @param oldValue
   * @param newValue
   * @param namespace
   */
  protected notifyRibaAttributeChanged(
    attrName: string,
    oldValue: any,
    newValue: any,
    namespace: any
  ) {
    this.el.dispatchEvent(
      new CustomEvent("notify-attribute-change:" + attrName, {
        detail: {
          name: attrName,
          oldValue,
          newValue,
          namespace,
        },
      })
    );
  }

  protected askForRibaParent() {
    this.el.dispatchEvent(new CustomEvent("ask-for-parent"));
  }

  protected askForRibaAttribute(attrName: string) {
    //TODO Fix if co-* has different keypath as attribute name
    const eventName = "ask-for-attribute:" + attrName;
    // this.debug("Trigger " + eventName);
    this.el.dispatchEvent(new CustomEvent(eventName));
  }

  protected askForRibaAttributes(observedAttributes: string[]) {
    for (const observedAttribute of observedAttributes) {
      this.askForRibaAttribute(observedAttribute);
    }
  }

  protected onParentChanged(event: CustomEvent) {
    // this.debug("onParentChanged", event.detail);
    this.scope.$parent = event.detail;
  }

  protected onRibaAttributeChanged(event: CustomEvent) {
    const data = (event as CustomEvent).detail;
    this.debug("onRibaAttributeChanged", data);
    const oldValue = this.scope[data.name];
    this.attributeChangedCallback(
      data.name,
      oldValue,
      data.newValue,
      data.namespace
    );
  }

  protected listenForRibaParent() {
    this.el.addEventListener("parent" as any, this.onParentChanged);
  }

  protected removeEventListenerForRibaParent() {
    this.el.removeEventListener("parent" as any, this.onParentChanged);
  }

  protected listenForRibaAttribute(attrName: string) {
    const eventName = "attribute:" + attrName;
    this.debug("Listen for " + eventName);
    this.el.addEventListener(eventName as any, this.onRibaAttributeChanged);
  }

  protected removeEventListenerForRibaAttribute(attrName: string) {
    this.el.removeEventListener(
      ("attribute:" + attrName) as any,
      this.onRibaAttributeChanged
    );
  }

  /**
   * This is for the co-attribute-binder
   * TODO only watch for attributes passed as rv-co-* and not all
   * @param observedAttributes
   */
  protected listenForRibaAttributes(observedAttributes: string[]) {
    for (const observedAttribute of observedAttributes) {
      this.listenForRibaAttribute(observedAttribute);
    }
  }

  protected removeEventListenersForRibaAttributes(
    observedAttributes: string[]
  ) {
    for (const observedAttribute of observedAttributes) {
      this.removeEventListenerForRibaAttribute(observedAttribute);
    }
  }

  protected initRibaAttributeObserver(observedAttributes: string[]) {
    this.listenForRibaParent();
    this.listenForRibaAttributes(observedAttributes);
    this.askForRibaParent();
    this.askForRibaAttributes(observedAttributes);
  }

  /**
   * Load all attributes and calls the attributeChangedCallback for each attribute.
   * This method is used for fallback implementations, normally the browser calls the attributeChangedCallback for you
   */
  protected loadAttributes(observedAttributes: string[]) {
    const attributes = this.el.attributes;
    for (const i in attributes) {
      const attribute: Node = attributes[i];
      const name = attribute.nodeName;
      if (observedAttributes.indexOf(name) !== -1) {
        const newValue = attribute.nodeValue;
        this.attributeChangedCallback(name, undefined, newValue, null);
      }
    }
  }

  /**
   * Event handler to listen attribute change event as fallback for MutationObserver
   */
  protected initAttributeObserver(observedAttributes: string[]) {
    this.loadAttributes(observedAttributes);
    this.observedAttributes = observedAttributes;
    if (
      (window as any).customElements &&
      !this._fallback &&
      !(window as any).forceComponentFallback
    ) {
      // use native implementaion
      // this.debug("initAttributeObserver: Use native implementaion");
    } else {
      if ((window as any).MutationObserver) {
        // use MutationObserver as fallback
        this.attributeObserverFallback = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === "attributes") {
              if (mutation.attributeName) {
                // if this attribute is a watched attribute
                if (observedAttributes.indexOf(mutation.attributeName) !== -1) {
                  const newValue = this.el.getAttribute(mutation.attributeName);
                  this.attributeChangedCallback(
                    mutation.attributeName,
                    mutation.oldValue,
                    newValue,
                    mutation.attributeNamespace
                  );
                }
              }
            }
          });
        });
        this.attributeObserverFallback.observe(this.el, {
          attributes: true,
        });
      }
    }
  }
}
