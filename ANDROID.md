# Nudge for Android · 0.1.1

Download `downloads/nudge-0.1.1.apk` on your phone and open it. Android will ask you to allow installation from your browser. Android 8 or newer and an up-to-date Android System WebView are required.

## Keep your existing notes

Before clearing or removing anything, open the web app in the **same browser on the same phone** where your notes are stored. In Settings → Your thoughts, kept close, choose Export backup. Then in the Android app, expand the same section and Import backup. People, photos, reminders and local events are copied across; existing items are merged. Your original Friend Dossier data stays untouched. If its data is in a different browser, export its JSON first and import that too.

Enter the same private app access code in Android Settings → Your private AI connection; choose Remember on this device if desired. The OpenAI key stays in Cloudflare. Your friend profiles are stored in the app’s private IndexedDB; they are not published in GitHub or bundled in the APK. Voice, requests, attached photos and relevant saved information are sent to your private backend and OpenAI to fulfil your requests.

## Google Calendar and reminders

Settings → Calendars & app updates → Connect phone calendars requests calendar read permission. Select the Google calendars already synced to Android. Nudge refreshes them on app resume, displays six months of past events and roughly thirteen months ahead, and includes relevant calendar context in AI requests. Connect Google account calendar sync in Android first if nothing appears. Local Nudge events are editable inside Nudge; synced Google events open in the phone’s calendar app for changes. Local Nudge events are not written back into Google Calendar.

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
