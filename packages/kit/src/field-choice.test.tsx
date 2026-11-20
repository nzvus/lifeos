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
  it("VIS-85: three options with a label longer than 11 characters are a drop-down (whole at 320 px)", () => {
    const three = (b: string) => [
      { value: "a", label: "Saltato" },
      { value: "b", label: b },
      { value: "c", label: "Fatto" },
    ];
    const long = renderToStaticMarkup(
      <Field name="x" label="X" type="choice" options={three("Da confermare")} />,
    );
    expect(long).toContain("<select");
    const short = renderToStaticMarkup(
      <Field name="x" label="X" type="choice" options={three("Previsto")} />,
    );
    expect(short).not.toContain("<select");
  });
});
