#!/usr/bin/env python3
"""Extract comparable indicators from passive evidence snapshots.

With one snapshot directory, print its indicators. With two (older first), print only
the indicators whose values differ, so repeated collections can be compared without
reading raw JSON; SHA256SUMS always differs between runs because responses carry
timestamps. Reads local files only and makes no network requests.

Exit status: 0 when a single snapshot is printed or two snapshots match, 1 when two
snapshots differ, 2 on usage errors.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

DNS_TYPES = {1: "A", 2: "NS", 5: "CNAME", 6: "SOA", 15: "MX", 16: "TXT", 28: "AAAA"}
DNS_RCODES = {0: "NOERROR", 1: "FORMERR", 2: "SERVFAIL", 3: "NXDOMAIN", 5: "REFUSED"}
DNS_FILES = [
    ("dns-apex-A.json", "A"),
    ("dns-apex-AAAA.json", "AAAA"),
    ("dns-apex-NS.json", "NS"),
    ("dns-apex-MX.json", "MX"),
    ("dns-apex-TXT.json", "TXT"),
    ("dns-apex-SOA.json", "SOA"),
    ("dns-www-A.json", "A"),
    ("dns-www-AAAA.json", "AAAA"),
    ("dns-www-CNAME.json", "CNAME"),
    ("dns-lovable-verification-TXT.json", "TXT"),
]
RDAP_EVENTS = ("registration", "last changed", "expiration")
HTTP_HEADERS = ("server", "location", "content-type", "x-deployment-id")
NOT_COLLECTED = "(not collected)"
ABSENT = "(absent)"


def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return None
    except (json.JSONDecodeError, UnicodeDecodeError):
        return {"collection_error": "response is not JSON"}


def error_text(data) -> str | None:
    if isinstance(data, dict) and "collection_error" in data:
        return f"(collection error: {data['collection_error']})"
    return None


def dns_value(data, qtype: str) -> str:
    if data is None:
        return NOT_COLLECTED
    if error_text(data):
        return error_text(data)
    rcode = data.get("Status")
    if rcode != 0:
        return DNS_RCODES.get(rcode, f"rcode {rcode}")
    answers = sorted(
        str(a.get("data"))
        for a in data.get("Answer", [])
        if DNS_TYPES.get(a.get("type")) == qtype
    )
    return ", ".join(answers) if answers else "(no records)"


def vcard_values(entity: dict, field: str) -> list[str]:
    card = entity.get("vcardArray")
    if not isinstance(card, list) or len(card) < 2:
        return []
    values = []
    for prop in card[1]:
        if isinstance(prop, list) and len(prop) >= 4 and prop[0] == field:
            value = prop[3]
            values.append(value if isinstance(value, str) else json.dumps(value))
    return values


def walk_entities(entities):
    for entity in entities or []:
        yield entity
        yield from walk_entities(entity.get("entities"))


def contacts_for_role(data: dict, role: str) -> str | None:
    found = []
    for entity in walk_entities(data.get("entities")):
        if role in entity.get("roles", []):
            parts = [
                value
                for field in ("fn", "org", "email", "tel")
                for value in vcard_values(entity, field)
                if value.strip()
            ]
            found.append("; ".join(dict.fromkeys(parts)))
    found = sorted({f for f in found if f})
    return " | ".join(found) if found else None


def rdap_error(data) -> str | None:
    if data is None:
        return NOT_COLLECTED
    if error_text(data):
        return error_text(data)
    if "errorCode" in data:
        return f"(RDAP error {data.get('errorCode')}: {data.get('title', '')})"
    return None


def rdap_domain(data, prefix: str, out: dict) -> None:
    err = rdap_error(data)
    if err:
        out[f"{prefix}.response"] = err
        return
    out[f"{prefix}.status"] = ", ".join(sorted(data.get("status", []))) or "(none)"
    for event in data.get("events", []):
        action = event.get("eventAction")
        if action in RDAP_EVENTS:
            out[f"{prefix}.event.{action}"] = str(event.get("eventDate"))
    nameservers = sorted(n.get("ldhName", "").lower() for n in data.get("nameservers", []))
    if nameservers:
        out[f"{prefix}.nameservers"] = ", ".join(nameservers)
    for role in ("registrar", "registrant", "abuse"):
        contact = contacts_for_role(data, role)
        if contact:
            out[f"{prefix}.{role}"] = contact


def rdap_ip(path: Path, out: dict) -> None:
    ip = path.name[len("rdap-ip-"):-len(".json")].replace("_", ":")
    prefix = f"rdap.ip.{ip}"
    data = load_json(path)
    err = rdap_error(data)
    if err:
        out[f"{prefix}.response"] = err
        return
    out[f"{prefix}.network"] = (
        f"{data.get('name', '?')} ({data.get('handle', '?')}) "
        f"{data.get('startAddress', '?')} .. {data.get('endAddress', '?')}"
    )
    if data.get("country"):
        out[f"{prefix}.country"] = data["country"]
    for role in ("registrant", "abuse"):
        contact = contacts_for_role(data, role)
        if contact:
            out[f"{prefix}.{role}"] = contact


def ct_entries(snapshot: Path, out: dict) -> None:
    certificates = {}
    for label in ("apex", "www"):
        data = load_json(snapshot / f"ct-{label}.json")
        if data is None:
            out[f"ct.{label}.response"] = NOT_COLLECTED
            continue
        if not isinstance(data, list):
            out[f"ct.{label}.response"] = error_text(data) or "(unexpected response)"
            continue
        out[f"ct.{label}.response"] = f"ok ({len(data)} log entries)"
        for entry in data:
            issuer = str(entry.get("issuer_name", "?")).rsplit("CN=", 1)[-1]
            key = f"ct.cert.{issuer}:{entry.get('serial_number', '?')}"
            names = ", ".join(sorted(set(str(entry.get("name_value", "")).split("\n"))))
            certificates[key] = (
                f"{names}; valid {entry.get('not_before')} .. {entry.get('not_after')}"
            )
    out.update(certificates)


def http_indicators(path: Path, out: dict) -> None:
    if not path.exists():
        out["http.status"] = NOT_COLLECTED
        return
    blocks = [
        block.splitlines()
        for block in path.read_text(encoding="utf-8").replace("\r", "").split("\n\n")
        if block.strip().startswith("HTTP/")
    ]
    if not blocks:
        out["http.status"] = "(no response)"
        return
    # Without redirect following, the final block is the target's response. Earlier
    # blocks are interim replies such as an egress proxy's CONNECT answer.
    *preceding, final = blocks
    if preceding:
        out["http.preceding_blocks"] = " | ".join(b[0] for b in preceding)
    out["http.status"] = final[0]
    for line in final[1:]:
        name, _, value = line.partition(":")
        if name.lower() in HTTP_HEADERS:
            out[f"http.{name.lower()}"] = value.strip()


def collection_info(snapshot: Path) -> dict:
    info = {}
    path = snapshot / "00_collection-info.txt"
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            key, sep, value = line.partition("=")
            if sep:
                info[key] = value
    failed = []
    log = snapshot / "collection-log.tsv"
    if log.exists():
        rows = log.read_text(encoding="utf-8").splitlines()[1:]
        for row in rows:
            cols = row.split("\t")
            if len(cols) >= 3 and (cols[2] != "0" or cols[1] == "429" or cols[1].startswith("5")):
                failed.append(f"{cols[0]} (HTTP {cols[1]}, curl exit {cols[2]})")
    info["failed_requests"] = ", ".join(failed) if log.exists() and failed else (
        "none" if log.exists() else "(no collection-log.tsv)"
    )
    return info


def indicators(snapshot: Path) -> dict:
    out: dict = {}
    for filename, qtype in DNS_FILES:
        name = filename[len("dns-"):-len(".json")]
        out[f"dns.{name}"] = dns_value(load_json(snapshot / filename), qtype)
    rdap_domain(load_json(snapshot / "rdap-registrar.json"), "rdap.registrar", out)
    rdap_domain(load_json(snapshot / "rdap-registry.json"), "rdap.registry", out)
    for path in sorted(snapshot.glob("rdap-ip-*.json")):
        rdap_ip(path, out)
    ct_entries(snapshot, out)
    http_indicators(snapshot / "http-headers.txt", out)
    return out


def cell(value: str) -> str:
    return value.replace("|", "\\|")


def describe(snapshot: Path, info: dict) -> str:
    fields = [f"{k}={v}" for k, v in info.items()]
    return f"`{snapshot}`: " + "; ".join(fields)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("snapshots", nargs="+", type=Path, metavar="SNAPSHOT_DIR")
    args = parser.parse_args(argv)
    if len(args.snapshots) > 2:
        parser.error("pass one snapshot, or two snapshots with the older first")
    for snapshot in args.snapshots:
        if not snapshot.is_dir():
            parser.error(f"{snapshot} is not a directory")

    if len(args.snapshots) == 1:
        snapshot = args.snapshots[0]
        print(describe(snapshot, collection_info(snapshot)))
        print()
        print("| Indicator | Value |")
        print("| --- | --- |")
        for key, value in indicators(snapshot).items():
            print(f"| `{key}` | {cell(value)} |")
        return 0

    older, newer = args.snapshots
    old, new = indicators(older), indicators(newer)
    print("Older: " + describe(older, collection_info(older)))
    print("Newer: " + describe(newer, collection_info(newer)))
    print()
    keys = list(old) + [k for k in new if k not in old]
    changed = [k for k in keys if old.get(k, ABSENT) != new.get(k, ABSENT)]
    if not changed:
        print("No indicator changed.")
        return 0
    print("| Indicator | Older | Newer |")
    print("| --- | --- | --- |")
    for key in changed:
        print(f"| `{key}` | {cell(old.get(key, ABSENT))} | {cell(new.get(key, ABSENT))} |")
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
