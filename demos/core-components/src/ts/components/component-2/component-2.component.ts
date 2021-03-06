import { Component, TemplateFunction } from "@ribajs/core";
import template from "./component-2.component.html";
import { ComponentsExampleScope } from "../components-example/components-example.component";

export interface Component2Scope {
  myInputVal: string;
  $parent: ComponentsExampleScope | null;
}

export class Component2Component extends Component {
  public static tagName = "rv-component-2";

  public scope: Component2Scope = {
    myInputVal: "",
    $parent: null,
  };

  constructor() {
    super();
  }

  static get observedAttributes(): string[] {
    return ["my-input-val"];
  }

  protected connectedCallback() {
    super.connectedCallback();
    this.init(Component2Component.observedAttributes);
  }

  protected async afterBind() {
    console.debug("scope", this.scope);
  }

  protected template(): ReturnType<TemplateFunction> {
    return template;
  }
}
