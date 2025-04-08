import { z } from "zod";
import { Relation } from "../notion-data.js";
import { makePageSchema } from "./utils.js";

const HubPageProperties = z.object({
  URL: z.object({ url: z.string().nullish() }).nullish(),
});

export const HubPageSchema = makePageSchema(HubPageProperties);
