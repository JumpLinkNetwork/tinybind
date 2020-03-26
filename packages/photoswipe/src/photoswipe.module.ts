export * from './binders';
export * from './components';
export * from './formatters';
export * from './types';
export * from './services';

import { RibaModule } from '@ribajs/core';
import * as binders from './binders';
// import * as formatters from './formatters';
import { TouchEventsService, Autoscroll } from './services';
// import * as components from './components';

export const extrasModule: RibaModule = {
  formatters: {},
  binders,
  services: { TouchEventsService, Autoscroll },
  components: {},
};