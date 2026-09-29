# lojapayjoy.shop — technical status snapshot

**Collection time:** 2026-09-29T14:08:11Z<br>
**Scope:** DNS-over-HTTPS, RDAP, Certificate Transparency, and an HTTPS `HEAD` request only. No checkout interaction, form submission, application/API access, payment initiation, authentication attempt, endpoint enumeration, or attempts to bypass protections were performed.

## Observed public indicators

| Indicator | Observation |
| --- | --- |
| HTTPS reachability | The `HEAD` response was `HTTP/2 200` at collection time. |
| DNS A | `lojapayjoy.shop` resolved to `185.158.133.1` (TTL 300). |
| DNS NS | `ns1hwy.name.com`, `ns2fln.name.com`, `ns3fqs.name.com`, and `ns4jnz.name.com` (TTL 300). |
| Domain verification TXT | `_lovable.lojapayjoy.shop` returned a `lovable_verify` TXT value. This confirms only that the public record exists; it does not establish account ownership or prove hosting attribution by itself. |
| RDAP | Registration event: `2026-07-28T02:47:55+00:00`; last-changed event: `2026-09-10T04:21:02+00:00`; status included `transfer prohibited`. |
| Certificate Transparency | The archived CT responses include certificates for the apex and `www` hostname. |

These are technical observations, not an attribution finding. The preserved source responses and their SHA-256 manifest are in [`evidence/lojapayjoy.shop/20260929T140811Z`](../evidence/lojapayjoy.shop/20260929T140811Z).

## Evidence handling

* `SHA256SUMS` covers every source artifact in the snapshot except the manifest itself.
* The HTTP header artifact intentionally excludes the transient `Set-Cookie` line, so a bot-management token is not retained or committed.
* Preserve the original directory unchanged after collection. Copy it before adding analyst notes or derived exports.
* Record the collector, system clock source, and any subsequent transfers in the case-management system outside this repository.
* Run `./scripts/verify_evidence.sh` before sharing or relying on a snapshot. It fails if any file was altered or removed, if a file is not covered by `SHA256SUMS`, or if a snapshot has no manifest. The `Evidence integrity` GitHub Actions workflow runs the same check on every push; it never contacts the reported domain.
* `.gitattributes` marks `evidence/**` as binary for line-ending purposes, so a checkout with `core.autocrlf` enabled cannot rewrite the files and break the manifest.

## Reproducible passive collection

Run the following command from the repository root:

```bash
./scripts/collect_lojapayjoy_public_evidence.sh
```

The optional first argument sets the evidence-root directory; the script's target is intentionally fixed to the reported domain. It writes a UTC-stamped directory and a SHA-256 manifest, and refuses to overwrite an existing snapshot.

Each run also records:

* in `00_collection-info.txt`: the collector's SHA-256, the Git commit it was run from and whether the script differed from that commit, the curl version, whether an HTTPS proxy or a custom CA bundle was configured (never the proxy URL), and the NTP synchronisation state where `timedatectl` is available;
* in `collection-log.tsv`: the HTTP status, curl exit code, requested URL and effective URL of every request. Non-2xx bodies are kept as evidence, so an RDAP `404` or a DNS `NXDOMAIN` after a takedown is preserved rather than replaced by a generic error;
* `rdap-ip-<address>.json`: the regional internet registry's RDAP record for every address the apex and `www` names resolved to, which names the network holder and its abuse contact. `rdap.org` redirects each query to the responsible registry, and the registry URL that answered is logged.

The HEAD request uses `--suppress-connect-headers`, so an egress proxy's reply to the `CONNECT` request is no longer written into `http-headers.txt` (see the limitations below). The script exits with status `1` when a request to a public data source (DoH, RDAP, CT) failed at transport level or returned `429` or `5xx`; a failed HEAD to the target is recorded as an observation and does not fail the run.

Run collections intended as evidence from a controlled workstation with a known clock source. A sandbox whose egress proxy terminates TLS places an intermediary between the collector and every source; `https_proxy_configured` and `custom_ca_bundle_configured` in `00_collection-info.txt` flag that condition but cannot remove it.

## Verifying and comparing snapshots

```bash
./scripts/verify_evidence.sh
python3 scripts/snapshot_indicators.py evidence/lojapayjoy.shop/<RUN_ID>
python3 scripts/snapshot_indicators.py evidence/lojapayjoy.shop/<OLDER> evidence/lojapayjoy.shop/<NEWER>
```

Comparing manifests does not show what changed, because every response carries its own timestamps and the hashes differ on every run. `snapshot_indicators.py` extracts comparable indicators (DNS answers and response codes, RDAP status, events, nameservers and contacts, IP network registration, CT certificates, HTTP status and selected headers) and prints them as a Markdown table. Given two snapshots, it prints only the indicators that changed and exits with status `1`, so it can drive monitoring. Both scripts read local files only.

## Known limitations of snapshot 20260929T140811Z

These points concern the preserved snapshot itself. The files are left unchanged; the notes below qualify how they should be read.

1. **Collector revision not preserved.** The snapshot's `00_collection-info.txt` contains `method=passive-public-GET-HEAD-DNS-RDAP-CT-only`, while the collector committed alongside it (commit `8985883`) writes `collection_scope=public-DNS-RDAP-CT-and-HTTP-HEAD-only`. The snapshot was therefore produced by a revision of the collector that the repository does not contain, and the exact code that produced it cannot be reconstructed from Git history.
2. **Proxy reply inside `http-headers.txt`.** The file holds two header blocks. The request was a single HEAD without redirect following, so the target's response is the final `HTTP/2 200` block (14:08:17 GMT). The preceding `HTTP/1.1 200 OK` block (`server: envoy`, 14:08:14 GMT) is consistent with the collection environment's egress proxy answering the `CONNECT` request: curl writes that reply into `--head` output when it tunnels through a proxy (reproduced with curl 8.5.0). The snapshot does not record whether that proxy also terminated TLS, so `server: envoy` and `x-envoy-upstream-service-time` in the final block cannot be attributed to the target's infrastructure from this snapshot alone. A collection taken without an intercepting proxy would settle the point.
3. **RDAP status wording.** The registrar's RDAP reports `transfer prohibited`; the registry's RDAP reports `client transfer prohibited`. Under RFC 5731, section 2.3, status values prefixed with `client` are those the sponsoring client (here the registrar) can add or remove. The status is a registrar-side transfer lock, not a registry or legal measure.
4. **Minor discrepancies between RDAP sources.** The registration event is `2026-07-28T02:47:55+00:00` at the registrar and `2026-07-28T02:47:56.0Z` at the registry. Both sources give an expiration of `2027-07-28T23:59:59Z`. They list the same abuse e-mail (`abuse@name.com`) but different abuse telephone numbers (`+1-720-310-1849` at the registrar, `+1.7202492374` at the registry).
5. **CT validity dates are not issuance times.** The certificates' `not_before` values (02:26:29 to 02:33:27 UTC on 2026-07-28) precede the RDAP registration event by 14 to 21 minutes. `not_before` is a value the CA writes into the certificate, not the time the log accepted it, and the preserved crt.sh output contains no log timestamps. These values do not support a finding of activity before registration.
6. **No network registration data.** The snapshot predates IP RDAP collection, so it does not identify who holds the network behind `185.158.133.1`. The next collection will.

## Explicitly excluded activity

Do **not** use this repository or script to:

* submit checkout or contact forms, create orders, or send Pix payments;
* access, probe, enumerate, or authenticate to the referenced Supabase project or any third-party API;
* conduct credential attacks, fuzzing, brute force, vulnerability exploitation, or attempts to evade Cloudflare;
* contact the registrant through a forwarding form, which could alert the operator.

Use provider abuse channels, preservation requests, and law-enforcement/legal process for any non-public records or action against the infrastructure.
