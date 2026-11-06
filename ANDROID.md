# Nudge for Android · 0.1.11

Download `downloads/nudge-0.1.11.apk` on your phone and open it. Android will ask you to allow installation from your browser. Android 8 or newer and an up-to-date Android System WebView are required.

## Keep your existing notes

Before clearing or removing anything, open the web app in the **same browser on the same phone** where your notes are stored. In Settings → Your thoughts, kept close, choose Export backup. Then in the Android app, expand the same section and Import backup. People, photos, reminders and local events are copied across; existing items are merged. Your original Friend Dossier data stays untouched. If its data is in a different browser, export its JSON first and import that too.

Enter the same private app access code in Android Settings → Your private AI connection; choose Remember on this device if desired. The OpenAI key stays in Cloudflare. Your friend profiles are stored in the app’s private IndexedDB; they are not published in GitHub or bundled in the APK. Voice, requests, attached photos and relevant saved information are sent to your private backend and OpenAI to fulfil your requests.

## Google Calendar and reminders

Settings → Calendars & app updates → Connect phone calendars requests calendar read permission. Select the Google calendars already synced to Android. Nudge refreshes them on app resume, displays six months of past events and roughly thirteen months ahead, and includes relevant calendar context in AI requests. Connect Google account calendar sync in Android first if nothing appears. Linked events open inside Nudge, where you can add a category colour, sticker and notes for AI context. Their source title and time remain read-only and refresh from the phone calendar. Nudge details are kept separately through refresh and included in local and encrypted backups. Local Nudge events are fully editable inside Nudge. Local Nudge events are not written back into Google Calendar.

Settings → Notifications enables native reminders with Done and Remind me again actions. Android may delay alarms when exact alarms are unavailable or under battery restrictions. This first build has been compiled and signature-verified, but needs a real-phone check for microphone, calendar provider, photo capture, notification delivery, and device-specific battery behaviour.

## Automatic encrypted cloud backups

The existing private `unscripted-backups` R2 bucket can be reused. Nudge only writes beneath `nudge/private/`. Keep it entirely private: do not enable r2.dev or add a public domain.

1. GitHub deployment now binds **nudge-api** to the existing private **unscripted-backups** bucket as **BACKUPS**. Both Wrangler configurations include this binding, so no deployment-command change or new bucket is required. If your bucket actually has a different name, change `bucket_name` in both configuration files to its exact name.
2. Keep the existing APP_TOKEN and OPENAI_API_KEY secrets. No bucket access key is needed in the app.
3. In Nudge Settings → Private cloud backups, choose a recovery password of at least twelve characters and enable automatic backups. Keep it in your password manager, along with your app access code. The first successful upload must appear before relying on recovery.

Backups use AES-256-GCM with a random IV, a PBKDF2-SHA256 derived key (310,000 iterations), and a fresh salt when setting/changing the recovery password. Only ciphertext is uploaded. A non-extractable derived key is kept in the app’s private IndexedDB so subsequent backups need no typing; the password is not sent to the server. On a lost/replacement phone, install Nudge, connect using the app access code, enter the recovery password and choose Restore cloud backup. An account sign-in is not required for this single-user setup. Anyone with your access code could access or overwrite encrypted backup files, so keep that code private. They still need the recovery password to read them. There is no password reset that can decrypt lost-password backups.

Changes are backed up after approximately fifteen seconds while Nudge is open. Android also schedules a best-effort six-hour network job to retry/upload the most recent encrypted snapshot. Android controls background timing; force-stopping the app prevents background work until it is reopened. Backups larger than 32 MB require local export. Storage keeps one overwritten snapshot per UTC day plus a latest pointer; older days remain until you set an R2 lifecycle rule. Use a reasonable retention rule, for example 30 days, after successful recovery testing.

## Updates and rebuilding

The APK contains the trusted offline UI. It checks the public `update.json` manifest on launch and provides a manual Check for app updates button. New versions download an APK; Android asks you to install it. Updates preserve local data when signed with the **same signing key**. Keep the private signing-recovery archive supplied with this build; it must never go in the public repository. This archive is separate from your notes/recovery password.

Build with Java 17, Android API 35, and Android build tools. Set `NUDGE_ANDROID_SDK` to a directory containing `android-35/android.jar` and build tools in `android-15/` (or adapt the script paths). Set `NUDGE_KEYSTORE`, `NUDGE_STORE_PASSWORD`, then run `bash scripts/build-android.sh`. An Eclipse JDT compiler jar can be selected via `NUDGE_ECJ_JAR` if javac is absent. Increment manifest versionCode and versionName, build/verify the APK with the original signer, and update `update.json` plus the hosted download together. No app access code, OpenAI key, personal notes or signing secrets belong in the public APK/source.

## Normal app release · 0.1.5

The approved compact layouts, People notes, filing animation, rotating Owl notes and Undo are now bundled. Design pickers, sample controls and the native preview bar are removed. Only reminders explicitly marked as examples are removed; real reminders and existing app storage are preserved. Upgrading disables any older cached preview so the bundled release opens normally.

The logo and calendar-window design studies remain separate for review; no unselected new logo is installed. Phone calendar access remains read-only: edits to source titles, dates and times still belong in the source calendar, while Nudge categories, stickers and notes are editable in this app.

## Appearance and notebook calendar · 0.1.5

Settings → Appearance offers Light, Dark and Use device setting. The choice persists and is included with app settings in backups. Device mode follows changes to the phone theme. Dark mode covers the app surfaces, notes, calendar, controls and dialog windows, with matching native system bars. Images retain their original colours. The in-app event editor now uses the selected notebook design with a date badge, sticker and lined notes. Source calendar titles and times remain read-only. New logo options are awaiting selection.

## Calendar labels, archive and a warmer Today · 0.1.6

Today has an owl beside its coloured headline. The settings button uses a generated transparent flower-cog PNG. Six event stickers cover fireworks, New Year, graduation, deadlines, balloons and music.

Calendar → Tidy up calendar reviews repeated titles and birthday patterns, showing counts for the events currently imported. Choose a category and sticker, then Keep this label. The rule applies to past imported matches and future imports inside Nudge. Individual event edits take priority. Google Calendar stays read-only; source events are never changed. Remove a remembered rule under Calendar options, or Undo the last label change from the tidy-up dialog. Approved rules merge into local and encrypted backups, including removal timestamps.

Daily pattern checks run while Nudge is open, at most once per local day. Only new ambiguous title groups use the private AI connection; obvious birthday/work/deadline patterns are detected locally. AI suggestions are cached, and no label is applied until approved. This is not an Android background scheduler, so it cannot promise analysis while the app is closed. Switch daily checks off in Calendar options. Calendar write permission is not requested.

Swipe left for the next period and right for the previous period; zoomed calendars still pan within the month. The legend is inside Calendar options. Today's smaller centred date badge sits on a highlighted tile.

People important dates before today appear in a collapsed Archive folder. Nothing is deleted or copied: editing the date into the future restores the active view. The note editor now provides an optional date and annual-repeat setting. Recognisable older ISO/UK dates are supported; undated or ambiguous notes stay active. Annual dates stay in Important dates. Folder headings have no counts.

## Selected stationery logo · 0.1.7

The selected cream note, yellow pencil and pink tick PNG is used for the header, favicon and web app icons. Android uses the same artwork as an adaptive launcher icon on a blush background, with a matching monochrome note-and-pencil notification symbol. The original selected PNG is retained unchanged. Olive remains on Today and in completion notes. Package, signer and storage origin are unchanged.

## Visual stickers and custom labels · 0.1.8

Tidy-up now sits below Calendar options. Sticker choices show PNG previews in a collapsible picture grid, including the selected sticker. The same picker is used in event editing, pattern review and custom label creation.

Choose Create your own label in an event or tidy-up card, or in Calendar options. Give the label a name, colour and optional default sticker. It becomes selectable immediately without clearing unsaved event notes. Labels are included in local exports and encrypted backups; IDs and approved rules are preserved on merge. AI can suggest only existing custom labels supplied with the request, with approval still required.

Each remembered title rule keeps its own PNG, independently of its category. Two jobs can both be Work and use different stickers. Use Calendar options → Remembered labels → Edit, or open Your remembered labels inside tidy-up, to change an existing rule. Individual event sticker edits, including None, take priority over rule/default stickers. Source Google events remain read-only.

Seven additional PNGs cover anniversaries, Halloween, bonfire night, Valentine's day, therapy, care work and desk work. Today uses the original full-body Olive on a transparent background, without the pink bubble.

## Soft mauve and calendar preferences · 0.1.9

Soft mauve dark mode uses a dark purple base with warm light text. Custom labels use a hue/saturation wheel, depth slider and optional hex entry. The label creator has no disclosure triangle. Ten more transparent PNG stickers cover friends, cleaning, surgery, plants, love, vets and birthdays.

Label definitions, matching rules and unfinished cleanup choices have a separate recovery record on the same device. Creating a label from a pattern applies it immediately; Save these labels saves the remaining selections together. Go over calendar again rechecks pending or skipped patterns and opens remembered rules for category/sticker editing. Existing approved rules are preserved; source calendars remain read-only.

## Fifty approved stickers · 0.1.10

Adds the full approved 1–50 collection in the simpler app style. Each is an independent transparent PNG, available in event details, custom label defaults and per-pattern calendar tidy-up rules. The same keys are accepted in backup validation and AI cleanup suggestions. Existing assets and saved assignments keep their original identifiers. Android bundles display-sized copies for offline use.

## Calendar swipe direction · 0.1.11

Swipe left to advance and right to return in month and week views. Vertical scrolling, pinch zoom and panning while zoomed retain their existing behaviour.


## Cream sticky notes and continuing reminders · 0.1.12

Settings → Notifications → Enable sticky notes opens Android's Display over other apps permission screen. The selected cream note with pink tape, stationery artwork and Done, Snooze and Edit date actions is drawn with a native application overlay. Close dismisses only the card. Try sticky note uses temporary sample content without adding a reminder. The floating note clears after 90 seconds or on opening Nudge; it does not appear on the locked screen. Standard notifications remain available if overlays are disabled or unavailable. Android may hide overlays in protected apps, and phone battery/permission settings still affect delivery.

Every native delivery now persists and arms the next check-in before posting an alert. Overdue reminders continue until completed, deleted or rescheduled. Existing cadence remains 18 hours for balanced or 36 hours for gentle, moved into the configured reminder hours. A future deadline still gets a check-in beforehand. Done cancels its alarm; deleting/editing removes the old notification and replaces or cancels its alarm. Background repeat actions reconcile on resume without overwriting a newer manual date edit. Sample reminders are excluded. Browser reminders also repeat while the page is open without duplicating native alerts.

Validation: `TZ=Europe/London node --test tests/*.test.cjs tests/*.test.mjs`, plus compile/run `tests/ReminderScheduleTest.java` with `android/src/com/nicole/nudge/ReminderSchedule.java`. Native delivery after dismissal/reboot and overlay appearance need phone testing. Package, storage origin, backup prefix and signing identity are preserved.

## Scheduling correction prepared after 0.1.14

The source now validates next-week requests against the next local Monday–Sunday and keeps Christmas arranging in a December window. Both AI routes and the local fallback apply the same range checks; an explicit separate alert takes priority. Flexible reminder windows do not create hard deadlines. New weekday preferences for booking/calls are defaults, not claims about a business's actual opening hours.

The local planner no longer increases delays with every snooze. Overdue tasks get a prompt follow-up, including when the calendar has no full work-session gap. Flexible tasks continue on the configured balanced/gentle cadence, with varied waking-hour times. Native fallback continues after the four projected follow-ups run out and rejects stale distant follow-ups for overdue tasks. Completion/deletion and explicit custom snoozes still take priority.

On first launch with these changes, plan version 2 repairs eligible automatic schedules using their original capture dates. Manual timing and unclassified legacy/custom snoozes are preserved. Linking people or editing categories no longer marks the timing as manually chosen. Linked people use wrapping checkbox choices instead of the native multi-select box.

Validation: run `TZ=Europe/London node --test tests/*.test.cjs tests/*.test.mjs` and compile/run `tests/ReminderScheduleTest.java` with `ReminderSchedule.java`. The native test covers 100 successive overdue alarms and DST boundaries. A signed Android release is still required to deliver the bundled UI/planner and Java changes to the phone; deploying the Worker alone will not update existing installed code. This change does not alter `update.json`, the package ID, signing identity, or preview manifest. Device delivery and visual layout still need an actual Android check.
