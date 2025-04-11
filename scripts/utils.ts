import { writeFile } from "fs/promises";

export async function writeJsonToFile(filePath: `${string}.json`, data: any) {
  await writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function writeTxtToFile(filePath: `${string}.txt`, data: string) {
  await writeFile(filePath, data);
}
