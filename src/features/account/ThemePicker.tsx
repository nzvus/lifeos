"use client";
/**
 * Impostazioni → Tema: light, dark or the system's, for this device only
 * (kept in its storage, read by the root layout's script before drawing).
 */
import { useEffect, useState } from "react";
import { Field } from "@lifeos/kit";

type Choice = "system" | "light" | "dark";

function apply(c: Choice) {
  const dark =
    c === "dark" ||
    (c === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  try {
    if (c === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", c);
  } catch {
    // Storage blocked: the choice holds until the page is left.
  }
}

export function ThemePicker() {
  const [choice, setChoice] = useState<Choice | null>(null);
  useEffect(() => {
    let t: string | null = null;
    try {
      t = localStorage.getItem("theme");
    } catch {
      t = null;
    }
    setChoice(t === "light" || t === "dark" ? t : "system");
  }, []);
  if (choice === null) return null;
  return (
    <Field
      name="theme"
      label="Tema"
      type="choice"
      required
      defaultValue={choice}
      help="Vale per questo dispositivo."
      onChange={(c) => {
        setChoice(c as Choice);
        apply(c as Choice);
      }}
      options={[
        { value: "system", label: "Sistema" },
        { value: "light", label: "Chiaro" },
        { value: "dark", label: "Scuro" },
      ]}
    />
  );
}
