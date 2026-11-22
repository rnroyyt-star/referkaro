// Admin controls: target tracker, manual reward give/revoke, auto-credit, weekly targets,
// per-user target override, wallet freeze, withdrawal hold, audit log.
const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path'),{spawn}=require('child_process'),net=require('net');
(async()=>{
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rk-admin-'));
const port=await new Promise((r,j)=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))});s.on('error',j)});
const base=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['server.js'],{cwd:__dirname,env:{...process.env,PORT:String(port),APP_URL:base,DATA_FILE:path.join(dir,'data.json'),ADMIN_EMAIL:'admin@example.test',ADMIN_PASSWORD:'AdminPass123',NODE_ENV:'test',REQUIRE_PERSISTENT_STORAGE:'false'},stdio:['ignore','pipe','pipe']});
let logs='';child.stdout.on('data',x=>logs+=x);child.stderr.on('data',x=>logs+=x);
try{
for(let i=0;i<80;i++){if(child.exitCode!==null)throw Error(logs);try{if((await fetch(base+'/health')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
const post=(route,b,c)=>fetch(base+'/api/'+route,{method:'POST',headers:{'content-type':'application/json',...(c?{cookie:c}:{})},body:JSON.stringify(b)});
const get=async c=>(await fetch(base+'/api/state',{headers:{cookie:c}})).json();
const ok=async(route,b,c)=>{const r=await post(route,b,c);assert.equal(r.status,200,route+' '+await r.clone().text());return r.json()};
const code=async(route,b,c,want)=>{const r=await post(route,b,c);assert.equal(r.status,want,route+' expected '+want+' got '+r.status+' '+await r.clone().text());return r};
let r=await post('login',{email:'admin@example.test',password:'AdminPass123'});assert.equal(r.status,200);const ac=r.headers.get('set-cookie').split(';')[0];
const adminRef=(await get(ac)).me.ref;
const reg=async(name,email,phone,ref)=>{const rr=await post('register',{name,email,phone,password:'StrongPass123',ref});assert.equal(rr.status,200,await rr.text());return rr.headers.get('set-cookie').split(';')[0]};
await ok('admin/business-config',{price:300,fee:0,minWd:1,minDirectRefs:0,minUnlockRefs:0,withdrawalDay:'any'},ac);

// ---- targets: daily + weekly ----
await ok('admin/daily-targets',{targets:[{id:'d1',target:1,amount:30,period:'daily',active:true},{id:'w1',target:1,amount:100,period:'weekly',active:true}]},ac);
const refC=await reg('Referrer','ref@example.test','9876500001',adminRef);let me=(await get(refC)).me;const refId=me.id,refCode=me.ref;
const invC=await reg('Invitee','inv@example.test','9876500002',refCode);const invId=(await get(invC)).me.id;
const noneC=await reg('Pending Ref','pend@example.test','9876500003',refCode); // registered, never verified
await ok('admin/user',{id:invId,action:'verify'},ac);
me=(await get(refC)).me;
assert.equal(me.dailyReferral.count,1);assert.equal(me.dailyReferral.targets.length,2);
assert.deepEqual(me.dailyReferral.targets.map(t=>t.period),['daily','weekly']);
assert(me.dailyReferral.targets.every(t=>t.completed&&!t.claimed),'both periods complete, nothing claimed');

// ---- admin Target Tracker ----
let adm=await get(ac);const row=adm.db.targetTracker.rows.find(x=>x.id===refId);
assert(row,'referrer visible in tracker');assert.equal(row.count,1);assert.equal(row.unverified,1,'unverified referral is counted separately');
assert(row.targets.every(t=>t.completed&&!t.claimed));

// ---- manual give / revoke ----
await code('admin/target-reward',{uid:refId,targetId:'d1',action:'give'},ac,400); // reason required
await ok('admin/target-reward',{uid:refId,targetId:'d1',action:'give',reason:'dispute fix'},ac);
await code('admin/target-reward',{uid:refId,targetId:'d1',action:'give',reason:'again'},ac,409);
assert.equal((await get(refC)).me.wallet.balance,30);
await code('daily-referral/claim',{targetId:'d1'},refC,409);
let rv=await ok('admin/target-reward',{uid:refId,targetId:'d1',action:'revoke',reason:'wrong claim'},ac);
assert.equal(rv.balance,0);assert.equal(rv.frozen,false);
me=(await get(refC)).me;assert.equal(me.wallet.balance,0);assert.equal(me.dailyReferral.targets[0].revoked,true);
await code('daily-referral/claim',{targetId:'d1'},refC,409); // revoked reward cannot be re-claimed
await code('admin/target-reward',{uid:refId,targetId:'d1',action:'revoke',reason:'x'},ac,404);
await code('admin/target-reward',{uid:refId,targetId:'d1',action:'give',reason:'x'},refC,403);

// ---- auto-credit (also picks up the weekly target) ----
let t=await ok('admin/target-settings',{autoCredit:true},ac);assert.equal(t.credited,1,'only the unclaimed weekly target is auto-credited');
me=(await get(refC)).me;assert.equal(me.wallet.balance,100);assert.equal(me.dailyReferral.targets.find(x=>x.id==='w1').claimed,true);
await code('daily-referral/claim',{targetId:'w1'},refC,409);
t=await ok('admin/target-settings',{autoCredit:true},ac);assert.equal(t.credited,0,'auto-credit is idempotent');
await ok('admin/target-settings',{autoCredit:false},ac);

// ---- per-user target override ----
await code('admin/user',{id:refId,action:'settargets',targets:[{target:0,amount:5}]},ac,400);
await ok('admin/user',{id:refId,action:'settargets',targets:[{target:5,amount:500}]},ac);
me=(await get(refC)).me;assert.equal(me.dailyReferral.targets.length,1);assert.equal(me.dailyReferral.targets[0].target,5);assert.equal(me.dailyReferral.custom,true);
const other=(await get(invC)).me;assert.equal(other.dailyReferral.targets.length,2,'other users keep the global targets');
await ok('admin/user',{id:refId,action:'cleartargets'},ac);
assert.equal((await get(refC)).me.dailyReferral.targets.length,2);

// ---- wallet freeze ----
await code('admin/user',{id:refId,action:'freeze'},ac,400); // reason required
await ok('admin/user',{id:refId,action:'freeze',reason:'suspicious referrals'},ac);
me=(await get(refC)).me;assert.equal(me.frozen,true);
await code('wd',{amount:10,upi:'abc@upi'},refC,403);
await code('referral/wallet-unlock',{uid:invId},refC,403);
await ok('admin/user',{id:refId,action:'unfreeze'},ac);assert.equal((await get(refC)).me.frozen,false);

// ---- withdrawal hold on a demo (managed) account: bypasses day/min-referral rules ----
await ok('admin/demo-create',{name:'Demo Wd',email:'demo@example.test',password:'DemoPass123',balance:500,earned:500,referrals:0,withdrawals:0},ac);
r=await post('login',{email:'demo@example.test',password:'DemoPass123'});assert.equal(r.status,200);const dc=r.headers.get('set-cookie').split(';')[0];const demoId=(await get(dc)).me.id;
await ok('wd',{amount:100,upi:'demo@upi'},dc);
const findWd=async pred=>{const d=(await get(ac)).db;return [...d.wd,...(d.demoWd||[])].find(pred)};
let w=await findWd(x=>x.uid===demoId);assert.equal(w.status,'Pending');const wid=w.id;
await code('admin/wd',{id:wid,status:'On Hold'},ac,400); // reason required
await ok('admin/wd',{id:wid,status:'On Hold',reason:'verify UPI owner'},ac);
w=await findWd(x=>x.id===wid);assert.equal(w.status,'On Hold');assert.equal(w.holdReason,'verify UPI owner');
assert.equal((await get(dc)).me.wallet.balance,400,'held amount stays deducted');
await code('admin/wd',{id:wid,status:'On Hold',reason:'dup'},ac,400); // already on hold
await ok('admin/wd',{id:wid,status:'Processing'},ac); // release
w=await findWd(x=>x.id===wid);assert.equal(w.status,'Processing');assert(!w.holdReason);
await ok('admin/wd',{id:wid,status:'On Hold',reason:'second check'},ac);
await ok('admin/wd',{id:wid,status:'Rejected'},ac);
assert.equal((await get(dc)).me.wallet.balance,500,'rejecting a held withdrawal refunds the amount');
await ok('admin/user',{id:demoId,action:'freeze',reason:'review'},ac);
await code('wd',{amount:10,upi:'demo@upi'},dc,403);

// ---- audit log ----
const actions=(await get(ac)).db.audit.map(a=>a.action);
for(const a of ['targets:reward-give','targets:reward-revoke','targets:auto-credit-on','targets:user-override','user:freeze','user:unfreeze','withdrawal:hold','withdrawal:rejected','targets:global-update'])assert(actions.includes(a),'audit missing '+a+' in '+actions.join(','));
// non-admin users never see tracker/audit
assert.equal((await get(refC)).db.audit,undefined);
// backup carries audit log
const bk=await (await fetch(base+'/api/backup',{headers:{cookie:ac}})).json();assert(Array.isArray(bk.audit)&&bk.audit.length>5);
console.log('Admin controls OK: tracker, manual give/revoke, auto-credit, weekly + per-user targets, wallet freeze, withdrawal hold/release/reject, audit log, backup.');
}finally{child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));fs.rmSync(dir,{recursive:true,force:true})}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
