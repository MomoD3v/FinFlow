#!/usr/bin/env python3
"""Read an ODS budget and create a PRIVATE FinFlow v2 backup. Never commit output.
Usage: python scripts/convert-budget-ods.py INPUT.ods /private/path/import.json
No network, no third-party dependencies. Reads saved cell values, not recalculation.
"""
import argparse,json,zipfile,xml.etree.ElementTree as ET
from decimal import Decimal,ROUND_HALF_UP
from datetime import date,timedelta
p=argparse.ArgumentParser();p.add_argument('input');p.add_argument('output');p.add_argument('--months',nargs='+',default=['2026-09','2026-10']);args=p.parse_args()
ns={k:'urn:oasis:names:tc:opendocument:xmlns:'+v+':1.0' for k,v in [('t','table'),('o','office'),('x','text')]}
def attr(e,k,v):return e.get('{'+ns[k]+'}'+v)
root=ET.fromstring(zipfile.ZipFile(args.input).read('content.xml'));sheets={}
for table in root.findall('.//o:spreadsheet/t:table',ns):
 rows={};ri=1
 for row in table.findall('t:table-row',ns):
  cells={};ci=1
  for cell in row:
   txt=' '.join(''.join(x.itertext()) for x in cell.findall('x:p',ns)).strip()
   cells[ci]={'text':txt,'value':attr(cell,'o','value'),'date':attr(cell,'o','date-value'),'formula':attr(cell,'t','formula')}
   ci+=int(attr(cell,'t','number-columns-repeated') or 1)
  rows[ri]=cells;ri+=int(attr(row,'t','number-rows-repeated') or 1)
 sheets[attr(table,'t','name')]=rows
empty={'text':'','value':None,'date':None}
def cell(sheet,r,c):return sheets.get(sheet,{}).get(r,{}).get(c,empty)
def text(sheet,r,c):return cell(sheet,r,c)['text']
def num(sheet,r,c):return Decimal(cell(sheet,r,c)['value'] or '0')
def money(sheet,r,c):return int((num(sheet,r,c)*100).quantize(Decimal(1),rounding=ROUND_HALF_UP))
def day(sheet,r,c):
 x=cell(sheet,r,c)
 if x.get('date'):return x['date'][:10]
 if x.get('value'):return (date(1899,12,30)+timedelta(days=float(x['value']))).isoformat()
 return None
def month(sheet,r,c):return (day(sheet,r,c) or '')[:7]
state=dict(version=2,accounts=[],transactions=[],recurring=[],commitments=[],goals=[],snapshots=[],plans=[],batches=[],ignored=[],rules=[],settings={'theme':'light','month':args.months[-1],'buffer':None,'lastExport':None})
lookup={}
for r in range(5,85):
 if not text('Patrimoine',r,1):continue
 inst=text('Patrimoine',r,4);kind='debt' if text('Patrimoine',r,1)=='Passif' else {'Compte courant':'current','Livret / cash':'savings'}.get(text('Patrimoine',r,2),'investment')
 account={'id':f'ods-account-{r}','name':text('Patrimoine',r,3),'institution':inst,'kind':kind,'balance':money('Patrimoine',r,5),'asOf':day('Patrimoine',r,6),'currency':'EUR'}
 state['accounts'].append(account)
 if kind=='current':
  if 'postale' in inst.lower():lookup['Compte courant principal']=account['id']
  if 'bourso' in inst.lower():lookup['Compte courant secondaire']=account['id']
  if 'revolut' in inst.lower():lookup['Néobanque / carte']=account['id']
 lookup[account['name']]=account['id']
def account(name):
 if name not in lookup:
  lookup[name]=f'ods-account-extra-{len(lookup)}';state['accounts'].append(dict(id=lookup[name],name=name or 'Compte à préciser',institution='',kind='current',balance=0,asOf=None,currency='EUR'))
 return lookup[name]
for r in range(5,305):
 d=day('Transactions',r,1)
 if not d:continue
 bm=month('Transactions',r,15)
 if bm not in args.months and d[:7] not in args.months:continue
 flow=text('Transactions',r,4);amount=money('Transactions',r,7)*(1 if text('Transactions',r,3)=='Entrée' else -1)
 kind='transfer' if flow=='Transfert interne' else 'saving' if flow=='Épargne' else 'investment' if flow=='Investissement' else 'refund' if flow.startswith('Remboursement') else 'income' if amount>=0 else 'expense'
 state['transactions'].append(dict(id=f'ods-tx-{r}',date=d,description=text('Transactions',r,2),amount=amount,accountId=account(text('Transactions',r,8)),kind=kind,category=text('Transactions',r,5),budgetMonth=bm or d[:7],status='booked',notes=text('Transactions',r,13),source='Tableur initial',sourceKey=f'ods-initial-row-{r}'))
for r in range(5,105):
 if not text('Charges fixes',r,1):continue
 end=month('Charges fixes',r,4)
 state['recurring'].append(dict(id=f'ods-fixed-{r}',name=text('Charges fixes',r,1),amount=money('Charges fixes',r,2),accountId=account(text('Charges fixes',r,6)),day=int(num('Charges fixes',r,5)) or 1,start=month('Charges fixes',r,8),end=end or None,category='Charges fixes'))
for sheet,typ in [('Crédits','credit'),('Fiscalité','tax')]:
 for r in range(5,55):
  if not text(sheet,r,1):continue
  count=int(num(sheet,r,6));d=day(sheet,r,5)
  if not count or not d:continue
  state['commitments'].append(dict(id=f'ods-{typ}-{r}',name=text(sheet,r,1),type=typ,amount=money(sheet,r,4),firstDate=d,count=count,paid=int(num(sheet,r,7)) if typ=='credit' else 0,direction='in' if text(sheet,r,3)=='Entrée' else 'out',accountId='',notes=text(sheet,r,13 if typ=='credit' else 10)))
for r in range(5,55):
 if not text('Projets & cagnottes',r,1):continue
 state['goals'].append(dict(id=f'ods-goal-{r}',name=text('Projets & cagnottes',r,1),target=money('Projets & cagnottes',r,3),current=money('Projets & cagnottes',r,4),targetDate=day('Projets & cagnottes',r,5),monthly=money('Projets & cagnottes',r,9),active=text('Projets & cagnottes',r,10)=='Actif'))
for r in range(5,65):
 d=day('Historique patrimoine',r,1)
 if not d:continue
 state['snapshots'].append(dict(id=f'ods-snapshot-{r}',date=d,assets=money('Historique patrimoine',r,2),otherDebts=money('Historique patrimoine',r,3),creditDebt=money('Historique patrimoine',r,4),checking=money('Historique patrimoine',r,6),buffer=money('Historique patrimoine',r,7) if cell('Historique patrimoine',r,7)['value'] else None))
for r in range(5,65):
 m=month('Prévisions mensuelles',r,1)
 if m not in args.months:continue
 cats={}
 for c in range(9,18):
  name=text('Prévisions mensuelles',4,c).replace(' (auto)','')
  value=cell('Prévisions mensuelles',r,c)
  # Keep scheduled categories automatic; the actual recurring/credit schedules own those values.
  cats[name]=None if c in (9,13) or not value.get('value') else money('Prévisions mensuelles',r,c)
 state['plans'].append(dict(month=m,income=money('Prévisions mensuelles',r,2)+money('Prévisions mensuelles',r,3) if cell('Prévisions mensuelles',r,2)['value'] else None,exceptional=sum(money('Prévisions mensuelles',r,c) for c in [4,5,8]),refundTax=money('Prévisions mensuelles',r,7),categories=cats,fixedAdjustment=money('Prévisions mensuelles',r,18)))
if num('Patrimoine',11,11):state['settings']['buffer']=money('Patrimoine',11,11)
checks={'month':month('Budget mensuel',2,2),'plannedIn':money('Budget mensuel',12,2),'plannedOut':money('Budget mensuel',24,2),'balance':money('Budget mensuel',30,2),'netWorth':money('Patrimoine',8,11)}
with open(args.output,'w') as out:json.dump({'format':'finflow-backup','version':2,'source':'ODS — valeurs sauvegardées','checks':checks,'state':state},out,ensure_ascii=False,indent=2)
print(json.dumps({k:len(v) for k,v in state.items() if isinstance(v,list)}))
