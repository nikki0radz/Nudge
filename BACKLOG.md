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
- Selected calendar: 3, Month + agenda, now the default preview calendar with real event editing, compact single-line event labels, a centred colour key and subtle minus/plus controls. Comparison controls are tucked away in Calendar options → Try with sample events. Verify two-finger pinch and horizontal scrolling on her Android phone; browser checks cover button zoom, dates, selected-day scrolling and layouts.
- Next native calendar release: include Android CalendarContract event/display/calendar colour fields in sync so Google’s source colours can be retained. The current native payload omits these fields. Preview honours a valid colour when present and otherwise uses its category palette; categorisation is a local display heuristic, not a new AI sync feature.

## People dates, countdowns and archive

Status: visual samples are in preview; live date processing is requested for the next functional update.

- Preserve recurring birthdays and anniversaries in Important dates; show the next occurrence and sort all upcoming dates by next occurrence, including year boundaries.
- Once a one-off event has ended (after the local day ends when it has no end time), move it out of the active list into a per-person archive. Preserve the original note, dates, links and photos; allow opening and restoring. Do not guess whether a date recurs or archive ambiguous free text. Add/confirm explicit date and recurrence fields, including manual editing and AI capture.
- Show a compact profile countdown for any next important event within 30 days. Show upcoming events on Today within seven days, naming the person, event and relative date; offer a relevant gentle prompt without claiming a gift is needed for every occasion. Handle today, all-day dates, timezones and leap days.
- Add a soft, decorative locked/top-secret archive folder at the bottom of the person, opening letter-like archived notes. The lock is decoration only, with no extra authentication.
- Five interactive header and countdown designs plus a sample archive letter are available through Try profile & event styles. Sample dates do not mutate or hide actual entries. Approved profile countdown styling: 2, Little ribbon, with a visible occasion emoji (birthday cake, anniversary flowers, wedding ring, party, appointment or travel icon; calendar fallback). Keep this style when implementing live countdowns.
- Approved reminder design: 2, Folder slips, now applied to real reminder rows in preview. People notes have tighter spacing. Five inline category menu styles replace the native Android choice popup; the selected menu and header styles are remembered on this device for preview.

## Compact home capture layout comparison

- Five recording layouts are available in Today → Try five recording layouts: Rosy dock, Little folder, Slim shelf, Soft capsule and Paper pocket. The selected style persists on the device.
- Removed the idle Tap to tell me label and the redundant capture description; text and photo entry sit together in the capture card footer. Recording/paused timers, stop/save, pause/resume, loading and audio recovery remain available.
- Recording and Paused example buttons are visual-only and never request microphone access or create audio. Close the comparison panel or tap the example stop button to return to real capture. Collect Nicole’s layout choice before stable release; verify real audio capture on her phone.

## Compact activity history

- Remove the Last saved card from Today (done in preview); preserve saved data and the immediate save/edit confirmation.
- Future Reminders tab History button: a small chronological text list grouped by day, with short descriptions such as Added a gift idea for a person or Set a reminder. Truncate long content, avoid individual cards, and link to the relevant item where it still exists. Store actual save events reliably across typed/voice/photo capture, edits and imports before presenting it as a complete history; do not infer an inaccurate audit trail from current entries alone.
- Approved capture layout: 2, Little folder, with a larger full-width microphone and What’s next on your list? above the folder. Approved thought category menu: 1, Folder dropdown; its chevron now uses a centred vector icon rather than a text glyph.

## Larger portraits and consistent menus

- Replace the compact portrait studies with five larger portrait-led designs: Portrait first, Soft centrepiece, Picture window, Keepsake portrait and Petal arch. Use actual saved photos; selections persist separately from the previous small-header options.
- Calendar uses a back arrow instead of Today/List view buttons; Month/Next week remain the actual calendar views.
- All HTML single-select controls now use a shared soft inline dropdown, including calendar filtering, birthday month, person selection, reminder editing and Settings. Preserve original form values and change handlers, disabled options, keyboard selection and Escape. Category selection keeps its approved folder dropdown. Android-owned permission dialogs, file pickers and calendar-account selection are outside the web preview UI.

## AI-created people awaiting verification

- When a capture clearly mentions a new person, allow AI to create and link a profile automatically, including relationship names such as Owen’s mum. Preserve the exact relationship and link the related person; do not silently merge it into Owen or invent a legal name, birthday or other details. Existing implicit-person creation needs review for coverage and ambiguity.
- Mark newly AI-created profiles as unverified. Give them a subtle highlight and a Verify person prompt when opened, with editable name, relationship, birthday/photo and a clear confirmation action. Avoid duplicate profiles using aliases/relationship identity, and allow merge/correction. Remind gently later without turning every capture into another form.
- People directory should show photos and names only; five compact styles are in preview. Keep sample directory entries isolated from saved data.
- Latest home preference: upcoming birthdays should appear within 30 days. Other events previously used seven days; retain separate windows when implementing live countdowns, with profile countdowns at 30 days.
- Saved-note titles stay prominent; separate descriptions and date details are now smaller and bracketed in preview. Main text without a separate title remains full-sized.
