/**
 * features/nutrition/ingredients/BarcodeBox.tsx — a new ingredient from its
 * barcode: the camera reads it (the browser's BarcodeDetector, where it
 * exists — Chrome on Android does), or the digits are typed; the page then
 * fills the form from Open Food Facts. Client component.
 */
"use client";

import { Barcode, Camera, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fill, type Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { CARD } from "@/ui/Card";
import { FormAlert } from "@/ui/FormAlert";

type Detector = { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

const detectorCtor = () =>
  (window as unknown as { BarcodeDetector?: new (o: object) => Detector })
    .BarcodeDetector;

export function BarcodeBox({
  code,
  found,
  t,
}: {
  code: string | null;
  found: boolean;
  t: Messages["barcode"];
}) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [typed, setTyped] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const video = useRef<HTMLVideoElement>(null);

  const go = (c: string) => {
    const q = new URLSearchParams(params.toString());
    q.set("barcode", c);
    router.push(`${path}?${q.toString()}`);
  };

  const lookup = () => {
    if (/^\d{6,14}$/.test(typed)) go(typed);
    else setError(t.invalid);
  };

  useEffect(() => {
    if (!scanning) return;
    const Ctor = detectorCtor();
    if (!Ctor) return;
    const detector = new Ctor({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
    let stream: MediaStream | null = null;
    let stop = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        while (!stop) {
          const [hit] = await detector.detect(video.current);
          if (hit?.rawValue) {
            stop = true;
            go(hit.rawValue);
            break;
          }
          await new Promise((r) => setTimeout(r, 250));
        }
      } catch {
        setError(t.noCamera);
        setScanning(false);
      }
    })();
    return () => {
      stop = true;
      stream?.getTracks().forEach((tr) => tr.stop());
    };
    // `go` and `t` are stable enough for the life of one scan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  return (
    <section className={CARD} aria-label={t.title}>
      <h2 className="section-heading">
        <span className="section-icon">
          <Barcode size={20} aria-hidden="true" />
        </span>
        {t.title}
      </h2>
      {code && (
        <FormAlert tone={found ? "info" : "error"}>
          {found ? t.found : fill(t.missing, { code })}
        </FormAlert>
      )}
      {error && <FormAlert tone="error">{error}</FormAlert>}
      {scanning ? (
        <div className="flex flex-col gap-2">
          <video
            ref={video}
            muted
            playsInline
            className="w-full rounded-control bg-ink"
          />
          <button
            type="button"
            onClick={() => setScanning(false)}
            className={`self-start ${buttonClass({ variant: "quiet", size: "sm" })}`}
          >
            <X size={16} aria-hidden="true" />
            {t.stop}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <button
            type="button"
            onClick={() => {
              if (!detectorCtor()) return setError(t.noCamera);
              setError(null);
              setScanning(true);
            }}
            className={buttonClass({ variant: "secondary" })}
          >
            <Camera size={18} aria-hidden="true" />
            {t.scan}
          </button>
          {/* Not a <form>: this box sits inside the ingredient form. */}
          <div className="flex items-end gap-2">
            <label className="flex flex-col gap-1 text-meta font-semibold">
              {t.code}
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  lookup();
                }}
                inputMode="numeric"
                className="w-40 rounded-control rule-b-medium border-ink bg-sheet px-2 py-1.5 text-body font-normal"
              />
            </label>
            <button
              type="button"
              onClick={lookup}
              className={buttonClass({ variant: "subtle" })}
              aria-label={t.lookup}
            >
              <Search size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
      <p className="text-meta text-muted">{t.hint}</p>
    </section>
  );
}
