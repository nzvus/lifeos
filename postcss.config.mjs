// postcss.config.mjs — Tailwind v4 runs as a PostCSS plugin. Next.js picks this
// file up automatically when it compiles any imported .css file
// (src/app/globals.css). Nothing else belongs here.
const config = {
  plugins: { "@tailwindcss/postcss": {} },
};

export default config;
