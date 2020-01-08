import { TemplatesComponent } from '../templates/templates.component';

import { Utils } from '@ribajs/core';

import { Dragscroll, DragscrollOptions, Autoscroll, AutoscrollOptions, Utils as ExtraUtils, ScrollPosition, ScrollEventsService } from '@ribajs/extras';

import templateSlides from './bs4-slideshow-slides.component.html';

import templateControls from './bs4-slideshow-controls.component.html';

import templateIndicators from './bs4-slideshow-indicators.component.html';

const SLIDESHOW_INNER_SELECTOR = '.slideshow-inner';

const SLIDES_SELECTOR = `${SLIDESHOW_INNER_SELECTOR} > .slide`;

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface Position extends DOMRect {
  centerX: number;
  centerY: number;
}

export interface Slide {
  title?: string;
  content: string;
  handle?: string;
  active: boolean;
  type?: string;
  position: Position;
  index: number;
}

export interface ResponsiveOptions extends Partial<Options> {
  /** min witdh of responsive view port of from which these options take effect */
  minWidth: number;
}

export interface Options {
  /** number of slides to be scrolled by clicking on the controls */
  slidesToScroll: number;
 /** Show controls */
  controls: boolean;
  /** Slides are dragable on desktop browsers */
  draggable: boolean;
  /** Enables autoplay continuously or with interval */
  autoplay: boolean;
  /** Pause between autoscroll, 0 for continuously autoscrolling */
  autoplayInterval: number;
  /** Scrollspeed for continuously autoscrolling */
  autoplayVelocity: number;
  /** Icon source url for the prev slide icon button */
  controlPrevIconSrc: string;
  /** Icon source url for the next slide icon button */
  controlNextIconSrc: string;
  /** Icon source url for the inactive indicator */
  indicatorInactiveIconSrc: string;
  /** Icon source url for the active indicator */
  indicatorActiveIconSrc: string;
  /** Slide angle, can be vertical or horizontal */
  angle: 'vertical' | 'horizontal';
  /** Pauses autoscolling on hover or focus */
  pauseOnHover: boolean;
  /** Autoscroll to the nearest slide after manual scroll or dragscroll */
  sticky: boolean;
  /** Show indicators */
  indicators: boolean;
  /** Pause on autoplay (with interval) */
  pause: boolean;

  // Responsive options
  xs: ResponsiveOptions;
  sm: ResponsiveOptions;
  md: ResponsiveOptions;
  lg: ResponsiveOptions;
  xl: ResponsiveOptions;
}

export interface Scope extends Options {
  next: Bs4SlideshowComponent['next'];
  prev: Bs4SlideshowComponent['prev'];
  goTo: Bs4SlideshowComponent['goTo'];
  items: Slide[];
}

export class Bs4SlideshowComponent extends TemplatesComponent {

  protected get slideshowInner() {
    if (!this._slideshowInner) {
      this._slideshowInner = this.el.querySelector(SLIDESHOW_INNER_SELECTOR);
    }
    if (!this._slideshowInner) {
      throw new Error(`Child element with selecto ${SLIDESHOW_INNER_SELECTOR} not found!`);
    }
    return this._slideshowInner;
  }

  protected get slideElements() {
    if (!this._slideElements) {
      this._slideElements = this.el.querySelectorAll(SLIDES_SELECTOR);
    }
    if (!this._slideElements) {
      throw new Error(`Child element with selecto ${SLIDES_SELECTOR} not found!`);
    }
    return this._slideElements;
  }

  protected get controlsElements() {
    if (!this._controlsElements) {
      this._controlsElements = this.el.querySelectorAll('.slideshow-control-prev, .slideshow-control-next');
    }
    return this._controlsElements;
  }

  protected get indicatorsElement() {
    if (!this._indicatorsElement) {
      this._indicatorsElement = this.el.querySelector('.slideshow-indicators');
    }
    return this._indicatorsElement;
  }

  static get observedAttributes() {
    return [
      'min-width',
      'slides-to-show',
      'slides-to-scroll',
      'controls',
      'draggable',
      'autoplay',
      'autoplay-interval',
      'autoplay-velocity',
      'control-prev-icon-src',
      'control-next-icon-src',
      'indicator-inactive-icon-src',
      'indicator-active-icon-src',
      'angle',
      'set-active-slide',
      'pause-on-hover',
      'sticky',
      'indicators',
      'pause',

      'sm-min-width',
      'sm-slides-to-show',
      'sm-slides-to-scroll',
      'sm-controls',
      'sm-draggable',
      'sm-autoplay',
      'sm-autoplay-interval',
      'sm-autoplay-velocity',
      'sm-control-prev-icon-src',
      'sm-control-next-icon-src',
      'sm-indicator-inactive-icon-src',
      'sm-indicator-active-icon-src',
      'sm-angle',
      'sm-set-active-slide',
      'sm-pause-on-hover',
      'sm-sticky',
      'sm-indicators',
      'sm-pause',

      'md-min-width',
      'md-slides-to-show',
      'md-slides-to-scroll',
      'md-controls',
      'md-draggable',
      'md-autoplay',
      'md-autoplay-interval',
      'md-autoplay-velocity',
      'md-control-prev-icon-src',
      'md-control-next-icon-src',
      'md-indicator-inactive-icon-src',
      'md-indicator-active-icon-src',
      'md-angle',
      'md-set-active-slide',
      'md-pause-on-hover',
      'md-sticky',
      'md-indicators',
      'md-pause',

      'lg-min-width',
      'lg-slides-to-show',
      'lg-slides-to-scroll',
      'lg-controls',
      'lg-draggable',
      'lg-autoplay',
      'lg-autoplay-interval',
      'lg-autoplay-velocity',
      'lg-control-prev-icon-src',
      'lg-control-next-icon-src',
      'lg-indicator-inactive-icon-src',
      'lg-indicator-active-icon-src',
      'lg-angle',
      'lg-set-active-slide',
      'lg-pause-on-hover',
      'lg-sticky',
      'lg-indicators',
      'lg-pause',

      'xl-min-width',
      'xl-slides-to-show',
      'xl-slides-to-scroll',
      'xl-controls',
      'xl-draggable',
      'xl-autoplay',
      'xl-autoplay-interval',
      'xl-autoplay-velocity',
      'xl-control-prev-icon-src',
      'xl-control-next-icon-src',
      'xl-indicator-inactive-icon-src',
      'xl-indicator-active-icon-src',
      'xl-angle',
      'xl-set-active-slide',
      'xl-pause-on-hover',
      'xl-sticky',
      'xl-indicators',
      'xl-pause',
    ];
  }

  public static tagName = 'bs4-slideshow';

  protected templateAttributes = [
    {
      name: 'class',
      required: false,
    },
    {
      name: 'handle',
      required: false,
    },
    {
      name: 'type',
      required: true,
    },
    {
      name: 'active',
      type: 'boolean',
      required: false,
    },
    {
      name: 'index',
      type: 'number',
      required: false,
    },
  ];

  protected autobind = true;

  protected dragscrollService?: Dragscroll;

  protected continuousAutoplayService?: Autoscroll;

  protected scrollEventsService?: ScrollEventsService;

  protected _slideshowInner: HTMLElement | null = null;

  protected _slideElements: NodeListOf<Element> | null = null;

  protected _controlsElements: NodeListOf<Element> | null = null;

  protected _indicatorsElement: HTMLElement | null = null;

  protected templateControls = templateControls;

  protected templateIndicators = templateIndicators;

  protected autoplayIntervalIndex: number | null = null;

  protected continuousAutoplayIntervalIndex: number | null = null;

  protected resumeTimer: number | null = null;
  
  /**
   * Current breakpoint
   */
  protected breakpoint: Breakpoint = 'xs';

  protected scope: Scope = {
    // Template methods
    next: this.next.bind(this),
    prev: this.prev.bind(this),
    goTo: this.goTo.bind(this),
    // Template properties
    items: new Array<Slide>(),
    // Options
    slidesToScroll: 1,
    controls: true,
    draggable: true,
    autoplay: false,
    autoplayInterval: 0,
    autoplayVelocity: 0.8,
    controlPrevIconSrc: '',
    controlNextIconSrc: '',
    indicatorActiveIconSrc: '',
    indicatorInactiveIconSrc: '',
    angle: 'horizontal',
    pauseOnHover: true,
    sticky: false,
    indicators: true,
    pause: false,

    // Responsive options
    xs: {
      minWidth: 0,
    },
    sm: {
      minWidth: 576,
    },
    md: {
      minWidth: 768,
    },
    lg: {
      minWidth: 992,
    },
    xl: {
      minWidth: 1200,
    },
  };

  constructor(element?: HTMLElement) {
    super(element);
  }

  /**
   * Go to next slide
   */
  public next() {
    this.scrollToNextSlide();
  }

  /**
   * Go to prev slide
   */
  public prev() {
    this.scrollToPrevSlide();
  }

  /**
   * Go to slide by index
   * @param index 
   */
  public goTo(index: number) {
    this.setSlidePositions();
    let top = 0;
    let left = 0;

    if (this.scope.angle === 'vertical') {
      // Check if we do not need to slide
      if (this.scope.items[index].position.centerY === 0) {
        // We do not need to scroll
        return;
      }
      top = this.slideshowInner.scrollTop + this.scope.items[index].position.centerY;
    } else {
      // Check if we do not need to slide
      if (this.scope.items[index].position.centerX === 0) {
        // We do not need to scroll
        return;
      }
      left = this.slideshowInner.scrollLeft + this.scope.items[index].position.centerX;
    }

    // TODO new scrollservice based on https://pawelgrzybek.com/page-scroll-in-vanilla-javascript/
    if (this.slideElements[index]) {
      // if is is window to scroll
      if (typeof(this.slideshowInner.scroll) === 'function') {
        this.slideshowInner.scroll({
          behavior: 'smooth',
          left,
          top,
        });
      } else {
        if (this.scope.angle === 'vertical') {
          this.slideshowInner.scrollTop = top;
        } else {
          this.slideshowInner.scrollLeft = left;
        }
      }
    }
  }

  protected setOptions(dest: ResponsiveOptions | Options, source: ResponsiveOptions | Options) {
    dest.slidesToScroll = typeof(source.slidesToScroll) !== 'undefined' ? Utils.clone(false, source.slidesToScroll) : dest.slidesToScroll;
    dest.controls = typeof(source.controls) !== 'undefined' ? Utils.clone(false, source.controls) : dest.controls;
    dest.draggable = typeof(source.draggable) !== 'undefined' ? Utils.clone(false, source.draggable) : dest.draggable;
    dest.autoplay = typeof(source.autoplay) !== 'undefined' ? Utils.clone(false, source.autoplay) : dest.autoplay;
    dest.autoplayInterval = typeof(source.autoplayInterval) !== 'undefined' ? Utils.clone(false, source.autoplayInterval) : dest.autoplayInterval;
    dest.autoplayVelocity = typeof(source.autoplayVelocity) !== 'undefined' ? Utils.clone(false, source.autoplayVelocity) : dest.autoplayVelocity;
    dest.controlPrevIconSrc = typeof(source.controlPrevIconSrc) !== 'undefined' ? Utils.clone(false, source.controlPrevIconSrc) : dest.controlPrevIconSrc;
    dest.controlNextIconSrc = typeof(source.controlNextIconSrc) !== 'undefined' ? Utils.clone(false, source.controlNextIconSrc) : dest.controlNextIconSrc;
    dest.indicatorActiveIconSrc = typeof(source.indicatorActiveIconSrc) !== 'undefined' ? Utils.clone(false, source.indicatorActiveIconSrc) : dest.indicatorActiveIconSrc;
    dest.indicatorInactiveIconSrc = typeof(source.indicatorInactiveIconSrc) !== 'undefined' ? Utils.clone(false, source.indicatorInactiveIconSrc) : dest.indicatorInactiveIconSrc;
    dest.angle = typeof(source.angle) !== 'undefined' ? Utils.clone(false, source.angle) : dest.angle;
    dest.pauseOnHover = typeof(source.pauseOnHover) !== 'undefined' ? Utils.clone(false, source.pauseOnHover) : dest.pauseOnHover;
    dest.sticky = typeof(source.sticky) !== 'undefined' ? Utils.clone(false, source.sticky) : dest.sticky;
    dest.indicators = typeof(source.indicators) !== 'undefined' ? Utils.clone(false, source.indicators) : dest.indicators;
    dest.pause = typeof(source.pause) !== 'undefined' ? Utils.clone(false, source.pause) : dest.pause;
  }

  protected setOptionsIfUndefined(dest: ResponsiveOptions | Options, source: ResponsiveOptions | Options) {
    dest.slidesToScroll = typeof(dest.slidesToScroll) === 'undefined' ? source.slidesToScroll : dest.slidesToScroll;
    dest.controls = typeof(dest.controls) === 'undefined' ? source.controls : dest.controls;
    dest.draggable = typeof(dest.draggable) === 'undefined' ? source.draggable : dest.draggable;
    dest.autoplay = typeof(dest.autoplay) === 'undefined' ? source.autoplay : dest.autoplay;
    dest.autoplayInterval = typeof(dest.autoplayInterval) === 'undefined' ? source.autoplayInterval : dest.autoplayInterval;
    dest.autoplayVelocity = typeof(dest.autoplayVelocity) === 'undefined' ? source.autoplayVelocity : dest.autoplayVelocity;
    dest.controlPrevIconSrc = typeof(dest.controlPrevIconSrc) === 'undefined' ? source.controlPrevIconSrc : dest.controlPrevIconSrc;
    dest.controlNextIconSrc = typeof(dest.controlNextIconSrc) === 'undefined' ? source.controlNextIconSrc : dest.controlNextIconSrc;
    dest.indicatorActiveIconSrc = typeof(dest.indicatorActiveIconSrc) === 'undefined' ? source.indicatorActiveIconSrc : dest.indicatorActiveIconSrc;
    dest.indicatorInactiveIconSrc = typeof(dest.indicatorInactiveIconSrc) === 'undefined' ? source.indicatorInactiveIconSrc : dest.indicatorInactiveIconSrc;
    dest.angle = typeof(dest.angle) === 'undefined' ? source.angle : dest.angle;
    dest.pauseOnHover = typeof(dest.pauseOnHover) === 'undefined' ? source.pauseOnHover : dest.pauseOnHover;
    dest.sticky = typeof(dest.sticky) === 'undefined' ? source.sticky : dest.sticky;
    dest.indicators = typeof(dest.indicators) === 'undefined' ? source.indicators : dest.indicators;
    dest.pause = typeof(dest.pause) === 'undefined' ? source.pause : dest.pause;
  }

  protected initResponsiveOptions() {
    this.setOptions(this.scope.xs, this.scope);
    this.setOptionsIfUndefined(this.scope.sm, this.scope.xs);
    this.setOptionsIfUndefined(this.scope.md, this.scope.sm);
    this.setOptionsIfUndefined(this.scope.lg, this.scope.md);
    this.setOptionsIfUndefined(this.scope.xl, this.scope.lg);
    this.breakpoint = this.getBreakpoint();
    this.setOptionsByBreakpoint(this.breakpoint);
  }

  // TODO create independent bs4 breakpoint service
  protected getBreakpoint(): Breakpoint {
    const size = window.innerWidth;
    // XS
    if (size >= this.scope.xs.minWidth && size < this.scope.sm.minWidth) {
      return 'xs';
    }
    // SM
    if (size >= this.scope.sm.minWidth && size < this.scope.md.minWidth) {
      return 'sm';
    }
    // MD
    if (size >= this.scope.md.minWidth && size < this.scope.lg.minWidth) {
      return 'md';
    }
    // LG
    if (size >= this.scope.lg.minWidth && size < this.scope.xl.minWidth) {
      return 'lg';
    }
    // XL
    return 'xl';
  }

  protected setOptionsByBreakpoint(breakpoint: Breakpoint) {
    this.setOptions(this.scope, this.scope[breakpoint]);
    if (this.scope.autoplay) {
      this.enableAutoplay();
    } else {
      this.disableAutoplay();
    }
    if (this.scope.draggable) {
      this.enableDesktopDragscroll();
    } else {
      this.disableDesktopDragscroll();
    }
  }

  protected onBreakpointChanges() {
    this.setOptionsByBreakpoint(this.breakpoint);
  }

  protected onResize() {
    const newBreakpoint = this.getBreakpoint();
    if (newBreakpoint !== this.breakpoint) {
      this.breakpoint = newBreakpoint;
      this.onBreakpointChanges();
    }
  }

  protected onVisibilityChanged(event: CustomEvent) {
    if (event.detail.visibile) {
      this.dragscrollService?.checkDraggable();
      this.continuousAutoplayService?.update();
    }
  }

  protected onScroll() {
    // this.setSlidePositions();
    // this.setCenteredSlideActive();
    this.resume(1000);
  }

  protected onScrollend() {
    this.setSlidePositions();
    this.setCenteredSlideActive();
    if (this.scope.sticky) {
      this.scrollToNearestSlide();
    }
    this.resume(1000);
  }

  protected onMouseIn() {
    if (this.scope.pauseOnHover) {
      this.scope.pause = true;
    }
  }

  protected onMouseOut() {
    this.resume(200);
  }

  protected onMouseUp() {
    this.resume(1000);
  }

  /** Resume if this method was not called up for [delay] milliseconds */
  protected resume(delay = 1000) {
    if (!this.scope.pause) {
      return;
    }

    if (this.resumeTimer !== null) {
      clearTimeout(this.resumeTimer);
      this.resumeTimer = null;
    }

    this.resumeTimer = window.setTimeout(() => {
      this.setSlidePositions();
      this.scope.pause = false;
    }, delay);
  }

  protected connectedCallback() {
    super.connectedCallback();
    return this.init(Bs4SlideshowComponent.observedAttributes);
  }

  protected addEventListeners() {
    window.addEventListener('resize', this.onResize.bind(this), {passive: true});

    // Custom event triggered by some parent components when this component changes his visibility, e.g. triggered in the bs4-tabs component
    this.el.addEventListener('visibility-changed' as any, this.onVisibilityChanged.bind(this));

    this.slideshowInner.addEventListener('scroll', this.onScroll.bind(this), { passive: true});
    this.slideshowInner.addEventListener('scrollended', this.onScrollend.bind(this), {passive: true});

    this.el.addEventListener('mouseenter', this.onMouseIn.bind(this), {passive: true});
    this.el.addEventListener('mouseover', this.onMouseIn.bind(this), {passive: true});
    this.el.addEventListener('focusin', this.onMouseIn.bind(this), {passive: true});
    this.el.addEventListener('touchstart', this.onMouseIn.bind(this), {passive: true});

    this.el.addEventListener('mouseout', this.onMouseOut.bind(this), {passive: true});
    this.el.addEventListener('mouseleave', this.onMouseOut.bind(this), {passive: true});
    this.el.addEventListener('focusout', this.onMouseOut.bind(this), {passive: true});

    this.el.addEventListener('mouseup', this.onMouseUp.bind(this), {passive: true});
    this.el.addEventListener('touchend', this.onMouseUp.bind(this), {passive: true});
    this.el.addEventListener('scroll', this.onMouseUp.bind(this), {passive: true});
    this.el.addEventListener('scrollend', this.onMouseUp.bind(this), {passive: true});
    // See ScrollEventsService for this event
    this.el.addEventListener('scrollended', this.onMouseUp.bind(this), {passive: true});

    // inital
    this.onResize();
    // this.onScroll();
    this.onScrollend();
  }

  protected removeEventListeners() {
    window.removeEventListener('resize', this.onResize.bind(this));

    this.el.removeEventListener('visibility-changed' as any, this.onVisibilityChanged.bind(this));

    this.slideshowInner.removeEventListener('scroll', this.onScroll.bind(this));
    this.slideshowInner.removeEventListener('scrollended', this.onScrollend.bind(this));

    this.el.removeEventListener('mouseenter', this.onMouseIn.bind(this));
    this.el.removeEventListener('mouseover', this.onMouseIn.bind(this));
    this.el.removeEventListener('focusin', this.onMouseIn.bind(this));
    this.el.removeEventListener('touchstart', this.onMouseIn.bind(this));

    this.el.removeEventListener('mouseout', this.onMouseOut.bind(this));
    this.el.removeEventListener('mouseleave', this.onMouseOut.bind(this));
    this.el.removeEventListener('focusout', this.onMouseOut.bind(this));
  }

  protected async beforeBind() {
    return super.beforeBind();
  }

  protected async afterBind() {
    await super.afterBind();
    this.initSlideshowInner();
    this.initResponsiveOptions();
    this.removeEventListeners();
    this.addEventListeners();
  }

  protected initSlideshowInner() {

    this.initSlideshowInnerSlides();

    this.scrollEventsService = new ScrollEventsService(this.slideshowInner);

  }

  protected enableDesktopDragscroll() {
    if (!this.dragscrollService) {
      const dragscrollOptions: DragscrollOptions = {detectGlobalMove: true};
      this.dragscrollService = new Dragscroll(this.slideshowInner, dragscrollOptions);
    }
  }

  protected disableDesktopDragscroll() {
    if (this.dragscrollService ) {
      this.dragscrollService.destroy();
      this.dragscrollService = undefined;
    }
  }

  protected enableContinuousAutoplay() {
    if (!this.continuousAutoplayService) {
      const autoscrollOptions: AutoscrollOptions = {
        velocity: this.scope.autoplayVelocity,
        angle: this.scope.angle,
        pauseOnHover: this.scope.pauseOnHover,
      };
      this.continuousAutoplayService = new Autoscroll(this.slideshowInner, autoscrollOptions);
    }
    // on continuous autoplay the scrollended event is never triggered, so call this method all `intervalsTimeMs` milliseconds as a WORKAROUND
    if (!this.continuousAutoplayIntervalIndex) {
      // intervals are depending on the autoscrolling speed (autoplayVelocity)
      const intervalsTimeMs = this.scope.autoplayVelocity * 10000;
      console.debug('intervalsTimeMs', intervalsTimeMs);
      this.continuousAutoplayIntervalIndex = window.setInterval(this.onScrollend.bind(this), intervalsTimeMs);
    }
  }

  protected disableContinuousAutoplay() {
    if (this.continuousAutoplayService) {
      this.continuousAutoplayService.destroy();
      this.continuousAutoplayService = undefined;
    }
    if (this.continuousAutoplayIntervalIndex) {
      window.clearInterval(this.continuousAutoplayIntervalIndex);
      this.continuousAutoplayIntervalIndex = null;
    }
  }

  protected enableIntervalAutoplay() {
    if (this.autoplayIntervalIndex === null) {
      this.autoplayIntervalIndex = window.setInterval(() => {
        if (!this.scope.pause) {
          this.next();
        }
      }, this.scope.autoplayInterval);
    }
  }

  protected disableIntervalAutoplay() {
    if (this.autoplayIntervalIndex) {
      window.clearInterval(this.autoplayIntervalIndex);
      this.autoplayIntervalIndex = null;
    }
  }


  protected disableAutoplay() {
    this.disableIntervalAutoplay();
    this.disableContinuousAutoplay();
  }

  protected enableAutoplay() {
    // continuous scrolling
    if (this.scope.autoplayInterval <= 0) {
      this.enableContinuousAutoplay();
    } else {
      this.enableIntervalAutoplay();
    }
  }

  protected initSlideshowInnerSlides() {
    if (!this.slideElements) {
      throw new Error('No slides found!');
    }

    // If slides not added by template
    if (this.scope.items.length === 0) {
      this.addItemsByChilds();
    }

  }

  protected transformTemplateAttributes(attributes: any, index: number) {
    attributes = super.transformTemplateAttributes(attributes, index);
    attributes.handle = attributes.handle || index.toString();
    attributes.index = index;
    attributes.class = attributes.class || '';
    attributes.class += ' slide';
    return attributes;
  }

  /**
   * Add slide by template element
   * @param tpl template element
   */
  protected addItemByTemplate(tpl: HTMLTemplateElement, index: number) {
    const attributes = this.getTemplateAttributes(tpl, index);
    const content = tpl.innerHTML;
    if (attributes.type) {
      if (attributes.type === 'slide') {
        this.scope.items.push({...attributes, content});
      }
      if (attributes.type === 'controls') {
        this.templateControls = content;
      }
      if (attributes.type === 'indicators') {
        this.templateIndicators = content;
      }
    }
  }

  /**
   * Add slides by child elements (not as template elements)
   * @param tpl template element
   */
  protected addItemsByChilds() {
    if (!this.slideElements) {
      return;
    }
    this.slideElements.forEach((slideElement, index) => {
      const handle = slideElement.getAttribute('handle') || slideElement.getAttribute('id') || index.toString();
      slideElement.setAttribute('index', index.toString());
      const attributes = {
        handle,
        active: false,
        content: slideElement.innerHTML,
        index,
        position: {...slideElement.getBoundingClientRect(), centerY: 0, centerX: 0},
      };
      this.scope.items.push(attributes);
    });
  }

  protected getScrollPosition(): ScrollPosition {
    const scrollPosition = ExtraUtils.getScrollPosition(this.slideshowInner);
    return scrollPosition;
  }

  /**
   * get closest number
   * @see https://stackoverflow.com/a/35000557
   * @param goal the number which this number should be closest to
   * @param curr current number in loop
   * @param prev previous number or closest value found so far
   */
  protected getCurrentClosestNumber(goal: number, curr: number, prev: number) {
    return Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev;
  }

  protected getMostCenteredSlideIndex() {
    if (this.scope.items.length <= 0) {
      return -1;
    }
    let nearZero = Math.abs(this.scope.angle === 'vertical' ? this.scope.items[0].position.centerY : this.scope.items[0].position.centerX);
    let minIndex = 0;

    for (let i = 1; i < this.scope.items.length; i++) {
      const position = Math.abs(this.scope.angle === 'vertical' ? this.scope.items[i].position.centerY : this.scope.items[i].position.centerX);
      nearZero = this.getCurrentClosestNumber(0, position, nearZero);
      if (nearZero === position) {
        minIndex = i;
      }
    }
    return minIndex;
  }

  protected setAllSlidesUnactive(excludeIndex = -1) {
    if (!this.slideElements) {
      return;
    }
    for (let index = 0; index < this.scope.items.length; index++) {
      if (index !== excludeIndex) {
        if (this.scope.items[index]) {
          this.scope.items[index].active = false;
        }
        if (this.slideElements[index] && this.slideElements[index].classList.remove) {
          this.slideElements[index].classList.remove('active');
        }
      }
    }
  }

  protected setCenteredSlideActive() {
    const index = this.getMostCenteredSlideIndex();
    this.setAllSlidesUnactive(index);
    if (!this.scope.items[index]) {
      return;
    }
    this.scope.items[index].active = true;
    if (this.slideElements && this.slideElements[index].classList.add) {
      this.slideElements[index].classList.add('active');
    }
  }

  protected isScrollableToIndex(index: number) {
    if (!this.scope.items[index]) {
      return false;
    }
    const maxScrollTo = this.scope.angle === 'vertical' ? this.getScrollPosition().maxY : this.getScrollPosition().maxX;
    const scrollTo = this.scope.angle === 'vertical' ? this.slideshowInner.scrollTop + this.scope.items[index].position.centerY : this.slideshowInner.scrollLeft + this.scope.items[index].position.centerX;
    return scrollTo <= maxScrollTo && scrollTo >= 0;
  }

  protected scrollToNextSlide() {
    this.setSlidePositions();
    const currentIndex = this.getMostCenteredSlideIndex();
    let nextIndex = currentIndex + this.scope.slidesToScroll;

    if (nextIndex >= this.slideElements.length) {
      nextIndex = nextIndex - this.slideElements.length;
    }

    // if (!this.isScrollableToIndex(nextIndex)) {
    //   nextIndex++;
    // }

    // if (nextIndex >= this.slideElements.length) {
    //   nextIndex = nextIndex - this.slideElements.length;
    // }

    return this.goTo(nextIndex);
  }

  protected scrollToPrevSlide() {
    this.setSlidePositions();
    const currentIndex = this.getMostCenteredSlideIndex();
    let prevIndex = currentIndex - this.scope.slidesToScroll;

    if (prevIndex < 0) {
      prevIndex = (this.slideElements.length - 1) - prevIndex;
    }

    // if (!this.isScrollableToIndex(prevIndex)) {
    //   prevIndex--;
    // }

    // if (prevIndex < 0) {
    //   prevIndex = (this.slideElements.length - 1) - prevIndex;
    // }

    return this.goTo(prevIndex);
  }

  protected scrollToNearestSlide() {
    this.setSlidePositions();
    const nearestIndex = this.getMostCenteredSlideIndex();
    return this.goTo(nearestIndex);
  }

  protected setSlidePositions() {
    if (this.scope.items.length !== this.slideElements?.length) {
      console.warn(`The slide objects must be the same size as the slide elements! ${this.scope.items.length} !== ${this.slideElements?.length}`);
      return;
    }
    const mainBoundingClient = this.slideshowInner.getBoundingClientRect();
    for (let i = 0; i < this.scope.items.length; i++) {
      const slideElement = this.slideElements[i];
      const slideObject = this.scope.items[i];
      const rect = slideElement.getBoundingClientRect();

      rect.x -= mainBoundingClient.x;
      rect.y -= mainBoundingClient.y;

      slideObject.position = {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        toJSON: rect.toJSON,
        // 0 if element is in the middle / center
        centerY: (rect.y + (rect.height / 2)) - mainBoundingClient.height / 2,
        // 0 if element is in the middle / center
        centerX: (rect.x + (rect.width / 2)) - mainBoundingClient.width / 2,
      };
    }
  }

  protected requiredAttributes() {
    return [];
  }

  /**
   * Default custom Element method
   * Invoked when the custom element is moved to a new document.
   * @param attributeName
   * @param oldValue
   * @param newValue
   * @param namespace
   */
  protected attributeChangedCallback(attributeName: string, oldValue: any, newValue: any, namespace: string | null) {

    let optionForSize: Breakpoint = 'xs';

    let responsiveScope: ResponsiveOptions | Options = this.scope;

    if (this.observedAttributesToCheck && this.observedAttributesToCheck[attributeName]) {
      this.observedAttributesToCheck[attributeName].initialized = true;
    }

    newValue = this.parseAttribute(newValue);

    if (attributeName.startsWith('sm-')) {
      optionForSize = 'sm';
      responsiveScope = this.scope.sm;
      attributeName = attributeName.slice(3);
    } else if (attributeName.startsWith('md-')) {
      optionForSize = 'md';
      responsiveScope = this.scope.md;
      attributeName = attributeName.slice(3);
    } else if (attributeName.startsWith('lg-')) {
      optionForSize = 'lg';
      responsiveScope = this.scope.lg;
      attributeName = attributeName.slice(3);
    } else if (attributeName.startsWith('xl-')) {
      optionForSize = 'xl';
      responsiveScope = this.scope.xl;
      attributeName = attributeName.slice(3);
    }


    const parsedAttributeName = Utils.camelCase(attributeName);


    if (responsiveScope && (responsiveScope as any)[parsedAttributeName]) {
      oldValue = (responsiveScope as any)[parsedAttributeName];
    }

    // automatically inject observed attributes to view responsiveScope
    (responsiveScope as any)[parsedAttributeName] = newValue;

    // call custom attribute changed callback with parsed values
    this.parsedAttributeChangedCallback(optionForSize + parsedAttributeName, oldValue, newValue, namespace);

    this.bindIfReady();
  }

  /**
   * Similar to attributeChangedCallback but attribute arguments are already parsed as they are stored in the scope
   * @param attributeName
   * @param oldValue
   * @param newValue
   * @param namespace
   */
  protected parsedAttributeChangedCallback(attributeName: string, oldValue: any, newValue: any, namespace: string | null) {
    return super.parsedAttributeChangedCallback(attributeName, oldValue, newValue, namespace);
  }

  // deconstructor
  protected disconnectedCallback() {
    this.removeEventListeners();
    this.scrollEventsService?.destroy();
    this.disableAutoplay();
    this.disableDesktopDragscroll();
    return super.disconnectedCallback();
  }

  protected template() {
    // Only set the component template if there no childs or the childs are templates
    if (!this.el.hasChildNodes() || this.hasOnlyTemplateChilds()) {
      // ('Full template!', this.templateIndicators);
      return templateSlides + this.templateControls + this.templateIndicators;
    } else {
      // console.debug('Append to template!');
      // Prepend control elements if no custom control elements in template are found
      if (this.controlsElements.length <= 0) {
        this.el.innerHTML += this.templateControls;
      }

      if (!this.indicatorsElement) {
        this.el.innerHTML += this.templateIndicators;
      }

      return null;
    }
  }
}
