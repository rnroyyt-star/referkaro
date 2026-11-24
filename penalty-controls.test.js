// Integration checks for user contact edits, wallet hold/freeze and penalty payment lock.
const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path'),{spawn}=require('child_process'),net=require('net');
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rk-penalty-'));
 const port=await new Promise((resolve,reject)=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))});s.on('error',reject)});
 const base=`http://127.0.0.1:${port}`,child=spawn(process.execPath,['server.js'],{cwd:__dirname,env:{...process.env,PORT:String(port),APP_URL:base,DATA_FILE:path.join(dir,'data.json'),ADMIN_EMAIL:'admin@example.test',ADMIN_PASSWORD:'AdminPass123',NODE_ENV:'test',REQUIRE_PERSISTENT_STORAGE:'false'},stdio:['ignore','pipe','pipe']});let logs='';child.stdout.on('data',x=>logs+=x);child.stderr.on('data',x=>logs+=x);
 try{
  for(let i=0;i<80;i++){if(child.exitCode!==null)throw Error(logs);try{if((await fetch(base+'/health')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
  const post=(r,b,c)=>fetch(base+'/api/'+r,{method:'POST',headers:{'content-type':'application/json',...(c?{cookie:c}:{})},body:JSON.stringify(b)}),ok=async(r,b,c)=>{const x=await post(r,b,c);assert.equal(x.status,200,r+' '+await x.clone().text());return x.json()},code=async(r,b,c,n)=>{const x=await post(r,b,c);assert.equal(x.status,n,r+' expected '+n+' got '+await x.clone().text());return x};
  let r=await post('login',{email:'ADMIN@example.test',password:'AdminPass123'});assert.equal(r.status,200,'case-insensitive login');const ac=r.headers.get('set-cookie').split(';')[0];
  r=await post('register',{name:'Penalty User',email:'old@example.test',phone:'9876500001',password:'StrongPass123'});assert.equal(r.status,200);const uc=r.headers.get('set-cookie').split(';')[0],st=async c=>(await (await fetch(base+'/api/state',{headers:{cookie:c}})).json());let uid=(await st(uc)).me.id;
  await ok('admin/user',{id:uid,action:'editcontact',email:'NEW@example.test',phone:'9876500002'},ac);
  assert.equal((await st(uc)).me.email,'new@example.test');
  const qr='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7s8AAAAASUVORK5CYII=';
  await ok('admin/user',{id:uid,action:'penalty',amount:725,qr,upi:'merchant@upi'},ac);
  assert.equal((await st(uc)).me.penalty.amount,725);
  await code('ticket',{type:'Other',msg:'should be locked'},uc,423);
  await ok('penalty/submit',{utr:'123456789012'},uc);
  assert.equal((await st(uc)).me.penalty.status,'Pending Verification');
  await code('ticket',{type:'Other',msg:'still locked'},uc,423);
  await ok('admin/penalty-verify',{id:uid,status:'Verified'},ac);
  assert.equal((await st(uc)).me.penalty.status,'Verified');
  await ok('ticket',{type:'Other',msg:'unlocked now'},uc);
  await ok('admin/business-config',{price:299,fee:1,minWd:1,minDirectRefs:0,minUnlockRefs:0,withdrawalDay:'any'},ac);
  await ok('admin/demo-create',{name:'Wallet Test',email:'wallet@example.test',password:'DemoPass123',balance:500,earned:500},ac);
  r=await post('login',{email:'wallet@example.test',password:'DemoPass123'});assert.equal(r.status,200);const dc=r.headers.get('set-cookie').split(';')[0],did=(await st(dc)).me.id;
  await ok('admin/user',{id:did,action:'wallethold',amount:100},ac);
  await ok('wd',{amount:400,upi:'wallet@upi'},dc);
  await code('wd',{amount:1,upi:'wallet@upi'},dc,400);
  await ok('admin/user',{id:did,action:'walletfreeze',reason:'review'},ac);
  await code('wd',{amount:1,upi:'wallet@upi'},dc,403);
  console.log('Penalty controls integration: OK (case-insensitive login, contact edit, full lock, UTR pending/verify/unlock, wallet hold and freeze)');
 }catch(e){console.error(e);console.error(logs);process.exitCode=1}finally{child.kill();fs.rmSync(dir,{recursive:true,force:true})}
})();
