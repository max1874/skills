#!/bin/bash
# Usage: scan.sh "<app name root>" "<vendor root>" "<bundle prefix>" [--exclude-trash]
# e.g.:  scan.sh "foo" "acme" "com.acmelabs"
# Read-only. Use the shortest form of each root; better extra noise than a miss.
set -u
APPKW="${1:?Usage: scan.sh <app name root> <vendor root> <bundle prefix> [--exclude-trash]}"
VENKW="${2:-$APPKW}"
BIDPRE="${3:-}"
EXTRASH="${4:-}"

# Known same-name noise, filtered out on a match
NOISE='meego|ctcategories|negotiator|DerivedData|/\.Trash/'
[ "$EXTRASH" = "--exclude-trash" ] && NOISE="$NOISE"

filt() { grep -viE "$NOISE" || true; }
sec()  { printf '\n\033[1m[%s] %s\033[0m\n' "$1" "$2"; }
none() { echo "  ✓ none"; }

RE="$APPKW|$VENKW"
[ -n "$BIDPRE" ] && RE="$RE|$BIDPRE"

sec 1 "/Applications and the app itself"
{ ls -d /Applications/*[Aa]* 2>/dev/null | grep -iE "$RE"; \
  find ~/Applications /Applications -maxdepth 2 -iname "*${APPKW}*" 2>/dev/null; } | filt | sort -u | grep . || none

sec 2 "All of ~/Library (app name root)"
find ~/Library -maxdepth 5 -iname "*${APPKW}*" 2>/dev/null | filt | grep . || none

sec 3 "All of ~/Library (vendor root) ★ AppCleaner's blind spot"
find ~/Library -maxdepth 5 -iname "*${VENKW}*" 2>/dev/null | filt | grep . || none

sec 4 "LaunchAgents / LaunchDaemons"
{ ls ~/Library/LaunchAgents /Library/LaunchAgents /Library/LaunchDaemons 2>/dev/null | grep -iE "$RE"; } | filt | grep . || none

sec 5 "Loaded in launchctl"
launchctl list 2>/dev/null | grep -iE "$RE" | filt | grep . || none

sec 6 "Running processes"
# Exclude this script itself: pgrep -f matches its own command line
pgrep -fl "$APPKW" 2>/dev/null | grep -v "scan\.sh" | filt | grep . || none

sec 7 "System-wide /Library"
find /Library -maxdepth 4 \( -iname "*${VENKW}*" -o -iname "*${APPKW}*" \) 2>/dev/null | filt | grep . || none

sec 8 "Crash logs (DiagnosticReports)"
{ ls /Library/Logs/DiagnosticReports ~/Library/Logs/DiagnosticReports 2>/dev/null | grep -iE "$RE"; } | filt | grep . || none

sec 9 "Containers / Group Containers / Saved State"
find ~/Library/Containers ~/Library/"Group Containers" ~/Library/"Saved Application State" ~/Library/"Application Scripts" \
     -maxdepth 1 \( -iname "*${VENKW}*" -o -iname "*${APPKW}*" \) 2>/dev/null | filt | grep . || none

sec 10 "defaults domains / install receipts"
{ defaults domains 2>/dev/null | tr ',' '\n' | grep -iE "$RE"; ls /var/db/receipts 2>/dev/null | grep -iE "$RE"; } | filt | grep . || none

sec 11 "Home dotfiles / CLI"
find ~ -maxdepth 5 -iname "*${APPKW}*" \
     -not -path "*/Library/*" -not -path "*/.Trash/*" -not -path "*/Desktop/*" \
     -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | filt | grep . || none

sec 12 "Agent ecosystem injection ★ no tool checks this"
for d in ~/.claude/skills ~/.agents/skills ~/.grok/skills ~/.codex/skills ~/.cursor ~/.gemini ~/.opencode ~/.local/bin ~/.local/share ~/.config; do
  [ -d "$d" ] && find "$d" -maxdepth 2 -iname "*${APPKW}*" 2>/dev/null
done | filt | sort -u | grep . || none

sec 13 "Shell config pollution"
grep -nE "$RE" ~/.zshrc ~/.zshenv ~/.zprofile ~/.bash_profile ~/.bashrc 2>/dev/null | filt | grep . || none

sec 14 "Keystone-style self-reinstalling updaters ★ key (lists only those belonging to this target)"
find ~/Library -maxdepth 5 \( -name "ksadmin" -o -name "ksinstall" -o -iname "*SoftwareUpdate*.bundle" \) 2>/dev/null \
  | grep -iE "$RE" | filt | grep . || {
    none
    echo "  (Note: other apps' Keystone updaters on this system are out of scope here; to see them all:"
    echo "     find ~/Library -maxdepth 5 -name ksadmin -o -iname '*SoftwareUpdate*.bundle' )"
  }

sec 15 "Browser native messaging hosts"
find ~/Library/"Application Support" -maxdepth 4 -ipath "*NativeMessagingHosts*" \
     \( -iname "*${APPKW}*" -o -iname "*${VENKW}*" \) 2>/dev/null | filt | grep . || none

sec 16 "System temp caches /private/var/folders ★ very easy to miss"
# Darwin's per-user cache directory. GPU shaders and code_sign_clone live here, under paths with random hashes,
# which a plain find ~ and Spotlight both miss. It can also reveal new bundle ids beyond the app name (e.g. *.helper)
find "$(getconf DARWIN_USER_CACHE_DIR 2>/dev/null)/.." -maxdepth 3 \
     \( -iname "*${APPKW}*" -o -iname "*${VENKW}*" \) 2>/dev/null | filt | grep . || none

sec 17 "Spotlight whole-disk index (not limited by maxdepth)"
{ mdfind -name "$APPKW" 2>/dev/null; [ -n "$BIDPRE" ] && mdfind "kMDItemCFBundleIdentifier == '${BIDPRE}.*'c" 2>/dev/null; } \
  | grep -v "^$HOME/.Trash" | filt | sort -u | head -20 | grep . || none

sec 18 "ByHost / CrashReporter / recent items / Dock ★ checks contents, not only file names"
{ ls ~/Library/Preferences/ByHost/ 2>/dev/null | grep -iE "$RE"
  # CrashReporter's Intervals_*.plist file names do not contain the app name; the entries are inside
  for f in ~/Library/"Application Support"/CrashReporter/*; do
    [ -f "$f" ] || continue
    plutil -p "$f" 2>/dev/null | grep -qiE "$RE" && echo "  content match: $f"
  done
  find ~/Library/"Application Support"/com.apple.sharedfilelist -type f 2>/dev/null | while read -r f; do
    strings "$f" 2>/dev/null | grep -qiE "$RE" && echo "  content match: $f"
  done
  defaults read com.apple.dock persistent-apps 2>/dev/null | grep -iE "$RE"
  defaults read com.apple.dock recent-apps 2>/dev/null | grep -iE "$RE"; } | filt | grep . || none

sec 18b "Spotlight full-text content search ★ finds records whose file names contain no keyword"
{ mdfind "$VENKW" 2>/dev/null; mdfind "'$APPKW'" 2>/dev/null; } \
  | grep -v "^$HOME/.Trash" | filt | sort -u | head -15 | grep . || none

sec 18c "Download quarantine records / leftover installers"
{ sqlite3 ~/Library/Preferences/com.apple.LaunchServices.QuarantineEventsV2 \
    "select LSQuarantineDataURLString from LSQuarantineEvent;" 2>/dev/null | grep -iE "$RE"
  find ~/Downloads ~/Desktop -maxdepth 2 \( -iname "*${APPKW}*" -o -iname "*${VENKW}*" \) 2>/dev/null
  hdiutil info 2>/dev/null | grep -iE "$RE"; } | filt | grep . || none

sec 19 "Default apps / URL scheme registrations"
plutil -p ~/Library/Preferences/com.apple.LaunchServices/com.apple.launchservices.secure.plist 2>/dev/null \
  | grep -iE "$RE" | filt | grep . || none

sec 20 "Keychain ★ Chromium-based browsers always leave a Safe Storage master key"
for kc in $(security list-keychains 2>/dev/null | tr -d ' "'); do
  security dump-keychain "$kc" 2>/dev/null | grep -iE '"svce"<blob>=|"srvr"<blob>=' \
    | grep -iE "$RE" | filt | sed "s|^|  [$(basename "$kc")] |"
done | sort -u | grep . || none

sec 21 "LaunchServices registry (stale records)"
LSREG=/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister
"$LSREG" -dump 2>/dev/null | awk '/^[[:space:]]*path:/{p=$0} 1' \
  | grep -iE "path:.*($APPKW|$VENKW)|identifier:.*($BIDPRE)" | sed 's/^ *//' \
  | filt | sort -u | head -20 | grep . || none

sec 22 "Login items / background items (review by hand in System Settings)"
echo "  ⚠ /private/var/db/com.apple.backgroundtaskmanagement needs root; the script cannot read it"
echo "  ⚠ Check by hand: System Settings → General → Login Items & Extensions, for leftover entries of the target app"

printf '\n\033[1m—— Scan done. Sort the results above by hand into three kinds: install traces (delete) / records (keep) / same-name noise (keep) ——\033[0m\n'
