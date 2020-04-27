
/**
 *
 */
export const getInputValue = (el: HTMLElement) => {
  const results: string[] = [];
  if ((el as HTMLSelectElement).type === "checkbox") {
    return (el as HTMLInputElement).checked;
  } else if ((el as HTMLSelectElement).type === "select-multiple") {
    const options: HTMLOptionsCollection = (el as HTMLSelectElement).options;

    for (const key in options) {
      if (options[key]) {
        const option = options[key];
        if (option.selected) {
          results.push(option.value);
        }
      }
    }

    return results;
  } else if (el.getAttribute("contenteditable")) {
    return el.innerHTML; // TODO write test for contenteditable
  } else {
    return (el as HTMLInputElement).value;
  }
}


/**
 * Scrolls to an element by event and selector
 *
 * Attributes:
 *  * scroll-element="query-selector"
 * @see https://stackoverflow.com/a/31987330
 * @param element
 * @param to
 * @param duration
 */
export const scrollTo = (
  to: HTMLElement,
  offset: number,
  scrollElement: Element | (Window & typeof globalThis) | null,
  angle: "horizontal" | "vertical" = "vertical",
  behavior: "auto" | "smooth" | undefined = "smooth"
) => {
  if (!scrollElement) {
    scrollElement = window;
  }

  let top = 0;
  let left = 0;

  if (typeof (scrollElement as Window).pageYOffset === "number") {
    if (angle === "vertical") {
      top =
        to.getBoundingClientRect().top +
        (scrollElement as Window).pageYOffset -
        offset;
    } else {
      left =
        to.getBoundingClientRect().left +
        (scrollElement as Window).pageXOffset -
        offset;
    }
  } else {
    if (angle === "vertical") {
      top = to.offsetTop - offset;
    } else {
      left = to.offsetLeft - offset;
    }
  }

  // if is is window to scroll
  scrollElement.scroll({
    behavior,
    left,
    top,
  });
}

export const getElementFromEvent = (event: Event | MouseEvent | TouchEvent) => {
  const el =
    ((event as Event).target as HTMLAnchorElement) ||
    ((event as any).currentTarget as HTMLAnchorElement) ||
    ((event as MouseEvent).relatedTarget as HTMLAnchorElement) ||
    ((event as any).fromElement as HTMLAnchorElement);
  return el;
}

export const getViewportDimensions = () => {
  const w = Math.max(
    document.documentElement ? document.documentElement.clientWidth : 0,
    window.innerWidth || 0
  );
  const h = Math.max(
    document.documentElement ? document.documentElement.clientHeight : 0,
    window.innerHeight || 0
  );
  return {
    h,
    w,
  };
}

/**
 * Cross-browser Document Ready check
 * @see https://www.competa.com/blog/cross-browser-document-ready-with-vanilla-javascript/
 * @param callback
 */
export const ready = (callback: () => void) => {
  if (!callback || typeof callback !== "function") {
    return new Error("The callback is required!");
  }

  const checkReady = () => {
    if (document.readyState !== "loading") {
      callback();
      if ((document as any).attachEvent) {
        (document as any).detachEvent("onreadystatechange", checkReady);
      }
      document.removeEventListener("DOMContentLoaded", checkReady);
    }
  };

  if ((document as any).attachEvent) {
    (document as any).attachEvent("onreadystatechange", checkReady);
  }
  if (document.addEventListener) {
    document.addEventListener("DOMContentLoaded", checkReady);
  }
  checkReady();
}
