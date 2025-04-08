import { z } from "zod";
import { CommonPageData, CommonPageProperties } from "./common.js";

export function makePageSchema<TProperties extends z.ZodObject<any>>(
  pageProperties: TProperties,
) {
  return z.array(
    CommonPageData.extend({
      properties: CommonPageProperties.merge(pageProperties),
    }),
  );
}

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
