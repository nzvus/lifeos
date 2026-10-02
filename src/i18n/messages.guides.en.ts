/**
 * i18n/messages.guides.en.ts — the words of the exercise guides (ADR-0028),
 * one per movement pattern (core/training/guides.ts has the numbers).
 * Cues: setup and execution; mistakes: the most common ones. Guidance from
 * the usual coaching references (NSCA, ACSM), not medical advice.
 */
type PatternWords = { cues: string[]; mistakes: string[] };

export const guidesEn = {
  section: "Guide",
  title: "How to",
  cues: "Technique",
  mistakes: "Common mistakes",
  numbers: "Usually: {sets} sets × {reps} · rest {rest}",
  numbersTime: "Usually: {reps}",
  warmupYes: "Warm-up: yes, if it is the first exercise for these muscles.",
  warmupNo: "Warm-up: usually not, if the muscles are already warm.",
  note: "General guidance, not medical advice: stop if it hurts.",
  today: "Today",
  todayLabel: "Today: ",
  reasons: {
    start: "{sets} × {lo}–{hi}: pick a load you could lift 2–3 more times",
    add_load: "{sets} × {lo}–{hi} × {kg} kg: every set reached {hi} last time, go up",
    add_load_bw: "{sets} × {lo}–{hi}: all at the top, add a load or a harder variant",
    add_reps: "{sets} × {lo}–{hi} × {kg} kg: aim for {lo} reps or more on every set",
    add_reps_bw: "{sets} × {lo}–{hi}: aim for {lo} reps or more on every set",
    hold: "{sets} × {lo}–{hi} × {kg} kg: same load, aim to reach {lo}",
    add_time_min: "{min} minutes (about +10 % on last time)",
    add_time_s: "{sets} × {s} s (about +10 %)",
    hold_time_min: "{min} minutes to start",
    hold_time_s: "{sets} × {s} s to start",
  },
  best: "Best set: {reps} × {kg} kg · estimated 1RM {e1rm} kg",
  patterns: {
    horizontal_press: {
      cues: [
        "Shoulder blades back and down, chest up; feet planted.",
        "Lower under control to the chest (chest height on a machine), elbows about 45° from the body.",
        "Press without lifting shoulders or hips off the bench; breathe out as you press.",
      ],
      mistakes: [
        "Elbows flared to 90°: it loads the shoulders.",
        "Bouncing off the chest or cutting the range short.",
        "Arching so much the hips lift.",
      ],
    },
    vertical_press: {
      cues: [
        "Abs and glutes tight, neutral back; on a bench, back supported.",
        "Start with elbows slightly in front and press up, hands meeting overhead.",
        "Lower slowly to chin height or a little below.",
      ],
      mistakes: [
        "Arching the lower back to push more.",
        "Elbows too wide and back.",
        "A load so heavy it shortens the range.",
      ],
    },
    fly: {
      cues: [
        "Elbows slightly bent and fixed throughout.",
        "Open until the chest stretches, not past the line of the shoulders.",
        "Close as if hugging a tree, squeezing the chest.",
      ],
      mistakes: [
        "Bending and straightening the elbows: it becomes a press.",
        "Opening too far, stressing the shoulder.",
        "Heavy loads at the cost of control.",
      ],
    },
    horizontal_pull: {
      cues: [
        "Stable torso, chest up, neutral back.",
        "Pull the elbows back close to the body, bringing the shoulder blades together.",
        "Return slowly letting the back stretch, keeping the posture.",
      ],
      mistakes: [
        "Rocking the torso to move the load.",
        "Pulling with the arms only, shoulder blades still.",
        "Shoulders creeping up to the ears.",
      ],
    },
    vertical_pull: {
      cues: [
        "Grip a little wider than the shoulders, torso slightly back, chest up.",
        "Lower the shoulder blades first, then drive the elbows to the hips and the bar to the upper chest.",
        "Go back up slowly to almost straight arms.",
      ],
      mistakes: [
        "Pulling behind the neck.",
        "Leaning back to help.",
        "Stopping halfway: no stretch at the top.",
      ],
    },
    rear_fly: {
      cues: [
        "Arms almost straight, the move comes from the shoulders, not the elbows.",
        "Open out to shoulder height, thumbs forward or down.",
        "Pause briefly at the end, then return slowly.",
      ],
      mistakes: [
        "Squeezing the shoulder blades hard: the back works more than the rear delts.",
        "Using momentum.",
        "Too much load for a small muscle.",
      ],
    },
    lateral_raise: {
      cues: [
        "Elbows slightly bent, torso still.",
        "Raise out to the side to shoulder height, leading with the elbows.",
        "Lower slowly: the way down counts as much as the way up.",
      ],
      mistakes: [
        "Shrugging toward the ears (the traps take over).",
        "Swinging with the torso.",
        "Going above the shoulders with heavy loads.",
      ],
    },
    curl: {
      cues: [
        "Elbows still at the sides.",
        "Curl to a full squeeze without moving the shoulder forward.",
        "Lower to almost straight arms, under control.",
      ],
      mistakes: [
        "Swinging the torso.",
        "Elbows drifting forward at the top.",
        "Partial range at the bottom.",
      ],
    },
    triceps_extension: {
      cues: [
        "Elbows still, close to the head or the sides depending on the variant.",
        "Straighten the arm fully, without snapping the elbow.",
        "Return slowly to a deep bend.",
      ],
      mistakes: [
        "Elbows flaring or moving.",
        "Pushing with the torso or shoulders.",
        "Short range, no stretch.",
      ],
    },
    squat: {
      cues: [
        "Feet shoulder-width, toes slightly out; brace the abs.",
        "Sit the hips back and the knees out over the toes, neutral back.",
        "Reach at least parallel (if mobility allows) and drive up through the whole foot.",
      ],
      mistakes: [
        "Knees caving in.",
        "Heels lifting.",
        "Lower back rounding at the bottom.",
      ],
    },
    leg_press: {
      cues: [
        "Back and hips flat against the seat.",
        "Feet mid-platform, shoulder-width.",
        "Lower as far as the hips stay down, then push through the whole foot.",
      ],
      mistakes: [
        "Hips lifting at the bottom (rounded back).",
        "Locking the knees hard at the top.",
        "Knees caving in.",
      ],
    },
    lunge: {
      cues: [
        "Torso tall, weight on the front leg.",
        "Drop straight down until the back knee nears the floor.",
        "Drive up through the front heel.",
      ],
      mistakes: [
        "Step too short: the front knee travels far forward.",
        "Front knee caving in.",
        "Pushing with the back leg.",
      ],
    },
    hinge: {
      cues: [
        "Neutral back from start to finish; load close to the legs.",
        "The move starts with the hips going back, knees slightly bent.",
        "Stand up squeezing the glutes, without arching at the top.",
      ],
      mistakes: [
        "Rounded back.",
        "Load drifting away from the body.",
        "Overextending the lower back at the end.",
      ],
    },
    leg_curl: {
      cues: [
        "Knee in line with the machine's pivot; hips still on the pad.",
        "Curl all the way with a short pause.",
        "Return slowly to an almost straight leg.",
      ],
      mistakes: ["Hips lifting.", "Swinging on the way down.", "Short range."],
    },
    leg_extension: {
      cues: [
        "Knee in line with the pivot, back supported.",
        "Straighten fully with a short squeeze at the top.",
        "Lower slowly.",
      ],
      mistakes: [
        "Kicking with momentum.",
        "Lifting the hips off the seat.",
        "Dropping the weight on the way down.",
      ],
    },
    calf_raise: {
      cues: [
        "Balls of the feet on the edge, knees almost straight (standing) or bent (seated).",
        "Lower all the way into a stretch, pause a second.",
        "Rise as high as you can and hold briefly.",
      ],
      mistakes: ["Bouncing at the bottom.", "Short range.", "Bending the knees to help."],
    },
    crunch: {
      cues: [
        "Bring the ribs toward the pelvis by rounding the upper back.",
        "Breathe out as you close.",
        "Return slowly without fully resting.",
      ],
      mistakes: [
        "Pulling the neck with the hands.",
        "Using momentum.",
        "Moving from the hips instead of the abs.",
      ],
    },
    leg_raise: {
      cues: [
        "Shoulders stable; hanging, no swinging.",
        "Lift the legs and curl the pelvis up at the end.",
        "Lower slowly without swinging.",
      ],
      mistakes: [
        "Swinging to get up.",
        "Moving only the hips, pelvis not curling.",
        "Dropping the legs.",
      ],
    },
    plank: {
      cues: [
        "Elbows under the shoulders, body in line from head to heels.",
        "Glutes and abs tight; breathe normally.",
        "Stop when the position breaks, not when the timer rings.",
      ],
      mistakes: ["Hips sagging.", "Hips too high.", "Holding the breath."],
    },
    run: {
      cues: [
        "Short, quick steps, landing under the body.",
        "A pace at which you can still talk for most runs.",
        "Grow weekly volume by about 10 % at a time.",
      ],
      mistakes: [
        "Starting too fast.",
        "Raising distance and intensity together.",
        "Ignoring pain that doesn't go away.",
      ],
    },
    bike: {
      cues: [
        "Saddle at hip height: at the bottom the knee stays slightly bent.",
        "Steady cadence, 80–95 rpm.",
        "A resistance that lets you talk in short sentences.",
      ],
      mistakes: [
        "Saddle too low (knees strained).",
        "Too much resistance at low cadence.",
        "Tense shoulders and stiff torso.",
      ],
    },
  } satisfies Record<string, PatternWords>,
};
