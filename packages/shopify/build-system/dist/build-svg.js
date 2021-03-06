"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Custom version of https://github.com/Shopify/slate/blob/0.x/packages/slate-tools/src/tasks/build-svg.js
 */
const gulp_1 = __importDefault(require("gulp"));
const gulp_plumber_1 = __importDefault(require("gulp-plumber"));
const chokidar_1 = __importDefault(require("chokidar"));
const gulp_size_1 = __importDefault(require("gulp-size"));
const vinyl_paths_1 = __importDefault(require("vinyl-paths"));
const del_1 = __importDefault(require("del"));
const gulp_svgmin_1 = __importDefault(require("gulp-svgmin"));
const gulp_cheerio_1 = __importDefault(require("gulp-cheerio"));
const gulp_ext_replace_1 = __importDefault(require("gulp-ext-replace"));
const gulp_util_1 = __importDefault(require("gulp-util"));
const config_1 = require("./includes/config");
const utilities_1 = require("./includes/utilities");
const messages_1 = __importDefault(require("./includes/messages"));
/**
 * Processing for SVGs prior to deployment - adds accessibility markup, and converts
 * the file to a liquid snippet.
 *
 * @param {String|Array} files - glob/array of files to match & send to the stream
 * @returns {Stream}
 * @private
 */
function processIcons(files) {
    messages_1.default.logProcessFiles("build:svg");
    return gulp_1.default
        .src(files)
        .pipe(gulp_plumber_1.default(utilities_1.errorHandler))
        .pipe(gulp_svgmin_1.default(config_1.config.plugins.svgmin))
        .pipe(gulp_cheerio_1.default(config_1.config.plugins.cheerio))
        .pipe(gulp_ext_replace_1.default(".liquid"))
        .pipe(gulp_size_1.default({
        showFiles: true,
        pretty: true,
    }))
        .pipe(gulp_1.default.dest(config_1.config.dist.snippets));
}
/**
 * Cleanup/remove liquid snippets from the `dist` directory during watch tasks if
 * any underlying SVG files in the `src` folder have been removed.
 *
 * @param {String|Array} files - glob/array of files to match & send to the stream
 * @returns {Stream}
 * @private
 */
function removeIcons(files) {
    messages_1.default.logProcessFiles("remove:svg");
    const mapFiles = files.map((file) => {
        gulp_util_1.default.log("remove icon: " + file);
        const distFile = file
            .replace("src/icons", "dist/snippets")
            .replace(config_1.config.ribaShopify.root, config_1.config.dist.root);
        const snippetFile = distFile.replace(".svg", ".liquid");
        return snippetFile;
    });
    return gulp_1.default
        .src(mapFiles)
        .pipe(gulp_plumber_1.default(utilities_1.errorHandler))
        .pipe(vinyl_paths_1.default(del_1.default))
        .pipe(gulp_size_1.default({
        showFiles: true,
        pretty: true,
    }));
}
/**
 * Pre-processing for svg icons
 *
 * @function build:svg
 * @memberof slate-cli.tasks.build
 * @static
 */
gulp_1.default.task("build:svg", () => {
    return processIcons([config_1.config.src.icons, config_1.config.ribaShopify.src.icons]);
});
/**
 * Watches source svg icons for changes...
 *
 * @function watch:svg
 * @memberof slate-cli.tasks.watch
 * @static
 */
gulp_1.default.task("watch:svg", () => {
    const cache = utilities_1.createEventCache();
    return chokidar_1.default
        .watch([config_1.config.src.icons, config_1.config.ribaShopify.src.icons], {
        ignoreInitial: true,
    })
        .on("all", (event, path) => {
        messages_1.default.logFileEvent(event, path);
        cache.addEvent(event, path);
        utilities_1.processCache(cache, processIcons, removeIcons);
    });
});
//# sourceMappingURL=build-svg.js.map