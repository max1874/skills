#!/bin/bash
# Reverse audit: find leftovers whose app is gone but whose traces remain
# Usage: audit-orphans.sh [minimum size in KB, default 0]
#
# Read-only. Every line of output is a **candidate**, not a conclusion: the false-positive rate is high, so open each one.
# Known false-positive kinds are in the note at the end of this script, and in SKILL.md under "The five kinds of false positive in a reverse audit".
set -u
MINKB="${1:-0}"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
LSREG=/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister

echo "[1/4] Building the index of installed bundle ids…"
"$LSREG" -dump 2>/dev/null | awk '
  /^[[:space:]]*path:/ {p=$0; sub(/^[[:space:]]*path:[[:space:]]*/,"",p); sub(/ \(0x[0-9a-f]*\)$/,"",p)}
  /^[[:space:]]*identifier:/ {id=$2; if(p!="" && id!="") print id"\t"p}
' | sort -u > "$TMP/reg.tsv"
# Key point: count only paths that really exist; the registry is full of stale records for deleted apps
while IFS=$'\t' read -r id path; do
  [ -e "$path" ] && echo "$id"
done < "$TMP/reg.tsv" | tr 'A-Z' 'a-z' | sort -u > "$TMP/installed.txt"
echo "      $(wc -l < "$TMP/reg.tsv" | tr -d ' ') registry records, $(wc -l < "$TMP/installed.txt" | tr -d ' ') with paths that still exist"

echo "[2/4] Collecting leftovers named by bundle id…"
{
  for d in Preferences HTTPStorages Caches "Saved Application State" Containers \
           "Group Containers" WebKit "Application Scripts" Logs LaunchAgents; do
    find "$HOME/Library/$d" -maxdepth 1 -mindepth 1 2>/dev/null
  done
} | while read -r p; do
  bid=$(basename "$p" | sed -E 's/\.(plist|savedState|binarycookies)$//')
  # Must look like a bundle id (at least two dots)
  echo "$bid" | grep -qE '^[A-Za-z0-9_-]+(\.[A-Za-z0-9_+-]+){2,}$' || continue
  echo "$bid" | grep -qiE '^com\.apple\.|^group\.com\.apple\.|^systemgroup\.com\.apple\.' && continue
  printf "%s\t%s\n" "$(echo "$bid" | tr 'A-Z' 'a-z')" "$p"
done | sort -u > "$TMP/leftovers.tsv"
echo "      $(wc -l < "$TMP/leftovers.tsv" | tr -d ' ') candidates"

echo "[3/4] Deciding ownership…"
# Key fix: Group Containers / Application Scripts are named TEAMID.group.xxx, which can never match
# a bundle id directly; strip the TEAMID and group prefixes first
cut -f1 "$TMP/leftovers.tsv" | sort -u | while read -r bid; do
  base=$(echo "$bid" | sed -E 's/^[a-z0-9]{10}\.//; s/^(system)?groups?\.//')
  owned=no
  grep -qE "^${base}(\.|$)" "$TMP/installed.txt" 2>/dev/null && owned=yes
  # Match the other way too: an app's bundle id is a prefix of the leftover (e.g. com.foo.bar.helper)
  [ "$owned" = no ] && awk -v b="$base" '$0==substr(b,1,length($0)) && length($0)>8' "$TMP/installed.txt" | grep -q . && owned=yes
  [ "$owned" = no ] && echo "$bid"
done > "$TMP/orphans.txt"
echo "      $(wc -l < "$TMP/orphans.txt" | tr -d ' ') ownerless bundle ids"

echo "[4/4] Totaling sizes…"
echo
printf '\033[1m%12s  %s\033[0m\n' "Size" "bundle id / path"
# Compute sizes first, then sort, largest first
while read -r bid; do
  tot=$(awk -F'\t' -v b="$bid" '$1==b{print $2}' "$TMP/leftovers.tsv" \
        | while read -r p; do du -sk "$p" 2>/dev/null | cut -f1; done \
        | awk '{s+=$1}END{print s+0}')
  printf '%d\t%s\n' "$tot" "$bid"
done < "$TMP/orphans.txt" | sort -rn | while IFS=$'\t' read -r tot bid; do
  [ "$tot" -lt "$MINKB" ] && continue
  printf '%11dK  %s\n' "$tot" "$bid"
  awk -F'\t' -v b="$bid" '$1==b{print "               "$2}' "$TMP/leftovers.tsv"
done

echo
echo "———— Broken links and orphan daemons (these are what actually cause problems) ————"
echo "[LaunchAgent/Daemon whose program does not exist]"
find "$HOME/Library/LaunchAgents" /Library/LaunchAgents /Library/LaunchDaemons -maxdepth 1 -name "*.plist" 2>/dev/null | while read -r f; do
  prog=$(plutil -extract Program raw "$f" 2>/dev/null)
  [ -z "$prog" ] && prog=$(plutil -extract ProgramArguments.0 raw "$f" 2>/dev/null)
  if [ -z "$prog" ]; then echo "  ⚠ empty shell (no Program, possibly a Keystone placeholder): $f"
  elif [ ! -e "$prog" ]; then echo "  ✗ broken: $f → $prog"; fi
done
echo "[Broken CLI links]"
find /usr/local/bin /opt/homebrew/bin "$HOME/.local/bin" -maxdepth 1 -type l 2>/dev/null | while read -r l; do
  [ -e "$l" ] || echo "  ✗ broken: $l → $(readlink "$l")"
done
echo "[Privileged helpers with no matching daemon]"
ls /Library/PrivilegedHelperTools/ 2>/dev/null | while read -r h; do
  [ -f "/Library/LaunchDaemons/$h.plist" ] || echo "  ⚠ $h"
done
echo "[Safe Storage master keys in the keychain (compare against which apps above are uninstalled)]"
security dump-keychain "$HOME/Library/Keychains/login.keychain-db" 2>/dev/null \
  | grep -iE '"svce"<blob>=".*safe storage"' | sed 's/^ */  /' | sort -u

cat <<'EOF'

════════════════════════════════════════════════════════════════
Everything above is a [candidate], not a conclusion. Open each one before deciding. Known kinds of false positive:

1. The group container id is completely different from the app's bundle id
   OrbStack's group is dev.orbstack, but its bundle id is dev.kdrag0n.MacVirt
   → Always check directly whether /Applications/<name>.app exists; do not trust id matching alone

2. The folder has a generic name and its contents belong to another app
   ~/Library/Application Support/Chromium holds the native messaging hosts of
   Claude and Codex; org.chromium.Chromium.plist was written by Lark (Electron)
   → Deleting them breaks features in use

3. Updaters / analytics components of installed apps
   *.shipit, *.installer, *.updateservice, segment.storage.*,
   bugsnag-shared-*, *.statsigservice: all have owners

4. App names with a version number or suffix
   CleanShot X / Visual Studio Code / Downie 4 / Permute 4
   → Matching by name goes wrong in both directions

5. Different products from one vendor reusing a bundle id ★ most dangerous
   Another app from the same vendor can have the uninstalled app's bundle id (e.g. com.acme.foo)
   → After that app is uninstalled, every com.acme.foo.* looks like a leftover but is in use by the other app
   → Trust only one way of deciding ownership: walk /Applications and read Info.plist to find whose id it is
   → Then look at the modification time: anything still being written has an owner
════════════════════════════════════════════════════════════════
EOF

echo
echo "Find which installed app owns a suspicious bundle id:"
echo '  for a in /Applications/*.app; do id=$(defaults read "$a/Contents/Info.plist" CFBundleIdentifier 2>/dev/null); [ "$id" = "<suspicious id>" ] && echo "Owned: $a"; done'
