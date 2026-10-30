"""Audit for sleep.md: every sleep and nap piece, its local times and length, days with more than one piece.
Usage: python3 -I audit-sleep.py <v2 export.json>"""
import json,sys,collections as C
from datetime import datetime as D
from zoneinfo import ZoneInfo
R=ZoneInfo('Europe/Rome')
d=json.load(open(sys.argv[1]))["tables"]
T=lambda x: D.fromisoformat(x.replace("Z","+00:00")).astimezone(R)
vals=C.defaultdict(dict)
for v in d["entry_values"]: vals[v["entryId"]][v["field"]]=v["num"] if v["num"] is not None else v["text"]
E=[e for e in d["entries"] if e["kind"] in("sleep","nap")]
print("sleep/nap entries",len(E),C.Counter((e["kind"],bool(e["deletedAt"]),e["status"]) for e in E))
byday=C.defaultdict(list)
for e in sorted(E,key=lambda e:e["startAt"] or ""):
    if e["deletedAt"] or not e["startAt"] or not e["endAt"]: continue
    s,w=T(e["startAt"]),T(e["endAt"]); h=(w-s).total_seconds()/3600
    byday[e["day"]].append(e)
    print(e["day"],e["kind"],e["status"],s.strftime('%a %d %H:%M'),'→',w.strftime('%H:%M'),f'{h:4.2f}h',vals[e["id"]], 'created',T(e["createdAt"]).strftime('%d %H:%M'))
print("days with >1 piece:",{k:[x["kind"] for x in v] for k,v in byday.items() if len(v)>1})
