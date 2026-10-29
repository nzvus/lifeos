"use server";
/**
 * ⊕'s one-tap rows (capture.md §5–§6): a planned entry of the day ticked done
 * (no second entry; «ora della spunta» as on Oggi), water added. Both close
 * the sheet on the day they were for.
 */
import { redirect } from "next/navigation";
import { addWater, changeStatus } from "../oggi/[[...day]]/actions";

const back = (day: string, today: boolean) => (today ? "/oggi" : "/oggi/" + day);

export async function tickPlanned(
  id: string,
  day: string,
  today: boolean,
): Promise<void> {
  await changeStatus(id, "done");
  redirect(back(day, today));
}

export async function waterNow(
  day: string,
  ml: 250 | 500,
  today: boolean,
): Promise<void> {
  await addWater(day, ml);
  redirect(back(day, today));
}
