import type { Item, SectionItem } from "../types/index.js";
import { isSectionDocType } from "./processing.js";

export function makeSortedByDocNo<
  T extends Record<string, any> & { docNo: string },
>(arr: T[]) {
  return arr.toSorted(sortByDocNo);
}

export function makeSortedByNumberOrDocNo<
  T extends Record<string, any> & {
    docNo: string | null | undefined;
    number?: number | null | undefined;
  },
>(arr: T[]) {
  const hasNumber = arr.filter(
    (item) => item.number !== null && item.number !== undefined,
  );
  const doesNotHaveNumber = arr.filter(
    (item) => item.number === null || item.number === undefined,
  );
  return [
    ...makeSortedByNumber(
      hasNumber as (Record<string, any> & { number: number })[],
    ),
    ...makeSortedByDocNo(
      doesNotHaveNumber as Record<string, any> & { docNo: string }[],
    ),
  ] as T[];
}

function makeSortedByNumber(arr: Record<string, any> & { number: number }[]) {
  return arr.toSorted(sortByNumber);
}

function sortByNumber(
  a: Record<string, any> & {
    number: number;
  },
  b: Record<string, any> & {
    number: number;
  },
) {
  return a.number - b.number;
}

function sortByDocNo(
  a: Record<string, any> & { docNo: string | null | undefined },
  b: Record<string, any> & { docNo: string | null | undefined },
) {
  const docNoA = a.docNo;
  const docNoB = b.docNo;
  if (!docNoA || !docNoB) {
    throw new Error("No doc no strings found");
  }
  const numbersA = docNoA.match(/\d+/g);
  const numbersB = docNoB.match(/\d+/g);
  if (!numbersA || !numbersB) {
    return docNoA.localeCompare(docNoB);
  }
  const lastNumberA = Number(numbersA.at(-1));
  const lastNumberB = Number(numbersB.at(-1));

  return lastNumberA - lastNumberB;
}

export function getFirstElement(s: string) {
  return s.split(" - ").at(0);
}

export function getLastElement(s: string) {
  return s.split(" - ").at(-1);
}

export function removeLastNumberSection(input: string): string {
  // Find the last occurrence of a period followed by a number
  const lastDotIndex = input.lastIndexOf(".");

  // If a period is found, return the string up to that point
  if (lastDotIndex !== -1) {
    return input.substring(0, lastDotIndex);
  }

  // If no period is found, return the original string
  return input;
}

export function isSectionItem(item: Item): item is SectionItem {
  return isSectionDocType(item.type);
}

