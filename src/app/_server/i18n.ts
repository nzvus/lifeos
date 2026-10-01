/**
 * app/_server/i18n.ts — picks the dictionary for a locale, and is where
 * TypeScript proves that i18n/ and core/ agree.
 *
 * i18n/ may not import core/ (it's a leaf) and core/ may not import i18n/
 * (it's the bottom of the graph). app/ may import both, so the consistency
 * checks live here: if a nutrient, an error code, a locale or a theme is added in
 * core/ without a label in the dictionaries, THIS file stops compiling.
 */
import "server-only";
import type { ErrorCode } from "@/core/shared/result";
import type { Locale } from "@/core/shared/locales";
import type { Theme } from "@/core/shared/themes";
import type { Moment } from "@/core/nutrition/moments";
import type { MovementPattern, MuscleGroup, MuscleRegion } from "@/core/training/anatomy";
import type { ExerciseKind, Intensity, SessionStatus } from "@/core/training/kinds";
import type { FiberType, Nova, Origin, TagIcon } from "@/core/nutrition/quality";
import type { NutrientKey } from "@/core/nutrition/nutrients";
import { dictionaries, type Messages } from "@/i18n";

// Compile-time checks. `Exact<A, B>` is `true` only if A and B have the same keys;
// assigning `true` to it fails to compile otherwise. No code runs here.
type Exact<A, B> = [keyof A] extends [B] ? ([B] extends [keyof A] ? true : false) : false;
const _nutrients: Exact<Messages["nutrients"], NutrientKey> = true;
const _errors: Exact<Messages["errors"], ErrorCode> = true;
const _locales: Exact<typeof dictionaries, Locale> = true;
const _themes: Exact<Messages["settings"]["themeNames"], Theme> = true;
const _moments: Exact<Messages["moments"]["names"], Moment> = true;
const _nova: Exact<Messages["quality"]["novaNames"], Nova> = true;
const _origins: Exact<Messages["quality"]["origins"], Origin> = true;
const _fibers: Exact<Messages["quality"]["fiberNames"], FiberType> = true;
const _fiberAbout: Exact<Messages["quality"]["fiberAbout"], FiberType> = true;
const _tagIcons: Exact<Messages["quality"]["tagIcons"], TagIcon> = true;
const _kinds: Exact<Messages["training"]["kinds"], ExerciseKind> = true;
const _statuses: Exact<Messages["training"]["statuses"], SessionStatus> = true;
const _intensities: Exact<Messages["training"]["estimate"]["intensities"], Intensity> =
  true;
const _regions: Exact<Messages["exercises"]["regions"], MuscleRegion> = true;
const _groups: Exact<Messages["exercises"]["groups"], MuscleGroup> = true;
const _patterns: Exact<Messages["exercises"]["patterns"], MovementPattern> = true;
void [
  _nutrients,
  _errors,
  _locales,
  _themes,
  _moments,
  _nova,
  _origins,
  _fibers,
  _fiberAbout,
  _regions,
  _groups,
  _patterns,
  _intensities,
]; // "used", so the linter doesn't complain

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}
