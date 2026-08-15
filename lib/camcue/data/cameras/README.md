# Camera capability data — accuracy rules

CamCue is only as good as this folder. A wrong spec produces a recommendation
the camera cannot actually execute, which is the one failure mode the product
cannot survive.

## Confidence levels

Every profile carries a `confidence` value. It is shown to the user.

| Level | Meaning |
| --- | --- |
| `verified` | Long-shipping model with stable, unambiguous, widely published specifications. Capability matrix believed correct as written. |
| `high` | Compiled from published manufacturer specifications. Believed correct, but not re-checked against the newest firmware release. |
| `unverified` | Insufficient reliable information. **The camera is withheld from the product entirely** — `index.ts` filters it out of `cameras`, and `npm run validate` fails if one is shipped. Keep its capabilities deliberately minimal and never expand it by guessing. |

A withheld profile stays on file so the research is not lost and so it is
obvious what still needs checking. Promote it to `high` only once its
resolution/frame-rate matrix has been confirmed against manufacturer
documentation.

## Hard rules

1. **Never invent a mode.** If you cannot confirm a resolution/frame-rate pair,
   leave it out. A missing mode degrades a recommendation; a fake mode breaks it.
2. **Encode real constraints.** `maxFps`, `resExclude` and `fovExclude` on a
   stabilization mode exist so the engine cannot emit an impossible combination
   (e.g. GoPro Horizon Lock above 60 FPS, DJI HorizonSteady at 4K).
3. **Fixed-lens cameras get real aperture values.** Interchangeable-lens bodies
   use `{ type: "variable" }` with no min/max — the lens decides, not the body.
4. **`windReduction` is a real in-camera wind filter**, not "the mic exists".
   Interchangeable-lens cameras are `false`; they need physical protection.
5. **Bit depth belongs to the profile, not the camera.** An 8-bit body must not
   carry a 10-bit colour profile just because a newer sibling has one.
6. **`lastVerified` is the date the profile was last reviewed**, not the date the
   camera launched.

## Adding a camera

Copy the closest existing profile in the same category, replace every field, and
re-read it against the manufacturer's specification page before committing.
Then check it renders in the app: a camera whose `videoModes` are wrong will
still produce a confident-looking (and wrong) recommendation card.
