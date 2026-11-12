/**
 * The fitness rules of PAT-90 (change 2026-11-06-guards): each shape that has a kit piece
 * fails a PR when it is hand-made again in a screen, and no screen compares a type key
 * (MOD-02). Files that broke a rule on 6 Nov are counted in `lint-baseline.json` (ESLint bulk
 * suppressions): a listed file may not grow its count, and a fixed one leaves the list.
 *
 * The user, 6 Nov: «come ci assicuriamo che ricostruendo… non abbiamo di nuovo lo stesso
 * problema?» (PROD-38).
 */
import { readFileSync } from "node:fs";

const TYPE_KEYS = (() => {
  const keys = JSON.parse(
    readFileSync(new URL("./type-keys.json", import.meta.url), "utf8"),
  );
  return new Set([...keys.voce, ...keys.catalog]);
})();

/** A rule that reports every node a selector finds, with one message. */
const banned = (selector, message) => ({
  meta: { type: "problem", schema: [], messages: { banned: message } },
  create: (context) => ({
    [selector]: (node) => context.report({ node, messageId: "banned" }),
  }),
});

const jsxName = (node) => (node.name?.type === "JSXIdentifier" ? node.name.name : null);
const attr = (node, name) =>
  node.attributes.find((a) => a.type === "JSXAttribute" && a.name?.name === name);
const stringOf = (value) => {
  if (!value) return null;
  if (value.type === "Literal") return String(value.value);
  if (value.type === "JSXExpressionContainer") {
    const e = value.expression;
    if (e.type === "Literal") return String(e.value);
    if (e.type === "TemplateLiteral")
      return e.quasis.map((q) => q.value.cooked).join(" ");
  }
  return null;
};

/** `kind`, `x.kind`, `x.catalog`, `x.key`, `x.type`: a place a type key is read from. */
const KEY_NAMES = new Set(["kind", "kindKey", "catalog", "key", "type"]);
const isKeyRead = (n) =>
  (n.type === "Identifier" && KEY_NAMES.has(n.name)) ||
  (n.type === "MemberExpression" && !n.computed && KEY_NAMES.has(n.property.name)) ||
  (n.type === "ChainExpression" && isKeyRead(n.expression));
const isTypeKey = (n) => n.type === "Literal" && TYPE_KEYS.has(n.value);

const rules = {
  "no-search-input": {
    meta: {
      type: "problem",
      schema: [],
      messages: { banned: "A search field is `Find` from the kit (PAT-41)." },
    },
    create: (context) => ({
      JSXOpeningElement(node) {
        if (jsxName(node) === "input" && stringOf(attr(node, "type")?.value) === "search")
          context.report({ node, messageId: "banned" });
      },
    }),
  },
  "no-raw-form": banned(
    "JSXOpeningElement[name.name='form']",
    "A form is `ObjectForm` or `Composer` from the kit (PAT-61, PAT-62).",
  ),
  "no-window-confirm": banned(
    "CallExpression[callee.object.name='window'][callee.property.name='confirm'], CallExpression[callee.name='confirm']",
    "Confirm with the kit's `Confirm` sheet, only what cannot be undone (PAT-73).",
  ),
  "no-hand-toast": {
    meta: {
      type: "problem",
      schema: [],
      messages: { banned: "A toast is the kit's `Toast` (PAT-21, PAT-74)." },
    },
    create: (context) => ({
      JSXOpeningElement(node) {
        const cls = stringOf(attr(node, "className")?.value);
        if (cls && /\bk-toast(bar)?\b/.test(cls))
          context.report({ node, messageId: "banned" });
      },
    }),
  },
  "no-svg": banned(
    "JSXOpeningElement[name.name='svg']",
    "No SVG in a screen: a trend is the kit's `Chart` (PAT-53), an icon is `Glyph`.",
  ),
  "no-inline-style": banned(
    "JSXAttribute[name.name='style']",
    "No inline style: spacing, sizes and colours come from tokens (PAT-80).",
  ),
  "no-type-key-compare": {
    meta: {
      type: "problem",
      schema: [],
      messages: {
        banned:
          "Compared with the type key «{{key}}»: read it from the registry (MOD-02), or move the code into its specialisation folder (model.md §8).",
      },
    },
    create: (context) => ({
      BinaryExpression(node) {
        if (!["===", "!==", "==", "!="].includes(node.operator)) return;
        const [read, lit] = isTypeKey(node.right)
          ? [node.left, node.right]
          : [node.right, node.left];
        if (isTypeKey(lit) && isKeyRead(read))
          context.report({ node, messageId: "banned", data: { key: lit.value } });
      },
      SwitchCase(node) {
        if (node.test && isTypeKey(node.test) && isKeyRead(node.parent.discriminant))
          context.report({ node, messageId: "banned", data: { key: node.test.value } });
      },
    }),
  },
};

export const fitness = { meta: { name: "lifeos-fitness" }, rules };

/** Every rule as an error, for the files of screens (app/, features/). */
export const SCREEN_RULES = Object.fromEntries(
  Object.keys(rules).map((r) => [`lifeos/${r}`, "error"]),
);
