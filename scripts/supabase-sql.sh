#!/usr/bin/env bash
#
# Run SQL against a Supabase project through the Management API.
#
# The API only needs the personal access token the Supabase CLI already stores
# in the macOS keychain, so no database password and no service-role key are
# involved, and nothing is ever printed but the JSON result.
#
# Usage:
#   ./scripts/supabase-sql.sh 'select count(*) from public.profiles'
#   ./scripts/supabase-sql.sh < some-migration.sql
#   PROJECT_REF=abc123 ./scripts/supabase-sql.sh 'select 1'
#
# The project defaults to the one `supabase link` recorded for this repo.
set -euo pipefail

API_HOST="https://api.supabase.com"

ref="${PROJECT_REF:-}"
if [ -z "$ref" ]; then
  linked="supabase/.temp/linked-project.json"
  [ -f "$linked" ] || { echo "No PROJECT_REF set and $linked is missing. Run 'supabase link' first." >&2; exit 1; }
  ref=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["ref"])' "$linked")
fi

if [ $# -gt 0 ]; then sql="$1"; else sql=$(cat); fi
[ -n "${sql//[[:space:]]/}" ] || { echo "No SQL given (pass it as an argument or on stdin)." >&2; exit 1; }

token=$(security find-generic-password -s "Supabase CLI" -w 2>/dev/null || echo "${SUPABASE_ACCESS_TOKEN:-}")
[ -n "$token" ] || { echo "No Supabase access token in the keychain. Run 'supabase login'." >&2; exit 1; }

body=$(SQL="$sql" python3 -c 'import json,os; print(json.dumps({"query": os.environ["SQL"]}))')

http=$(curl -sS --max-time 60 -o /tmp/.supabase-sql-out -w '%{http_code}' \
  -X POST "$API_HOST/v1/projects/$ref/database/query" \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  --data-binary "$body")

cat /tmp/.supabase-sql-out; echo
rm -f /tmp/.supabase-sql-out
[ "$http" -lt 400 ] || { echo "HTTP $http" >&2; exit 1; }
