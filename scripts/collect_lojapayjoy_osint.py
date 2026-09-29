#!/usr/bin/env python3
"""Collect third-party OSINT about lojapayjoy.shop without contacting the domain itself.

Every request goes to a public third-party data source: DNS-over-HTTPS resolvers
(Cloudflare and Google), RDAP (registry, IP and ASN), RIPEstat, Shodan InternetDB
(passive data from Shodan's own scans; nothing is scanned here), crt.sh (including
the full certificates and a lookalike search for "payjoy"), urlscan.io search (no
scan is submitted), the Internet Archive's lookup APIs (nothing is archived), the
Google Safe Browsing transparency report, and public phishing feeds.

The raw responses, a request log and a SHA-256 manifest are written to
evidence/lojapayjoy.shop-osint/<UTC run id>/ (or the directory given as argument).
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

TARGET = "lojapayjoy.shop"
DOH = {
    "cloudflare": "https://cloudflare-dns.com/dns-query?name={name}&type={type}",
    "google": "https://dns.google/resolve?name={name}&type={type}",
}
DNS_QUERIES = {
    TARGET: ["A", "AAAA", "NS", "SOA", "MX", "TXT", "CAA", "HTTPS", "DS", "DNSKEY"],
    f"www.{TARGET}": ["A", "AAAA", "CNAME", "HTTPS"],
    f"_dmarc.{TARGET}": ["TXT"],
    f"_lovable.{TARGET}": ["TXT"],
}
RIPESTAT_IP_CALLS = [
    "network-info",
    "prefix-overview",
    "abuse-contact-finder",
    "whois",
    "maxmind-geo-lite",
    "routing-status",
]
LOOKALIKE_PATTERNS = ["%payjoy%", "%pay-joy%"]
RETRY_STATUSES = {"429", "500", "502", "503", "504"}
SCRIPT = Path(__file__).resolve()


class Collector:
    def __init__(self, out_dir: Path):
        self.out_dir = out_dir
        self.rows: list[str] = ["artifact\thttp_status\tcurl_exit\tattempts\trequested_url\teffective_url"]
        self.failures: list[str] = []

    def fetch(self, artifact: str, url: str, *, headers=(), data: str | None = None,
              max_time: int = 60, retries: int = 2, backoff: int = 20) -> Path:
        path = self.out_dir / artifact
        status, rc, effective = "000", 0, ""
        for attempt in range(1, retries + 2):
            cmd = ["curl", "--silent", "--show-error", "--location", "--connect-timeout", "10",
                   "--max-time", str(max_time), "--write-out", "%{http_code}\t%{url_effective}",
                   "--output", str(path)]
            for header in headers:
                cmd += ["-H", header]
            if data is not None:
                cmd += ["--data", data]
            cmd.append(url)
            proc = subprocess.run(cmd, capture_output=True, text=True)
            rc = proc.returncode
            status, _, effective = proc.stdout.partition("\t")
            if rc == 0 and status not in RETRY_STATUSES:
                break
            if attempt <= retries:
                time.sleep(backoff * attempt)
        if rc != 0:
            path.write_text(json.dumps({"collection_error": "transport failure",
                                        "curl_exit_code": rc}) + "\n")
        if rc != 0 or status in RETRY_STATUSES:
            self.failures.append(artifact)
        self.rows.append("\t".join([artifact, status or "000", str(rc), str(attempt), url, effective]))
        return path

    def write_log(self) -> None:
        (self.out_dir / "collection-log.tsv").write_text("\n".join(self.rows) + "\n")


def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def safe(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)


def git(*args: str) -> str | None:
    proc = subprocess.run(["git", "-C", str(SCRIPT.parent), *args], capture_output=True, text=True)
    return proc.stdout.strip() if proc.returncode == 0 else None


def collection_info(started: str) -> str:
    commit = git("rev-parse", "HEAD") or "unavailable"
    if commit == "unavailable":
        modified = "unknown"
    elif git("ls-files", "--error-unmatch", str(SCRIPT)) is None:
        modified = "untracked"
    else:
        diff = subprocess.run(["git", "-C", str(SCRIPT.parent), "diff", "--quiet", "HEAD", "--",
                               str(SCRIPT)])
        modified = "no" if diff.returncode == 0 else "yes"
    curl_version = subprocess.run(["curl", "--version"], capture_output=True, text=True)
    proxy = any(os.environ.get(v) for v in ("HTTPS_PROXY", "https_proxy", "ALL_PROXY", "all_proxy"))
    ca_bundle = any(os.environ.get(v) for v in ("CURL_CA_BUNDLE", "SSL_CERT_FILE"))
    lines = [
        f"target={TARGET}",
        f"collected_at_utc={started}",
        "collection_scope=third-party-OSINT-only-no-request-to-target",
        f"collector_sha256={hashlib.sha256(SCRIPT.read_bytes()).hexdigest()}",
        f"collector_git_commit={commit}",
        f"collector_modified_since_commit={modified}",
        f"curl_version={' '.join(curl_version.stdout.split()[:2])}",
        f"https_proxy_configured={'yes' if proxy else 'no'}",
        f"custom_ca_bundle_configured={'yes' if ca_bundle else 'no'}",
    ]
    return "\n".join(lines) + "\n"


def write_manifest(out_dir: Path) -> None:
    lines = []
    for path in sorted(p for p in out_dir.iterdir() if p.is_file() and p.name != "SHA256SUMS"):
        lines.append(f"{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.name}")
    (out_dir / "SHA256SUMS").write_text("\n".join(lines) + "\n")


def main(argv: list[str]) -> int:
    started = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    root = Path(argv[0]) if argv else Path("evidence") / f"{TARGET}-osint"
    out_dir = root / started.replace("-", "").replace(":", "")
    if out_dir.exists():
        print(f"ERROR: {out_dir} already exists; refusing to overwrite a snapshot", file=sys.stderr)
        return 2
    os.umask(0o077)
    out_dir.mkdir(parents=True)
    (out_dir / "00_collection-info.txt").write_text(collection_info(started))
    c = Collector(out_dir)

    # DNS from two independent resolvers, including records the passive collector skips.
    for resolver, template in DOH.items():
        for name, types in DNS_QUERIES.items():
            for rtype in types:
                c.fetch(f"dns-{resolver}-{safe(name)}-{rtype}.json",
                        template.format(name=name, type=rtype),
                        headers=["accept: application/dns-json"])

    addresses = set()
    for name in (TARGET, f"www.{TARGET}"):
        for rtype, code in (("A", 1), ("AAAA", 28)):
            data = load_json(out_dir / f"dns-cloudflare-{safe(name)}-{rtype}.json") or {}
            for answer in data.get("Answer", []):
                if answer.get("type") == code and re.fullmatch(r"[0-9A-Fa-f:.]+", answer.get("data", "")):
                    addresses.add(answer["data"])

    # Registry RDAP rate-limits shared egress addresses; retry with a longer backoff.
    c.fetch("rdap-registry.json", f"https://rdap.gmoregistry.net/rdap/domain/{TARGET}",
            retries=3, backoff=30)
    c.fetch("rdap-registrar.json", f"https://namerdap.systems/domain/{TARGET}")

    asns = set()
    for ip in sorted(addresses):
        tag = safe(ip)
        if ":" not in ip:
            ptr = ".".join(reversed(ip.split("."))) + ".in-addr.arpa"
            c.fetch(f"dns-cloudflare-ptr-{tag}.json", DOH["cloudflare"].format(name=ptr, type="PTR"),
                    headers=["accept: application/dns-json"])
        c.fetch(f"rdap-ip-{tag}.json", f"https://rdap.org/ip/{ip}")
        c.fetch(f"shodan-internetdb-{tag}.json", f"https://internetdb.shodan.io/{ip}")
        for call in RIPESTAT_IP_CALLS:
            path = c.fetch(f"ripestat-{call}-{tag}.json",
                           f"https://stat.ripe.net/data/{call}/data.json?resource={ip}")
            if call == "network-info":
                asns.update(str(a) for a in ((load_json(path) or {}).get("data") or {}).get("asns", []))
    for asn in sorted(asns):
        c.fetch(f"rdap-autnum-AS{asn}.json", f"https://rdap.org/autnum/{asn}")
        c.fetch(f"ripestat-as-overview-AS{asn}.json",
                f"https://stat.ripe.net/data/as-overview/data.json?resource=AS{asn}")

    # Certificate Transparency: entries for the domain and any subdomain, the full
    # certificates behind them, and certificates for other names containing "payjoy".
    cert_ids = set()
    for label, query in (("exact", TARGET), ("subdomains", f"%.{TARGET}")):
        path = c.fetch(f"ct-{label}.json", f"https://crt.sh/?q={query.replace('%', '%25')}&output=json",
                       max_time=120)
        entries = load_json(path)
        if isinstance(entries, list):
            cert_ids.update(str(e["id"]) for e in entries if "id" in e)
    for cert_id in sorted(cert_ids):
        c.fetch(f"ct-cert-{cert_id}.pem", f"https://crt.sh/?d={cert_id}")
    for pattern in LOOKALIKE_PATTERNS:
        c.fetch(f"ct-lookalike-{safe(pattern.strip('%'))}.json",
                f"https://crt.sh/?q={pattern.replace('%', '%25')}&output=json", max_time=180)

    # Reputation and archive lookups. None of these submits the URL anywhere.
    c.fetch("urlscan-search-domain.json",
            f"https://urlscan.io/api/v1/search/?q=domain:{TARGET}&size=100")
    c.fetch("urlscan-search-lookalike.json",
            "https://urlscan.io/api/v1/search/?q=page.domain:*payjoy*&size=100")
    c.fetch("wayback-availability.json", f"https://archive.org/wayback/available?url={TARGET}")
    c.fetch("wayback-cdx.json",
            f"https://web.archive.org/cdx/search/cdx?url={TARGET}&matchType=domain&output=json&limit=1000")
    c.fetch("google-safebrowsing-status.txt",
            "https://transparencyreport.google.com/transparencyreport/api/v3/safebrowsing/status"
            f"?site={TARGET}")
    c.fetch("openphish-feed.txt", "https://openphish.com/feed.txt")
    c.fetch("urlhaus-host.json", "https://urlhaus-api.abuse.ch/v1/host/", data=f"host={TARGET}")

    c.write_log()
    write_manifest(out_dir)
    print(f"Evidence written to {out_dir}")
    if c.failures:
        print(f"WARNING: {len(c.failures)} request(s) failed: {', '.join(c.failures)} "
              "(see collection-log.tsv)", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
