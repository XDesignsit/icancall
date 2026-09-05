#!/usr/bin/env bash
#
# Wire a freshly created Supabase project up as iCanCall's staging database.
#
# You create the project in the dashboard (so the database password is yours and
# never passes through here); this does everything after that:
#   1. checks the project is provisioned and healthy
#   2. applies supabase/schema.sql and every migration
#   3. writes the staging credentials into .env.local (gitignored)
#   4. optionally repoints Vercel Preview at staging, with --vercel
#
# Usage:
#   ./scripts/setup-staging.sh <project-ref>
#   ./scripts/setup-staging.sh <project-ref> --vercel
set -euo pipefail

REF="${1:-}"
[ -n "$REF" ] || { echo "usage: $0 <project-ref> [--vercel]" >&2; exit 1; }
DO_VERCEL=false
[ "${2:-}" = "--vercel" ] && DO_VERCEL=true

PROD_REF=dzgclvaksadfyqcvrnxz
if [ "$REF" = "$PROD_REF" ]; then
  echo "Refusing to run: $REF is the PRODUCTION project." >&2
  exit 1
fi

token=$(security find-generic-password -s "Supabase CLI" -w 2>/dev/null || echo "${SUPABASE_ACCESS_TOKEN:-}")
[ -n "$token" ] || { echo "No Supabase access token in the keychain. Run 'supabase login'." >&2; exit 1; }
api() { curl -sS --max-time 60 -H "Authorization: Bearer $token" "$@"; }

echo "==> 1. checking project $REF"
status=$(api "https://api.supabase.com/v1/projects" \
  | python3 -c 'import json,sys; r=sys.argv[1]; print(next((p["status"] for p in json.load(sys.stdin)["projects"] if p["ref"]==r), "NOT_FOUND"))' "$REF")
echo "    status: $status"
case "$status" in
  ACTIVE_HEALTHY) ;;
  NOT_FOUND) echo "    Project not found on this account." >&2; exit 1 ;;
  *) echo "    Still provisioning. Wait until ACTIVE_HEALTHY and re-run." >&2; exit 1 ;;
esac

echo "==> 2. applying schema and migrations"
for f in supabase/schema.sql supabase/migrations/*.sql; do
  [ -f "$f" ] || continue
  printf '    %-62s' "$(basename "$f")"
  if PROJECT_REF="$REF" ./scripts/supabase-sql.sh < "$f" >/dev/null 2>&1; then echo "ok"; else echo "FAILED"; exit 1; fi
done

echo "==> 3. fetching API keys"
keys=$(api "https://api.supabase.com/v1/projects/$REF/api-keys")
anon=$(echo "$keys" | python3 -c 'import json,sys; print(next(k["api_key"] for k in json.load(sys.stdin) if k["name"]=="anon"))')
service=$(echo "$keys" | python3 -c 'import json,sys; print(next(k["api_key"] for k in json.load(sys.stdin) if k["name"]=="service_role"))')
url="https://$REF.supabase.co"
echo "    url:          $url"
echo "    anon:         ${anon:0:12}… (${#anon} chars)"
echo "    service_role: ${service:0:12}… (${#service} chars)"

echo "==> 4. writing .env.local"
[ -f .env.local ] && cp .env.local ".env.local.bak.$(date -u +%Y%m%dT%H%M%SZ)"
python3 - "$url" "$service" "$anon" <<'PY'
import sys, re, os, secrets
url, service, anon = sys.argv[1:4]
path = ".env.local"
lines = open(path).read().splitlines() if os.path.exists(path) else []
def setvar(lines, key, val):
    out, done = [], False
    for l in lines:
        if re.match(rf'^\s*{re.escape(key)}\s*=', l):
            if not done: out.append(f'{key}="{val}"'); done = True
        else: out.append(l)
    if not done: out.append(f'{key}="{val}"')
    return out
have_jwt = any(re.match(r'^\s*JWT_SECRET\s*=\s*"?\S', l) for l in lines)
for k, v in [("NEXT_PUBLIC_SUPABASE_URL", url),
             ("SUPABASE_SERVICE_ROLE_KEY", service),
             ("NEXT_PUBLIC_SUPABASE_ANON_KEY", anon),
             ("NEXT_PUBLIC_DEMO_LOGINS", "1")]:
    lines = setvar(lines, k, v)
if not have_jwt:
    lines = setvar(lines, "JWT_SECRET", secrets.token_urlsafe(48))
    print("    JWT_SECRET: generated a local one")
open(path, "w").write("\n".join(lines).rstrip("\n") + "\n")
print("    .env.local updated (backup alongside it)")
PY

echo "==> 5. verifying"
PROJECT_REF="$REF" ./scripts/supabase-sql.sh \
  "select (select count(*) from public.profiles) as profiles,
          (select count(*) from public.phone_lines) as phone_lines,
          (select count(*) from information_schema.tables
            where table_schema='public' and table_name in ('profiles','phone_lines')) as tables_present" \
  | sed 's/^/    /'

if $DO_VERCEL; then
  echo "==> 6. repointing Vercel Preview at staging"
  for k in NEXT_PUBLIC_SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY; do
    npx vercel env rm "$k" preview --yes >/dev/null 2>&1 || true
  done
  printf '%s' "$url"     | npx vercel env add NEXT_PUBLIC_SUPABASE_URL preview >/dev/null && echo "    NEXT_PUBLIC_SUPABASE_URL   -> staging"
  printf '%s' "$service" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY preview >/dev/null && echo "    SUPABASE_SERVICE_ROLE_KEY  -> staging"
  echo "    NOTE: a redeploy is required — 'vercel redeploy' reuses the OLD env, so push a commit."
else
  echo "==> 6. skipped Vercel (re-run with --vercel to repoint Preview at staging)"
fi

echo
echo "Done. Local dev now talks to staging Supabase with real auth."
