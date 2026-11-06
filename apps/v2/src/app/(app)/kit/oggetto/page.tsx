/** The ObjectPage (PAT-30) in the kit gallery. Development only, 404 in production. */
import { notFound } from "next/navigation";
import { galleryAllowed } from "@/features/gallery/allowed";
import { ObjectDemo } from "@/features/gallery/ObjectDemo";

export default function KitObjectPage() {
  if (!galleryAllowed(process.env.NODE_ENV)) notFound();
  return <ObjectDemo />;
}
