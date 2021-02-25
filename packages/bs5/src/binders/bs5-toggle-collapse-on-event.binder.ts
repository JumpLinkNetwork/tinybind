import { Binder } from "@ribajs/core";
import { Collapse } from "../services/collapse";

export interface Bs5CollapseOnEventBinder extends Binder<boolean> {
  onEvent: (event: Event) => void;
  collapseServices: Collapse[];
  targets: NodeListOf<HTMLElement>;
}

/**
 *
 */
export const toggleCollapseOnEventBinder: Binder<string> = {
  name: "bs5-toggle-collapse-on-*",
  bind(el: HTMLElement) {
    this.customData = {
      targets: new Map<HTMLElement, Collapse>(),
      onEvent(event: Event) {
        event.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const collapseService of this.targets.values()) {
          collapseService.toggle();
        }
      },
    };
    this.customData.onEvent = this.customData.onEvent.bind(this.customData);
    if (this.args === null) {
      throw new Error("args is null");
    }
    const eventName = this.args[0] as string;
    el.addEventListener(eventName, this.customData.onEvent);
  },
  unbind() {
    const eventName = this.args[0] as string;
    this.el.removeEventListener(eventName, this.customData.onEvent);
  },
  routine(el: HTMLElement, targetSelector: string) {
    const newTargets = Array.from(
      document.querySelectorAll<HTMLElement>(targetSelector)
    );

    if (newTargets.length <= 0) {
      console.warn(
        `[toggleCollapseOnEventBinder] No element with selector "${targetSelector}" found.`
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const target of this.customData.targets.keys()) {
      if (!newTargets.find((x) => x === target)) {
        this.customData.targets.get(target).dispose();
        this.customData.targets.delete(target);
      }
    }

    for (const target of newTargets) {
      if (!this.customData.targets.has(target)) {
        this.customData.targets.set(
          target,
          new Collapse(target, { toggle: false })
        );
      }
    }
    // onStateChange();
  },
};
