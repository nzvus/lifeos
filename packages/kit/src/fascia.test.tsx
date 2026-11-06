import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContextLine } from "./ContextLine";
import { Fascia, Judge, scoreFascia } from "./Fascia";

const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("one fascia and one judgement chip (PAT-52)", () => {
  it("a score's ruler: «in parte» from 40, «raggiunto» from 70, the tip in its zone's colour", () => {
    const r = scoreFascia(82);
    expect(r.rule.map((z) => [z.left, z.w, z.level])).toEqual([
      ["40%", "30%", "fair"],
      ["70%", "30%", "good"],
    ]);
    expect(r.ticks.map((t) => t.label)).toEqual(["40", "70"]);
    expect(r.tip).toBe("var(--heat-good)");
    expect(scoreFascia(55).tip).toBe("var(--heat-fair)");
    expect(scoreFascia(10).tip).toBe("var(--heat-bad)");
    const s = html(<Fascia strip={r} />);
    expect(s).toContain('class="k-ztip"');
    expect(s.match(/class="tk"/g)).toHaveLength(2);
  });

  it("the chip is mark + number + word, the same for every judged number", () => {
    const s = html(<Judge score={82} />);
    expect(s).toMatch(/k-judge.*k-st met.*aria-label="raggiunto".*>82<.*raggiunto/);
    expect(html(<Judge score={55} shown="1,4 g/kg" />)).toMatch(
      /k-st part.*1,4 g\/kg.*in parte/,
    );
    expect(html(<Judge score={null} />)).toContain(">—<");
  });
});

describe("ContextLine (PAT-33, MOD-53)", () => {
  it("one line beside the voce, its parts joined, nothing when empty", () => {
    const s = html(<ContextLine parts={["5 h 30 di sonno", "caffè 40 min fa", ""]} />);
    expect(s).toContain("5 h 30 di sonno · caffè 40 min fa");
    expect(s).toContain('aria-label="Contesto: 5 h 30 di sonno, caffè 40 min fa"');
    expect(html(<ContextLine parts={[" "]} />)).toBe("");
  });
});
