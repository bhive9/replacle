import { readFileSync } from "node:fs";
import { join } from "node:path";

// The client only ever looks up four-letter words; public/data/dictionary-4.txt
// must stay an exact, well-formed copy of those entries.
const fourLetter = readFileSync(join(process.cwd(), "public/data/dictionary-4.txt"), "utf8")
  .split("\n")
  .filter(Boolean);

const fullDictionary = new Set(
  readFileSync(join(process.cwd(), "public/data/dictionary.txt"), "utf8")
    .split("\n")
    .map((word) => word.trim().toLowerCase())
);

describe("dictionary-4.txt", () => {
  it("contains only lowercase four-letter words", () => {
    for (const word of fourLetter) {
      expect(word).toMatch(/^[a-z]{4}$/);
    }
  });

  it("covers exactly the four-letter entries of the full dictionary", () => {
    const expected = [...fullDictionary].filter((word) => word.length === 4).sort();
    expect([...fourLetter].sort()).toEqual(expected);
  });

  it("has no duplicates", () => {
    expect(new Set(fourLetter).size).toBe(fourLetter.length);
  });
});
