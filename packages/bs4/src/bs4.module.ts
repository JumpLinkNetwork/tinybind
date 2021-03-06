import { RibaModule } from "@ribajs/core";
import * as binders from "./binders";
import * as components from "./components";
import * as formatters from "./formatters";
import * as services from "./services";
import * as helper from "./helper";
import * as constants from "./constants";
import { Bs4ModuleOptions } from "./interfaces";

export const bs4Module: RibaModule = {
  binders,
  services,
  formatters,
  components,
  helper,
  constants,
  init(options: Bs4ModuleOptions = {}) {
    services.Bs4Service.setSingleton(options);
    return this;
  },
};
