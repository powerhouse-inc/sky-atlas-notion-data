import { writeFile } from "fs/promises";

export async function writeJsonToFile(filePath: string, data: any) {
  await writeFile(filePath, JSON.stringify(data, null, 2));
}
