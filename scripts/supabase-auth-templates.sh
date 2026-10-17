#!/usr/bin/env bash
# Pushes the PIN email templates in supabase/templates/ to a Supabase project's
# auth config ("Confirm signup" and "Magic link", the only two the app uses).
#
#   ./scripts/supabase-auth-templates.sh <project-ref>
#
# Production is dzgclvaksadfyqcvrnxz, staging mzyayceihmpgkstsnvjs. Uses the
# Supabase CLI token from the macOS keychain (or SUPABASE_ACCESS_TOKEN). Sends
# one template per PATCH: large payloads have tripped the API's WAF before.
set -euo pipefail

ref="${1:-}"
if [[ -z "$ref" ]]; then
  echo "usage: $0 <project-ref>" >&2
  exit 1
fi

root="$(cd "$(dirname "$0")/.." && pwd)"
token=$(security find-generic-password -s "Supabase CLI" -w 2>/dev/null || echo "${SUPABASE_ACCESS_TOKEN:-}")
case "$token" in go-keyring-base64:*) token=$(printf %s "${token#go-keyring-base64:}" | base64 -d) ;; esac
if [[ -z "$token" ]]; then
  echo "No Supabase token: log in with 'supabase login' or set SUPABASE_ACCESS_TOKEN." >&2
  exit 1
fi

api="https://api.supabase.com/v1/projects/$ref/config/auth"
for pair in confirmation:mailer_templates_confirmation_content magic_link:mailer_templates_magic_link_content; do
  file="$root/supabase/templates/${pair%%:*}.html"
  key="${pair#*:}"
  body=$(python3 -c 'import json,sys; print(json.dumps({sys.argv[1]: open(sys.argv[2]).read()}))' "$key" "$file")
  status=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$api" \
    -H "Authorization: Bearer $token" -H "Content-Type: application/json" --data "$body")
  echo "$ref ${pair%%:*}: HTTP $status"
  [[ "$status" == 200 ]] || exit 1
done

# Read back and compare with the files.
curl -s "$api" -H "Authorization: Bearer $token" | python3 -c '
import json, sys
d = json.load(sys.stdin)
root = sys.argv[1]
for name, key in [("confirmation", "mailer_templates_confirmation_content"), ("magic_link", "mailer_templates_magic_link_content")]:
    ok = d.get(key) == open(root + "/supabase/templates/" + name + ".html").read()
    print(name + ": " + ("matches" if ok else "DIFFERS"))
' "$root"
