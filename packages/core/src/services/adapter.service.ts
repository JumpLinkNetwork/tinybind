import { Adapter, Adapters, ModuleElementType, AnyConstructor } from "../types";
import { ModuleElementService } from "./module-element.service";
import { Observer } from "../observer";

export class AdapterService
  extends ModuleElementService
  implements AnyConstructor {
  protected type: ModuleElementType = "adapter";

  /**
   *
   */
  constructor(adapters: Adapters) {
    super(adapters);
  }

  /**
   * Regist a adapter with his name
   * @param adapter
   * @param name
   */
  public regist(
    adapter: Adapter,
    fallbackName?: string,
    forceFallback = false
  ): Adapters {
    const name = forceFallback
      ? fallbackName || adapter.name
      : adapter.name || fallbackName;
    if (!name) {
      throw new Error("Adapter name not found!");
    }
    this.elements[name] = adapter;
    const options = { adapters: (this.elements as any) as Adapters };
    Observer.updateOptions(options);
    return this.elements;
  }
}
