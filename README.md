# Nudge
A voice-first, Android-ready reminder app. Pink, cream and a little sunshine.

## First edition
- Tap to dictate, tap again to save; live transcript and animated recording indicator. Browser speech recognition support and microphone permission required. Text and keyboard dictation remain available.
- Reminders saved without a date form; automatic waking-hour check-ins, common spoken dates/times, deadlines and context labels.
- Multiple category tags and basic people extraction. Category/search view, completion, restore, edit and delete.
- Duplicate suggestions with explicit merge or save separately choices.
- Deadline/older-item resurfacing; “Remind me again” chooses another time.
- Browser-local persistence, JSON export/merge import, offline app shell.
- Optional foreground browser notifications. No backend, API keys, analytics or account required.

## Current limits
The local rule-based parser is deliberately a preview, not OpenAI. Unsupported/ambiguous timing is retained and marked for a contextual check-in. It does not monitor meetings, shops, calendar or location, and does not create recurring schedules. Browser speech services may process audio remotely; raw recordings are not retained. If recognition is unavailable, use text/keyboard dictation.

Web timers cannot deliver reliable reminders while the app is closed. Android native local notifications and notification action buttons will be added during packaging. Notification permission is opt-in. Records currently exist only in the browser/device that saved them. Export before migration.

## Next: Cloudflare + OpenAI
Keep all API keys in Worker secrets, never client code. Add authenticated `/api/transcribe` (audio) and `/api/interpret` (text + timezone + existing reminder summaries), structured schema validation and persistent D1 records. OpenAI interprets intent, extracts people/categories, separates multiple tasks, and proposes duplicate matches. The app validates dates and schedules notification delivery deterministically. Model output must not perform unrestricted actions. Native Android scheduling remains independent of model availability. Add a Capacitor shell, native recording, local notifications, actions (Done / Remind me again), and boot rescheduling. Cloud sync should preserve IDs and original text. Spoken times take precedence; otherwise use waking hours, deadline lead time and paced follow-up, rather than unconstrained randomness.

## Development
Static build: no dependencies required. Serve the repository root over HTTPS (or localhost) for mic and service worker support. Files at root also work with GitHub Pages branch deployment. `node tests/engine.test.cjs` verifies core scheduling and duplicate behavior.
