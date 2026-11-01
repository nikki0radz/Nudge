# Nudge
Voice-first reminders with a pink, cream and pastel yellow interface.

## Use
Open the GitHub Pages app. In **Settings → Your private AI connection**, enter the code matching the Worker’s `APP_TOKEN` secret. Optionally choose **Remember on this device**. The OpenAI key is never entered in the app. Then speak or type; reminders are extracted, tagged and scheduled automatically. Duplicate suggestions let you refresh an existing reminder or save separately. “Remind me again” chooses another moment without a date form.

The home screen shows three reminders, giving priority to deadlines and older tasks. The Reminders tab has search and multiple category/person tags. Completion, restoring, edits, JSON export and merge-import are supported. Example reminders are optional and clearly marked.

## Cloudflare
- Worker: `nudge-api`, GitHub root `/`, no build command, deploy `npx wrangler deploy`.
- Required **runtime Secrets**: `OPENAI_API_KEY`, `APP_TOKEN`.
- Optional runtime Text: `ALLOWED_ORIGIN` (default `https://nikki0radz.github.io`), `OPENAI_MODEL` (default `gpt-4.1-mini`), `TRANSCRIPTION_MODEL` (default `gpt-transcribe`).
- GitHub Pages continues to host the frontend. The API URL is fixed to `https://nudge-api.nikki0radz.workers.dev` in `ai-client.js`.
- `/health` is public and returns deployment status only. `/api/connect`, `/api/interpret`, `/api/transcribe` require `Authorization: Bearer <APP_TOKEN>`. Missing configuration fails closed. CORS is additional browser policy, not authentication.
- `/api/connect` checks the code and required secret presence without a billable model call. Actual model/key access is checked by the first real request.
- Interpretation uses the Responses API with strict structured output, `store:false`, bounded input/output, validated dates, existing-ID validation and a fixed instruction boundary. Transcript/text are sent only for explicitly initiated processing. Server logs do not include them or credentials.

## Voice and recovery
Connected voice capture uses MediaRecorder, capped at five minutes, with microphone permission, visible stop/record states and animated waves. The recording is stored locally in IndexedDB before upload, allowing retry/download after failure or reload. Typed thoughts/transcripts are kept as local drafts while processing. After transcription the draft replaces the audio recovery copy. Successfully saved reminders clear the draft. An explicit **Save without AI** fallback uses basic local parsing. Recovery recordings can be removed with confirmation.

The private code is stored in sessionStorage, or localStorage only when remembering the device is chosen. It is excluded from reminder backups. Browser-local storage is not encrypted cloud sync. Do not use shared devices with the remember option. Saved reminders remain available after disconnecting AI.

## Limits and next steps
Reminders remain local to this browser/device; export before clearing storage or moving into Android. Browser notifications work only while open and supported; Android native local notifications/actions are still needed for reliable closed-app reminders. There is no calendar/location integration or meeting detection. Contextual requests and recurring schedules remain tagged context with a check-in; the app does not claim to monitor them. “Remind me again” and resurfacing use local logic, not another AI call.

Next: Capacitor Android packaging, native notifications and recording, persistent sync if desired. Keep notification scheduling deterministic and independent of model availability.

## Validation
No frontend build/dependency install is required. Run:
```
node --check app.js
node tests/engine.test.cjs
node tests/worker.test.mjs
node tests/client.test.cjs
```
Worker tests mock OpenAI; a live authenticated voice/text request requires entering the private code in the app. Tests must not use real secrets or user recordings.

## People and shared assistant
The People tab combines profiles, birthdays, allergies, gifts, links, pictures and casual notes with person-linked reminders. The home microphone and text box both use `/api/assistant`: questions retrieve saved evidence; information updates profiles; requests create reminders. No mode switch is needed. The answer appears on the home screen, with links to matching reminders and notes. An optional read-aloud control uses browser speech synthesis.

The Worker uses the existing `APP_TOKEN` and `OPENAI_API_KEY` Secrets. `/api/interpret` remains available for older clients. The assistant uses a strict multi-intent schema, validates referenced IDs and dates, accepts up to two compressed images, and never opens saved URLs or executes tasks. Explicit before/by deadlines still use independent constraints. Birthday offsets and availability lower bounds are applied in code after interpretation. Missing birthdays remain linked and resolve when a birthday is supplied.

People and images live locally in IndexedDB (`nudge-people-v1`) to avoid overflowing localStorage with photos. They are included in Nudge JSON backups. Source Friend Dossier data is copied from the known same-origin keys (`friendDossier.v4` and earlier variants) when available, keeping the source intact. The Copy Friend Dossier button repeats a non-destructive merge; JSON imports accept Friend Dossier backups from another browser. Imports retain entry data, photos and custom category labels, not the old app's visual themes. People are not published into GitHub source. Questions send relevant saved notes and active reminder context to the authenticated backend/OpenAI; profile pictures are not sent automatically. Captured attachments are sent only with the submitted thought.

Shared-input photos can be product images or screenshots with a caption or voice description. Profile portraits can be set manually. The app does not identify people or infer birthdays/allergies from faces, fetch TikTok pages or browse arbitrary links. Photos used for an unresolved clarification remain attached for the follow-up.

Additional checks: `node tests/people.test.cjs` and `node tests/assistant.test.mjs`. Browser QA covers manual profiles, notes, pictures, persistence and the centred tick. Authenticated model responses use mocked upstream tests; private user codes are never needed for development.

## Photo controls
People profiles have a direct Add/Change photo control, Choose photo and Take photo actions, and horizontal/vertical/zoom crop previews. The original compressed source and crop settings are retained. Notes and categories have Add photos actions, removable thumbnail previews, camera capture and support for pictures without a written caption. Saved pictures open in a gallery with previous/next controls, arrow keys and horizontal swiping. The bottom navigation contains Today, Reminders and People; Settings remains accessible from the top gear. `node tests/photos.test.cjs` checks crop geometry and retained source metadata.

## Android, calendar and encrypted backups

See [ANDROID.md](ANDROID.md) for the installable APK, preserving existing Friend Dossier data, synced phone/Google calendars, private R2 setup, recovery and signed app updates. The optional backup deploy configuration is `wrangler.backups.jsonc`; create the private bucket before selecting it.
