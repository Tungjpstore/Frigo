#!/usr/bin/env bash
set -euo pipefail

scope="${1:-}"
database="${D1_DATABASE:-frigo-db}"
strict=0
json_output=0

case "$scope" in
  local) scope_flag="--local" ;;
  remote) scope_flag="--remote" ;;
  *)
    echo "Usage: bash scripts/d1-week-reconcile.sh <local|remote> [--strict] [--json]"
    exit 2
    ;;
esac

shift
for option in "$@"; do
  case "$option" in
    --) ;;
    --strict) strict=1 ;;
    --json) json_output=1 ;;
    *) echo "Unknown option: $option" >&2; exit 2 ;;
  esac
done

query="$(sed -e '/^[[:space:]]*--/d' -e '/^[[:space:]]*$/d' scripts/d1-week-reconcile.sql | tr '\n' ' ')"
echo "Running read-only Week reconciliation: database=$database scope=$scope" >&2

if ! result="$(pnpm wrangler d1 execute "$database" "$scope_flag" --yes --command "$query" --json)"; then
  echo "D1 reconciliation query failed; no mutation was attempted." >&2
  exit 1
fi

args=(scripts/week-reconciliation.mjs --database "$database" --scope "$scope")
if [[ "$strict" == "1" ]]; then args+=(--strict); fi
if [[ "$json_output" == "1" ]]; then args+=(--json); fi
printf '%s' "$result" | node "${args[@]}"
