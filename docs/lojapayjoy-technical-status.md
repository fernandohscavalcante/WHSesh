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

## Reproducible passive collection

Run the following command from the repository root:

```bash
./scripts/collect_lojapayjoy_public_evidence.sh
```

The optional first argument sets the evidence-root directory; the script's target is intentionally fixed to the reported domain. It writes a UTC-stamped directory and a SHA-256 manifest.

## Explicitly excluded activity

Do **not** use this repository or script to:

* submit checkout or contact forms, create orders, or send Pix payments;
* access, probe, enumerate, or authenticate to the referenced Supabase project or any third-party API;
* conduct credential attacks, fuzzing, brute force, vulnerability exploitation, or attempts to evade Cloudflare;
* contact the registrant through a forwarding form, which could alert the operator.

Use provider abuse channels, preservation requests, and law-enforcement/legal process for any non-public records or action against the infrastructure.
