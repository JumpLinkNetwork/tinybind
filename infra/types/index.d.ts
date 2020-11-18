/** Type definition for html-loader */
declare module "*.html" {
  const html: string;
  export default html;
}
/** Type definition for pug-loader: https://github.com/pugjs/pug-loader */
declare module "*.pug" {
  const pug: (locals?: any) => string;
  export default pug;
}

declare module "*.svg" {
  const svg: string;
  export default svg;
}

declare module "*.png" {
  const png: string;
  export default png;
}

declare module "*.scss" {
  const scss: string;
  export default scss;
}

declare module "*.css" {
  const css: string;
  export default css;
}

// Used by bs4 module
declare module "@sphinxxxx/color-conversion" {
  export default class Color {
    rgba: number[];
    hsla: number[];
    hslString: string;
    hex: string;
    hslaString: string;
    constructor(r: number | string, g?: number, b?: number, a?: number);
    /**
     * Splits a HEX string into its RGB(A) components
     */
    hexToRgb(input: string): number[];
    /**
     * Gets the RGB value from a CSS color name
     */
    nameToRgb(input: string): number[];
    rgbToHsl(input: number): number[];
    hslToRgb(input: number): number[];
    printRGB(alpha?: boolean): string;
    printHSL(alpha?: boolean): string;
    printHex(alpha?: boolean): string;
  }
}
