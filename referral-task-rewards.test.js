const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path'),{spawn}=require('child_process'),net=require('net');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(e=>e?reject(e):resolve(p))})})}
async function startServer(dir,port,now){
 const base=`http://127.0.0.1:${port}`,fakeClock=path.join(dir,'fake-clock.cjs');
 fs.writeFileSync(fakeClock,`const RealDate=Date;const started=RealDate.now();const base=Number(process.env.TEST_NOW);global.Date=class TestDate extends RealDate{constructor(...a){super(...(a.length?a:[base+(RealDate.now()-started)]))}static now(){return base+(RealDate.now()-started)}};`);
 const child=spawn(process.execPath,['--require',fakeClock,'server.js'],{cwd:__dirname,env:{...process.env,PORT:String(port),APP_URL:base,DATA_FILE:path.join(dir,'data.json'),CONTENT_FILE:path.join(dir,'test-content.json'),ADMIN_EMAIL:'admin@daily-ref.test',ADMIN_PASSWORD:'AdminPass123',NODE_ENV:'test',REQUIRE_PERSISTENT_STORAGE:'false',TASK_AI_SECONDS:'1',TEST_NOW:String(now)},stdio:['ignore','pipe','pipe']});
 let logs='';child.stdout.on('data',x=>logs+=x);child.stderr.on('data',x=>logs+=x);
 for(let i=0;i<100;i++){if(child.exitCode!==null)throw new Error('Server exited: '+logs);try{if((await fetch(base+'/health')).ok)return{child,base,logs:()=>logs}}catch{}await wait(100)}
 child.kill('SIGTERM');throw new Error('Server did not start: '+logs);
}
async function stop(child){if(child.exitCode===null){child.kill('SIGTERM');await new Promise(r=>child.once('exit',r))}}
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rk-daily-ref-')),port=await freePort();
 const fixedDay=Date.UTC(2026,10,20,12,0,0); // 20 Nov 2026, IST afternoon
 const days=Array.from({length:7},()=>({videos:[],questions:[]}));
 fs.writeFileSync(path.join(dir,'test-content.json'),JSON.stringify({modules:[{title:'Daily Test',days}]}));
 const post=async(base,route,body,cookie)=>fetch(base+'/api/'+route,{method:'POST',headers:{'content-type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(body)});
 const cookie=r=>{const h=r.headers.get('set-cookie');assert.ok(h,'session cookie missing');return h.split(';')[0]};
 let server;
 try{
  server=await startServer(dir,port,fixedDay);let {base}=server;
  let r=await post(base,'login',{email:'admin@daily-ref.test',password:'AdminPass123'});assert.equal(r.status,200,await r.text());const admin=cookie(r);
  const reg=async(name,email,phone,ref)=>{const x=await post(base,'register',{name,email,phone,password:'StrongPass123',ref});assert.equal(x.status,200,await x.text());return cookie(x)};
  const state=async c=>(await fetch(base+'/api/state',{headers:{cookie:c}})).json();
  const aCookie=await reg('Level One','l1@daily-ref.test','9876500101','ADMIN0'),a=await state(aCookie);
  const bCookie=await reg('Level Two','l2@daily-ref.test','9876500102',a.me.ref),b=await state(bCookie);
  const cCookie=await reg('Level Three','l3@daily-ref.test','9876500103',b.me.ref),c=await state(cCookie);
  for(const uid of [b.me.id,c.me.id]){r=await post(base,'admin/user',{id:uid,action:'verify'},admin);assert.equal(r.status,200,await r.text())}
  const finishTask=async c=>{let x=await post(base,'task/start',{m:0,kind:'a'},c);assert.equal(x.status,200,await x.text());await wait(1150);await state(c)};
  await finishTask(bCookie);await state(aCookie);await state(aCookie); // state refreshes must not double-credit
  await finishTask(cCookie);await state(aCookie);await state(bCookie);await state(aCookie);
  let aState=await state(aCookie),bState=await state(bCookie);
  assert.equal(aState.me.wallet.entries.filter(x=>x.kind==='taskref').length,1,'direct task reward must credit once on day one');
  assert.equal(aState.me.wallet.entries.filter(x=>x.kind==='taskref2').length,1,'level 2 task reward must credit once on day one');
  assert.equal(bState.me.wallet.entries.filter(x=>x.kind==='taskref').length,1,'level 2 user direct task reward must credit once on day one');
  await stop(server.child);server=null;
  server=await startServer(dir,port,fixedDay+86400000);base=server.base;
  await finishTask(bCookie);await finishTask(cCookie);await state(aCookie);await state(bCookie);
  aState=await state(aCookie);bState=await state(bCookie);
  assert.equal(aState.me.wallet.entries.filter(x=>x.kind==='taskref').length,2,'direct referral must pay again on the next IST day');
  assert.equal(aState.me.wallet.entries.filter(x=>x.kind==='taskref2').length,2,'level 2 referral must pay again on the next IST day');
  assert.equal(bState.me.wallet.entries.filter(x=>x.kind==='taskref').length,2,'level 2 user direct referral must pay again on the next IST day');
  assert.equal(aState.me.wallet.entries.filter(x=>x.kind==='taskref').reduce((s,x)=>s+x.amt,0),10,'two days of direct reward should total ₹10');
  assert.equal(aState.me.wallet.entries.filter(x=>x.kind==='taskref2').reduce((s,x)=>s+x.amt,0),4,'two days of level 2 reward should total ₹4');
  console.log('Daily referral task reward integration: OK (Level 1 ₹5 and Level 2 ₹2 credited once per referred user per IST day; repeat state/task calls do not duplicate; next-day rewards credit again).');
 }finally{if(server)await stop(server.child);fs.rmSync(dir,{recursive:true,force:true})}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
