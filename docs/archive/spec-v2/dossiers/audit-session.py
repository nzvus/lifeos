"""Audit for session.md: warm-ups by position, ramp %, rests, transitions, duration. Usage: python3 -I audit-session.py <v2 export.json>"""
import json,sys,collections as C,statistics as S
from datetime import datetime as D
d=json.load(open(sys.argv[1]))['tables']
E=[e for e in d['entries'] if not e['deletedAt']]
items={i['id']:i for i in d['catalog_items']}
cv=C.defaultdict(dict)
for v in d['catalog_values']: cv[v['itemId']][v['field']]=v.get('num') or v.get('text')
sets=C.defaultdict(list)
for s in d['training_sets']: sets[s['entryId']].append(s)
vals=C.defaultdict(dict)
for v in d['entry_values']: vals[v['entryId']][v['field']]=v['num']
kids=C.defaultdict(list)
for e in E:
    if e['parentId']: kids[e['parentId']].append(e)
T=lambda x:D.fromisoformat(x.replace('Z','+00:00')) if x else None
sess=[e for e in E if e['kind']=='session' and e['status']=='done']
print('done sessions',len(sess),'with routine',sum(1 for s in sess if s['itemId']))
nm=lambda i: items.get(i,{}).get('name','?')
print('exercise fields sample', list(cv[next(iter(k['itemId'] for k in E if k['kind']=='session_exercise'))].items())[:20])
# warmups
wu=[];firstpos=C.Counter();wr=[];perc=[];wrest=[]
posord=[]; trans=[]; dur=[]
for s in sess:
    ex=[k for k in kids[s['id']] if sets[k['id']]]
    # done order by first set time
    def first(k):
        ts=[T(x['startedAt'] or x['endedAt']) for x in sets[k['id']] if (x['startedAt'] or x['endedAt'])]
        return min(ts) if ts else None
    timed=[k for k in ex if first(k)]
    timed.sort(key=first)
    pos={k['id']:int(float(vals[k['id']].get('position') or 0)) for k in ex}
    if timed and all(vals[k['id']].get('position') is not None for k in timed):
        planned=sorted(timed,key=lambda k:pos[k['id']])
        posord.append(sum(1 for a,b in zip(timed,planned) if a['id']!=b['id'])/len(timed))
    for i,k in enumerate(timed):
        ss=sorted(sets[k['id']],key=lambda x:x['position'])
        w=[x for x in ss if x['warmup']]; work=[x for x in ss if not x['warmup']]
        if w:
            wu.append((i,len(w)))
            if work and work[0]['loadKg']:
                L=float(work[0]['loadKg'])
                perc.append([round(float(x['loadKg'] or 0)/L*100) for x in w])
            # rest after warmups
            for a,b in zip(ss,ss[1:]):
                if a['warmup'] and a['endedAt'] and b['startedAt']:
                    r=(T(b['startedAt'])-T(a['endedAt'])).total_seconds()
                    if 0<r<600: wrest.append(r)
        else: wu.append((i,0))
    for a,b in zip(timed,timed[1:]):
        la=max((T(x['endedAt']) for x in sets[a['id']] if x['endedAt']),default=None)
        fb=first(b)
        if la and fb:
            r=(fb-la).total_seconds()
            if 0<r<900: trans.append(r)
    if vals[s['id']].get('durationMin'): dur.append(float(vals[s['id']]['durationMin']))
pos_w=C.defaultdict(list)
for i,n in wu: pos_w[min(i,3)].append(n>0)
print('share of exercises with warm-up by position (0,1,2,3+):',{k:f"{sum(v)}/{len(v)}" for k,v in sorted(pos_w.items())})
print('warm-up sets per exercise when present', C.Counter(n for i,n in wu if n))
print('warm-up % of first work load (samples)', perc[:15], 'n',len(perc))
flat=[p for l in perc for p in l]; 
if flat: print('warmup % quartiles', S.quantiles(flat,n=4))
if wrest: print('rest after warmup sets median',S.median(wrest),'IQR',S.quantiles(wrest,n=4),'n',len(wrest))
print('done order differs from planned: share of positions mean', round(S.mean(posord),2) if posord else None, 'sessions',len(posord), 'sessions with any change', sum(1 for x in posord if x>0))
print('transition median',S.median(trans),'n',len(trans))
print('duration min median',S.median(dur),'quartiles',S.quantiles(dur,n=4))
# planned vs done exercises per session (routine)
skip=[sum(1 for k in kids[s['id']] if not sets[k['id']]) for s in sess]
print('exercises with no sets per done session', C.Counter(skip))
# rests between work sets
wr=[]
for k in [e for e in E if e['kind']=='session_exercise']:
    ss=[x for x in sorted(sets[k['id']],key=lambda x:x['position']) if not x['warmup']]
    for a,b in zip(ss,ss[1:]):
        if a['endedAt'] and b['startedAt']:
            r=(T(b['startedAt'])-T(a['endedAt'])).total_seconds()
            if 0<r<600: wr.append(r)
print('work rest median',S.median(wr),'IQR',S.quantiles(wr,n=4),'n',len(wr))
# untimed sets share recent
rec=[x for x in d['training_sets'] if (x['endedAt'] or '')>='2026-10-01']
print('sets since 1 Oct',len(rec),'without start',sum(1 for x in rec if not x['startedAt']),'rir set',sum(1 for x in rec if x['rir'] is not None))
