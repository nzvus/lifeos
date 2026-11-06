import { redirect } from "next/navigation";

/** The app opens on today. */
export default function Home() {
  redirect("/oggi");
}
