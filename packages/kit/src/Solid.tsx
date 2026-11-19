"use client";
/**
 * Solid (bars study §13, his 20 Nov «un solido tridimensionale… permettendomi di ruotarlo… la
 * rotazione è una dimensione»): the day as a block of columns, one row per part (the macros, in
 * their colours), one column per voce (his meals, by their icon), each as tall as its kcal.
 * Turning it is the pivot (OLAP): from the front the meals side by side, from the side the macros,
 * from above the map of the day. A drag turns it; the three dots snap to those views.
 */
import { useRef, useState, type CSSProperties } from "react";
import { Glyph } from "./Glyph";
import type { GlyphOf } from "./glyph";

export type SolidData = {
  label: string;
  /** The columns along the width (his meals). */
  cols: { name: string; icon: GlyphOf }[];
  /** The rows along the depth (the macros). */
  rows: { name: string; key: string; color: string }[];
  /** v[row][col], in one unit (kcal). */
  v: number[][];
};

const VIEWS: [number, number][] = [
  [-22, -32], // three quarters
  [-6, 0], // the front: by meal
  [-6, -90], // the side: by macro
  [-88, 0], // from above: the map
];
const H = 120; // the tallest column, in px
const W = 22; // a column's width and depth
const GAP = 8;

export function Solid({ data, viewLabels }: { data: SolidData; viewLabels: string[] }) {
  const [view, setView] = useState(0);
  const [rot, setRot] = useState<[number, number]>(VIEWS[0]!);
  const drag = useRef<{ x: number; y: number; r: [number, number] } | null>(null);
  const top = Math.max(1, ...data.v.flat());
  const nx = data.cols.length;
  const nz = data.rows.length;
  const width = nx * (W + GAP);
  const depth = nz * (W + GAP);
  const go = (i: number) => {
    setView(i);
    setRot(VIEWS[i]!);
  };
  return (
    <div className="k-solid" role="img" aria-label={data.label}>
      <div
        className="stage"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, r: rot };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          setRot([
            Math.max(-90, Math.min(0, d.r[0] - (e.clientY - d.y) * 0.4)),
            d.r[1] + (e.clientX - d.x) * 0.5,
          ]);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <div
          className="scene"
          style={{ "--rx": rot[0] + "deg", "--ry": rot[1] + "deg" } as CSSProperties}
        >
          <div
            className="floor"
            style={{
              width: width + "px",
              height: depth + "px",
              left: -width / 2 + "px",
              top: -depth / 2 + "px",
            }}
          />
          {data.rows.map((r, z) =>
            data.cols.map((c, x) => {
              const h = Math.max(1, (data.v[z]![x]! / top) * H);
              const X = x * (W + GAP) + (W + GAP) / 2 - width / 2;
              const Z = z * (W + GAP) + (W + GAP) / 2 - depth / 2;
              return (
                <div
                  key={r.key + c.name}
                  className="col"
                  style={
                    {
                      "--c": r.color,
                      "--h": h + "px",
                      "--s": Math.round(25 + (75 * data.v[z]![x]!) / top) + "%",
                      "--w": W + "px",
                      transform: `translate3d(${X}px, 0, ${Z}px)`,
                    } as CSSProperties
                  }
                >
                  <i className="f top" />
                  <i className="f front" />
                  <i className="f back" />
                  <i className="f left" />
                  <i className="f right" />
                </div>
              );
            }),
          )}
          {data.cols.map((c, x) => (
            <span
              key={c.name}
              className="cico"
              style={{
                transform: `translate3d(${x * (W + GAP) + (W + GAP) / 2 - width / 2}px, 6px, ${depth / 2 + 4}px)`,
              }}
            >
              <Glyph of={c.icon} size="s" />
            </span>
          ))}
        </div>
      </div>
      <span className="views">
        {VIEWS.map((_, i) => (
          <button
            key={i}
            type="button"
            className={"dot" + (i === view ? " on" : "")}
            aria-label={viewLabels[i]}
            aria-pressed={i === view}
            onClick={() => go(i)}
          />
        ))}
      </span>
    </div>
  );
}
