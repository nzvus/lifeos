"""Audit for capture.md: what is logged from 26 Oct (v2 in daily use), how late,
doubles, meals without a role, deleted-and-redone entries.
Usage: python3 -I audit-capture.py <v2 export.json> [since=2026-10-26]"""
import json, sys, collections as C, statistics as S
from datetime import datetime as D

d = json.load(open(sys.argv[1]))["tables"]
since = sys.argv[2] if len(sys.argv) > 2 else "2026-10-26"
T = lambda x: D.fromisoformat(x.replace("Z", "+00:00"))
vals = C.defaultdict(dict)
for v in d["entry_values"]:
    vals[v["entryId"]][v["field"]] = v["num"] if v["num"] is not None else v["text"]
E = [e for e in d["entries"] if e["createdAt"] >= since and not e["parentId"]]
live = [e for e in E if not e["deletedAt"]]
print("entries", len(E), "deleted", len(E) - len(live))
print("by kind", C.Counter(e["kind"] for e in live))
print("deleted by kind", C.Counter(e["kind"] for e in E if e["deletedAt"]))
lag = [(T(e["createdAt"]) - T(e["startAt"])).total_seconds() / 60 for e in live if e["startAt"] and e["status"] == "done"]
print("minutes between the fact and its logging: median", round(S.median(lag)), "quartiles", [round(q) for q in S.quantiles(lag, n=4)], "over 60 min", sum(1 for x in lag if x > 60), "of", len(lag))
print("no time", C.Counter(e["kind"] for e in live if not e["startAt"]))
meals = [e for e in live if e["kind"] == "meal" and e["status"] == "done"]
print("meals", len(meals), "without role", sum(1 for e in meals if not vals[e["id"]].get("role")))
same = C.defaultdict(list)
for e in live:
    same[(e["kind"], e["day"], str(sorted(vals[e["id"]].items())))].append(T(e["createdAt"]))
dbl = 0
for k, ts in same.items():
    ts.sort()
    dbl += sum(1 for a, b in zip(ts, ts[1:]) if (b - a).total_seconds() < 10)
print("identical entries created < 10 s apart", dbl)
