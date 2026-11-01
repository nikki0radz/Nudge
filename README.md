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
