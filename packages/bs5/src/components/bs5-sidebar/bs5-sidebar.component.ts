import { Component, TemplateFunction } from "@ribajs/core";
import { TouchEventsService, TouchSwipeData } from "@ribajs/extras";
import { EventDispatcher } from "@ribajs/events";
import { TOGGLE_BUTTON } from "../../constants";
import { Bs5Service } from "../../services";
import {
  getViewportDimensions,
  hasChildNodesTrim,
} from "@ribajs/utils/src/dom";
import { throttle } from "@ribajs/utils/src/control";

type State =
  | "overlay-left"
  | "overlay-right"
  | "side-left"
  | "side-right"
  | "move-left"
  | "move-right"
  | "hidden";

interface Scope {
  // Template properties

  /**
   * Selector string to get the container element from DOM
   */
  containerSelector?: string;
  /**
   * The current state of the sidebar, can be `'hidden'`, `'side-left'`, `'side-right'`, `'overlay-left'` or `'overlay-right'`
   */
  state: State;
  /**
   * The last state before the state was changed
   */
  oldState: State;
  /**
   * The 'id' is required to react to events of the `bs5-toggle-button`, the `target-id` attribute of the `bs5-toggle-button` must be identical to this `id`
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
   * The sidebar can be move the full page (iPhone style) or overlap (Android style)
   */
  mode: "overlap" | "move";
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

  /**
   * Close sidebar on swipe
   */
  closeOnSwipe: boolean;

  // Template methods

  /**
   * Hides / closes the sidebar
   */
  hide: Bs5SidebarComponent["hide"];
  /**
   * Shows / opens the sidebar
   */
  show: Bs5SidebarComponent["show"];
  /**
   * Toggles (closes or opens) the sidebar
   */
  toggle: Bs5SidebarComponent["toggle"];
}

export class Bs5SidebarComponent extends Component {
  public static tagName = "bs5-sidebar";

  protected computedStyle?: CSSStyleDeclaration;

  protected autobind = true;

  protected bs5: Bs5Service;

  protected touch: TouchEventsService = new TouchEventsService(this);

  static get observedAttributes(): string[] {
    return [
      "id",
      "container-selector",
      "position",
      "mode",
      "width",
      "auto-show-on-wider-than",
      "auto-hide-on-slimmer-than",
      "force-hide-on-location-pathnames",
      "force-show-on-location-pathnames",
      "overlay-on-slimmer-than",
      "watch-new-page-ready-event",
      "close-on-swipe",
    ];
  }

  protected eventDispatcher?: EventDispatcher;

  protected routerEvents = new EventDispatcher("main");

  public scope: Scope = {
    // Template properties
    containerSelector: undefined,
    state: "hidden",
    oldState: "hidden",
    id: undefined,
    width: "250px",

    // Options
    position: "left",
    mode: "overlap",
    autoShowOnWiderThan: -1,
    autoHideOnSlimmerThan: -1,
    watchNewPageReadyEvent: true,
    forceHideOnLocationPathnames: [],
    forceShowOnLocationPathnames: [],
    overlayOnSlimmerThan: -1,
    closeOnSwipe: true,

    // Template methods
    hide: this.hide,
    show: this.show,
    toggle: this.toggle,
  };

  constructor() {
    super();
    this.bs5 = Bs5Service.getSingleton();
    const xl = this.bs5.getBreakpointByName("xl");

    this.scope.autoShowOnWiderThan = xl ? xl.dimension - 1 : -1;
    this.scope.autoHideOnSlimmerThan = xl ? xl.dimension - 1 : -1;
    this.scope.overlayOnSlimmerThan = xl ? xl.dimension - 1 : -1;

    // assign this to bound version, so we can remove window EventListener later without problem
    this.onEnvironmentChanges = this.onEnvironmentChanges.bind(this);
  }

  public setState(state: State) {
    this.scope.oldState = this.scope.state;
    this.scope.state = state;
    this.onStateChange();
  }

  public getState() {
    return this.scope.state;
  }

  public getShowMode() {
    let mode: State;
    const vw = getViewportDimensions().w;
    if (vw < this.scope.overlayOnSlimmerThan) {
      mode = `${this.scope.mode}-${this.scope.position}` as State;
    } else {
      mode = `side-${this.scope.position}` as State;
    }
    return mode;
  }

  public hide() {
    this.setState("hidden");
  }

  public show() {
    const state = this.getShowMode();
    this.setState(state);
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
    this.init(Bs5SidebarComponent.observedAttributes);
    this.computedStyle = window.getComputedStyle(this);
    this.addEventListeners();
    // initial
    this.onEnvironmentChanges();
  }

  protected addEventListeners() {
    window.addEventListener("resize", this.onEnvironmentChanges, {
      passive: true,
    });
    this.addEventListener("swipe" as any, this.onSwipe);
  }

  protected removeEventListeners() {
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
    window.removeEventListener("resize", this.onEnvironmentChanges);
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

  protected _onSwipe(event: CustomEvent<TouchSwipeData>) {
    if (!this.scope.closeOnSwipe) {
      return;
    }
    if (this.scope.state === "side-left" || this.scope.state === "side-right") {
      return;
    }
    if (this.scope.position === "left" && event.detail.direction === "left") {
      this.hide();
    }

    if (this.scope.position === "right" && event.detail.direction === "right") {
      this.hide();
    }
  }

  protected onSwipe = this._onSwipe.bind(this);

  protected onHidden() {
    this.setContainersStyle(this.scope.state);
    const translateX = this.scope.position === "left" ? "-100%" : "100%";
    this.style.transform = `translateX(${translateX})`;
    this.style.width = this.scope.width;
  }

  protected onMove(state: State) {
    this.setContainersStyle(state);
    this.style.transform = `translateX(0)`;
    this.style.width = this.scope.width;
  }

  protected onSide(state: State) {
    this.setContainersStyle(state);
    this.style.transform = `translateX(0)`;
    this.style.width = this.scope.width;
  }

  protected onOverlay(state: State) {
    this.setContainersStyle(state);
    this.style.transform = `translateX(0)`;
    this.style.width = this.scope.width;
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
      case "move-left":
      case "move-right":
        this.onMove(this.scope.state);
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
   * Internal "unthrottled" version of `onEnvironmentChanges`.
   */
  protected _onEnvironmentChanges() {
    this.setStateByEnvironment();
  }

  /**
   * If viewport size changes, location url changes or something else.
   */
  protected onEnvironmentChanges = throttle(
    this._onEnvironmentChanges.bind(this)
  );

  protected getContainers() {
    return this.scope.containerSelector
      ? document.querySelectorAll<HTMLUnknownElement>(
          this.scope.containerSelector
        )
      : undefined;
  }

  protected initContainers(state: State) {
    this.setContainersStyle(state);
  }

  protected setContainersStyle(state: State) {
    const containers:
      | NodeListOf<HTMLUnknownElement>
      | Array<HTMLUnknownElement> = this.getContainers() || [];

    if (containers) {
      for (let i = 0; i < containers.length; i++) {
        const container = containers[i];
        this.setContainerStyle(container, state);
      }
    }
  }

  /**
   * Sets the container style, takes overs always the transition style of this sidebar
   * @param container
   * @param style
   * @param state
   */
  protected setContainerStyle(container: HTMLUnknownElement, state: State) {
    const currStyle = container.style;
    if (state) {
      const width = this.width;
      const conStyle = window.getComputedStyle(container);

      if (this.scope.mode === "move" && state.startsWith("overlay-")) {
        switch (conStyle.position) {
          case "fixed":
            currStyle.left = "0";
            currStyle.right = "0";
            break;
          default:
            currStyle.marginLeft = "0";
            currStyle.marginRight = "0";
            break;
        }
      }

      switch (state) {
        case "side-left":
          switch (conStyle.position) {
            case "fixed":
              currStyle.left = width;
              break;
            default:
              currStyle.marginLeft = width;
              break;
          }
          break;
        case "side-right":
          switch (conStyle.position) {
            case "fixed":
              currStyle.right = width;
              break;
            default:
              currStyle.marginRight = width;
              break;
          }
          break;
        case "move-left":
          switch (conStyle.position) {
            case "fixed":
              currStyle.left = width;
              currStyle.right = `-${width}`;
              break;
            default:
              currStyle.marginLeft = width;
              currStyle.marginRight = `-${width}`;
              break;
          }
          break;
        case "move-right":
          switch (conStyle.position) {
            case "fixed":
              currStyle.right = width;
              currStyle.left = `-${width}`;
              break;
            default:
              currStyle.marginRight = width;
              currStyle.marginLeft = `-${width}`;
              break;
          }
          break;
        case "hidden":
          switch (this.scope.oldState) {
            case "side-left":
              switch (conStyle.position) {
                case "fixed":
                  currStyle.left = "0";
                  break;
                default:
                  currStyle.marginLeft = "0";
                  break;
              }
              break;
            case "side-right":
              switch (conStyle.position) {
                case "fixed":
                  currStyle.right = "0";
                  break;
                default:
                  currStyle.marginRight = "0";
                  break;
              }
              break;
            case "move-left":
              switch (conStyle.position) {
                case "fixed":
                  currStyle.left = "0";
                  currStyle.right = "0";
                  break;
                default:
                  currStyle.marginRight = "0";
                  currStyle.marginLeft = "0";
                  break;
              }
              break;
            case "move-right":
              switch (conStyle.position) {
                case "fixed":
                  currStyle.right = "0";
                  currStyle.left = "0";
                  break;
                default:
                  currStyle.marginRight = "0";
                  currStyle.marginLeft = "0";
                  break;
              }
              break;
            default:
              break;
          }

        default:
          break;
      }
    }
    container.style.transition = this.computedStyle
      ? this.computedStyle.transition
      : "";
  }

  protected async beforeBind() {
    await super.beforeBind();
    this.scope.oldState = this.getShowMode();
    this.initRouterEventDispatcher();
    return this.onEnvironmentChanges();
  }

  protected async afterBind() {
    this.onEnvironmentChanges();
    await super.afterBind();
  }

  protected requiredAttributes(): string[] {
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
      this.initContainers(this.scope.state);
    }
    if (attributeName === "id") {
      this.initToggleButtonEventDispatcher();
    }
  }

  // deconstruction
  protected disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListeners();
  }

  protected template(): ReturnType<TemplateFunction> {
    if (!hasChildNodesTrim(this)) {
      console.warn(
        "No child elements found, this component as no template so you need to define your own as child of this component."
      );
    }
    return null;
  }
}
