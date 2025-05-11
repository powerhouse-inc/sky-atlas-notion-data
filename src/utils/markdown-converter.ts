import { NotionToMarkdown } from "notion-to-md";
import type { TProcessedRichText } from "../types/processed-data.js";

export async function convertToMarkdown(richText: TProcessedRichText): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const n2m = new NotionToMarkdown({} as any);

    return await n2m.blockToMarkdown({
        type: "paragraph",
        paragraph: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            rich_text: richText as any,
            color: "default",
        },
        object: "block",
        id: ""
    });
}
