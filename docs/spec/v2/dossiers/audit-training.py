"""Audit of the training data in a lifeos export (dossiers/training.md §2).
Run: python3 -I audit-training.py <refined export .json>. Prints counts only;
never send the export anywhere."""
import json, statistics as st, sys
from collections import defaultdict, Counter
from datetime import datetime
d=json.load(open(sys.argv[1])); t=d['tables']
ses={s['id']:s for s in t['training_sessions'] if not s['deletedAt']}
done={k:s for k,s in ses.items() if s['status']=='done'}
ex={e['id']:e for e in t['exercises']}
se={x['id']:x for x in t['session_exercises'] if x['sessionId'] in done}
sets=[s for s in t['sets'] if s['sessionExerciseId'] in se]
days=sorted(s['day'] for s in done.values())
print("sessions done",len(done),"of",len(ses),"from",days[0],"to",days[-1])
dur=[s['durationMin'] for s in done.values() if s['durationMin']]
print("duration min median",st.median(dur) if dur else None, "range",min(dur),max(dur), "n",len(dur))
print("sets",len(sets),"warmup",sum(1 for s in sets if s['warmup']),"done",sum(1 for s in sets if s['done']))
work=[s for s in sets if not s['warmup']]
print("work sets with rir",sum(1 for s in work if s['rir'] is not None),"/",len(work), Counter(s['rir'] for s in work if s['rir'] is not None))
print("with startedAt",sum(1 for s in sets if s['startedAt']),"endedAt",sum(1 for s in sets if s['endedAt']),"restS",sum(1 for s in sets if s['restS'] is not None),"loadApprox",sum(1 for s in sets if s['loadApprox']),"loadText",sum(1 for s in sets if s['loadText']))
print("session_exercises restS set",sum(1 for x in se.values() if x['restS'] is not None),"/",len(se))
# timing
P=lambda x: datetime.fromisoformat(x.replace('Z','+00:00'))
by=defaultdict(list)
for s in sets: by[s['sessionExerciseId']].append(s)
spr=[];rests=[];restsU=[];restsW=[]
for k,ss in by.items():
    ss.sort(key=lambda s:s['position'])
    uni=ex[se[k]['exerciseId']]['unilateral']
    for s in ss:
        if s['startedAt'] and s['endedAt'] and s['reps']:
            sec=(P(s['endedAt'])-P(s['startedAt'])).total_seconds()
            if 0<sec<600: spr.append(sec/s['reps'])
    for a,b in zip(ss,ss[1:]):
        if a['endedAt'] and b['startedAt']:
            r=(P(b['startedAt'])-P(a['endedAt'])).total_seconds()
            if 0<=r<1200: (restsW if a['warmup'] else restsU if uni else rests).append(r)
q=lambda xs: (len(xs), round(st.median(xs),1), [round(x) for x in st.quantiles(xs,n=4)]) if len(xs)>3 else len(xs)
print("sec per rep",q(spr)); print("rest work bilateral",q(rests)); print("rest unilateral ex",q(restsU)); print("rest after warmup",q(restsW))
# per exercise e1rm series
def e1(r,kg,rir): 
    if not r or not kg or r>12: return None
    return kg*(1+(r+(rir or 0))/30)
series=defaultdict(list)
pos=defaultdict(list)
drop=[]
for k,ss in by.items():
    s0=done[se[k]['sessionId']]
    w=[s for s in ss if not s['warmup'] and s['reps'] and s['loadKg']]
    vals=[e1(s['reps'],float(s['loadKg']),s['rir']) for s in w]
    vals=[v for v in vals if v]
    if vals: series[se[k]['exerciseId']].append((s0['day'],max(vals),se[k]['position']))
    # reps drop at same load across sets
    if len(w)>=3 and len({s['loadKg'] for s in w})==1:
        drop.append((w[-1]['reps']-w[0]['reps']))
print("same-load exercises with >=3 sets:",len(drop),"reps last-first median",st.median(drop) if drop else None, Counter(drop).most_common(6))
chg=[]
for exid,pts in series.items():
    pts.sort()
    for a,b in zip(pts,pts[1:]): chg.append((b[1]-a[1])/a[1]*100)
print("exercises with e1rm",len(series),"with >=4 sessions",sum(1 for p in series.values() if len(p)>=4))
print("session-to-session e1rm change % : median",round(st.median(chg),1),"IQR",[round(x,1) for x in st.quantiles(chg,n=4)],"sd",round(st.pstdev(chg),1))
top=sorted(series.items(),key=lambda kv:-len(kv[1]))[:8]
for exid,pts in top:
    e=ex[exid]; print(" ",e['name'][:28].ljust(28),e['pattern'],"uni" if e['unilateral'] else "","n",len(pts),"e1rm",[round(p[1]) for p in pts][-8:],"pos",[p[2] for p in pts][-8:])
# exercises per session, sets per session
spe=Counter(x['sessionId'] for x in se.values())
print("exercises/session median",st.median(spe.values()))
wps=Counter(se[s['sessionExerciseId']]['sessionId'] for s in work)
print("working sets/session median",st.median(wps.values()), "range",min(wps.values()),max(wps.values()))
pat=Counter(ex[x['exerciseId']]['pattern'] for x in se.values()); print("patterns used",pat.most_common(25))
print("unilateral exercises used",sum(1 for x in se.values() if ex[x['exerciseId']]['unilateral']))
print("checkins",len(t['day_checkins']),"body",len(t['body_measurements']),"activity",len(t['day_activity']))
lab=Counter(s['label'] for s in done.values()); print("labels",lab.most_common(10))
print("intensity",Counter(s['intensity'] for s in done.values()))
print("=== extra")
# transitions between exercises within timed sessions
trans=[]; pred=[]
for sid,s in done.items():
    exs=sorted([x for x in se.values() if x['sessionId']==sid],key=lambda x:x['position'])
    ss=[sorted(by.get(x['id'],[]),key=lambda q:q['position']) for x in exs]
    for a,b in zip(ss,ss[1:]):
        if a and b and a[-1]['endedAt'] and b[0]['startedAt']:
            r=(P(b[0]['startedAt'])-P(a[-1]['endedAt'])).total_seconds()
            if 0<=r<1800: trans.append(r)
    # naive prediction: sets*(reps*4.2) + rests 78 between sets + 57 after warmup + transitions 
    n=sum(len(x) for x in ss)
    if not n or not s['durationMin']: continue
    t_sets=sum((q['reps'] or 0)*4.2 if q['reps'] else (q['durationS'] or 0) for x in ss for q in x)
    t_rest=sum(78 for x in ss for q in x[1:])
    pred.append((s['day'],s['durationMin'],round((t_sets+t_rest+ (len(ss)-1)*150)/60)))
print("transitions",q(trans))
print("pred vs actual (day,actual,pred) sample",pred[-10:])
err=[(p-a)/a*100 for _,a,p in pred if a>=30]
print("pred error % median",round(st.median(err)),"IQR",[round(x) for x in st.quantiles(err,n=4)])
for exid,pts in series.items():
    if ex[exid]['name'].startswith(('Lat pulldown','Machine chest')): print(ex[exid]['name'],[(p[0],round(p[1],1),p[2]) for p in sorted(pts)])
