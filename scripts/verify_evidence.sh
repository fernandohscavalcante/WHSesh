#!/usr/bin/env bash
# Verify every evidence snapshot against its SHA256SUMS manifest. Fails when a file was
# altered or removed, when a file is present but not covered by the manifest, or when a
# snapshot directory has no manifest. Reads local files only; makes no network requests.
set -Eeuo pipefail

readonly ROOT="${1:-evidence}"

if command -v sha256sum >/dev/null 2>&1; then
  SHA256=(sha256sum)
elif command -v shasum >/dev/null 2>&1; then
  SHA256=(shasum -a 256)
else
  printf 'ERROR: neither sha256sum nor shasum is available\n' >&2
  exit 2
fi

status=0
checked=0
while IFS= read -r -d '' snapshot; do
  checked=$((checked + 1))
  snapshot_ok=1
  if [[ ! -f "$snapshot/SHA256SUMS" ]]; then
    printf 'FAIL %s: no SHA256SUMS manifest\n' "$snapshot"
    status=1
    continue
  fi
  if ! (cd "$snapshot" && "${SHA256[@]}" -c SHA256SUMS >/dev/null 2>&1); then
    printf 'FAIL %s: manifest check failed\n' "$snapshot"
    (cd "$snapshot" && "${SHA256[@]}" -c SHA256SUMS 2>&1 | grep -v ': OK$') || true
    snapshot_ok=0
  fi
  while IFS= read -r -d '' file; do
    name="${file##*/}"
    if ! sed -E 's/^[0-9a-f]{64} [ *]//' "$snapshot/SHA256SUMS" | grep -qxF -- "$name"; then
      printf 'FAIL %s: %s is not covered by SHA256SUMS\n' "$snapshot" "$name"
      snapshot_ok=0
    fi
  done < <(find "$snapshot" -mindepth 1 -maxdepth 1 -type f ! -name SHA256SUMS -print0)
  if (( snapshot_ok )); then
    printf 'OK   %s\n' "$snapshot"
  else
    status=1
  fi
done < <(find "$ROOT" -mindepth 2 -maxdepth 2 -type d -print0 | LC_ALL=C sort -z)

if (( checked == 0 )); then
  printf 'ERROR: no snapshot directories found under %s\n' "$ROOT" >&2
  exit 2
fi
exit "$status"
