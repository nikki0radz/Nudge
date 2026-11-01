# Nudge backlog

## Friend Dossier export and migration

Status: deferred; no app release requested.

- Check the Friend Dossier app for an existing data export before adding another.
- If missing, add an Export data / JSON backup action in Friend Dossier.
- Verify an export-to-Nudge import round trip preserves profiles, photos, birthdays, notes, categories and other saved details without deleting the original data or overwriting existing Nudge notes.
- Nudge already accepts a Friend Dossier JSON object with a `friends` array through Settings → Your thoughts, kept close → Import backup. Verify the actual Friend Dossier export matches the importer rather than assuming compatibility.
- Keep this work in the backlog for now; do not publish an APK solely for it.

## Satisfying task completion and a possible mascot

Status: requested for a future update; reminder-card and mascot designs are being compared first.

- Keep a completed reminder visible briefly so the tick can be seen, then animate a gentle scribbled strike-through before moving it into Completed. Make the destination clear rather than making it instantly disappear.
- Show a small encouraging celebration such as “Good job”, optionally with a short joke or fun fact from a curated local bank. Prefer immediate offline feedback without an extra AI call for each completion. Include reduced-motion support and a way to undo accidental completion.
- Explore a small consistent cartoon mascot with about five facial expressions. Matching transparent PNGs are sufficient; swap expressions with a simple crossfade/bob. No complex animation file or runtime is required. Olive the owl is selected. A real PNG test is now embedded in preview; the five-expression reward flow still needs building.
- Reminder tiles should be compact enough to show several at once. Tags should be tiny or tucked away. Replace the diagonal up-right arrow beside Remind me again with a gentler icon/label after a card design is selected.

- On the next native release, use sentence case for the Android preview bar buttons as well (`setAllCaps(false)`); this native styling cannot be changed by a web preview alone.

### Calendar design comparison (preview)
- Five interactive studies under Reminders → calendar → Try five calendar layouts: Paper grid, Soft columns, Month + agenda, Time lanes, Open diary. Shared category colours, month / rolling eight-date week, controlled zoom and sample editing; real data is read only here.
- Collect Nicole’s choice before replacing the main calendar. Verify two-finger pinch and horizontal scrolling on her Android phone; browser checks cover buttons, slider, dates and layouts.
- Next native calendar release: include Android CalendarContract event/display/calendar colour fields in sync so Google’s source colours can be retained. The current native payload omits these fields. Preview honours a valid colour when present and otherwise uses its category palette; categorisation is a local display heuristic, not a new AI sync feature.
