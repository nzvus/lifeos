/**
 * app/_server/i18n.ts — picks the dictionary for a locale, and is where
 * TypeScript proves that i18n/ and core/ agree.
 *
 * i18n/ may not import core/ (it's a leaf) and core/ may not import i18n/
 * (it's the bottom of the graph). app/ may import both, so the consistency
 * checks live here: if a nutrient, an error code or a locale is added in
 * core/ without a label in the dictionaries, THIS file stops compiling.
 */
import "server-only";
import type { ErrorCode } from "@/core/shared/result";
import type { Locale } from "@/core/shared/locales";
import type { NutrientKey } from "@/core/nutrition/nutrients";
import { dictionaries, type Messages } from "@/i18n";

// Compile-time checks. `Exact<A, B>` is `true` only if A and B have the same keys;
// assigning `true` to it fails to compile otherwise. No code runs here.
type Exact<A, B> = [keyof A] extends [B] ? ([B] extends [keyof A] ? true : false) : false;
const _nutrients: Exact<Messages["nutrients"], NutrientKey> = true;
const _errors: Exact<Messages["errors"], ErrorCode> = true;
const _locales: Exact<typeof dictionaries, Locale> = true;
void [_nutrients, _errors, _locales]; // "used", so the linter doesn't complain

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}
