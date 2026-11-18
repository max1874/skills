#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  run_codex_worker.sh start  [--model MODEL] [--effort EFFORT] [--sandbox MODE] <absolute-worktree> <work-order-file> [run-directory]
  run_codex_worker.sh resume [--model MODEL] [--effort EFFORT] [--sandbox MODE] <absolute-worktree> <session-id> <follow-up-file> [run-directory]

Defaults:
  MODEL   the highest-priority listed *-sol model in Codex's own catalog
          (~/.codex/models_cache.json), so the default follows new releases;
          gpt-6.1-sol when the catalog cannot be read
  EFFORT  high
  MODE    danger-full-access (no sandbox: network, ssh and caches outside the
          worktree work); workspace-write confines writes to the worktree
  RUN DIR ~/.local/share/codex-worker-guide/runs/<time>-<repo>-<branch>
EOF
}

fail() {
  printf 'codex-worker-guide: %s\n' "$*" >&2
  exit 2
}

if [[ ${CODEX_WORKER_GUIDE_DEPTH:-0} != 0 ]]; then
  fail "nested delegation is forbidden (CODEX_WORKER_GUIDE_DEPTH=${CODEX_WORKER_GUIDE_DEPTH:-0})"
fi

# Newest Sol model by Codex's own ranking (lower priority = preferred).
default_model() {
  node -e '
const rank = m => m.priority ?? 2 ** 30;
const sol = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).models
  .filter(m => m.slug?.endsWith("-sol") && m.visibility === "list");
if (sol.length) console.log(sol.reduce((best, m) => rank(m) < rank(best) ? m : best).slug);
' "${CODEX_HOME:-$HOME/.codex}/models_cache.json" 2>/dev/null || true
}

mode=${1:-}
requested_model=""
model_source=user
requested_effort=high
sandbox=danger-full-access

case "$mode" in
  start|resume) shift ;;
  -h|--help)
    usage
    exit 0
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

while [[ $# -gt 0 ]]; do
  case "$1" in
    --model)
      [[ $# -ge 2 && -n "$2" ]] || fail "--model requires a value"
      requested_model=$2
      shift 2
      ;;
    --effort)
      [[ $# -ge 2 && -n "$2" ]] || fail "--effort requires a value"
      requested_effort=$2
      shift 2
      ;;
    --sandbox)
      [[ $# -ge 2 && -n "$2" ]] || fail "--sandbox requires a value"
      sandbox=$2
      shift 2
      ;;
    --)
      shift
      break
      ;;
    -*) fail "unsupported option: $1" ;;
    *) break ;;
  esac
done

if [[ -z "$requested_model" ]]; then
  requested_model=$(default_model)
  model_source=default:models_cache
  if [[ -z "$requested_model" ]]; then
    requested_model=gpt-6.1-sol
    model_source=default:fallback
  fi
fi

if [[ "$mode" == start ]]; then
  [[ $# -ge 2 && $# -le 3 ]] || { usage >&2; exit 2; }
  repo=$1
  prompt_file=$2
  run_dir=${3:-}
  session_id=""
else
  [[ $# -ge 3 && $# -le 4 ]] || { usage >&2; exit 2; }
  repo=$1
  session_id=$2
  prompt_file=$3
  run_dir=${4:-}
fi

reasoning_config="model_reasoning_effort=\"$requested_effort\""
disabled_features=(--disable fast_mode --disable ultrafast_mode)

[[ "$repo" = /* ]] || fail "worktree path must be absolute"
[[ -d "$repo" ]] || fail "worktree does not exist: $repo"
[[ -f "$prompt_file" ]] || fail "work-order file does not exist: $prompt_file"
command -v codex >/dev/null 2>&1 || fail "codex CLI is not on PATH"
codex_bin=$(command -v codex)

git -C "$repo" rev-parse --is-inside-work-tree >/dev/null 2>&1 \
  || fail "not a git worktree: $repo"

branch=$(git -C "$repo" branch --show-current)
[[ -n "$branch" ]] || fail "detached HEAD is not an implementation worktree"
case "$branch" in
  main|master|dev|stg) fail "protected branch is not writable: $branch" ;;
esac

if [[ "$mode" == start && -n $(git -C "$repo" status --porcelain) ]]; then
  fail "worktree must be clean before dispatch: $repo"
fi

start_head=$(git -C "$repo" rev-parse HEAD)
git_dir=$(git -C "$repo" rev-parse --absolute-git-dir)
command -v shasum >/dev/null 2>&1 || fail "shasum is required for writer locking"
command -v ps >/dev/null 2>&1 || fail "ps is required for writer lock diagnostics"

lock_key=$(printf '%s' "$git_dir" | shasum -a 256)
lock_key=${lock_key%% *}

lock_root=${CODEX_WORKER_GUIDE_LOCK_ROOT:-/tmp/codex-worker-guide-locks-$UID}
if ! lock_root_error=$(mkdir -p "$lock_root" 2>&1); then
  fail "cannot create writer lock root $lock_root: $lock_root_error"
fi

lock_dir="$lock_root/$lock_key.lock"
owner_file="$lock_dir/owner"

if ! lock_error=$(mkdir "$lock_dir" 2>&1); then
  if [[ -d "$lock_dir" ]]; then
    owner_pid=""
    owner_summary="owner metadata unavailable"
    if [[ -r "$owner_file" ]]; then
      owner_summary=$(tr '\n' ' ' <"$owner_file")
      while IFS='=' read -r key value; do
        if [[ "$key" == pid ]]; then
          owner_pid=$value
          break
        fi
      done <"$owner_file"
    fi

    if [[ "$owner_pid" =~ ^[0-9]+$ ]] && ! ps -p "$owner_pid" -o pid= >/dev/null 2>&1; then
      fail "stale writer lock exists at $lock_dir ($owner_summary)"
    fi
    fail "writer lock already exists at $lock_dir ($owner_summary)"
  fi
  fail "cannot create writer lock at $lock_dir: $lock_error"
fi

if ! {
  printf 'pid=%s\n' "$$"
  printf 'repo=%s\n' "$repo"
  printf 'branch=%s\n' "$branch"
  printf 'started_at=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
} >"$owner_file"; then
  rm -f "$owner_file"
  rmdir "$lock_dir" 2>/dev/null || true
  fail "cannot write writer lock metadata: $owner_file"
fi

worker_pid=""
session_file=""
cleanup() {
  # Stopped mid-run (SIGTERM/SIGINT): stop the worker and still record its session for resume.
  if [[ -n "$worker_pid" ]] && kill -0 "$worker_pid" 2>/dev/null; then
    kill "$worker_pid" 2>/dev/null || true
    wait "$worker_pid" 2>/dev/null || true
  fi
  if [[ -n "$session_file" && ! -s "$session_file" ]]; then
    record_session || true
  fi
  rm -f "$owner_file"
  rmdir "$lock_dir" 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 143' TERM
trap 'exit 130' INT
trap 'exit 129' HUP

if [[ -z "$run_dir" ]]; then
  # Durable, unlike the lock: a reboot must not take the evidence or the session ID with it.
  repo_name=$(basename "$(dirname "$(git -C "$repo" rev-parse --path-format=absolute --git-common-dir)")")
  runs_root=$HOME/.local/share/codex-worker-guide/runs
  mkdir -p "$runs_root"
  run_dir="$runs_root/$(date '+%Y%m%d-%H%M%S')-$repo_name-${branch//\//-}"
  mkdir "$run_dir" || fail "cannot create run directory: $run_dir"
else
  [[ "$run_dir" = /* ]] || fail "run directory must be absolute"
  if [[ -e "$run_dir" ]]; then
    [[ -d "$run_dir" && -z $(ls -A "$run_dir") ]] \
      || fail "run directory must be absent or empty: $run_dir"
  else
    mkdir -p "$run_dir"
  fi
fi

wrapped_prompt="$run_dir/work-order.md"
events_file="$run_dir/events.jsonl"
stderr_file="$run_dir/stderr.log"
last_file="$run_dir/last-message.md"
request_file="$run_dir/request.txt"
session_file="$run_dir/session-id.txt"

record_session() {
  local detected
  detected=$(node -e '
for (const line of require("fs").readFileSync(process.argv[1], "utf8").split("\n")) {
  let event;
  try { event = JSON.parse(line); } catch { continue; }
  const id = event.type === "thread.started" && (event.thread_id || event.session_id);
  if (id) { console.log(id); break; }
}
' "$events_file" 2>/dev/null || true)
  if [[ -n "$detected" ]]; then
    printf '%s\n' "$detected" >"$session_file"
  elif [[ -n "$session_id" ]]; then
    printf '%s\n' "$session_id" >"$session_file"
  else
    : >"$session_file"
  fi
}

# Update the CLI before dispatch when npm has a newer release; a failed check or update keeps the installed one.
installed=$("$codex_bin" --version 2>/dev/null | awk 'END {print $NF}')
latest=$(npm view @openai/codex version --fetch-timeout=5000 --fetch-retries=0 2>/dev/null || true)
if [[ -z "$latest" ]]; then
  cli_update="check_failed"
elif [[ "$latest" == "$installed" || $(printf '%s\n%s\n' "$installed" "$latest" | sort -V | tail -n 1) != "$latest" ]]; then
  cli_update="current"
elif "$codex_bin" update </dev/null >"$run_dir/update.log" 2>&1; then
  cli_update="updated_from_$installed"
else
  cli_update="update_failed_to_$latest"
fi

{
  printf '%s\n\n' '# Leaf Worker Contract'
  printf '%s\n' '- You are the leaf implementation worker for a Codex worker dispatch.'
  printf '%s\n' "- Requested worker configuration: $requested_model / $requested_effort / fast and ultrafast off."
  printf '%s\n' '- Do not invoke codex-worker-guide, spawn sub-agents, or call codex exec.'
  printf '%s\n' '- Work only in the assigned worktree and owned files.'
  printf '%s\n' '- Do not commit, push, merge, edit PR metadata, or access secrets; the parent does those,'
  printf '%s\n' '  overriding any AGENTS.md rule that committing and pushing are part of finishing.'
  printf '%s\n\n' '- Follow AGENTS.md and the work order below.'
  cat "$prompt_file"
} >"$wrapped_prompt"

{
  printf 'cli_version=%s\n' "$("$codex_bin" --version 2>&1 | tail -n 1)"
  printf 'cli_update=%s\n' "$cli_update"
  printf 'mode=%s\n' "$mode"
  printf 'repo=%s\n' "$repo"
  printf 'branch=%s\n' "$branch"
  printf 'starting_head=%s\n' "$start_head"
  printf 'requested_model=%s\n' "$requested_model"
  printf 'model_source=%s\n' "$model_source"
  printf 'requested_reasoning_effort=%s\n' "$requested_effort"
  printf 'sandbox=%s\n' "$sandbox"
  printf 'feature_flags=%s\n' "${disabled_features[*]}"
  printf 'resolved_model=not_exposed\n'
  printf 'resolved_reasoning_effort=not_exposed\n'
} >"$request_file"

set +e
if [[ "$mode" == start ]]; then
  env CODEX_WORKER_GUIDE_DEPTH=1 "$codex_bin" exec \
    --strict-config \
    --ignore-user-config \
    -m "$requested_model" \
    -c "$reasoning_config" \
    "${disabled_features[@]}" \
    -C "$repo" \
    -s "$sandbox" \
    --json \
    -o "$last_file" \
    - <"$wrapped_prompt" >"$events_file" 2>"$stderr_file" &
  worker_pid=$!
  wait "$worker_pid"
  status=$?
else
  (
    cd "$repo"
    exec env CODEX_WORKER_GUIDE_DEPTH=1 "$codex_bin" exec resume \
      --strict-config \
      --ignore-user-config \
      -m "$requested_model" \
      -c "$reasoning_config" \
      -c "sandbox_mode=\"$sandbox\"" \
      "${disabled_features[@]}" \
      --json \
      -o "$last_file" \
      "$session_id" - <"$wrapped_prompt" >"$events_file" 2>"$stderr_file"
  ) &
  worker_pid=$!
  wait "$worker_pid"
  status=$?
fi
worker_pid=""
set -e

record_session

# Codex offers spawn_agent unconditionally (no feature flag removes it), so count the calls instead.
sid=$(cat "$session_file")
rollout=""
[[ -n "$sid" ]] && rollout=$(find "${CODEX_HOME:-$HOME/.codex}/sessions" -name "rollout-*$sid.jsonl" -print -quit 2>/dev/null || true)
spawned=$(node -e '
const calls = require("fs").readFileSync(process.argv[1], "utf8").split("\n").filter(Boolean)
  .map(line => JSON.parse(line).payload ?? {})
  .filter(p => p.type === "function_call" && p.name === "spawn_agent").length;
console.log(calls);
' "$rollout" 2>/dev/null || echo unknown)

printf 'run_directory=%s\n' "$run_dir"
printf 'exit_status=%s\n' "$status"
printf 'session_id=%s\n' "$sid"
printf 'sub_agents_spawned=%s\n' "$spawned"
printf 'events=%s\n' "$events_file"
printf 'stderr=%s\n' "$stderr_file"
printf 'last_message=%s\n' "$last_file"
exit "$status"
