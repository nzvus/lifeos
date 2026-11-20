/**
 * The time decides the state (MOD-15 as amended; reframe §11, §14; his 15 and 20 Nov: «ogni cosa
 * che si mette in un orario successivo a tot minuti è obbligatoriamente pianificato, qualcosa che
 * si mette prima o adesso è sempre già fatto»). Two settings in `settings.prefs.timing`: the
 * slack that still counts as «adesso» (20 minutes by default), and what a previsto becomes once
 * its day is over without being done (saltato by default · da confermare · confermato). Pure.
 */
export const PAST_PLANNED = ["skipped", "unconfirmed", "confirmed"] as const;
export type PastPlanned = (typeof PAST_PLANNED)[number];
export type Timing = { slackMin: number; pastPlanned: PastPlanned };

export const TIMING_DEFAULTS: Timing = { slackMin: 20, pastPlanned: "skipped" };
export const SLACK_RANGE = { min: 0, max: 240 } as const;

/** The person's timing from `settings.prefs`, defaults for what is unset or out of range. */
export function timingOf(prefs: Record<string, unknown> | null | undefined): Timing {
  const t = (prefs?.["timing"] ?? {}) as Partial<Record<keyof Timing, unknown>>;
  const slack = Number(t.slackMin);
  return {
    slackMin:
      Number.isInteger(slack) && slack >= SLACK_RANGE.min && slack <= SLACK_RANGE.max
        ? slack
        : TIMING_DEFAULTS.slackMin,
    pastPlanned: PAST_PLANNED.includes(t.pastPlanned as PastPlanned)
      ? (t.pastPlanned as PastPlanned)
      : TIMING_DEFAULTS.pastPlanned,
  };
}

type Status = "planned" | "done" | "skipped";

/**
 * The state a voce he typed takes from its time: after now + the slack it is previsto, at now or
 * before it is fatto — whatever was tapped. Saltato is an act and is kept; a voce with no time
 * keeps what was asked (a day after today is previsto by `checkEntry`).
 */
export function stateAt(
  status: Status,
  startAt: Date | null | undefined,
  slackMin: number = TIMING_DEFAULTS.slackMin,
  now: Date = new Date(),
): Status {
  if (status === "skipped" || !startAt) return status;
  return startAt.getTime() > now.getTime() + slackMin * 60_000 ? "planned" : "done";
}

/**
 * What a previsto shows once its day is over and it was never done (reframe §11): saltato, or
 * fatto at its planned time («confermato»), or still previsto («da confermare»). Derived when the
 * day is read, never stored: changing the setting changes the past days too.
 */
export function pastState(
  status: Status,
  day: string,
  today: string,
  policy: PastPlanned,
): Status {
  if (status !== "planned" || day >= today) return status;
  return policy === "skipped" ? "skipped" : policy === "confirmed" ? "done" : "planned";
}

/** Minutes past local midnight of an instant, in a time zone. */
function minuteIn(now: Date, timeZone: string): number {
  const [h, m] = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(now)
    .split(":")
    .map(Number);
  return h! * 60 + m!;
}

/**
 * The same rule for a form still open (the composer's preview): is a voce on `day` at «HH:MM»
 * still to come? Minutes count from the logical day's start (the boundary), so 01:30 belongs to
 * the end of the day it closes. No time on today: fatto, as `stateAt` keeps what was asked.
 */
export function plannedAt(
  day: string,
  start: string,
  today: string,
  clock: { timeZone: string; boundaryMin: number },
  slackMin: number,
  now: Date = new Date(),
): boolean {
  if (day !== today) return day > today;
  const hm = /^(\d{1,2}):(\d{2})$/.exec(start);
  if (!hm) return false;
  const logical = (m: number) => (m - clock.boundaryMin + 1440) % 1440;
  const at = logical(Number(hm[1]) * 60 + Number(hm[2]));
  return at > logical(minuteIn(now, clock.timeZone)) + slackMin;
}
