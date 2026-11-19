// VIS-04, PAT-01: every place keeps one gap between its cards, no frames, and nothing stuck to
// the bottom covers anything else, at 390 and 320 px (one project each). His 14 Nov: «il
// padding è fatto male… alcune cose hanno i contorni altre no… non esistono tool appositi?».
import { expect, test } from "@playwright/test";
import { measureBoxLines, measureHeads, measureLayout } from "./layout";

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

test("a Box head's title, number, score and action on one line (VIS-40)", async ({
  page,
}) => {
  // the gallery too: it holds every state of a Box (a meta line, a wrapped head, open, a row)
  for (const url of [...PLACES, "/kit"]) {
    await page.goto(url);
    expect
      .soft(await page.evaluate(measureHeads), url + ": heads out of line")
      .toEqual([]);
  }
});

test("a Box's lines one gap apart, its head on one line while it fits (VIS-40)", async ({
  page,
}) => {
  for (const url of [...PLACES, "/kit"]) {
    await page.goto(url);
    expect
      .soft(await page.evaluate(measureBoxLines), url + ": a Box's lines")
      .toEqual([]);
  }
});
