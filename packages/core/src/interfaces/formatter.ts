export type FormatterFn = (val: any, ...args: any[]) => any;

export interface IOneWayFormatter {
  (val: any, ...args: any[]): any;
  read?: FormatterFn;
  publish?: FormatterFn;
  /**
   * A formatter can have any other private properties or methods like a Class
   */
  [propertyOrFunction: string]: any;
}

export interface ITwoWayFormatter {
  read?: FormatterFn;
  publish?: FormatterFn;
  /**
   * A formatter can have any other private properties or methods like a Class
   */
  [propertyOrFunction: string]: any;
}

export type IFormatter = FormatterFn &(IOneWayFormatter | ITwoWayFormatter);

export interface IModuleFormatters {
  [name: string]: IFormatter;
}

/**
 * This wrapper i used to store the binder name in the name property
 */
export interface IModuleFormatterWrapper {
  name: string;
  formatter: IFormatter;
}