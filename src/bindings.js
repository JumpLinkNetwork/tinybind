import rivets from './rivets'
import {parseType} from './parsers'
import {EXTENSIONS, OPTIONS} from './constants'
import Observer from './observer'

//there's a cyclic dependency that makes imported View a dummy object
//import View from './view'

const defined = (value) => {
  return value !== undefined && value !== null
}

function getInputValue(el) {
  let results = []
  if (el.type === 'checkbox') {
    return el.checked
  } else if (el.type === 'select-multiple') {

    el.options.forEach(option => {
      if (option.selected) {
        results.push(option.value)
      }
    })

    return results
  } else {
    return el.value
  }
}

// A single binding between a model attribute and a DOM element.
export class Binding {
  // All information about the binding is passed into the constructor; the
  // containing view, the DOM node, the type of binding, the model object and the
  // keypath at which to listen for changes.
  constructor(view, el, type, keypath, binder, arg, options) {
    this.view = view
    this.el = el
    this.type = type
    this.keypath = keypath
    this.options = options
    this.formatters = options.formatters || []
    this.dependencies = []
    this.formatterObservers = {}
    this.model = undefined
    this.binder = binder
    this.arg = arg
    this.sync = this.sync.bind(this)
  }

  // Observes the object keypath to run the provided callback.
  observe(obj, keypath, callback) {
    return new Observer(obj, keypath, callback, {
      root: this.view.rootInterface,
      adapters: this.view.adapters
    })
  }

  parseTarget() {
    if (this.keypath) {
      let token = parseType(this.keypath)

      if (token.type === 0) {
        this.value = token.value
      } else {
        this.observer = this.observe(this.view.models, this.keypath, this.sync)
        this.model = this.observer.target
      }
    } else {
      this.value = undefined;
    }
  }

  parseFormatterArguments(args, formatterIndex) {
    return args
      .map(parseType)
      .map(({type, value}, ai) => {
        if (type === 0) {
          return value
        } else {
          if (!defined(this.formatterObservers[formatterIndex])) {
            this.formatterObservers[formatterIndex] = {}
          }

          let observer = this.formatterObservers[formatterIndex][ai]

          if (!observer) {
            observer = this.observe(this.view.models, value, this.sync)
            this.formatterObservers[formatterIndex][ai] = observer
          }

          return observer.value()
        }
      })
  }

  // Applies all the current formatters to the supplied value and returns the
  // formatted value.
  formattedValue(value) {
    this.formatters.forEach((formatterStr, fi) => {
      let args = formatterStr.match(/[^\s']+|'([^']|'[^\s])*'|"([^"]|"[^\s])*"/g)
      let id = args.shift()
      let formatter = this.view.formatters[id]

      const processedArgs = this.parseFormatterArguments(args, fi)

      if (formatter && (formatter.read instanceof Function)) {
        value = formatter.read(value, ...processedArgs)
      } else if (formatter instanceof Function) {
        value = formatter(value, ...processedArgs)
      }
    })

    return value
  }

  // Returns an event handler for the binding around the supplied function.
  eventHandler(fn) {
    let binding = this
    let handler = binding.view.handler

    return function(ev) {
      handler.call(fn, this, ev, binding)
    }
  }

  // Sets the value for the binding. This Basically just runs the binding routine
  // with the supplied value formatted.
  set(value) {
    if ((value instanceof Function) && !this.binder.function) {
      value = this.formattedValue(value.call(this.model))
    } else {
      value = this.formattedValue(value)
    }

    let routineFn = this.binder.routine || this.binder

    if (routineFn instanceof Function) {
      routineFn.call(this, this.el, value)
    }
  }

  // Syncs up the view binding with the model.
  sync() {
    if (this.observer) {
      if (this.model !== this.observer.target) {
        let deps = this.options.dependencies

        this.dependencies.forEach(observer => {
          observer.unobserve()
        })

        this.dependencies = []
        this.model = this.observer.target

        if (defined(this.model) && deps && deps.length) {
          deps.forEach(dependency => {
            let observer = this.observe(this.model, dependency, this.sync)
            this.dependencies.push(observer)
          })
        }
      }

      this.set(this.observer.value())
    } else {
      this.set(this.value)
    }
  }

  // Publishes the value currently set on the input element back to the model.
  publish() {
    var value, lastformatterIndex;
    if (this.observer) {
      value = this.getValue(this.el)
      lastformatterIndex = this.formatters.length - 1

      this.formatters.slice(0).reverse().forEach((formatter, fiReversed) => {
        const fi = lastformatterIndex - fiReversed
        const args = formatter.split(/\s+/)
        const id = args.shift()
        const f = this.view.formatters[id]
        const processedArgs = this.parseFormatterArguments(args, fi)

        if (f && f.publish) {
          value = f.publish(value, ...processedArgs)
        }
      })

      this.observer.setValue(value)
    }
  }

  // Subscribes to the model for changes at the specified keypath. Bi-directional
  // routines will also listen for changes on the element to propagate them back
  // to the model.
  bind() {
    this.parseTarget()

    if (defined(this.binder.bind)) {
      this.binder.bind.call(this, this.el)
    }

    if (defined(this.model) && defined(this.options.dependencies)) {
      this.options.dependencies.forEach(dependency => {
        let observer = this.observe(this.model, dependency, this.sync)
        this.dependencies.push(observer)
      })
    }

    if (this.view.preloadData) {
      this.sync()
    }
  }

  // Unsubscribes from the model and the element.
  unbind() {
    if (defined(this.binder.unbind)) {
      this.binder.unbind.call(this, this.el)
    }

    if (defined(this.observer)) {
      this.observer.unobserve()
    }


    this.dependencies.forEach(observer => {
      observer.unobserve()
    })

    this.dependencies = []

    Object.keys(this.formatterObservers).forEach(fi => {
      let args = this.formatterObservers[fi]

      Object.keys(args).forEach(ai => {
        args[ai].unobserve()
      })
    })

    this.formatterObservers = {}
  }

  // Updates the binding's model from what is currently set on the view. Unbinds
  // the old model first and then re-binds with the new model.
  update(models = {}) {
    if (defined(this.observer)) {
      this.model = this.observer.target
    }

    if (defined(this.binder.update)) {
      this.binder.update.call(this, models)
    }
  }

  // Returns elements value
  getValue(el) {
    if (this.binder && defined(this.binder.getValue)) {
      return this.binder.getValue.call(this, el)
    } else {
      return getInputValue(el)
    }
  }
}

// component view encapsulated as a binding within it's parent view.
export class ComponentBinding extends Binding {
  // Initializes a component binding for the specified view. The raw component
  // element is passed in along with the component type. Attributes and scope
  // inflections are determined based on the components defined attributes.
  constructor(view, el, type) {
    this.view = view
    this.el = el
    this.type = type
    this.component = this.view.components[this.type]
    this.static = {}
    this.observers = {}
    this.upstreamObservers = {}

    let bindingPrefix = rivets._fullPrefix

    for (let i = 0, len = el.attributes.length; i < len; i++) {
      let attribute = el.attributes[i];
      if (attribute.name.indexOf(bindingPrefix) !== 0) {
        let propertyName = this.camelCase(attribute.name)
        let stat = this.component.static

        if (stat && stat.indexOf(propertyName) > -1) {
          this.static[propertyName] = attribute.value
        } else {
          this.observers[propertyName] = attribute.value
        }
      }
    }
  }


  // Intercepts `Rivets.Binding::sync` since component bindings are not bound to
  // a particular model to update it's value.
  sync() {}

  // Intercepts `Rivets.Binding::update` since component bindings are not bound
  // to a particular model to update it's value.
  update() {}

  // Intercepts `Rivets.Binding::publish` since component bindings are not bound
  // to a particular model to update it's value.
  publish() {}

  // Returns an object map using the component's scope inflections.
  locals() {
    let result = {}

    Object.keys(this.static).forEach(key => {
      result[key] = this.static[key]
    })

    Object.keys(this.observers).forEach(key => {
      result[key] = this.observers[key].value()
    })

    return result
  }

  // Returns a camel-cased version of the string. Used when translating an
  // element's attribute name into a property name for the component's scope.
  camelCase(string) {
    return string.replace(/-([a-z])/g, grouped => {
      grouped[1].toUpperCase()
    })
  }

  // Intercepts `Rivets.Binding::bind` to build `@componentView` with a localized
  // map of models from the root view. Bind `@componentView` on subsequent calls.
  bind() {
    var options = {}
    if (!this.bound) {
      Object.keys(this.observers).forEach(key => {
        let keypath = this.observers[key]

        this.observers[key] = this.observe(this.view.models, keypath, (key => {
          return () => {
            this.componentView.models[key] = this.observers[key].value()
          }
        }).call(this, key))
      })

      this.bound = true
    }

    if (this.componentView) {
      this.componentView.bind()
    } else {
      this.el.innerHTML = this.component.template.call(this)
      let scope = this.component.initialize.call(this, this.el, this.locals())
      this.el._bound = true


      EXTENSIONS.forEach(extensionType => {
        options[extensionType] = {}

        if (this.component[extensionType]) {
          Object.keys(this.component[extensionType]).forEach(key => {
            options[extensionType][key] = this.component[extensionType][key]
          })
        }

        Object.keys(this.view[extensionType]).forEach(key => {
          if (!defined(options[extensionType][key])) {
            options[extensionType][key] = this.view[extensionType][key]
          }
        })
      })

      OPTIONS.forEach(option => {
        if (defined(this.component[option])) {
          options[option] = this.component[option]
        } else {
          options[option] = this.view[option]
        }
      })

      //there's a cyclic dependency that makes imported View a dummy object. Use rivets.bind
      //this.componentView = new View(this.el, scope, options)
      //this.componentView.bind()
      this.componentView = rivets.bind(Array.prototype.slice.call(this.el.childNodes), scope, options);

      Object.keys(this.observers).forEach(key => {
        let observer = this.observers[key]
        let models = this.componentView.models

        let upstream = this.observe(models, key, ((key, observer) => {
          return () => {
            observer.setValue(this.componentView.models[key])
          }
        }).call(this, key, observer))

        this.upstreamObservers[key] = upstream
      })
    }
  }

  // Intercept `Rivets.Binding::unbind` to be called on `@componentView`.
  unbind() {
    Object.keys(this.upstreamObservers).forEach(key => {
      this.upstreamObservers[key].unobserve()
    })

    Object.keys(this.observers).forEach(key => {
      this.observers[key].unobserve()
    })

    if (defined(this.componentView)) {
      this.componentView.unbind.call(this)
    }
  }
}