import { Component } from "@ribajs/core";
import { EventDispatcher } from "@ribajs/events";
import {
  getViewportDimensions,
  hasChildNodesTrim,
} from "@ribajs/utils/src/dom";
import { TOGGLE_BUTTON } from "../../constants";

type State =
  | "overlay-left"
  | "overlay-right"
  | "side-left"
  | "side-right"
  | "hidden";

interface Scope {
  /**
   * Selector string to get the container element from DOM
   */
  containerSelector?: string;
  /**
   * The current state of the sidebar, can be `'hidden'`, `'side-left'`, `'side-right'`, `'overlay-left'` or `'overlay-right'`
   */
  state: State;
  /**
   * The 'id' is required to react to events of the `bs4-toggle-button`, the `target-id` attribute of the `bs4-toggle-button` must be identical to this `id`
   */
  id?: string;
  /**
   * The width of the sidebar with unit
   */
  width: string;

  // Options
  /**
   * The sidebar can be positioned `right` or `left`
   */
  position: "left" | "right";
  /**
   * Auto show the sidebar if the viewport width is wider than this value
   */
  autoShowOnWiderThan: number;
  /**
   * Auto hide the sidebar if the viewport width is slimmer than this value
   */
  autoHideOnSlimmerThan: number;
  /**
   * Watch the routers `newPageReady` event to update the sidebar state, e.g. hide on slime than after route changes
   */
  watchNewPageReadyEvent: boolean;
  /**
   * You can force to hide the sidebar on corresponding URL pathnames e.g. you can hide the sidebar on home with `['/']`.
   */
  forceHideOnLocationPathnames: Array<string>;
  /**
   * Like `force-hide-on-location-pathnames`, but to force to open the sidebar
   */
  forceShowOnLocationPathnames: Array<string>;
  /**
   * If the viewport width is wider than this value the sidebar adds a margin to the container (detected with the `container-selector`) to reduce its content, if the viewport width is slimmer than this value the sidebar opens over the content
   */
  overlayOnSlimmerThan: number;

  // Template methods
  /**
   * Hides / closes the sidebar
   */
  hide: Bs4SidebarComponent["hide"];
  /**
   * Shows / opens the sidebar
   */
  show: Bs4SidebarComponent["show"];
  /**
   * Toggles (closes or opens) the sidebar
   */
  toggle: Bs4SidebarComponent["toggle"];
}

export class Bs4SidebarComponent extends Component {
  public static tagName = "bs4-sidebar";

  protected computedStyle?: CSSStyleDeclaration;

  protected autobind = true;

  static get observedAttributes() {
    return [
      "id",
      "container-selector",
      "position",
      "width",
      "auto-show-on-wider-than",
      "auto-hide-on-slimmer-than",
      "force-hide-on-location-pathnames",
      "force-show-on-location-pathnames",
      "overlay-on-slimmer-than",
      "watch-new-page-ready-event",
    ];
  }

  protected eventDispatcher?: EventDispatcher;

  protected routerEvents = new EventDispatcher("main");

  protected scope: Scope = {
    // template properties
    containerSelector: undefined,
    state: "hidden",
    id: undefined,
    width: "250px",

    // Options
    position: "left",
    autoShowOnWiderThan: 1199,
    autoHideOnSlimmerThan: 1200,
    watchNewPageReadyEvent: true,
    forceHideOnLocationPathnames: [],
    forceShowOnLocationPathnames: [],
    overlayOnSlimmerThan: 1200,

    // template methods
    hide: this.hide,
    show: this.show,
    toggle: this.toggle,
  };

  constructor() {
    super();
    // assign this to bound version, so we can remove window EventListener later without problem
    this.onEnvironmentChanges = this.onEnvironmentChanges.bind(this);
  }

  public setState(state: State) {
    this.scope.state = state;
  }

  public getState() {
    return this.scope.state;
  }

  public hide() {
    this.scope.state = "hidden";
    this.onStateChange();
  }

  public show() {
    const vw = getViewportDimensions().w;
    if (vw < this.scope.overlayOnSlimmerThan) {
      this.scope.state = ("overlay-" + this.scope.position) as State;
    } else {
      this.scope.state = ("side-" + this.scope.position) as State;
    }
    this.onStateChange();
  }

  public toggle() {
    if (this.scope.state === "hidden") {
      this.show();
    } else {
      this.hide();
    }
  }

  protected connectedCallback() {
    super.connectedCallback();
    this.init(Bs4SidebarComponent.observedAttributes);
    this.computedStyle = window.getComputedStyle(this);
    window.addEventListener("resize", this.onEnvironmentChanges, false);
    // initial
    this.onEnvironmentChanges();
  }

  protected initToggleButtonEventDispatcher() {
    if (this.eventDispatcher) {
      this.eventDispatcher.off(
        TOGGLE_BUTTON.eventNames.toggle,
        this.toggle,
        this
      );
      this.eventDispatcher.off(
        TOGGLE_BUTTON.eventNames.init,
        this.triggerState,
        this
      );
    }
    this.eventDispatcher = new EventDispatcher(
      TOGGLE_BUTTON.nsPrefix + this.scope.id
    );
    this.eventDispatcher.on(TOGGLE_BUTTON.eventNames.toggle, this.toggle, this);
    this.eventDispatcher.on(
      TOGGLE_BUTTON.eventNames.init,
      this.triggerState,
      this
    );
  }

  protected initRouterEventDispatcher() {
    if (this.scope.watchNewPageReadyEvent) {
      this.routerEvents.on("newPageReady", this.onEnvironmentChanges, this);
    }
  }

  protected onHidden() {
    this.setContainersStyle();
    const translateX = this.scope.position === "left" ? "-100%" : "100%";
    this.setAttribute(
      "style",
      `transform:translateX(${translateX});width:${this.scope.width};`
    );
  }

  protected onSide(direction: State) {
    this.setContainersStyle(undefined, "", direction);
    this.el.setAttribute(
      "style",
      `transform:translateX(0);width:${this.scope.width};`
    );
  }

  protected onOverlay(direction: State) {
    this.setContainersStyle(undefined, "", direction);
    this.el.setAttribute(
      "style",
      `transform:translateX(0);width:${this.scope.width};`
    );
  }

  protected triggerState() {
    this.eventDispatcher?.trigger("state", this.scope.state);
  }

  protected onStateChange() {
    switch (this.scope.state) {
      case "side-left":
      case "side-right":
        this.onSide(this.scope.state);
        break;
      case "overlay-left":
      case "overlay-right":
        this.onOverlay(this.scope.state);
        break;
      default:
        this.onHidden();
        break;
    }
    if (this.eventDispatcher) {
      this.eventDispatcher.trigger(
        TOGGLE_BUTTON.eventNames.toggled,
        this.scope.state
      );
    }
  }

  protected get width() {
    return this.offsetWidth ? this.offsetWidth + "px" : this.scope.width;
  }

  protected setStateByEnvironment() {
    if (
      this.scope.forceHideOnLocationPathnames.includes(window.location.pathname)
    ) {
      return this.hide();
    }
    if (
      this.scope.forceShowOnLocationPathnames.includes(window.location.pathname)
    ) {
      return this.show();
    }
    const vw = getViewportDimensions().w;
    if (
      this.scope.autoHideOnSlimmerThan > -1 &&
      vw < this.scope.autoHideOnSlimmerThan
    ) {
      return this.hide();
    }
    if (
      this.scope.autoShowOnWiderThan > -1 &&
      vw > this.scope.autoShowOnWiderThan
    ) {
      return this.show();
    }
  }

  /**
   * If viewport size changes, location url changes or something else
   */
  protected onEnvironmentChanges() {
    this.setStateByEnvironment();
  }

  protected getContainers() {
    return this.scope.containerSelector
      ? document.querySelectorAll<HTMLUnknownElement>(
          this.scope.containerSelector
        )
      : undefined;
  }

  protected initContainers() {
    const containers = this.getContainers();
    this.setContainersStyle(containers);
  }

  protected setContainersStyle(
    containers?: NodeListOf<HTMLUnknownElement>,
    style?: string,
    move?: State
  ) {
    if (!containers) {
      containers = this.getContainers();
    }
    if (containers) {
      for (let i = 0; i < containers.length; i++) {
        const container = containers[i];
        this.setContainerStyle(container, style, move);
      }
    }
  }

  /**
   * Sets the container style, takes overs always the transition style of this sidebar
   * @param container
   * @param style
   * @param move
   */
  protected setContainerStyle(
    container: HTMLUnknownElement,
    style = "",
    move?: State
  ) {
    if (move) {
      const width = this.width;
      const conStyle = window.getComputedStyle(container);
      switch (move) {
        case "side-left":
          switch (conStyle.position) {
            case "fixed":
              style += "left:" + width;
              break;
            default:
              style += "margin-left:" + width;
              break;
          }
          break;
        case "side-right":
          switch (conStyle.position) {
            case "fixed":
              style += "right:" + width;
              break;
            default:
              style += "margin-right:" + width;
              break;
          }
          break;
        default:
          break;
      }
    }
    return container.setAttribute(
      "style",
      `transition:${
        this.computedStyle ? this.computedStyle.transition : ""
      };${style}`
    );
  }

  protected async beforeBind() {
    await super.beforeBind();
    this.initRouterEventDispatcher();
    return this.onEnvironmentChanges();
  }

  protected async afterBind() {
    this.onEnvironmentChanges();
    await super.afterBind();
  }

  protected requiredAttributes() {
    return ["id"];
  }

  protected parsedAttributeChangedCallback(
    attributeName: string,
    oldValue: any,
    newValue: any,
    namespace: string | null
  ) {
    super.parsedAttributeChangedCallback(
      attributeName,
      oldValue,
      newValue,
      namespace
    );
    if (attributeName === "containerSelector") {
      this.initContainers();
    }
    if (attributeName === "id") {
      this.initToggleButtonEventDispatcher();
    }
  }

  // deconstruction
  protected disconnectedCallback() {
    super.disconnectedCallback();
    this.eventDispatcher?.off(
      TOGGLE_BUTTON.eventNames.init,
      this.triggerState,
      this
    );
    this.eventDispatcher?.off(
      TOGGLE_BUTTON.eventNames.toggle,
      this.toggle,
      this
    );
    this.routerEvents.off("newPageReady", this.onEnvironmentChanges, this);
    window.removeEventListener("resize", this.onEnvironmentChanges, false);
  }

  protected template() {
    if (!hasChildNodesTrim(this)) {
      console.warn(
        "No child elements found, this component as no template so you need to define your own as child of this component."
      );
    }
    return null;
  }
}
