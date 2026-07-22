#!/usr/bin/env bash
# Produce the design system's compiled stylesheet for design-sync.
#
# src/app/globals.css can't be used directly as `cssEntry`: its first line is
# `@import "tailwindcss"`, which is a bare specifier, not a file on disk, so the
# converter reports [CSS_IMPORT_MISSING]. The compiled output is also the more
# correct input — buttonClass() can emit Tailwind utilities such as
# `rounded-full`, which only exist after compilation.
#
# The Next build names the chunk with a content hash, so pick the largest .css
# and copy it to a stable path.
set -euo pipefail

cd "$(dirname "$0")/.."

npm run build >/dev/null

mkdir -p .design-sync/.cache
SRC="$(find .next/static -name '*.css' -type f -exec ls -S {} + | head -1)"

if [ -z "${SRC:-}" ]; then
  echo "no compiled css found under .next/static — did the build succeed?" >&2
  exit 1
fi

cp "$SRC" .design-sync/.cache/styles.compiled.css
echo "css: $SRC -> .design-sync/.cache/styles.compiled.css ($(wc -c < "$SRC") bytes)"
