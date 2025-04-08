import { z } from "zod";
import { RichTextField, TitleField } from "../notion-data.js";
import { makePageSchema } from "./utils.js";

const NeededResearchPageProperties = z.object({
  Name: RichTextField,
  Content: RichTextField,
  "Doc No": TitleField,
});

export const NeededResearchPageSchema = makePageSchema(
  NeededResearchPageProperties,
);
