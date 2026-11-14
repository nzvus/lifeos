// VIS-04, PAT-01: every place keeps one gap between its cards, no frames, and nothing stuck to
// the bottom covers anything else, at 390 and 320 px (one project each). His 14 Nov: «il
// padding è fatto male… alcune cose hanno i contorni altre no… non esistono tool appositi?».
import { expect, test } from "@playwright/test";
import { measureLayout } from "./layout";

const PLACES = [
  "/oggi",
  "/oggi/piano",
  "/oggi/elenco",
  "/oggi/andamento",
  "/oggi/andamento/obiettivi",
];

test("one gap, no frames, nothing stuck over anything (VIS-04, PAT-01)", async ({
  page,
}) => {
  for (const url of PLACES) {
    await page.goto(url);
    const r = await page.evaluate(measureLayout);
    expect(r.want, "the gap token").toBeGreaterThan(0);
    expect.soft(r.gaps, url + ": gaps between cards").toEqual([]);
    expect.soft(r.frames, url + ": cards with a frame").toEqual([]);
    expect.soft(r.stuck, url + ": things stuck to the bottom").toEqual([]);
  }
});
