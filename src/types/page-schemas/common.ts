import { z } from "zod";
import { Relation } from "../notion-data.js";

/**
 * Common data fields present in all Notion pages
 * 
 * This schema defines the base structure for all Notion pages, including:
 * - Page metadata (ID, creation time, last edited time)
 * - Author information (creator and last editor)
 * - Parent database information
 * - Page URLs
 */
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

/**
 * Type helper for page data with custom properties
 * 
 * This type is used to create strongly-typed page data types by combining
 * the common page data with custom property schemas.
 * 
 * @template TProperties - The shape of custom properties to add to the page
 */
export type TPageData<TProperties extends z.ZodRawShape> = z.infer<
  z.ZodObject<TProperties>
>;

/**
 * Common properties present in all Notion pages in our databases
 * 
 * This schema defines properties that are present in all our Notion pages:
 * - Master Status: Relation to status pages
 * - P0 Hub: Relation to hub pages
 */
export const CommonPageProperties = z.object({
  "Master Status": Relation,
  "P0 🅗🅤🅑": Relation,
});
