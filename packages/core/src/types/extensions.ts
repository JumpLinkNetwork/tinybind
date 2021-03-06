import { Formatters } from "./formatters";
import { Binders } from "./binders";
import { Adapters } from "./adapters";
import { Components } from "./components";

export interface Extensions {
  binders?: Binders<any>;
  formatters?: Formatters;
  components?: Components;
  adapters?: Adapters;
}
