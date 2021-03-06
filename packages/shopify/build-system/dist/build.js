"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gulp_1 = __importDefault(require("gulp"));
require("./output");
require("./build-assets");
require("./build-config");
require("./build-svg");
require("./build-utils");
require("./build-wp");
gulp_1.default.task("build:zip", gulp_1.default.series("clean", gulp_1.default.parallel("build:wp", "build:assets", "build:assets:riba-shopify", "build:assets:riba-shopify-tda", "build:svg")));
/**
 * Does a full clean/rebuild of your theme and creates a `.zip` compatible with
 * shopify.
 *
 * @function zip
 * @memberof slate-cli.tasks
 * @static
 */
gulp_1.default.task("zip", gulp_1.default.series("build:zip", "compress", "output:errors"));
gulp_1.default.task("build", gulp_1.default.series("clean", gulp_1.default.parallel("build:wp", "build:assets", "build:assets:riba-shopify", "build:assets:riba-shopify-tda", "build:config", "build:svg"), "output:errors"));
//# sourceMappingURL=build.js.map