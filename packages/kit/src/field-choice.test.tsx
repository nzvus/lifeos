import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";

const two = [
  { value: "0", label: "Push" },
  { value: "1", label: "Pull" },
];

describe("a choice (VIS-85)", () => {
  it("VIS-85: ≤ 4 short options are segmented; a list he extends is always a drop-down", () => {
    const seg = renderToStaticMarkup(
      <Field name="p" label="Passo" type="choice" options={two} />,
    );
    expect(seg).toContain("k-choice");
    expect(seg).not.toContain("<select");
    const grows = renderToStaticMarkup(
      <Field name="p" label="Passo" type="choice" options={two} grows required />,
    );
    expect(grows).toContain("<select");
    // Required: no empty «–» to pick.
    expect(grows).not.toContain(">–<");
  });
});
