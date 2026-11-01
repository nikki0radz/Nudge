#!/usr/bin/env bash
set -euo pipefail
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NUDGE_SDK="${NUDGE_ANDROID_SDK:-/workspace/android-sdk}"
NUDGE_BUILD="${NUDGE_BUILD_DIR:-/workspace/nudge-android-build}"
mkdir -p "$NUDGE_BUILD/res" "$NUDGE_BUILD/classes" "$NUDGE_BUILD/generated" "$NUDGE_BUILD/assets/www" "$NUDGE_BUILD/dex"
python3 "$PROJECT_ROOT/scripts/prepare-assets.py" "$PROJECT_ROOT" "$NUDGE_BUILD/assets/www"
"$NUDGE_SDK/android-15/aapt2" compile --dir "$PROJECT_ROOT/android/res" -o "$NUDGE_BUILD/compiled-res.zip"
"$NUDGE_SDK/android-15/aapt2" link -o "$NUDGE_BUILD/base.apk" -I "$NUDGE_SDK/android-35/android.jar" --manifest "$PROJECT_ROOT/android/AndroidManifest.xml" --java "$NUDGE_BUILD/generated" -R "$NUDGE_BUILD/compiled-res.zip" -A "$NUDGE_BUILD/assets" --auto-add-overlay
find "$PROJECT_ROOT/android/src" "$NUDGE_BUILD/generated" -name '*.java' > "$NUDGE_BUILD/sources.txt"
if command -v javac >/dev/null; then
 javac --release 8 -classpath "$NUDGE_SDK/android-35/android.jar" -d "$NUDGE_BUILD/classes" @"$NUDGE_BUILD/sources.txt"
else
 java -cp "${NUDGE_ECJ_JAR:?Set NUDGE_ECJ_JAR when javac is unavailable}" org.eclipse.jdt.internal.compiler.batch.Main -8 -nowarn -proc:none -classpath "$NUDGE_SDK/android-35/android.jar" -d "$NUDGE_BUILD/classes" @"$NUDGE_BUILD/sources.txt"
fi
(cd "$NUDGE_BUILD/classes" && zip -qr "$NUDGE_BUILD/classes.jar" .)
"$NUDGE_SDK/android-15/d8" --min-api 26 --lib "$NUDGE_SDK/android-35/android.jar" --output "$NUDGE_BUILD/dex" "$NUDGE_BUILD/classes.jar"
cp "$NUDGE_BUILD/base.apk" "$NUDGE_BUILD/unsigned.apk"
(cd "$NUDGE_BUILD/dex" && zip -q "$NUDGE_BUILD/unsigned.apk" classes.dex)
"$NUDGE_SDK/android-15/zipalign" -f 4 "$NUDGE_BUILD/unsigned.apk" "$NUDGE_BUILD/aligned.apk"
if [[ -n "${NUDGE_KEYSTORE:-}" ]]; then
 "$NUDGE_SDK/android-15/apksigner" sign --ks "$NUDGE_KEYSTORE" --ks-pass env:NUDGE_STORE_PASSWORD --key-pass env:NUDGE_STORE_PASSWORD --ks-key-alias nudge --out "$NUDGE_BUILD/nudge-0.1.0.apk" "$NUDGE_BUILD/aligned.apk"
 "$NUDGE_SDK/android-15/apksigner" verify "$NUDGE_BUILD/nudge-0.1.0.apk"
fi
