/**
 * app/(app)/loading.tsx — shown INSTANTLY while a signed-in page loads.
 *
 * Next.js wraps each page in a React Suspense boundary using this file: when
 * you tap a link, the layout (header, nav) stays and this skeleton appears
 * immediately, then the real page replaces it. Without it the old page sat
 * frozen until the server answered, which felt like the tap did nothing.
 *
 * Pure shapes, no text: nothing to translate, nothing to read.
 */
export default function Loading() {
  return (
    <div aria-busy="true" className="flex animate-pulse flex-col gap-4">
      <div className="h-8 w-2/3 bg-hairline" />
      <div className="h-40 w-full bg-hairline" />
      <div className="h-6 w-full bg-hairline" />
      <div className="h-6 w-5/6 bg-hairline" />
      <div className="h-6 w-4/6 bg-hairline" />
    </div>
  );
}
