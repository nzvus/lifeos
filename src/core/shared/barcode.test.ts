import { describe, expect, it } from "vitest";
import { confirmReads, isValidGtin } from "./barcode";

describe("isValidGtin", () => {
  it("accepts real codes", () => {
    expect(isValidGtin("8076809513388")).toBe(true); // EAN-13
    expect(isValidGtin("96385074")).toBe(true); // EAN-8
    expect(isValidGtin("036000291452")).toBe(true); // UPC-A
  });

  it("rejects a misread digit, other lengths and non-digits", () => {
    expect(isValidGtin("8076809513389")).toBe(false);
    expect(isValidGtin("12345")).toBe(false);
    expect(isValidGtin("80768095133a8")).toBe(false);
  });
});

describe("confirmReads", () => {
  it("returns a code after two equal valid reads; a misread is ignored", () => {
    const read = confirmReads();
    expect(read("8076809513388")).toBeNull();
    expect(read("8076809513389")).toBeNull(); // fails the check digit: noise
    expect(read("8076809513388")).toBe("8076809513388");
  });

  it("starts again when another valid code is read", () => {
    const read = confirmReads();
    expect(read("8076809513388")).toBeNull();
    expect(read("96385074")).toBeNull();
    expect(read("8076809513388")).toBeNull();
    expect(read("8076809513388")).toBe("8076809513388");
  });
});
