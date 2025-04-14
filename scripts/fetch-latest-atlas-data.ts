import { parseArgs } from "util";
import {
  DEFAULT_JSON_ENDPOINT_URL,
  DEFAULT_TXT_ENDPOINT_URL,
  DEFAULT_HTML_ENDPOINT_URL,
} from "../src/constants.js";
import { EndpointDataTypeSchema, EndpointUrlSchema } from "../src/index.js";

main();
async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      writeToFilePath: {
        type: "string",
      },
      endpointUrl: {
        type: "string",
      },
    },
    allowPositionals: true,
  });

  const endpoints = {
    json: process.env.JSON_ENDPOINT_URL || DEFAULT_JSON_ENDPOINT_URL,
    txt: process.env.TXT_ENDPOINT_URL || DEFAULT_TXT_ENDPOINT_URL,
    html: process.env.HTML_ENDPOINT_URL || DEFAULT_HTML_ENDPOINT_URL,
  } as const;

  const parsedDataType = EndpointDataTypeSchema.safeParse(
    positionals[0] || "json",
  );
  if (!parsedDataType.success) {
    console.error("Data type must be either 'txt' or 'json'");
    process.exit(1);
  }
  const dataType = parsedDataType.data;
  const parsedEndpointUrl = EndpointUrlSchema.safeParse(
    values.endpointUrl || endpoints[dataType],
  );
  if (!parsedEndpointUrl.success) {
    console.error("Endpoint URL must be a valid URL");
    process.exit(1);
  }

  const endpointUrl = parsedEndpointUrl.data;
  const data = await fetch(endpointUrl);
  const text = await data.text();

  if (values.writeToFilePath) {
    const fs = await import("fs/promises");
    await fs.writeFile(values.writeToFilePath, text);
  }
  process.stdout.write(text);
}
