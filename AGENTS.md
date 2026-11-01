# Nudge development workflow

Nicole tests visual changes through the Android app's **Preview upcoming changes** switch.

- For visual-only feedback rounds, edit UI files inside `preview/`, then run `python3 scripts/publish-preview.py --source preview` with the original Nudge signing key/password provided through `NUDGE_KEYSTORE` and `NUDGE_STORE_PASSWORD`. Publish only the changed `preview/` files. The complete signed manifest and its files must be published together. Never commit signing material, passwords, app codes, or user data.
- Do not rebuild an APK, change `update.json`, or promote preview UI to the stable root for each visual tweak. Publish a stable release once Nicole approves the batch or explicitly requests a release.
- Native APIs, permissions and incompatible storage migrations need a signed APK release and a corresponding minimumNativeVersion update. Previews use actual local data and must stay backward-compatible with stable UI.
- Keep every Settings section collapsible. Keep the native Preview bar and Back to stable escape route usable even when preview UI breaks.
- Preserve the package ID, signing identity, https://nudge.local storage origin, and existing private backup prefix. See ANDROID.md for build, backup and migration details.
- Before publishing, verify the preview signature/file hashes, run relevant tests, and check the UI in the browser where useful. Native device behaviour cannot be proven by browser tests; report that limit plainly.
