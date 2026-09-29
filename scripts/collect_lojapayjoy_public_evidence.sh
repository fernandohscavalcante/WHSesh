#!/usr/bin/env bash
# Collect only public, passive technical indicators for the reported phishing domain.
# This script intentionally does NOT fetch application pages or assets; post forms;
# follow checkout flows; query Supabase; enumerate endpoints; or make payments.
# The only request sent to the target itself is a single HTTPS HEAD without redirects.
set -Eeuo pipefail
umask 077

readonly TARGET='lojapayjoy.shop'
readonly OUT_ROOT="${1:-evidence/${TARGET}}"
STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
readonly STARTED_AT
# One clock reading names the directory and fills collected_at_utc.
readonly RUN_ID="${STARTED_AT//[-:]/}"
readonly OUT_DIR="${OUT_ROOT}/${RUN_ID}"
readonly LOG="${OUT_DIR}/collection-log.tsv"
readonly DNS_API='https://cloudflare-dns.com/dns-query'
readonly SCRIPT_PATH="${BASH_SOURCE[0]}"

if command -v sha256sum >/dev/null 2>&1; then
  SHA256=(sha256sum)
elif command -v shasum >/dev/null 2>&1; then
  SHA256=(shasum -a 256)
else
  printf 'ERROR: neither sha256sum nor shasum is available\n' >&2
  exit 2
fi

if [[ -e "$OUT_DIR" ]]; then
  printf 'ERROR: %s already exists; refusing to overwrite a snapshot\n' "$OUT_DIR" >&2
  exit 2
fi
mkdir -p "$OUT_DIR"

yes_no() { if [[ -n "${1:-}" ]]; then printf yes; else printf no; fi; }

# Record what produced this snapshot, so the collector revision and the collection
# environment can be checked later. Proxy URLs are never recorded (they may hold credentials).
script_dir="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
script_file="$script_dir/$(basename "$SCRIPT_PATH")"
collector_commit="$(git -C "$script_dir" rev-parse HEAD 2>/dev/null || printf unavailable)"
if [[ "$collector_commit" == unavailable ]]; then
  collector_modified=unknown
elif ! git -C "$script_dir" ls-files --error-unmatch -- "$script_file" >/dev/null 2>&1; then
  collector_modified=untracked
elif git -C "$script_dir" diff --quiet HEAD -- "$script_file" 2>/dev/null; then
  collector_modified=no
else
  collector_modified=yes
fi
ntp_synchronized="$(timedatectl show -p NTPSynchronized --value 2>/dev/null || printf unknown)"
{
  printf 'target=%s\n' "$TARGET"
  printf 'collected_at_utc=%s\n' "$STARTED_AT"
  printf 'collection_scope=public-DNS-RDAP(domain,IP)-CT-and-HTTP-HEAD-only\n'
  printf 'collector_sha256=%s\n' "$("${SHA256[@]}" < "$SCRIPT_PATH" | cut -d' ' -f1)"
  printf 'collector_git_commit=%s\n' "$collector_commit"
  printf 'collector_modified_since_commit=%s\n' "$collector_modified"
  printf 'curl_version=%s\n' "$(curl --version | head -n 1 | cut -d' ' -f1-2)"
  printf 'https_proxy_configured=%s\n' \
    "$(yes_no "${HTTPS_PROXY:-}${https_proxy:-}${ALL_PROXY:-}${all_proxy:-}")"
  printf 'custom_ca_bundle_configured=%s\n' "$(yes_no "${CURL_CA_BUNDLE:-}${SSL_CERT_FILE:-}")"
  printf 'system_clock_ntp_synchronized=%s\n' "${ntp_synchronized:-unknown}"
} > "$OUT_DIR/00_collection-info.txt"

printf 'artifact\thttp_status\tcurl_exit\trequested_url\teffective_url\n' > "$LOG"
failures=()

# Non-2xx bodies are kept as evidence (for example an RDAP 404 after a takedown); the
# status of every request is logged. Transport errors, 429 and 5xx count as failed collection.
fetch() {
  local artifact="$1" url="$2" result rc=0 status effective
  shift 2
  result="$(curl --silent --show-error --location --connect-timeout 5 --max-time 30 \
    --write-out '%{http_code}\t%{url_effective}' --output "$OUT_DIR/$artifact" "$@" "$url")" || rc=$?
  status="${result%%$'\t'*}"
  effective="${result#*$'\t'}"
  if (( rc != 0 )); then
    printf '{"collection_error":"transport failure","curl_exit_code":%d}\n' "$rc" > "$OUT_DIR/$artifact"
  fi
  if (( rc != 0 )) || [[ "$status" == 429 || "$status" == 5?? ]]; then
    failures+=("$artifact")
  fi
  printf '%s\t%s\t%s\t%s\t%s\n' "$artifact" "${status:-000}" "$rc" "$url" "${effective:-}" >> "$LOG"
}

for record in A AAAA NS MX TXT SOA; do
  fetch "dns-apex-${record}.json" "${DNS_API}?name=${TARGET}&type=${record}" \
    -H 'accept: application/dns-json'
done
for record in A AAAA CNAME; do
  fetch "dns-www-${record}.json" "${DNS_API}?name=www.${TARGET}&type=${record}" \
    -H 'accept: application/dns-json'
done
fetch dns-lovable-verification-TXT.json "${DNS_API}?name=_lovable.${TARGET}&type=TXT" \
  -H 'accept: application/dns-json'
fetch rdap-registrar.json "https://namerdap.systems/domain/${TARGET}"
fetch rdap-registry.json "https://rdap.gmoregistry.net/rdap/domain/${TARGET}"

# Network registration (RIR RDAP) for every address the names resolved to, which names
# the hosting network and its abuse contact. rdap.org redirects to the responsible RIR;
# the RIR URL that answered is recorded in collection-log.tsv.
while IFS= read -r ip; do
  fetch "rdap-ip-${ip//:/_}.json" "https://rdap.org/ip/${ip}"
done < <(cat "$OUT_DIR"/dns-apex-A.json "$OUT_DIR"/dns-apex-AAAA.json \
  "$OUT_DIR"/dns-www-A.json "$OUT_DIR"/dns-www-AAAA.json \
  | grep -oE '"type":(1|28),"TTL":[0-9]+,"data":"[0-9A-Fa-f:.]+"' \
  | sed -E 's/.*"data":"([^"]+)"$/\1/' \
  | LC_ALL=C sort -u || true)

fetch ct-apex.json "https://crt.sh/?q=${TARGET}&output=json"
fetch ct-www.json "https://crt.sh/?q=www.${TARGET}&output=json"

# Single HEAD to the target. --suppress-connect-headers keeps an egress proxy's CONNECT
# reply out of the evidence; Set-Cookie is dropped so a bot-management token is not retained.
raw_headers="$(mktemp "$OUT_DIR/.http-headers.XXXXXX")"
trap 'rm -f "$raw_headers"' EXIT
head_rc=0
head_status="$(curl --silent --show-error --head --suppress-connect-headers \
  --connect-timeout 5 --max-time 10 --write-out '%{http_code}' --output "$raw_headers" \
  "https://${TARGET}/")" || head_rc=$?
tr -d '\r' < "$raw_headers" | sed -E '/^set-cookie:/Id; s/[[:space:]]+$//' > "$OUT_DIR/http-headers.txt"
rm -f "$raw_headers"
printf 'http-headers.txt\t%s\t%s\t%s\t%s\n' "${head_status:-000}" "$head_rc" \
  "https://${TARGET}/" "https://${TARGET}/" >> "$LOG"

(
  cd "$OUT_DIR"
  export LC_ALL=C
  files=()
  for f in *; do
    [[ -f "$f" && "$f" != SHA256SUMS ]] && files+=("$f")
  done
  "${SHA256[@]}" "${files[@]}" > SHA256SUMS
)
printf 'Evidence written to %s\n' "$OUT_DIR"

if (( ${#failures[@]} )); then
  printf 'WARNING: %d public-source request(s) failed: %s (see collection-log.tsv)\n' \
    "${#failures[@]}" "${failures[*]}" >&2
  exit 1
fi
