#!/bin/bash
# Usage: trash.sh "<label>" "<path1>" "<path2>" ...
# e.g.:  trash.sh "foo-uninstall" ~/Library/"Vendor Name" ~/Library/LaunchAgents/com.vendor.x.plist
#
# 1) First launchctl bootout the LaunchAgent plists passed in (deleting files while the daemon is alive gets them rebuilt)
# 2) Move to ~/.Trash/<label>-<date>/, never rm, so it can be recovered
# 3) Prefix with the source when the target name is taken: vendor folders often share one name in three places, and overwriting a symlink raises no error
set -u
LABEL="${1:?Usage: trash.sh <label> <paths...>}"
shift
[ $# -gt 0 ] || { echo "No paths given"; exit 1; }

DEST="$HOME/.Trash/${LABEL}-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEST"
echo "Trash destination: $DEST"
echo

# ---- 1. Unload LaunchAgents first ----
UID_=$(id -u)
for p in "$@"; do
  case "$p" in
    *LaunchAgents/*.plist)
      id=$(basename "$p" .plist)
      if launchctl bootout "gui/$UID_/$id" 2>/dev/null; then
        echo "bootout ✓  $id"
      else
        echo "bootout －  $id (not loaded)"
      fi
      ;;
  esac
done
echo

# ---- 2+3. Move, prefixing automatically on a name clash ----
OK=0; SKIP=0; FAIL=0
for p in "$@"; do
  if [ ! -e "$p" ] && [ ! -L "$p" ]; then
    echo "－ already absent  $p"; SKIP=$((SKIP+1)); continue
  fi
  base=$(basename "$p")
  target="$DEST/$base"
  if [ -e "$target" ] || [ -L "$target" ]; then
    # Deduplicate with the parent folder's name as a prefix; if it still clashes, add a number
    prefix=$(basename "$(dirname "$p")" | tr ' /' '__')
    target="$DEST/${prefix}__${base}"
    n=2
    while [ -e "$target" ] || [ -L "$target" ]; do
      target="$DEST/${prefix}__${base}__$n"; n=$((n+1))
    done
  fi
  if mv "$p" "$target"; then
    echo "✓ removed  $p"; OK=$((OK+1))
  else
    echo "✗ failed   $p"; FAIL=$((FAIL+1))
  fi
done

echo
echo "Result: removed $OK / absent $SKIP / failed $FAIL"
echo "Space reclaimed: $(du -sh "$DEST" 2>/dev/null | cut -f1)"
echo
echo "→ Next: rescan with scan.sh to verify; do not claim it is clean just because nothing errored"
