import { IRibaModule } from '@ribajs/core';
import * as binders from './binders';
import * as components from './components';
import * as formatters from './formatters';

export const <%= classify(name) %>Module: IRibaModule = {
  binders,
  components,
  formatters,
  services: {},
};