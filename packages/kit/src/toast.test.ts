import { describe, expect, it } from "vitest";
import { TOAST_MS, TOAST_START, toastReducer } from "./toast";

describe("Toast (PAT-74, PAT-21)", () => {
  it("shows one at a time: a new one replaces the last, for 5 s", () => {
    expect(TOAST_MS).toBe(5000);
    let s = toastReducer(TOAST_START, {
      type: "show",
      n: 1,
      text: "Salvato",
      undoable: true,
    });
    s = toastReducer(s, { type: "show", n: 2, text: "Archiviato", undoable: true });
    expect(s.current).toEqual({ n: 2, text: "Archiviato", undoable: true });
  });

  it("the old toast's timer never closes the new one", () => {
    let s = toastReducer(TOAST_START, { type: "show", n: 1, text: "a", undoable: false });
    s = toastReducer(s, { type: "show", n: 2, text: "b", undoable: false });
    s = toastReducer(s, { type: "expire", n: 1 });
    expect(s.current?.text).toBe("b");
    expect(toastReducer(s, { type: "expire", n: 2 }).current).toBeNull();
  });

  it("«Annulla» closes it once; a second tap changes nothing", () => {
    let s = toastReducer(TOAST_START, { type: "show", n: 3, text: "x", undoable: true });
    s = toastReducer(s, { type: "undo", n: 3 });
    expect(s.current).toBeNull();
    expect(toastReducer(s, { type: "undo", n: 3 })).toBe(s);
  });
});
