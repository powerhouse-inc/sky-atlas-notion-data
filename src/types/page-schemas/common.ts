import { z } from "zod";
import { Relation } from "../notion-data.js";

export const CommonPageData = z.object({
  object: z.string(),
  id: z.string(),
  created_time: z.string(),
  last_edited_time: z.string(),
  created_by: z.object({ object: z.string(), id: z.string() }),
  last_edited_by: z.object({ object: z.string(), id: z.string() }),
  parent: z.object({ type: z.string(), database_id: z.string() }),
  url: z.string(),
  public_url: z.string().nullish(),
});

export type TPageData<TProperties extends z.ZodRawShape> = z.infer<
  z.ZodObject<TProperties>
>;

export const CommonPageProperties = z.object({
  "Master Status": Relation,
  "P0 🅗🅤🅑": Relation,
});
