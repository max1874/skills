#!/bin/bash
# Ownership lookup: given a bundle id / app name / keychain item name, find which installed app it belongs to
# Usage: whose.sh <keyword>
#   whose.sh com.acme.foo           → /Applications/Acme Other.app (not the Foo you uninstalled!)
#   whose.sh Codex                  → /Applications/ChatGPT.app (its bundle id is com.openai.codex)
#   whose.sh "Suite App"            → /Applications/LarkSuite.app
#
# Why it is needed: an app's [file name] [CFBundleName] [CFBundleDisplayName] [bundle id]
# [keychain item name] can all differ from one another, so matching on any single one misjudges ownership.
# Misjudged ownership = deleting the data of an app still in use as if it were a leftover.
set -u
KW="${1:?Usage: whose.sh <bundle id or app name or keychain item name>}"
KWL=$(echo "$KW" | tr 'A-Z' 'a-z')

echo "Query: $KW"
echo

FOUND=0
for dir in /Applications "$HOME/Applications" /System/Applications \
           /Applications/Utilities /System/Applications/Utilities /Applications/Setapp; do
  [ -d "$dir" ] || continue
  for app in "$dir"/*.app; do
    [ -e "$app" ] || continue
    pl="$app/Contents/Info.plist"
    [ -f "$pl" ] || continue
    bid=$(defaults read "$pl" CFBundleIdentifier 2>/dev/null)
    bnm=$(defaults read "$pl" CFBundleName 2>/dev/null)
    bdn=$(defaults read "$pl" CFBundleDisplayName 2>/dev/null)
    bex=$(defaults read "$pl" CFBundleExecutable 2>/dev/null)
    fnm=$(basename "$app" .app)
    hay=$(echo "$bid|$bnm|$bdn|$bex|$fnm" | tr 'A-Z' 'a-z')
    case "$hay" in
      *"$KWL"*)
        FOUND=1
        echo "  ✓ Owned: $app"
        printf "      file name=%s  CFBundleName=%s  DisplayName=%s\n" "$fnm" "${bnm:-—}" "${bdn:-—}"
        printf "      bundle id=%s  executable=%s\n" "${bid:-—}" "${bex:-—}"
        ;;
    esac
  done
done

if [ "$FOUND" = 0 ]; then
  echo "  ✗ No installed app's file name/CFBundleName/DisplayName/executable/bundle id matches \"$KW\""
  echo
  echo "  Before concluding, rule out three cases:"
  echo "   1. It belongs to a CLI tool or plugin, which never had a .app"
  echo "      → which $KW ; ls -d ~/.$KWL ~/Library/Application\\ Support/*$KW* 2>/dev/null"
  echo "   2. It belongs to an Electron app's embedded framework (Electron writes preferences as Chromium)"
  echo "   3. The app is installed in an unusual location"
  echo "      → mdfind \"kMDItemCFBundleIdentifier == '$KW'\""
fi

echo
echo "———— Ownership check of every Safe Storage item in the keychain ————"
security dump-keychain "$HOME/Library/Keychains/login.keychain-db" 2>/dev/null \
  | grep -oE '"svce"<blob>="[^"]*[Ss]afe [Ss]torage"' | sed 's/.*="//; s/"$//' | sort -u \
  | while read -r svc; do
      name=${svc% Safe Storage}
      nl=$(echo "$name" | tr 'A-Z' 'a-z')
      exact=""; weak=""
      for dir in /Applications "$HOME/Applications" /System/Applications; do
        [ -d "$dir" ] || continue
        for app in "$dir"/*.app; do
          [ -e "$app" ] || continue
          pl="$app/Contents/Info.plist"
          f1=$(basename "$app" .app)
          f2=$(defaults read "$pl" CFBundleName 2>/dev/null)
          f3=$(defaults read "$pl" CFBundleDisplayName 2>/dev/null)
          f4=$(defaults read "$pl" CFBundleIdentifier 2>/dev/null)
          # Exact: any name field equals the item name as a whole
          for f in "$f1" "$f2" "$f3"; do
            [ "$(echo "$f" | tr 'A-Z' 'a-z')" = "$nl" ] && exact="$app"
          done
          # Weak: appears inside any field (bundle id included)
          case "$(echo "$f1|$f2|$f3|$f4" | tr 'A-Z' 'a-z')" in
            *"$nl"*) [ -z "$weak" ] && weak="$app";;
          esac
        done
      done
      if [ -n "$exact" ]; then
        printf "  ✓ %-24s → %s\n" "$name" "$exact"
      elif [ -n "$weak" ]; then
        printf "  ? %-24s → weak match %s (matched only in the bundle id or as a substring; confirm by hand)\n" "$name" "$weak"
      else
        printf "  ⚠ %-24s → no match, possibly a leftover (rule out the three cases above first)\n" "$name"
      fi
    done
