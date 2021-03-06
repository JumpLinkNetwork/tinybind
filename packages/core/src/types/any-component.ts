import type { BasicComponent, Component } from "../component";
import type { TypeOfComponent } from "./type-of-component";
import type { PageComponent } from "@ribajs/ssr";

export type AnyComponent<T = BasicComponent | Component | PageComponent> =
  TypeOfComponent<T>;
