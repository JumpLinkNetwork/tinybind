import {
  Bs5ContentsComponent,
  Scope as Bs5ContentsComponentScope,
} from "../bs5-contents/bs5-contents.component";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom";
import template from "./bs5-scrollspy.component.html";
import { TemplateFunction } from "@ribajs/core";

export interface Anchor {
  element: HTMLHeadingElement;
  href: string;
  title: string;
  childs: Anchor[];
}

export interface Scope extends Bs5ContentsComponentScope {
  /**
   * Pixels to offset from top when calculating position of scroll.
   */
  offset: number;
  /**
   * Pixels to offset from bottom when calculating position of scroll.
   */
  offsetBottom: number;
}

export class Bs5ScrollspyComponent extends Bs5ContentsComponent {
  public static tagName = "bs5-scrollspy";

  protected autobind = true;

  protected wrapperElement?: Element;

  static get observedAttributes(): string[] {
    return [
      "headers-start",
      "headers-depth",
      "find-header-id-depth",
      "header-parent-selector",
      "offset",
      "offset-bottom",
      "scroll-offset",
    ];
  }

  public scope: Scope = {
    headersDepth: 1,
    headersStart: 2,
    findHeaderIdDepth: 1,
    headerParentSelector: undefined,
    offset: 0,
    offsetBottom: 0,
    scrollOffset: 0,
    anchors: [],
  };

  constructor() {
    super();
  }

  protected connectedCallback() {
    super.connectedCallback();
    this.init(Bs5ScrollspyComponent.observedAttributes);
  }

  protected requiredAttributes(): string[] {
    return ["headersStart", "headersDepth", "headerParentSelector"];
  }

  protected template(): ReturnType<TemplateFunction> {
    // Only set the component template if there no childs already
    if (hasChildNodesTrim(this)) {
      return null;
    } else {
      return template;
    }
  }
}
