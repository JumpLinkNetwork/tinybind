/// <reference types="webpack-env" />

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
