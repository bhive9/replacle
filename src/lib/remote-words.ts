import { readFileSync } from "fs";
import { join } from "path";

const readWords = (file: string) => readFileSync(join(process.cwd(), "public/data", file), "utf8")
  .split("\n").map((word) => word.trim().toLowerCase()).filter((word) => word.length === 4);

export const startingWords = readWords("starting_words.txt");
export const dictionary = new Set(readWords("dictionary.txt"));
