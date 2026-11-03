"use client";
/**
 * A new food from its barcode (the boards Food and Library: «Scansiona»;
 * ported from v1's BarcodeBox): the camera reads it, a photo of it is read,
 * or the digits are typed; the page then fills the form from Open Food
 * Facts and says whether the code was found, is not there, or could not be
 * asked (FOOD-43). The browser's own BarcodeDetector where it reads
 * EAN/UPC, else the `barcode-detector` ponyfill (ZXing in WebAssembly) so
 * Firefox and iPhones read too; HD video (a barcode at arm's length needs
 * it); a code counts after two equal reads that pass the check digit
 * (core/food/barcode).
 * Focus (considerations.txt «codice a barre che mette a fuoco»): the camera
 * is asked for continuous focus where it has it, a tap on the picture
 * focuses there, a slight zoom where the lens allows, and the torch.
 */
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Glyph } from "@lifeos/kit";
import { confirmReads, isValidGtin } from "@/core/food/barcode";

type Detector = {
  detect: (src: HTMLVideoElement | ImageBitmap) => Promise<{ rawValue: string }[]>;
};
type DetectorCtor = {
  new (o: { formats: string[] }): Detector;
  getSupportedFormats?: () => Promise<string[]>;
};
/** What the camera may offer beyond the standard (Chrome on Android has these). */
type Caps = MediaTrackCapabilities & {
  focusMode?: string[];
  torch?: boolean;
  zoom?: { min: number; max: number };
  pointsOfInterest?: unknown;
};
type Extra = MediaTrackConstraintSet & {
  focusMode?: string;
  torch?: boolean;
  zoom?: number;
  pointsOfInterest?: { x: number; y: number }[];
};
const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];
const NO_CAMERA = "La fotocamera non è disponibile: scrivi le cifre o usa una foto.";

async function makeDetector(): Promise<Detector> {
  const native = (window as unknown as { BarcodeDetector?: DetectorCtor })
    .BarcodeDetector;
  if (native) {
    const supported = await native.getSupportedFormats?.().catch((): string[] => []);
    if (supported?.includes("ean_13")) return new native({ formats: FORMATS });
  }
  const { BarcodeDetector } = await import("barcode-detector/ponyfill");
  return new BarcodeDetector({ formats: FORMATS as never }) as unknown as Detector;
}

/** Asks the camera for one advanced setting; a camera without it simply ignores the ask. */
async function ask(track: MediaStreamTrack | null, c: Extra): Promise<void> {
  try {
    await track?.applyConstraints({ advanced: [c] });
  } catch {
    /* not supported here */
  }
}

export function BarcodeBox({
  code,
  result,
}: {
  code: string | null;
  /** Open Food Facts' answer for `code`: found, not there, or not reached. */
  result: "found" | "missing" | "error" | null;
}) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [typed, setTyped] = useState("");
  const [scanning, setScanning] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState<boolean | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const track = useRef<MediaStreamTrack | null>(null);

  const go = (c: string) => {
    const q = new URLSearchParams(params.toString());
    q.set("barcode", c);
    router.push(`${path}?${q.toString()}`);
  };
  const lookup = () => {
    if (isValidGtin(typed)) go(typed);
    else setError("Il codice non torna: controlla le cifre (8, 12 o 13).");
  };
  // A photo of the code (from the gallery or the camera app): read once.
  const fromPhoto = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setReading(true);
    try {
      const detector = await makeDetector();
      const hits = await detector.detect(await createImageBitmap(file));
      const c = hits.map((h) => h.rawValue).find(isValidGtin);
      if (c) go(c);
      else setError("Nella foto non leggo un codice: avvicinalo e che sia a fuoco.");
    } catch {
      setError("Non riesco a leggere la foto: prova con un’altra o scrivi le cifre.");
    } finally {
      setReading(false);
    }
  };
  // A tap on the picture focuses there (where the camera lets the page choose).
  const focusAt = (e: PointerEvent<HTMLVideoElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    void ask(track.current, {
      pointsOfInterest: [{ x, y }],
      focusMode: "single-shot",
    }).then(() => ask(track.current, { focusMode: "continuous" }));
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
        const t = stream.getVideoTracks()[0] ?? null;
        track.current = t;
        const caps = (t?.getCapabilities?.() ?? {}) as Caps;
        if (caps.focusMode?.includes("continuous"))
          await ask(t, { focusMode: "continuous" });
        // A little zoom keeps the phone far enough for the lens to focus.
        if (caps.zoom && caps.zoom.max >= 1.5)
          await ask(t, { zoom: Math.min(2, caps.zoom.max) });
        setTorch(caps.torch ? false : null);
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
        setError(NO_CAMERA);
        setScanning(false);
      }
    })();
    return () => {
      stop = true;
      track.current = null;
      setTorch(null);
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
      {code && result === "found" && (
        <p className="k-help" role="status">
          Trovato su Open Food Facts: i valori sono già scritti qui sotto, controllali con
          l’etichetta prima di salvare.
        </p>
      )}
      {code && result === "missing" && (
        <p className="k-help" role="status">
          «{code}» non è su Open Food Facts: scrivi i valori dall’etichetta. Il codice
          resta salvato con il cibo, così la prossima volta lo trova subito.
        </p>
      )}
      {code && result === "error" && (
        <p className="k-help" role="alert">
          Open Food Facts non risponde adesso, quindi non so se «{code}» c’è.{" "}
          <button type="button" className="k-btn link" onClick={() => router.refresh()}>
            Riprova
          </button>
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
            onPointerDown={focusAt}
            aria-label="Inquadra il codice; tocca per mettere a fuoco"
            style={{ width: "100%", borderRadius: 12 }}
          />
          <span className="k-help">
            Tieni il codice a una spanna, dritto; se è sfocato tocca l’immagine.
          </span>
          <div className="k-line g2 wrap">
            {torch !== null && (
              <button
                type="button"
                className="k-btn secondary"
                aria-pressed={torch}
                onClick={() => {
                  void ask(track.current, { torch: !torch });
                  setTorch(!torch);
                }}
              >
                {torch ? "Spegni la luce" : "Accendi la luce"}
              </button>
            )}
            <button
              type="button"
              className="k-btn secondary"
              onClick={() => setScanning(false)}
            >
              Basta
            </button>
          </div>
        </div>
      ) : (
        <div className="k-stack g2">
          <div className="k-line g2 wrap">
            <button
              type="button"
              className="k-btn secondary"
              onClick={() => {
                if (!navigator.mediaDevices?.getUserMedia) return setError(NO_CAMERA);
                setError(null);
                setScanning(true);
              }}
            >
              Scansiona
            </button>
            <label className="k-btn secondary" aria-busy={reading}>
              Da una foto
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => void fromPhoto(e.target.files?.[0])}
              />
            </label>
          </div>
          {/* Not a <form>: this box sits above the food's form. */}
          <div className="k-line g2">
            <input
              className="k-text"
              style={{ flex: 1, minWidth: 0 }}
              value={typed}
              inputMode="numeric"
              autoComplete="off"
              placeholder="oppure scrivi le cifre"
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
        </div>
      )}
    </section>
  );
}
