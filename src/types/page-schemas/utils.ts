import { z } from "zod";
import { CommonPageData, CommonPageProperties } from "./common.js";

/**
 * Create a page schema by merging common page data with custom properties
 * 
 * This function takes a custom properties schema and merges it with the
 * common page data schema, returning a new schema that includes both.
 * 
 */
export function makePageSchema<TProperties extends z.ZodObject<any>>(
  pageProperties: TProperties,
) {
  return z.array(
    CommonPageData.extend({
      properties: CommonPageProperties.merge(pageProperties),
    }),
  );
}

/**
 * Prettify utility type
 * 
 * This type recursively expands the properties of an object,
 * making all its properties accessible as top-level properties.
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
