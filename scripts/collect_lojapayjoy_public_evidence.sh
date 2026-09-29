#!/usr/bin/env bash
# Collect only public, passive technical indicators for the reported phishing domain.
# This script intentionally does NOT fetch application pages or assets; post forms;
# follow checkout flows; query Supabase; enumerate endpoints; or make payments.
set -Eeuo pipefail
umask 077

readonly TARGET='lojapayjoy.shop'
readonly OUT_ROOT="${1:-evidence/${TARGET}}"
readonly RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
readonly OUT_DIR="${OUT_ROOT}/${RUN_ID}"
readonly DNS_API='https://cloudflare-dns.com/dns-query'

mkdir -p "$OUT_DIR"
printf 'target=%s\ncollected_at_utc=%s\ncollection_scope=public-DNS-RDAP-CT-and-HTTP-HEAD-only\n' \
  "$TARGET" "$(date -u +%FT%TZ)" > "$OUT_DIR/00_collection-info.txt"

fetch() {
  local destination="$1"
  shift
  if ! curl --fail --silent --show-error --location --connect-timeout 5 --max-time 10 "$@" -o "$destination"; then
    printf '{"collection_error":"request failed"}\n' > "$destination"
    return 1
  fi
}

for record in A AAAA NS MX TXT SOA; do
  fetch "$OUT_DIR/dns-apex-${record}.json" \
    -H 'accept: application/dns-json' "${DNS_API}?name=${TARGET}&type=${record}" || true
done
for record in A AAAA CNAME; do
  fetch "$OUT_DIR/dns-www-${record}.json" \
    -H 'accept: application/dns-json' "${DNS_API}?name=www.${TARGET}&type=${record}" || true
done
fetch "$OUT_DIR/dns-lovable-verification-TXT.json" \
  -H 'accept: application/dns-json' "${DNS_API}?name=_lovable.${TARGET}&type=TXT" || true
fetch "$OUT_DIR/rdap-registrar.json" "https://namerdap.systems/domain/${TARGET}" || true
fetch "$OUT_DIR/rdap-registry.json" "https://rdap.gmoregistry.net/rdap/domain/${TARGET}" || true
fetch "$OUT_DIR/ct-apex.json" "https://crt.sh/?q=${TARGET}&output=json" || true
fetch "$OUT_DIR/ct-www.json" "https://crt.sh/?q=www.${TARGET}&output=json" || true

# Do not preserve Cloudflare's short-lived bot-management cookie in the evidence set.
curl --silent --show-error --head --connect-timeout 5 --max-time 10 "https://${TARGET}/" \
  | tr -d '\r' \
  | sed -E '/^set-cookie:/Id; s/[[:space:]]+$//' > "$OUT_DIR/http-headers.txt" || true

(
  cd "$OUT_DIR"
  find . -maxdepth 1 -type f ! -name SHA256SUMS -printf '%f\0' \
    | LC_ALL=C sort -z \
    | xargs -0 sha256sum > SHA256SUMS
)
printf 'Evidence written to %s\n' "$OUT_DIR"
