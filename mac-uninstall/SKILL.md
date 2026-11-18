---
name: mac-uninstall
description: Fully uninstalls a macOS app and reverse-audits old leftovers, covering what AppCleaner and similar tools miss: vendor-named folders, auto-update daemons, agent skill injection, keychain master keys, the LaunchServices registry. Use when the user says "uninstall X", "remove it completely", "check it is fully uninstalled", "does this app have leftovers", "did apps I uninstalled before leave anything behind", "卸载 X", "删干净", "彻底卸载", "检查卸载干净了没", "这个 app 还有残留吗" or "以前卸的软件有没有没清干净的".
---

# Fully uninstall a macOS app

## Why not AppCleaner

AppCleaner works by string-matching "app name + bundle id". Any app that keeps its data under a **vendor-named folder** gets missed, because the vendor name usually does not contain the app name.

Real case (a Chromium-based browser, called Foo Lite by Acme Labs here): AppCleaner reported finding 5 items, 780.6 MB; there were actually 27 items,
and it took four rounds to dig them all out. What it missed:

| Missed | Size | Why it was missed |
|---|---|---|
| `~/Library/Application Support/Acme Labs/` | 329M | The folder is named for the vendor, "Acme Labs", which does not contain "foo" |
| `~/Library/Caches/Acme Labs/` | 255M | Same |
| `~/Library/Acme Labs/FooSoftwareUpdate/` | 6.3M | A Keystone clone updater, containing `ksadmin`/`ksinstall` |
| `~/Library/LaunchAgents/com.acmelabs.keystone.*.plist` ×2 | — | Empty `<dict/>` shells; the bundle id is not the app's |
| `skills/foo-browser` in three places: `~/.claude`, `~/.agents`, `~/.grok` | — | Entirely outside the app's namespace |
| `~/.local/bin/foo-browser`, `~/.local/share/foo/` | — | Same |

**Conclusion: find the vendor name first, then scan again by the vendor name.** This is the single most valuable step.

## Procedure

### Step 1: Get the bundle id and vendor name (always, before uninstalling)

```bash
scripts/appinfo.sh "/Applications/Foo.app"
```

It prints the bundle id, the vendor prefix and the Team name from the signature. **The vendor name is the keyword for every scan after this**, and it matters more than the app name.

If the app is already deleted and there is no Info.plist to read, work out the vendor prefix from a leftover `com.<vendor>.<app>.plist`.

### Step 2: Scan the whole disk

```bash
scripts/scan.sh "<app name keyword>" "<vendor keyword>" "<bundle prefix>"
# e.g.: scripts/scan.sh "foo" "acme" "com.acmelabs"
```

It covers 24 kinds of location. When choosing keywords, **use the shortest root** (`foo`, not `foo lite`; `acme`, not `Acme Labs`): better extra noise than a miss.

The scan is read-only; run it freely.

### Step 3: Classify, and pull out the "records"

The scan results contain three kinds. **Delete only the first kind**:

1. **Install traces**: the app, data, caches, preferences, LaunchAgents, updaters, injected skills/CLIs. Delete.
2. **Records**: `~/.claude/history.jsonl`, `~/.claude/projects/`, `~/.claude/file-history/`, entries in a notes repository. These are the user's own history and are **not deleted by default**; deleting them needs a separate question.
3. **Same-name noise**: things whose names happen to contain the keyword but are unrelated. Known examples: `meego` (Feishu/Lark), `com.apple.ctcategories.service`, npm's `negotiator`, random hash folders in Xcode's `DerivedData`. Tell them apart by which owner the path belongs to; when unsure, take a look with `plutil -p` / `file` before deciding.
   When a keyword is so short it looks hexadecimal (e.g. `e2b`), kinds 2 and 3 get flooded by hash file names from browser caches, font caches and the clipboard, and the real things drown in them: check the dedicated locations instead (`~/.<name>`, `~/.config/<name>`, `~/.cache/<name>`, the npm global folder, the keychain), then use `find -iname` excluding folders like `Cache_Data`, `Code Cache` and `fontconfig`.

### Step 4: Lay the list out for the user and wait for explicit consent

List every item's **path + size + what it is**, and mark which ones tools like AppCleaner miss. **Deletion must wait for the user to explicitly say go**; do not act on your own.

### Step 5: Execute

```bash
scripts/trash.sh "<label>" "<path1>" "<path2>" ...
# e.g.: scripts/trash.sh "foo-uninstall" ~/Library/"Vendor Name" ~/Library/LaunchAgents/com.vendor.x.plist
```

The script does three things, in an order that must not change:

1. **First `launchctl bootout`** every related LaunchAgent: if you delete files while the daemon is alive, it may rebuild them.
2. **Move to the Trash, never `rm`**. Items go into `~/.Trash/<label>-<date>/`, recoverable at any time.
3. **Prefix with the source automatically when target names clash**. Vendor folders often share one name (`~/Library/Acme Labs`, `~/Library/Caches/Acme Labs`, `~/Library/Application Support/Acme Labs` are all called `Acme Labs`), and a plain `mv` into one folder fails or silently overwrites. Symlinks are especially dangerous: `mv` overwrites a same-named symlink without an error.

### Step 6: Rescan to verify

```bash
scripts/scan.sh "<app name keyword>" "<vendor keyword>" "<bundle prefix>" --exclude-trash
```

Confirm item by item that it is clean. **Do not say it is fully removed just because "the command raised no error"**; you need the rescan output.

## Reverse audit: finding old leftovers

This is a **different procedure** from the forward uninstall above. Forward is "you know what to uninstall; find its traces".
Reverse is "you don't know what was missed; work back from the traces to the apps that were not fully uninstalled". Take this route when the user asks
"did apps I uninstalled before leave anything behind".

```bash
scripts/audit-orphans.sh [minimum size in KB]
```

How it works: build an index of "currently installed bundle ids" with `lsregister -dump` (**counting only paths that really exist**:
the registry is full of stale records for deleted apps), then enumerate every leftover under `~/Library` named by bundle id,
and take the difference of the two.

### The five kinds of false positive in a reverse audit (measured; false positives far outnumber true positives)

One measured round: 205 candidates → 26 "ownerless" → after checking each one, **only 1 was real**.
So the script's output is only a lead; open every line:

**1. The group container id is completely different from the app's bundle id**
OrbStack's group container is `HUAQ24HBR6.dev.orbstack`, but its bundle id is
`dev.kdrag0n.MacVirt`: the two have nothing in common, so comparing by id alone is bound to misjudge.
`Group Containers` and `Application Scripts` are named `TEAMID.group.xxx`;
strip the 10-character TEAMID prefix and the `group.`/`groups.`/`systemgroup.` prefix before comparing,
**and in the end always check directly whether `/Applications/<name>.app` exists**.
This one nearly got a 6.9 GB Docker virtual machine image deleted as a leftover.

**2. The folder has a generic name and its contents belong to another app**
`~/Library/Application Support/Chromium/` looks like an uninstall leftover; open it and it holds
`NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json` and
the equivalent file for Codex: **in use**, and deleting it breaks the browser extension.
Next to it, `org.chromium.Chromium.plist` contains `LastRunAppBundlePath = /Applications/LarkSuite.app`:
Electron apps write preferences under Chromium's identity.

**3. Updaters / analytics components of installed apps**
`*.shipit`, `*.installer`, `*.updateservice`, `segment.storage.*`,
`bugsnag-shared-*`, `*.statsigservice`, `*.remotefeatureflags.*`: all of them have owners.

**4. App names with a version number or suffix**
`CleanShot X` / `Visual Studio Code` / `Downie 4` / `Permute 4`:
matching by name goes wrong in both directions.

**5. Different products from one vendor reusing the same bundle id ★ most dangerous**
One case: an installed app (`/Applications/<Other Product>.app`) had the bundle id **`com.<vendor>.<id>`**,
signed by the same company as an app that had just been uninstalled. After the uninstall,
all the `com.<vendor>.<id>.*` preferences, caches, HTTPStorages and ShipIt updaters
looked like the uninstalled app's leftovers, **but they were data the other product was actively using**.

The tell is **modification time**: the uninstalled app's own `~/.<app>` had stopped changing months earlier,
while all these `com.<vendor>.<id>.*` files were dated within the last few days: still being written.

The rule: **a bundle id is not an app's identity card.** Decide ownership with `scripts/whose.sh` (see the next section).

Under the same id, **only things specific to the app's name are leftovers** (such as `~/.<app>`,
`<App> Safe Storage`, `/usr/local/bin/<app>`); anything named by the bundle id is not.
Tell them apart by **modification time**: anything still being written has an owner.

### The three sections of a reverse audit that actually matter

The size-sorted table is mostly noise. **The three sections below are the signal**, because they correspond to "things that cause problems":

- **A LaunchAgent/Daemon whose program does not exist** → an orphan daemon
- **Broken CLI links** → point straight at an uninstalled app (in one audit, a broken `/usr/local/bin/<app>`
  link is what showed that an app had not been fully uninstalled)
- **The keychain's `* Safe Storage` list** → check each against `/Applications`;
  wherever the app is gone, the key is a leftover (in one audit, this is how a leftover app was found)

## Deciding ownership: an app has five names, and any two can differ

Before deleting anything, establish whose it is. The difficulty is that one app carries five identifiers,
**and any two of them may fail to match**:

| Identifier | How to get it |
|---|---|
| File name | `basename Foo.app` |
| `CFBundleName` | `defaults read Foo.app/Contents/Info.plist CFBundleName` |
| `CFBundleDisplayName` | Same as above |
| bundle id | `CFBundleIdentifier` |
| Keychain item name | the X in `<X> Safe Storage` |

Four mismatches met in practice, each of which could cause a wrong deletion:

| What you see | What it really is |
|---|---|
| `com.<vendor>.<id>` | Not the app you uninstalled, but **another product from the same vendor** (the vendor's two products share one id) |
| `Codex Safe Storage` | Not the Codex CLI, but **ChatGPT.app** (its bundle id is `com.openai.codex`) |
| `Suite App Safe Storage` | It is **LarkSuite.app** (file name LarkSuite, yet CFBundleName is Lark; none of the five names match) |
| `Code Safe Storage` | It is VS Code, but substring matching hits `com.openai.codex` first |

So **no single-dimension match can be trusted**; do a multi-dimensional lookup with the tool:

```bash
scripts/whose.sh <bundle id | app name | keychain item name>
```

It walks every installed app's `Info.plist`, compares all five fields at once, and **reports exact matches and
substring matches separately**: substring hits are marked `?` and need a human to confirm; never treat them as conclusions.
At the end it appends an ownership check of the whole keychain `* Safe Storage` list; only the ones marked `⚠` are leftover candidates.

When ownership cannot be determined, rule out three cases before concluding: a CLI tool/plugin that never had a `.app`,
an Electron app writing preferences under Chromium's identity, or an app installed in an unusual location
(`mdfind "kMDItemCFBundleIdentifier == '<id>'"`).

## Watch out: self-reinstalling updaters

Many apps copy Chrome's Keystone framework. Signs:

- `~/Library/<vendor>/*SoftwareUpdate/*.bundle`, containing `ksadmin` and `ksinstall`
- LaunchAgents that are empty `<dict/>` shells, filled back in by `ksadmin` on demand
- `Actives/<bundle id>`, a 0-byte marker file

When you see this set, delete all of it. Delete only the app and keep this, and it can install the app back.

## Watch out: agent ecosystem injection

Browser and developer-tool apps now put skills into AI agents' configuration folders, and **in more than one ecosystem**. Check these locations:

```
~/.claude/skills/    ~/.agents/skills/    ~/.grok/skills/
~/.codex/    ~/.cursor/    ~/.gemini/    ~/.opencode/
~/.local/bin/    ~/.local/share/<app>/
```

They are usually symlinks pointing to an intermediate folder, which in turn points inside the `.app`. Once the app is deleted, they are all broken links.

Also clear the `skillUsage.<skill name>` key in `~/.claude.json` (read and write it with python, and recheck after the change). Note that Claude Code holds that file while running, so after the change it is best to have the user restart the session once.

## Watch out: keychain master keys

Chromium-based browsers (Chrome / Edge / Arc / …) store an item called
`<app name> Safe Storage` in the login keychain: the master key they use to encrypt saved passwords and cookies. Deleting the app does not take it away.

```bash
security dump-keychain ~/Library/Keychains/login.keychain-db | grep -iE '"svce"<blob>=' | grep -i "<keyword>"
security delete-generic-password -s "<app name> safe storage" -a "<account name>"
```

Deleting it may bring up a keychain authorization dialog; have the user click "Allow".

## Watch out: the LaunchServices registry

After an app is deleted, the `lsregister` database still holds registration records for it and every embedded Helper,
including keychain-access-group, WebAuthn permission groups and notification activityType.
These records make the system still treat those bundle ids as "known applications".

**Unregister them one by one; do not rebuild the whole database:**

```bash
LSREG=/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister
# List stale records
"$LSREG" -dump | grep -iE "path:.*<keyword>" | sed 's/^ *path: *//; s/ (0x[0-9a-f]*)$//' | sort -u
# Unregister them one by one
"$LSREG" -u "<path>"
```

`lsregister -kill -r` rebuilds the whole database, **with the side effect of resetting the default app for every file type**:
the user's custom associations are lost. A targeted `-u` has no such cost.

Note: after the top-level `.app` is unregistered, **the embedded Helper sub-apps still keep their own records**; dump again and clear them one by one.
Apps inside data folders (such as `~/Library/Application Support/<vendor>/Updater/x.y.z/Updater.app`)
are also registered separately and need clearing too.

## Watch out: search by contents, not only by file name

Some system databases have **file names that contain no keyword at all**; the app's records hide in the contents. Tools that scan by path/file name
(including earlier versions of this skill) all miss them. Known case:

```
~/Library/Application Support/CrashReporter/Intervals_<machine UUID>.plist
```

This file has 2500+ app records, with the target app's `AppRecord` among them. **Do not delete it whole**;
use plistlib to remove only the matching entries, then after writing it back verify with `plutil -lint`:

```python
d = plistlib.load(open(p,'rb'))
for key in ("appRecords", "appRecords_lastMas", "appsPerActivityPeriod"):
    d[key] = [r for r in d[key] if not any(kw in str(x).lower() for x in r for kw in KEYWORDS)]
plistlib.dump(d, open(p,'wb'))
```

Leftovers like this are found with **Spotlight full-text search** (`mdfind "<vendor name>"`, without `-name`):
it searches file contents and can hit files whose names contain no keyword. This is a step that must always run at the end.

## Three places the scripts cannot read (hand them to the user)

The following need "Full Disk Access" or root, which the scripts do not have. **Say so plainly; do not pretend to have checked them**:

| Location | Needs | What to tell the user |
|---|---|---|
| The TCC permission database (camera/microphone/screen recording/accessibility grants) | Full Disk Access | Check by hand each category under System Settings → Privacy & Security |
| The background items database `/private/var/db/com.apple.backgroundtaskmanagement` | root | Check by hand under System Settings → General → Login Items & Extensions |
| Time Machine local snapshots | — | Snapshots necessarily contain the app from before the uninstall; that is normal, and they go away as the snapshots expire |

Once the app has been unregistered from LaunchServices, `tccutil reset All <bundle id>` reports
`-10814 No such bundle identifier`. **That does not mean TCC has no records**; do not use it as evidence.
To clear TCC, reset it before deleting the app.

## When sudo is needed

Leftovers under `/Library/LaunchDaemons`, `/Library/PrivilegedHelperTools` and `/var/db/receipts` need root. **Do not run sudo yourself**; write the commands out clearly and hand them to the user to run.

## Check your own commands; don't let the shell fool you

Two pitfalls actually hit, both of which lead to a conclusion that **looks well-founded but is wrong**:

**In `ls -d pathA pathB`, if either one does not exist, the whole command returns non-zero.**
Written as `ls -d /Applications/X.app ~/Applications/X.app || echo "not installed"`,
the `|| echo` fires even when X is installed in the first location, and reports "not installed" outright.
This once got an installed OrbStack judged as uninstalled. The correct way is to check each one separately:

```bash
for d in /Applications "$HOME/Applications" /System/Applications; do
  [ -e "$d/$name.app" ] && found="$d/$name.app"
done
```

**In zsh, a glob that matches nothing aborts the whole command** (`no matches found`);
`2>/dev/null` does not stop it, and the commands after it never run. Use `find` instead of multi-path globs.

The rule: **any conclusion that "X does not exist" must be rechecked with a command that checks only X before you state it.**
