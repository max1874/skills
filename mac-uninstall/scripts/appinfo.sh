#!/bin/bash
# Usage: appinfo.sh "/Applications/Foo.app"
# Prints the bundle id, vendor prefix and signing Team: the source of keywords for the later scans
set -u
APP="${1:?Usage: appinfo.sh /Applications/Foo.app}"
PL="$APP/Contents/Info.plist"

[ -d "$APP" ] || { echo "Not found: $APP"; exit 1; }

BID=$(defaults read "$PL" CFBundleIdentifier 2>/dev/null)
NAME=$(defaults read "$PL" CFBundleName 2>/dev/null)
VER=$(defaults read "$PL" CFBundleShortVersionString 2>/dev/null)

echo "app path       : $APP"
echo "size           : $(du -sh "$APP" 2>/dev/null | cut -f1)"
echo "name / version : ${NAME:-?}  ${VER:-?}"
echo "bundle id      : ${BID:-?}"
echo "bundle prefix  : $(echo "${BID:-}" | cut -d. -f1-2)"
echo
echo "Signing info (the vendor name is often here):"
codesign -dv --verbose=2 "$APP" 2>&1 | grep -iE "Authority|TeamIdentifier" | head -5
echo
echo "Embedded helpers / updaters:"
find "$APP/Contents" -maxdepth 3 \( -iname "*Update*" -o -iname "*Helper*" -o -iname "ks*" \) 2>/dev/null | head -10
echo
echo "→ Next: scripts/scan.sh \"<app name root>\" \"<vendor root>\" \"$(echo "${BID:-}" | cut -d. -f1-2)\""
