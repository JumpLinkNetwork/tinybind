import { Component, EventDispatcher } from "@ribajs/core";
import template from "./button-example.component.html";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom";

export class ButtonExampleComponent extends Component {
  public static tagName = "rv-button-example";

  protected autobind = true;
  static get observedAttributes() {
    return [];
  }

  protected scope = {};

  protected eventDispatcher?: EventDispatcher;
  protected sidebarEventDispatcher?: EventDispatcher;

  constructor(element?: HTMLElement) {
    super(element);
  }

  protected connectedCallback() {
    super.connectedCallback();
    super.init(ButtonExampleComponent.observedAttributes);
    this.sidebarEventDispatcher = new EventDispatcher("main-sidebar");
    this.eventDispatcher = new EventDispatcher("button-test");
    this.eventDispatcher.on("toggle", this.toggle);
  }

  protected toggle() {
    console.log("toggle");
    this.eventDispatcher["bs4-toggle-button:main-sidebar"].trigger('toggle');
  }

  protected requiredAttributes() {
    return [];
  }

  protected template() {
    // Only set the component template if there no childs already
    if (hasChildNodesTrim(this.el)) {
      // console.debug('Do not use template, because element has child nodes');
      return null;
    } else {
      // console.debug('Use template', template);
      return template;
    }
  }
}
