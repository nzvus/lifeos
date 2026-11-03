/**
 * «Porta i dati da v1» (Impostazioni): the v1 export in the body, converted
 * whole, then only what v2 lacks (core/convert `newFromV1`). `?prova=1`
 * answers what would come in and writes nothing; without it, the same is
 * written in one transaction (if anything fails, nothing changes). A route,
 * not a server action: a year of data is a few megabytes.
 */
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { convert, ConvertError, type V1Export } from "@/core/convert";
import { loadFile } from "@/core/convert/load";
import { newFromV1, readHave } from "@/core/convert/merge";

export async function POST(request: Request): Promise<Response> {
  const owner = await requireOwner();
  const dry = new URL(request.url).searchParams.get("prova") === "1";
  let v1: V1Export;
  try {
    v1 = JSON.parse(await request.text()) as V1Export;
  } catch {
    return Response.json({ error: "Non è un file JSON." }, { status: 400 });
  }
  const db = await getDb();
  try {
    const { file, summary } = newFromV1(
      convert(v1, new Date()),
      await readHave(db as never, owner.id),
    );
    if (!dry) {
      await loadFile(db as never, file, owner.id);
      revalidatePath("/", "layout");
    }
    return Response.json({ summary, written: !dry });
  } catch (e) {
    if (e instanceof ConvertError)
      return Response.json(
        { error: "Il file non è un export di v1: " + e.message },
        { status: 400 },
      );
    console.error(e);
    return Response.json(
      { error: "Non è andato: niente è cambiato. Riprova o dimmelo." },
      { status: 500 },
    );
  }
}
