"use client";
/**
 * A new food from its barcode (the boards Food and Library: «Scansiona»;
 * ported from v1's BarcodeBox): the camera reads it, or the digits are
 * typed; the page then fills the form from Open Food Facts. The browser's
 * own BarcodeDetector where it reads EAN/UPC, else the `barcode-detector`
 * ponyfill (ZXing in WebAssembly) so Firefox and iPhones read too; HD
 * video (a barcode at arm's length needs it); a code counts after two equal
 * reads that pass the check digit (core/food/barcode).
 */
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Glyph } from "@lifeos/kit";
import { confirmReads, isValidGtin } from "@/core/food/barcode";

type Detector = { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type DetectorCtor = {
  new (o: { formats: string[] }): Detector;
  getSupportedFormats?: () => Promise<string[]>;
};
const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

async function makeDetector(): Promise<Detector> {
  const native = (window as unknown as { BarcodeDetector?: DetectorCtor })
    .BarcodeDetector;
  if (native) {
    const supported = await native.getSupportedFormats?.().catch((): string[] => []);
    if (supported?.includes("ean_13")) return new native({ formats: FORMATS });
  }
  const { BarcodeDetector } = await import("barcode-detector/ponyfill");
  return new BarcodeDetector({ formats: FORMATS as never });
}

export function BarcodeBox({ code, found }: { code: string | null; found: boolean }) {
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
    if (isValidGtin(typed)) go(typed);
    else setError("Il codice non torna: controlla le cifre (8, 12 o 13).");
  };

  useEffect(() => {
    if (!scanning) return;
    let stream: MediaStream | null = null;
    let stop = false;
    const confirm = confirmReads();
    (async () => {
      try {
        const detector = await makeDetector();
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (!video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        while (!stop) {
          const hits = await detector.detect(video.current);
          const c = hits.map((h) => confirm(h.rawValue)).find(Boolean);
          if (c) {
            stop = true;
            go(c);
            break;
          }
          await new Promise((r) => setTimeout(r, 150));
        }
      } catch {
        setError("La fotocamera non è disponibile: scrivi le cifre del codice.");
        setScanning(false);
      }
    })();
    return () => {
      stop = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // `go` is stable enough for the life of one scan: the effect runs per scan.
  }, [scanning]);

  return (
    <section className="k-section g2" aria-label="Codice a barre">
      <h2>
        <span className="k-hicon">
          <Glyph of={{ ui: "scan" }} size="m" />
        </span>
        Dal codice a barre
      </h2>
      {code && (
        <p className="k-help" role="status">
          {found
            ? "Trovato su Open Food Facts: controlla i valori con l’etichetta prima di salvare."
            : "«" + code + "» non è su Open Food Facts: scrivi i valori dall’etichetta."}
        </p>
      )}
      {error && (
        <p className="k-help" role="alert">
          {error}
        </p>
      )}
      {scanning ? (
        <div className="k-stack g2">
          <video
            ref={video}
            muted
            playsInline
            style={{ width: "100%", borderRadius: 12 }}
          />
          <button
            type="button"
            className="k-btn secondary"
            onClick={() => setScanning(false)}
          >
            Basta
          </button>
        </div>
      ) : (
        <div className="k-line wrap">
          <button
            type="button"
            className="k-btn secondary"
            onClick={() => {
              if (!navigator.mediaDevices?.getUserMedia)
                return setError(
                  "La fotocamera non è disponibile: scrivi le cifre del codice.",
                );
              setError(null);
              setScanning(true);
            }}
          >
            Scansiona
          </button>
          {/* Not a <form>: this box sits above the food's form. */}
          <input
            className="k-text"
            style={{ width: "11rem" }}
            value={typed}
            inputMode="numeric"
            placeholder="oppure le cifre"
            aria-label="Le cifre del codice a barre"
            onChange={(e) => setTyped(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              lookup();
            }}
          />
          <button type="button" className="k-btn secondary" onClick={lookup}>
            Cerca
          </button>
        </div>
      )}
    </section>
  );
}
