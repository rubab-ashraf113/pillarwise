{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const enc=new TextEncoder(),dec=new TextDecoder();
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const b64=buf=>{const b=new Uint8Array(buf);let s='';for(let i=0;i<b.length;i+=32768)s+=String.fromCharCode.apply(null,b.subarray(i,i+32768));return btoa(s)};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const digest=async(a,d)=>hex(await crypto.subtle.digest(a,d));
const store={get(k,d){try{const v=localStorage.getItem('pw-'+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem('pw-'+k,JSON.stringify(v))}catch(e){}}};

/* ---------- language, region, mode ---------- */
let L=store.get('lang',null);
if(!L){const n=(navigator.language||'en').slice(0,2);L=I18N[n]?n:'en'}
const tzRegion=()=>{try{const z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';if(z==='Asia/Karachi')return'pk';if(/Asia\/(Kolkata|Calcutta)/.test(z))return'in';if(z==='Europe/London')return'uk';if(/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Indiana|Boise)/.test(z)||z.startsWith('US/')||z==='Pacific/Honolulu')return'us'}catch(e){}return'global'};
let R=store.get('region',null)||tzRegion();
const get=(obj,path)=>path.split('.').reduce((o,k)=>o&&o[k],obj);
function t(k,v){let s=get(I18N[L],k);if(s==null)s=get(I18N.en,k);if(s==null)return k;if(typeof s==='string'&&v)s=s.replace(/\{(\w+)\}/g,(_,x)=>v[x]!=null?v[x]:'');return s}
const verdict=(cls,title,small)=>`<div class="verdict v-${cls}">${title}${small?`<small>${small}</small>`:''}</div>`;
const sigList=items=>`<ul class="sig">${items.map(i=>`<li><span class="dot d-${i.lvl}"></span><div>${esc(i.t)}<small>${esc(i.why)}</small></div></li>`).join('')}</ul>`;
const xbox=html=>`<div class="xbox x" data-label="${esc(t('expert'))}">${html}</div>`;
async function copy(text,el){try{await navigator.clipboard.writeText(text);if(el){const o=el.textContent;el.textContent=t('copied');setTimeout(()=>el.textContent=o,1500)}}catch(e){if(el)el.textContent=t('copyFail')}}
let dlNs=null;try{if(window.claude&&claude.use)claude.use('downloads').then(n=>{dlNs=n}).catch(()=>{})}catch(e){}
async function download(bytes,name){if(dlNs){try{await dlNs.save({filename:name,data:new Blob([bytes])});return'saved'}catch(e){return(e&&e.code)||'unavailable'}}
 try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([bytes]));a.download=name;document.body.appendChild(a);a.click();a.remove();return'saved'}catch(e){return'unavailable'}}
const dlMsg=(st,name)=>st==='saved'?verdict('ok',esc(t('saved',{n:name}))):st==='declined'?verdict('warn',t('saveCancel')):verdict('warn',t('saveNo'));

function applyLang(){
 const html=document.documentElement;html.lang=L;html.dir=(L==='ur'||L==='ar')?'rtl':'ltr';
 $$('[data-t]').forEach(e=>e.textContent=t(e.dataset.t));$$('[data-tp]').forEach(e=>e.placeholder=t(e.dataset.tp));
 document.title='Pillarwise';
 $('#lang').innerHTML=LANGS.map(([c,n])=>`<option value="${c}" ${c===L?'selected':''}>${n}</option>`).join('');
 $('#region').innerHTML=Object.keys(I18N.en.rg).map(k=>`<option value="${k}" ${k===R?'selected':''}>${esc(t('rg.'+k))}</option>`).join('');
 $('#report').textContent=t('rep_bank')+' '+t('rep_'+R);
 $$('.out').forEach(o=>{if(!o.dataset.keep)o.innerHTML=''});
 renderSide();drawTemple();renderPlan();renderRisk();fillSetup();setTheme(theme,false);renderHist();
 if(!$('#msg').value)$('#msg').placeholder=sampleText();
}
const sampleText=()=>get(I18N[L],'samples.'+R)||I18N.en.samples[R]||I18N.en.samples.global;
$('#lang').addEventListener('change',e=>{L=e.target.value;store.set('lang',L);applyLang()});
$('#region').addEventListener('change',e=>{R=e.target.value;store.set('region',R);$('#msg').placeholder='';applyLang()});
let expert=store.get('expert',false);
function setMode(x){expert=x;store.set('expert',x);document.body.classList.toggle('expert',x);$('#mSimple').setAttribute('aria-pressed',!x);$('#mExpert').setAttribute('aria-pressed',x);$('#mExpert').title=t('modeHint')}
$('#mSimple').addEventListener('click',()=>setMode(false));$('#mExpert').addEventListener('click',()=>setMode(true));

/* ---------- theme ---------- */
const ICO={sun:'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',moon:'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'};
let themeSaved=!!store.get('theme',null);let theme=store.get('theme',null)||document.documentElement.dataset.theme||(matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
function setTheme(x,save=true){theme=x==='dark'?'dark':'light';if(save){store.set('theme',theme);themeSaved=true}document.documentElement.dataset.pwTheme=theme;$('#themeIco').setAttribute('d',theme==='dark'?ICO.sun:ICO.moon);$('#themeLbl').textContent=t(theme==='dark'?'light':'dark');$('#helpBtn').setAttribute('aria-label',t('help'));$('#appBtn').setAttribute('aria-label',t('getApp'));$('#themeBtn').title=t('theme');$('#themeBtn').setAttribute('aria-label',t('theme')+': '+t(theme==='dark'?'light':'dark'));const w=$('#wTheme');if(w)w.value=theme}
$('#themeBtn').addEventListener('click',()=>setTheme(theme==='dark'?'light':'dark'));
try{new MutationObserver(()=>{const h=document.documentElement.dataset.theme;if(!themeSaved&&(h==='dark'||h==='light')&&h!==theme)setTheme(h,false)}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})}catch(e){}

/* ---------- dialogs: welcome + get app ---------- */
let lastFocus=null;
function openDlg(id){lastFocus=document.activeElement;const d=$('#'+id);d.classList.add('open');document.body.style.overflow='hidden';setTimeout(()=>{const f=d.querySelector('.dlg');if(f)f.focus()},30)}
function closeDlg(d){d.classList.remove('open');document.body.style.overflow='';if(d.id==='welcome')store.set('seen',true);if(lastFocus&&lastFocus.focus)lastFocus.focus()}
$$('.ov').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-close]'))closeDlg(d)})});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const d=$('.ov.open');if(d)closeDlg(d)}});
$('#helpBtn').addEventListener('click',()=>openDlg('welcome'));
$('#wStart').addEventListener('click',()=>{closeDlg($('#welcome'));show('ov')});
function fillSetup(){
 $('#wLang').innerHTML=LANGS.map(([c,n])=>`<option value="${c}" ${c===L?'selected':''}>${n}</option>`).join('');
 $('#wRegion').innerHTML=Object.keys(I18N.en.rg).map(k=>`<option value="${k}" ${k===R?'selected':''}>${esc(t('rg.'+k))}</option>`).join('');
 $('#wTheme').innerHTML=['light','dark'].map(k=>`<option value="${k}" ${k===theme?'selected':''}>${esc(t('theme'))}: ${esc(t(k))}</option>`).join('');
}
$('#wLang').addEventListener('change',e=>{L=e.target.value;store.set('lang',L);applyLang()});
$('#wRegion').addEventListener('change',e=>{R=e.target.value;store.set('region',R);$('#msg').placeholder='';applyLang()});
$('#wTheme').addEventListener('change',e=>setTheme(e.target.value));
let deferred=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e});
window.addEventListener('appinstalled',()=>{deferred=null;$('#installout').innerHTML=verdict('ok',esc(t('installed')))});
const standalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}};
const ZIP=document.getElementById('appzip');
$('#appBtn').addEventListener('click',()=>{$('#installout').innerHTML=standalone()?verdict('ok',esc(t('installed'))):'';$('#installBtn').hidden=standalone();openDlg('getapp')});
$('#installBtn').addEventListener('click',async()=>{if(deferred){deferred.prompt();try{const c=await deferred.userChoice;if(c.outcome==='accepted')$('#installout').innerHTML=verdict('ok',esc(t('installed')))}catch(e){}deferred=null}else $('#installout').innerHTML=verdict('info',esc(t('installNA')))});
$('#zipBtn').addEventListener('click',async()=>{const o=$('#zipout');try{let bytes;if(ZIP)bytes=unb64(ZIP.textContent.trim());else{const r=await fetch('pillarwise-app.zip');if(!r.ok)throw 0;bytes=new Uint8Array(await r.arrayBuffer())}o.innerHTML=dlMsg(await download(bytes,'pillarwise-app.zip'),'pillarwise-app.zip')}catch(e){o.innerHTML=verdict('warn',esc(t('saveNo')))}});
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)&&!ZIP&&!window.claude){navigator.serviceWorker.register('sw.js').catch(()=>{})}

/* ---------- erase ---------- */
let eraseArmed=0;
$('#eraseBtn').addEventListener('click',()=>{
 if(!eraseArmed){eraseArmed=setTimeout(()=>{eraseArmed=0;$('#eraseBtn').textContent=t('erase')},5000);$('#eraseBtn').textContent=t('eraseConfirm');$('#eraseout').innerHTML='';return}
 clearTimeout(eraseArmed);eraseArmed=0;$('#eraseBtn').textContent=t('erase');themeSaved=false;
 try{Object.keys(localStorage).filter(k=>k.startsWith('pw-')).forEach(k=>localStorage.removeItem(k))}catch(e){}
 res={};hist=[];histOn=false;Object.keys(findings).forEach(k=>delete findings[k]);keys=null;ident=null;
 $$('input[type=text],input[type=password],input[type=date],textarea').forEach(i=>{if(i.id!=='msg'||true)i.value=''});$$('input[type=file]').forEach(i=>{try{i.value=''}catch(e){}});
 $$('.out').forEach(o=>o.innerHTML='');$('#signbtn').disabled=true;$('#pwbreach').disabled=true;
 renderSide();drawTemple();renderPlan();renderRisk();renderHist();
 $('#eraseout').innerHTML=verdict('ok',esc(t('eraseDone')));
});

/* ---------- pillars, quiz, plan ---------- */
const PIL=['C','I','A','Au','NR'];
try{['quiz','avail','seen-quiz'].forEach(k=>localStorage.removeItem('pw-'+k))}catch(e){}
let res=store.get('res',{});const findings={};
const LV={ok:100,warn:55,bad:15,info:80};
function setRes(p,tool,lvl){if(lvl==null)delete res[tool];else res[tool]={p,lvl};store.set('res',res);drawTemple();renderSide()}
let view='ov';
function score(p){const r=Object.values(res).filter(x=>x.p===p);if(!r.length)return null;return Math.round(r.reduce((s,x)=>s+(LV[x.lvl]??50),0)/r.length)}
function renderSide(){if($('#tiles'))renderTiles();
 $('#side').innerHTML=`<button role="tab" data-v="ov" aria-selected="${view==='ov'}"><b>${esc(t('ov'))}</b></button>`+PIL.map(p=>{const s=score(p);return `<button role="tab" data-v="${p}" aria-selected="${view===p}"><b>${esc(t('p'+p))}</b><small>${s==null?esc(t('notChecked')):s+'%'}</small><span class="bar"><i style="width:${s||0}%"></i></span></button>`}).join('')+`<button role="tab" data-v="H" aria-selected="${view==='H'}"><b>${esc(t('hist'))}</b><small>${hist.length||''}</small></button>`;
}
function show(v){if(v!=='ov'&&v!=='H'&&!PIL.includes(v))v='ov';if(view!==v){['#pw','#encpw','#keypass'].forEach(s=>{const e=$(s);if(e)e.value=''});const po=$('#pwout'),bo=$('#breachout');if(po)po.innerHTML='';if(bo)bo.innerHTML='';const pb=$('#pwbreach');if(pb)pb.disabled=true}view=v;$$('.view').forEach(s=>s.classList.toggle('on',s.id==='v-'+v));renderSide();if(v==='H'&&typeof renderHist==='function')try{renderHist()}catch(e){}}
$('#side').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;show(b.dataset.v);try{history.replaceState(null,'','#'+b.dataset.v)}catch(x){}if(innerWidth<900)$('#side').scrollIntoView({block:'start'})});
window.addEventListener('hashchange',()=>show(location.hash.slice(1)));
const prevFill={};let introDone=false;
function drawTemple(){
 const xs=[80,190,300,410,520],top=92,bot=270,w=58,h=bot-top;
 let g=`<g class="ped"><polygon points="22,80 300,14 578,80" fill="rgba(127,216,204,.12)" stroke="#7fd8cc" stroke-width="2"/><text x="300" y="64" text-anchor="middle" font-size="19" font-weight="700" fill="#dff5f1">${esc(t('yourInfo'))}</text><rect x="22" y="80" width="556" height="10" fill="#7fd8cc"/></g>`;
 PIL.forEach((p,i)=>{const s=score(p),x=xs[i]-w/2;
  g+=`<g class="col" style="animation-delay:${.25+i*.08}s"><rect x="${x}" y="${top}" width="${w}" height="${h}" rx="3" fill="rgba(255,255,255,.06)" stroke="rgba(223,245,241,.55)"/>`;
  for(let k=1;k<4;k++)g+=`<line x1="${x+k*w/4}" y1="${top+6}" x2="${x+k*w/4}" y2="${bot-4}" stroke="rgba(223,245,241,.18)"/>`;
  g+=`<rect class="fill" data-p="${p}" x="${x}" y="${top}" width="${w}" height="${h}" rx="3" fill="#7fd8cc" style="transform:scaleY(${(prevFill[p]||0)/100})"/>`;
  g+=`<text x="${xs[i]}" y="${bot-12}" text-anchor="middle" font-size="16" font-weight="800" fill="${s!=null&&s>14?'#08363a':'#dff5f1'}">${s==null?'?':s+'%'}</text></g>`;
  g+=`<text x="${xs[i]}" y="${bot+28}" text-anchor="middle" font-size="${L==='ur'?14:12.5}" font-weight="600" fill="#dff5f1">${esc(t('p'+p).length>16?t('p'+p).slice(0,15)+'…':t('p'+p))}</text>`});
 g+=`<rect x="12" y="${bot}" width="576" height="8" fill="#7fd8cc" opacity=".8"/><text x="300" y="322" text-anchor="middle" font-size="13" fill="#9fc9c4">${esc(t('pillarNote'))}</text>`;
 const sv=$('#temple');sv.innerHTML=g;sv.setAttribute('aria-label',t('pillarNote'));
 if(!introDone){sv.classList.add('intro');introDone=true;setTimeout(()=>sv.classList.remove('intro'),1400)}
 requestAnimationFrame(()=>requestAnimationFrame(()=>{sv.querySelectorAll('.fill').forEach(r=>{const s=score(r.dataset.p)||0;r.style.transform=`scaleY(${s/100})`;prevFill[r.dataset.p]=s})}));
}
function renderTiles(){
 $('#tiles').innerHTML=PIL.map((p,i)=>{const s=score(p);return `<button class="tile" data-go="${p}" style="animation-delay:${i*.06}s"><span class="th"><b>${esc(t('p'+p))}</b>${s==null?'':`<span class="tnum">${s}%</span>`}</span><span>${esc(t('tl_'+p))}</span></button>`}).join('');
}
$('#tiles').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(!b)return;show(b.dataset.go);try{history.replaceState(null,'','#'+b.dataset.go)}catch(x){}const sh=$('.shell');if(sh)scrollTo({top:sh.offsetTop-8,behavior:'smooth'})});
function finding(key,p,k,v,w){if(p)findings[key]={p,k,v,w};else delete findings[key];renderPlan()}
function renderPlan(){
 const items=Object.values(findings).map(f=>({p:f.p,text:t(f.k,f.v),w:f.w}));items.sort((x,y)=>y.w-x.w);
 if(!items.length){$('#plan').innerHTML=Object.keys(res).length?verdict('ok',esc(t('planNone'))):`<p class="note">${esc(t('planEmpty'))}</p>`;return}
 $('#plan').innerHTML=`<ol class="plan">${items.map((it,i)=>`<li>${i<3?`<span class="tag">${esc(t('doFirst'))}</span>`:''}${esc(it.text)}<small>${esc(t('p'+it.p))}</small></li>`).join('')}</ol>`;
}

/* ---------- HISTORY & BACKUP (on-device, no accounts) ---------- */
let hist=store.get('hist',[]),histOn=store.get('histOn',false);
function addHist(p,tool,lvl,vk,vv,d){setRes(p,tool,lvl);if(!histOn)return;hist.unshift({ts:Date.now(),p,tool,lvl,vk,vv:vv||null,d:d||''});hist=hist.slice(0,200);store.set('hist',hist);renderSide();if(view==='H')renderHist()}
function renderHist(){
 $('#histOn').checked=histOn;
 $('#histlist').innerHTML=!histOn&&!hist.length?`<p class="note">${esc(t('histOff'))}</p>`:!hist.length?`<p class="note">${esc(t('histEmpty'))}</p>`:hist.map(e=>`<div class="hrow"><span class="dot d-${e.lvl==='info'?'info':e.lvl}"></span><div><b>${esc(t(e.tool))}</b>: ${esc(t(e.vk,e.vv||undefined))}<small>${esc(t('p'+e.p))}${e.d?' · <span dir="ltr">'+esc(e.d)+'</span>':''}</small></div><time>${esc(new Date(e.ts).toLocaleString(L,{dateStyle:'short',timeStyle:'short'}))}</time></div>`).join('');
}
$('#histOn').addEventListener('change',e=>{histOn=e.target.checked;store.set('histOn',histOn);renderHist()});
$('#histClear').addEventListener('click',()=>{hist=[];store.set('hist',hist);renderHist();renderSide()});
$('#bkExport').addEventListener('click',async()=>{const o=$('#bkout'),pw=$('#bkpass').value;if(pw.length<8){o.innerHTML=verdict('warn',esc(t('encShort')));return}
 o.innerHTML=verdict('info',esc(t('working')));
 const payload={res,hist,settings:{lang:L,region:R,theme,expert,histOn}};
 const file=JSON.stringify({type:'pillarwise-backup',v:1,created:new Date().toISOString(),data:TXT+b64(await encryptBytes(enc.encode(JSON.stringify(payload)),pw))});
 const st=await download(enc.encode(file),'pillarwise-backup.json');o.innerHTML=st==='saved'?verdict('ok',esc(t('bkDone')),esc(t('bkDoneW'))):dlMsg(st,'pillarwise-backup.json')});
$('#bkImport').addEventListener('click',async()=>{const o=$('#bkout'),f=$('#bkfile').files[0];if(!f){o.innerHTML=verdict('warn',esc(t('bkNeedFile')));return}
 o.innerHTML=verdict('info',esc(t('working')));
 try{const s=JSON.parse(await f.text());if(s.type!=='pillarwise-backup')throw 0;const d=JSON.parse(dec.decode(await decryptBytes(unb64(s.data.slice(TXT.length)),$('#bkpass').value)));
  res=d.res||{};hist=d.hist||[];const st=d.settings||{};histOn=!!st.histOn;
  store.set('res',res);store.set('hist',hist);store.set('histOn',histOn);
  if(st.lang&&I18N[st.lang]){L=st.lang;store.set('lang',L)}if(st.region){R=st.region;store.set('region',R)}if(st.theme)setTheme(st.theme);setMode(!!st.expert);
  applyLang();renderHist();$('#bkout').innerHTML=verdict('ok',esc(t('bkRestored')))}
 catch(e){o.innerHTML=verdict('bad',esc(t('bkBad')))}});

/* ---------- CONFIDENTIALITY ---------- */
const COMMON='123456 123456789 12345678 password qwerty 111111 12345 1234567 123123 abc123 password1 1234567890 000000 iloveyou 1234 qwerty123 dragon sunshine princess letmein 654321 monkey football 1q2w3e4r welcome admin pakistan pakistan123 786786 bismillah allah786 india india123 karachi lahore mumbai delhi london cricket qwertyuiop asdfghjkl zxcvbnm passw0rd p@ssw0rd baseball shadow master superman michael jessica hello hello123 freedom whatever trustno1 starwars 112233 121212 159753 987654321 aa123456 zaq12wsx 1qaz2wsx qazwsx 7777777 555555 666666 888888 999999 love123 mypassword secret login internet computer contraseña hola123 amor azerty soleil'.split(' ');
const SEQS=['abcdefghijklmnopqrstuvwxyz','qwertyuiopasdfghjklzxcvbnm','01234567890','azertyuiop','qazwsxedc'];
function analyzePw(pw){
 const sig=[],low=pw.toLowerCase(),de=low.replace(/[@4]/g,'a').replace(/3/g,'e').replace(/[1!|]/g,'i').replace(/0/g,'o').replace(/[$5]/g,'s').replace(/7/g,'t');
 let pool=0;if(/[a-z]/.test(pw))pool+=26;if(/[A-Z]/.test(pw))pool+=26;if(/\d/.test(pw))pool+=10;if(/[^A-Za-z0-9]/.test(pw))pool+=33;
 const lp=Math.log2(Math.max(pool,1));let bits=[...pw].length*lp;
 if(COMMON.includes(low)||COMMON.includes(de)){bits=Math.min(bits,8);sig.push({lvl:'bad',t:t('s_common'),why:t('s_commonW')})}
 else{const hit=COMMON.filter(c=>c.length>=5&&(low.includes(c)||de.includes(c)));if(hit.length){bits=Math.min(bits,14+de.replace(hit[0],'').length*lp*.7);sig.push({lvl:'warn',t:t('s_word',{w:hit[0]}),why:t('s_wordW')})}}
 if(pw.length<8)sig.push({lvl:'bad',t:t('s_8'),why:t('s_lenW')});else if(pw.length<12)sig.push({lvl:'warn',t:t('s_12'),why:t('s_lenW')});
 if(/(.)\1{2,}/.test(pw)){bits-=6;sig.push({lvl:'warn',t:t('s_rep'),why:t('s_repW')})}
 seq:for(const s of SEQS)for(let i=0;i+4<=s.length;i++){const sub=s.slice(i,i+4);if(low.includes(sub)||low.includes([...sub].reverse().join(''))){bits-=8;sig.push({lvl:'warn',t:t('s_seq',{w:sub}),why:t('s_seqW')});break seq}}
 if(/(19[5-9]\d|20[0-4]\d)/.test(pw)){bits-=5;sig.push({lvl:'warn',t:t('s_year'),why:t('s_yearW')})}
 if(/^[A-Za-z]+[^A-Za-z0-9]?\d{1,4}[^A-Za-z0-9]?$/.test(pw)){bits-=8;sig.push({lvl:'warn',t:t('s_pat'),why:t('s_patW')})}
 if(pool<=26&&pw.length<16)sig.push({lvl:'info',t:t('s_one'),why:t('s_oneW')});
 return{bits:Math.max(0,Math.round(bits)),sig,pool};
}
const fmtTime=s=>{if(s<1)return t('t_lt1');const u=[[31536e12,'t_my'],[31536e9,'t_ky'],[31536e3,'t_y'],[2592e3,'t_mo'],[86400,'t_d'],[3600,'t_h'],[60,'t_m'],[1,'t_s']];for(const[d,n]of u)if(s>=d){const v=s/d;if(v>1e6&&n==='t_my')return t('t_uni');return(v<10?v.toFixed(1):Math.round(v).toLocaleString())+' '+t(n)}};
const pwLevel=b=>b<28?['bad',0,9]:b<45?['bad',1,8]:b<60?['warn',2,5]:b<80?['ok',3,0]:['ok',4,0];
$('#pwshow').addEventListener('change',e=>$('#pw').type=e.target.checked?'text':'password');
$('#pw').addEventListener('input',()=>{
 const pw=$('#pw').value;$('#breachout').innerHTML='';$('#pwbreach').disabled=!pw;
 if(!pw){$('#pwout').innerHTML='';finding('pw');return}
 const r=analyzePw(pw),[l,lv,w]=pwLevel(r.bits),g=2**r.bits/2;
 $('#pwout').innerHTML=verdict(l,esc(t('lv'+lv))+' · '+esc(t('bits',{n:r.bits})),esc(t('crack',{t:fmtTime(g/1e10)})))+`<div class="meter"><i style="width:${Math.min(100,r.bits/90*100)}%;background:var(--${l==='ok'?'grn':l==='warn'?'amb':'red'})"></i></div>`+(r.sig.length?sigList(r.sig):'')+xbox(`<dl class="kv"><dt>${esc(t('pool'))}</dt><dd>${r.pool}</dd><dt>${esc(t('len'))}</dt><dd>${[...pw].length}</dd><dt>Entropy</dt><dd>${r.bits} bits (pool × length − pattern penalties)</dd><dt>${esc(t('online'))}</dt><dd>${esc(fmtTime(g/(100/3600)))}</dd></dl>`);
 finding('pw',w?'C':null,'f_pw',null,w);clearTimeout(window.__pwT);window.__pwT=setTimeout(()=>setRes('C','pw',l),700);
});
$('#pwbreach').addEventListener('click',async()=>{
 const pw=$('#pw').value;if(!pw)return;const h=(await digest('SHA-1',enc.encode(pw))).toUpperCase(),pre=h.slice(0,5),suf=h.slice(5);
 const sent=`<dl class="kv" style="margin-top:8px"><dt>${esc(t('sent'))}</dt><dd class="fp" dir="ltr">${pre}</dd></dl><p class="note">${esc(t('kNote'))}</p>`+xbox(`<dl class="kv"><dt>SHA-1</dt><dd class="mono" dir="ltr">${pre}<b>${suf}</b></dd><dt>${esc(t('kept'))}</dt><dd class="mono">${suf}</dd><dt>API</dt><dd class="mono">GET api.pwnedpasswords.com/range/${pre}</dd></dl>`);
 $('#breachout').innerHTML=verdict('info',esc(t('checking')))+sent;
 try{const r=await fetch('https://api.pwnedpasswords.com/range/'+pre);if(!r.ok)throw 0;const tx=await r.text();const line=tx.split('\n').find(l=>l.split(':')[0].trim()===suf);const n=line?parseInt(line.split(':')[1]):0;
  $('#breachout').innerHTML=(n>0?verdict('bad',esc(t('found',{n:n.toLocaleString()})),esc(t('foundW'))):verdict('ok',esc(t('notFound')),esc(t('notFoundW'))))+sent;finding('breach',n>0?'C':null,'f_breach',null,12);addHist('C','pwT',n>0?'bad':'ok',n>0?'found':'notFound',{n:n.toLocaleString()})}
 catch(e){$('#breachout').innerHTML=verdict('warn',esc(t('noNet')),esc(t('noNetW')))+sent}
});
const WORDS=[...new Set('apple river candle tiger mango cloud silver garden rocket pencil ocean desert window butter planet forest hammer violin parrot lemon bridge cotton dragon falcon ginger harbor island jacket kettle ladder marble needle orange pepper quartz rabbit saddle tomato umbrella velvet walnut yogurt zebra anchor basket camera dinner engine feather glacier helmet igloo jungle kitten lantern magnet napkin oyster pillow quiver ribbon spider tunnel unicorn valley wizard yellow almond bamboo cactus donkey eagle fabric goblet hazel insect jigsaw koala lizard meadow nectar olive panda quilt rattle salmon temple turtle vessel wagon cherry copper crystal danger echo fossil gravel hollow ivory jasmine kernel lotus mirror noble orbit pebble puzzle radar shadow summit thunder tulip vapor willow canyon cobalt comet coral cricket dolphin ember fiddle galaxy honey indigo jelly kayak lagoon mosaic nutmeg opal piano prism raven saffron sparrow tango timber vortex whistle zipper beacon blossom brook caramel cedar cinnamon clover crane daisy dune fern flame frost glow harvest heron horizon jade lilac maple mint moss nova onyx pearl petal pine plume pond quill reef ridge sage shell spruce starling stone storm thistle tide topaz trail wave wren breeze cliff cove dawn delta field grove hill lake marsh mesa peak plain rain sand sky snow spring star sun wind badge bell book bottle brush button cable chair chalk clock coin comb cup desk drum fork glove kite knot lamp leaf lock map mask nest note paint pipe plate rope ruler sail scarf shoe spoon stamp table tent ticket torch tower train wheel acorn arrow atlas bagel banjo barley bison blanket blender bucket burrow cabin carrot castle cello cobra cookie cradle crown cymbal denim dinghy domino easel elbow falcon fennel ferry fiesta flute fridge funnel garlic gazebo gecko geyser goose gorilla granite guitar hamster hedge hippo hockey hoodie husky iceberg iguana jaguar jeep juggler kiwi ladle lasso lemur lime llama lobster locket mango mantis marimba mitten moose muffin nachos noodle orchid otter paddle pancake papaya pecan pelican penguin pickle pirate plaza poppy potato pretzel pumpkin python quokka raccoon radish raft rhino robot rodeo rooster sapphire scooter sequoia sherbet skate sloth snorkel sofa sombrero squash squid sushi swan tadpole taco teapot tornado trumpet tuba tundra turnip ukulele vanilla vulture waffle walrus wasabi whale yacht yak'.split(' '))];
const rnd=n=>{const a=new Uint32Array(1),lim=Math.floor(4294967296/n)*n;do crypto.getRandomValues(a);while(a[0]>=lim);return a[0]%n};
$('#genbtn').addEventListener('click',()=>{
 let pw,bits;if($('#gentype').value==='phrase'){const k=6,ws=Array.from({length:k},()=>WORDS[rnd(WORDS.length)]),ci=rnd(k);ws[ci]=ws[ci][0].toUpperCase()+ws[ci].slice(1);pw=ws.join('-')+'-'+rnd(100);bits=Math.round(k*Math.log2(WORDS.length)+Math.log2(100))}
 else{const cs='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+?';pw=Array.from({length:20},()=>cs[rnd(cs.length)]).join('');bits=Math.round(20*Math.log2(cs.length))}
 $('#genout').innerHTML=`<div class="pre mono" dir="ltr" style="font-size:17px">${esc(pw)}</div><div class="row"><button class="btn ghost" id="gencopy">${esc(t('copy'))}</button><span class="note">${esc(t('genBits',{n:bits}))}</span></div>`;
 $('#gencopy').addEventListener('click',e=>copy(pw,e.target));
});
async function deriveKey(pw,salt){const base=await crypto.subtle.importKey('raw',enc.encode(pw),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function encryptBytes(bytes,pw){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),key=await deriveKey(pw,salt),ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes)),out=new Uint8Array(28+ct.length);out.set(salt);out.set(iv,16);out.set(ct,28);return out}
async function decryptBytes(b,pw){const key=await deriveKey(pw,b.slice(0,16));return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:b.slice(16,28)},key,b.slice(28)))}
const MAGIC=enc.encode('MHZ1'),TXT='PW1:';
$('#encbtn').addEventListener('click',async()=>{
 const pw=$('#encpw').value,f=$('#encfile').files[0],tx=$('#enctext').value,o=$('#encout');
 if(pw.length<8){o.innerHTML=verdict('warn',esc(t('encShort')));return}if(!f&&!tx){o.innerHTML=verdict('warn',esc(t('encNeed')));return}
 o.innerHTML=verdict('info',esc(t('working')));
 if(f){const d=await encryptBytes(new Uint8Array(await f.arrayBuffer()),pw),full=new Uint8Array(4+d.length);full.set(MAGIC);full.set(d,4);const nm=f.name+(dlNs?'.pwz.txt':'.pwz');o.innerHTML=verdict('ok',esc(t('encDone')),esc(t('encDoneW')))+dlMsg(await download(full,nm),nm)}
 else{const s=TXT+b64(await encryptBytes(enc.encode(tx),pw));setRes('C','enc','ok');o.innerHTML=verdict('ok',esc(t('encDone')),esc(t('encDoneW')))+`<textarea class="mono" dir="ltr" readonly>${s}</textarea><div class="row"><button class="btn ghost" id="enccopy">${esc(t('copy'))}</button></div>`;$('#enccopy').addEventListener('click',e=>copy(s,e.target))}
});
$('#decbtn').addEventListener('click',async()=>{
 const pw=$('#encpw').value,f=$('#encfile').files[0],tx=$('#enctext').value.trim(),o=$('#encout');
 try{if(f){const b=new Uint8Array(await f.arrayBuffer());if(dec.decode(b.slice(0,4))!=='MHZ1')throw new Error('fmt');o.innerHTML=verdict('info',esc(t('working')));const p=await decryptBytes(b.slice(4),pw),nm=f.name.replace(/\.pwz(\.txt)?$/,'');o.innerHTML=verdict('ok',esc(t('decDone')))+dlMsg(await download(p,nm),nm)}
  else{if(!tx.startsWith(TXT))throw new Error('fmt');o.innerHTML=verdict('info',esc(t('working')));const p=await decryptBytes(unb64(tx.slice(TXT.length)),pw);o.innerHTML=verdict('ok',esc(t('decDone')))+`<div class="pre">${esc(dec.decode(p))}</div>`}}
 catch(e){o.innerHTML=e.message==='fmt'?verdict('warn',esc(t('decFmt'))):verdict('bad',esc(t('decBad')),esc(t('decBadW')))}
});

/* ---------- INTEGRITY ---------- */
$('#hbtn').addEventListener('click',async()=>{
 const f=$('#hfile').files[0],tx=$('#htext').value,exp=$('#hexp').value.trim().toLowerCase().replace(/[^0-9a-f]/g,''),o=$('#hout');
 if(!f&&!tx){o.innerHTML=verdict('warn',esc(t('hNeed')));return}
 o.innerHTML=verdict('info',esc(t('working')));const d=f?await f.arrayBuffer():enc.encode(tx);
 const h={'SHA-256':await digest('SHA-256',d),'SHA-512':await digest('SHA-512',d),'SHA-1':await digest('SHA-1',d)};let v;
 if(exp){const m=Object.entries(h).find(([,x])=>x===exp),alg={64:'SHA-256',128:'SHA-512',40:'SHA-1'}[exp.length];
  if(m){v=verdict('ok',esc(t('hMatch')),esc(t('hMatchW',{a:m[0]})));finding('hash');addHist('I','hT','ok','hMatch',null,f?f.name:'')}
  else if(alg){v=verdict('bad',esc(t('hMis')),esc(t('hMisW')));finding('hash','I','f_hash',null,11);addHist('I','hT','bad','hMis',null,f?f.name:'')}
  else v=verdict('warn',esc(t('hOdd')),esc(t('hOddW')))}
 else v=verdict('info',esc(t('hDone')),esc(t('hDoneW')));
 o.innerHTML=v+`<dl class="kv" style="margin-top:10px"><dt>SHA-256</dt><dd class="mono" dir="ltr">${h['SHA-256']}</dd></dl>`+xbox(`<dl class="kv"><dt>SHA-512</dt><dd class="mono" dir="ltr">${h['SHA-512']}</dd><dt>SHA-1</dt><dd class="mono" dir="ltr">${h['SHA-1']} (legacy, collision-prone)</dd>${f?`<dt>Size</dt><dd>${f.size.toLocaleString()} bytes</dd>`:''}</dl>`);
});
const hashFiles=async l=>{const out=[];for(const f of l)out.push({name:f.name,size:f.size,sha256:await digest('SHA-256',await f.arrayBuffer())});return out};
$('#sealbtn').addEventListener('click',async()=>{const fs=[...$('#sealfiles').files],o=$('#sealout');if(!fs.length){o.innerHTML=verdict('warn',esc(t('sealNeed')));return}
 o.innerHTML=verdict('info',esc(t('working')));$('#sealjson').value=JSON.stringify({type:'pillarwise-seal',created:new Date().toISOString(),files:await hashFiles(fs)},null,1);$('#sealcopy').disabled=false;o.innerHTML=verdict('ok',esc(t('sealMade',{n:fs.length})));setRes('I','sealmade','ok')});
$('#sealcopy').addEventListener('click',e=>copy($('#sealjson').value,e.target));
$('#checkbtn').addEventListener('click',async()=>{
 const o=$('#sealout');let seal;try{seal=JSON.parse($('#sealjson').value);if(!/seal$/.test(seal.type))throw 0}catch(e){o.innerHTML=verdict('warn',esc(t('sealBadJ')));return}
 const fs=[...$('#checkfiles').files];if(!fs.length){o.innerHTML=verdict('warn',esc(t('sealNeed')));return}
 const now=await hashFiles(fs),base=new Map(seal.files.map(f=>[f.name,f])),seen=new Set();let bad=0;
 const rows=now.map(f=>{const b=base.get(f.name);seen.add(f.name);if(!b)return[f.name,'warn','st_new'];if(b.sha256===f.sha256)return[f.name,'ok','st_same'];bad++;return[f.name,'bad','st_changed']});
 seal.files.filter(f=>!seen.has(f.name)).forEach(f=>rows.push([f.name,'warn','st_missing']));
 o.innerHTML=(bad?verdict('bad',esc(t('sealBad',{n:bad})),esc(t('sealBadW'))):verdict('ok',esc(t('sealOk'))))+`<table class="t"><tr><th>${esc(t('colFile'))}</th><th>${esc(t('colStatus'))}</th></tr>${rows.map(([n,l,s])=>`<tr><td>${esc(n)}</td><td><span class="dot d-${l}" style="margin:0 6px"></span>${esc(t(s))}</td></tr>`).join('')}</table>`;
 finding('seal',bad?'I':null,'f_seal',null,10);addHist('I','sealT',bad?'bad':'ok',bad?'sealBad':'sealOk',{n:bad},now.length+' files');
});

/* ---------- AVAILABILITY ---------- */
function renderRisk(){const d=$('#lastbk').value,n=+$('#perday').value||0,o=$('#riskout');if(!d){o.innerHTML=`<p class="note">${esc(t('riskPick'))}</p>`;return}
 const days=Math.max(0,Math.floor((Date.now()-new Date(d+'T00:00'))/864e5)),l=days<=7?'ok':days<=30?'warn':'bad';
 o.innerHTML=verdict(l,esc(t('riskLine',{d:days})),esc(t('riskW',{n:(days*n).toLocaleString()})));finding('bk',days>30?'A':null,'f_bk',{d:days},8);setRes('A','bk',l)}
$('#lastbk').addEventListener('input',renderRisk);$('#perday').addEventListener('input',renderRisk);
$('#ecbtn').addEventListener('click',e=>{const tx=`${t('cardHead')}\n\n${t('cardWhere')}:\n${$('#ec1').value||'-'}\n\n${t('cardBank')}: ${$('#ec2').value||'-'}\n\n${t('reportT')}: ${t('rep_bank')} ${t('rep_'+R)}\n${t('fix.u1')}`;copy(tx,e.target);setRes('A','card','ok');$('#ecout').innerHTML=`<div class="pre">${esc(tx)}</div>`});

/* ---------- AUTHENTICITY: links ---------- */
const BRANDS=[
['HBL',['hbl.com'],['hbl']],['Meezan Bank',['meezanbank.com'],['meezan','meezanbank']],['UBL',['ubldigital.com','ubl.com.pk'],['ubl']],['MCB',['mcb.com.pk'],['mcb']],['Bank Alfalah',['bankalfalah.com'],['alfalah','bankalfalah']],['Easypaisa',['easypaisa.com.pk'],['easypaisa']],['JazzCash',['jazzcash.com.pk'],['jazzcash']],['NADRA',['nadra.gov.pk'],['nadra']],['FBR',['fbr.gov.pk'],['fbr']],['PTA',['pta.gov.pk'],['pta']],['NCCIA',['nccia.gov.pk'],['nccia']],['BISP',['bisp.gov.pk'],['bisp','benazir','ehsaas']],['Pakistan Post',['pakpost.gov.pk'],['pakpost']],['Daraz',['daraz.pk'],['daraz']],
['SBI',['onlinesbi.sbi','sbi.co.in','sbi.bank.in'],['sbi','onlinesbi']],['HDFC Bank',['hdfcbank.com','hdfc.bank.in'],['hdfc','hdfcbank']],['ICICI Bank',['icicibank.com','icici.bank.in'],['icici','icicibank']],['Paytm',['paytm.com'],['paytm']],['UIDAI (Aadhaar)',['uidai.gov.in'],['uidai','aadhaar','aadhar']],['India Post',['indiapost.gov.in'],['indiapost']],
['UK Government',['gov.uk'],[]],['HMRC',['gov.uk'],['hmrc']],['DVLA',['gov.uk'],['dvla']],['Royal Mail',['royalmail.com'],['royalmail']],['HSBC',['hsbc.co.uk','hsbc.com'],['hsbc']],['Barclays',['barclays.co.uk','barclays.com'],['barclays']],['Lloyds Bank',['lloydsbank.com'],['lloyds','lloydsbank']],['NatWest',['natwest.com'],['natwest']],
['IRS',['irs.gov'],['irs']],['USPS',['usps.com'],['usps']],['Chase',['chase.com'],['chase']],['Bank of America',['bankofamerica.com'],['bankofamerica']],['Wells Fargo',['wellsfargo.com'],['wellsfargo']],['FedEx',['fedex.com'],['fedex']],['UPS',['ups.com'],['ups']],
['Google',['google.com','gmail.com','youtube.com'],['google','gmail']],['Microsoft',['microsoft.com','live.com','office.com','outlook.com'],['microsoft','outlook','office365','hotmail']],['Apple',['apple.com','icloud.com'],['apple','icloud','appleid']],['PayPal',['paypal.com'],['paypal']],['Facebook',['facebook.com','fb.com'],['facebook']],['Instagram',['instagram.com'],['instagram']],['WhatsApp',['whatsapp.com','wa.me'],['whatsapp']],['Amazon',['amazon.com','amazon.in','amazon.co.uk'],['amazon']],['Netflix',['netflix.com'],['netflix']],['DHL',['dhl.com'],['dhl']],['Binance',['binance.com'],['binance']],['Coinbase',['coinbase.com'],['coinbase']]];
const SLD=['com.pk','gov.pk','org.pk','edu.pk','net.pk','gop.pk','co.uk','org.uk','ac.uk','gov.uk','police.uk','co.in','gov.in','org.in','bank.in','com.au','com.br','co.jp','com.mx','com.ar','gob.mx','gob.es','com.sa','gov.sa','ae.org'];
const BADTLD=['xyz','top','click','live','icu','buzz','cfd','sbs','rest','zip','mov','gq','tk','ml','cf','ga','work','loan','monster','quest','bond','cyou','support','lat'];
const SHORT=['bit.ly','tinyurl.com','t.ly','cutt.ly','is.gd','rb.gy','shorturl.at','goo.su','ow.ly','tiny.cc','s.id','rebrand.ly','t.co','lnkd.in','qrco.de'];
const lev=(a,b)=>{const m=a.length,n=b.length;if(Math.abs(m-n)>2)return 9;let p=Array.from({length:n+1},(_,i)=>i);for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]};
const norm=s=>s.replace(/rn/g,'m').replace(/vv/g,'w').replace(/0/g,'o').replace(/1/g,'l').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t');
const regDomain=h=>{const p=h.split('.'),l2=p.slice(-2).join('.');return SLD.includes(l2)&&p.length>=3?p.slice(-3).join('.'):l2};
function inspectUrl(raw){
 raw=raw.trim();const sig=[];let risk=0;const add=(lvl,k,v,w)=>{sig.push({lvl,t:t(k,v),why:t(k+'W',v)});risk+=w};
 if(/^(javascript|data|vbscript):/i.test(raw)){add('bad','u_js',null,100);return{risk:100,sig,host:'',reg:''}}
 let u;try{u=new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)?raw:'https://'+raw)}catch(e){return null}
 if(!u.hostname.includes('.')&&!/^\[/.test(u.hostname))return null;
 const rawHost=raw.replace(/^[a-z][a-z0-9+.-]*:\/\//i,'').split(/[\/?#]/)[0].split('@').pop().split(':')[0];
 const host=u.hostname.toLowerCase().replace(/\.$/,''),reg=regDomain(host),tld=host.split('.').pop(),regLabel=reg.split('.')[0];
 if(u.protocol==='http:')add('warn','u_http',null,12);
 if(u.username||raw.split(/[?#]/)[0].includes('@'))add('bad','u_at',null,30);
 if(/^\d{1,3}(\.\d{1,3}){3}$/.test(host)||host.startsWith('['))add('bad','u_ip',null,25);
 if(/[^\x00-\x7F]/.test(rawHost)||host.split('.').some(l=>l.startsWith('xn--')))add('bad','u_idn',null,35);
 const official=BRANDS.find(([,ds])=>ds.some(d=>host===d||host.endsWith('.'+d)));
 if(official)sig.push({lvl:'ok',t:t('u_off',{b:official[0]}),why:t('u_offW')});
 else{const tokens=host.split(/[.-]/).filter(Boolean);let hit=null;
  outer:for(const[n,ds,ks]of BRANDS)for(const k of ks){
   if(tokens.includes(k)||(k.length>=6&&host.includes(k))){if(ds.some(d=>host===d||host.endsWith('.'+d)))continue;hit={n,r:ds[0],how:'name'};break outer}
   for(const tk of tokens){if(tk!==k&&k.length>=4&&norm(tk)===k){hit={n,r:ds[0],how:'typo',tk};break outer}if(k.length>=6&&tk.length>=5&&lev(tk,k)===1){hit={n,r:ds[0],how:'typo',tk};break outer}}}
  if(hit){if(hit.how==='name')add('bad','u_brand',{b:hit.n,r:hit.r,d:reg},45);else add('bad','u_typo',{t:hit.tk,b:hit.n,r:hit.r},45)}}
 if(BADTLD.includes(tld))add('warn','u_tld',{t:tld},15);
 if(SHORT.includes(host))add('warn','u_short',null,15);
 if(host.split('.').length-reg.split('.').length>=3)add('warn','u_sub',null,12);
 if((regLabel.match(/-/g)||[]).length>=2)add('warn','u_hy',null,8);
 if(u.port&&!['80','443'].includes(u.port))add('warn','u_port',{p:u.port},8);
 const kw=(u.pathname+u.search+host).toLowerCase().match(/login|signin|verify|update|secure|account|wallet|otp|kyc|password|unlock|suspend|challan|refund|reward|prize|claim|redelivery/g);
 if(kw&&!official)add('warn','u_kw',{w:[...new Set(kw)].slice(0,3).join(', ')},10);
 if(raw.length>120)add('info','u_long',null,4);
 if(!sig.length)sig.push({lvl:'info',t:t('u_clean'),why:t('u_cleanW')});
 return{risk:Math.min(100,risk),sig,host,reg,u};
}
const urlV=r=>r.risk>=40?['bad','vHigh']:r.risk>=15?['warn','vMid']:['ok','vLow'];
$('#urlbtn').addEventListener('click',()=>{
 const r=inspectUrl($('#url').value),o=$('#urlout');if(!r){o.innerHTML=verdict('warn',esc(t('urlBad')));return}
 const[l,k]=urlV(r);
 o.innerHTML=verdict(l,esc(t(k))+' · '+esc(t('risk',{n:r.risk})),r.reg?esc(t('owner',{d:''}))+`<b class="mono" dir="ltr">${esc(r.reg)}</b>`:'')+sigList(r.sig)+(r.u?xbox(`<dl class="kv"><dt>${esc(t('scheme'))}</dt><dd class="mono">${esc(r.u.protocol)}</dd><dt>${esc(t('host'))}</dt><dd class="mono" dir="ltr">${esc(r.host)}</dd><dt>${esc(t('regd'))}</dt><dd class="mono" dir="ltr">${esc(r.reg)}</dd><dt>${esc(t('path'))}</dt><dd class="mono" dir="ltr">${esc(r.u.pathname+r.u.search)}</dd></dl>`):'');
 finding('url',l==='bad'?'Au':null,'f_url',{d:r.reg||'script'},9);addHist('Au','urlT',l,k,null,r.reg||'script');
});
$('#url').addEventListener('keydown',e=>{if(e.key==='Enter')$('#urlbtn').click()});

/* ---------- AUTHENTICITY: messages (multilingual patterns) ---------- */
const RULES=[
 ['otp',40,/\b(otp|pin|m-?pin|t-?pin|cvv|cvc|verification code|security code|one[- ]time (code|password)|\d[- ]digit code|c[oó]digo|clave|contrase[ñn]a|mot de passe|code de v[ée]rification)\b|code\s*(bata|bhej|send|share|forward|de|batao)\w*|کوڈ|پن کوڈ|رمز|كلمة المرور|कोड|ओटीपी/gi],
 ['urg',12,/\b(urgent\w*|urgente|immediately|inmediatamente|right now|within \d+\s*(hours?|hrs?|minutes?|mins?|horas?)|en \d+ horas|last chance|final (notice|warning)|today only|expires? today|jaldi|foran|fauran|turant|abhi|imm[ée]diatement)\b|فوری|جلدی|ابھی|عاجل|فورا|तुरंत|जल्दी/gi],
 ['thr',18,/\b(block(ed)?|suspend(ed)?|deactivat\w*|closed|band ho\w*|block ho\w*|legal action|arrest\w*|warrant|penalty|case darj|bloquead[ao]|suspendid[ao]|cerrad[ao]|bloqu[ée]e?|suspendu)\b|بند ہو|گرفتار|جرمانہ|حظر|إيقاف|ब्लॉक|बंद/gi],
 ['prize',22,/\b(congratulations|congrats|you (have )?won|winner|prize|lottery|lucky draw|inaam|inam|mubarak ho|reward|gift card|cash prize|jeeto|felicidades|ganador|premio|sorteo|f[ée]licitations|gagn[ée])\b|انعام|مبارک ہو|قرعہ اندازی|مبروك|جائزة|इनाम|बधाई/gi],
 ['aid',15,/\b(bisp|benazir|ehsaas|kafalat|8171|pm kisan|stimulus|relief fund|subsidio|ayuda del gobierno)\b|بینظیر|احساس|کفالت/gi],
 ['fine',15,/\b(e-?challan|challan|traffic (fine|violation)|toll (charge|unpaid)|unpaid toll|excise|token tax|multa|amende|pcn)\b|چالان|مخالفة|चालान/gi],
 ['id',16,/\b(cnic|aadhaar|aadhar|pan card|ssn|social security|id card|shanakhti|national insurance|date of birth|mother'?s maiden|card number|account number|kyc|dni|n[uú]mero de cuenta)\b|شناختی کارڈ|بطاقة الهوية|आधार/gi],
 ['money',20,/\b(send|transfer|bhej\w*|jama kar\w*|deposit|pay|env[ií]a|transfiere|paga|paye[rz]?|virement)\b[^.\n]{0,30}(\b(rs\.?|pkr|inr|rupees?|money|paise|paisay|amount|fee|charges|dinero|euros?|d[oó]lares)\b|[₹$£€]\s?\d)|\b(easypaisa|jazzcash|upi|gift ?cards?|bitcoin|crypto)\b|پیسے بھیج|حوّل|تحويل/gi],
 ['imp',8,/\b(bank|banco|banque|helpline|fia|nccia|pta|nadra|fbr|state bank|sbp|rbi|irs|hmrc|police|polic[ií]a|customs|aduana|courier|tcs|leopards|dhl|fedex|ups|usps|royal mail|correos|head office)\b/gi],
 ['secret',15,/\b(don'?t tell|do not tell|keep (this|it) (secret|private|confidential)|confidential|kisi ko na|kisi ko mat|no se lo digas|no le digas|ne le dites)\b|کسی کو نہ|لا تخبر|किसी को मत/gi],
 ['invest',16,/\b(double your|guaranteed (profit|returns?)|daily (profit|income|earning)|investment plan|part[- ]time job|work from home|earn (rs\.?\s*|\$)?\d+|ghar baithe|task|ganancias garantizadas|trabajo desde casa|gana dinero)\b|گھر بیٹھے|ربح مضمون|घर बैठे/gi],
 ['parcel',10,/\b(parcel|package|shipment|delivery (failed|pending)|redelivery|customs duty|address (update|incomplete)|paquete|env[ií]o|colis|livraison)\b|پارسل|طرد|पार्सल/gi],
 ['phone',12,/(\+92|0092|\b0)3\d{2}[- ]?\d{7}\b|\+91[- ]?[6-9]\d{9}\b|\b\d{3}[- .]\d{3}[- .]\d{4}\b/g],
 ['link',8,/(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|\b[a-z0-9-]+\.(com|pk|in|uk|net|org|xyz|top|info|live|click|site|online|shop|ly|me|icu|es|mx)(\/[^\s<>"']*)?)/gi]];
$('#msgsample').addEventListener('click',()=>{$('#msg').value=sampleText();$('#msgbtn').click()});
$('#msgbtn').addEventListener('click',()=>{
 const m=$('#msg').value,o=$('#msgout');if(!m.trim()){o.innerHTML=verdict('warn',esc(t('msgNeed')));return}
 let risk=0;const fired=[],marks=[];
 RULES.forEach(([id,w,re])=>{re.lastIndex=0;const ms=[...m.matchAll(re)];if(ms.length){risk+=w;fired.push([id,w]);ms.forEach(x=>marks.push([x.index,x.index+x[0].length]))}});
 const links=[...m.matchAll(RULES[RULES.length-1][2])].map(x=>x[0].replace(/[.,)!?]+$/,'')),lr=links.map(l=>({l,r:inspectUrl(l)})).filter(x=>x.r);
 lr.forEach(x=>risk+=Math.round(x.r.risk*.5));if(fired.some(f=>f[0]==='otp')&&fired.length>1)risk+=10;risk=Math.min(100,risk);
 marks.sort((a,b)=>a[0]-b[0]);let html='',pos=0;marks.forEach(([s,e])=>{if(s<pos)return;html+=esc(m.slice(pos,s))+`<mark class="hl">${esc(m.slice(s,e))}</mark>`;pos=e});html+=esc(m.slice(pos));
 const l=risk>=45?'bad':risk>=20?'warn':'ok',k=l==='bad'?'mHigh':l==='warn'?'mMid':'mLow';
 o.innerHTML=verdict(l,esc(t(k))+' · '+esc(t('risk',{n:risk})),esc(t(k+'W'))+(l==='bad'?' '+esc(t('rep_'+R)):''))
  +(fired.length?sigList(fired.map(([id,w])=>({lvl:w>=15?'bad':'warn',t:t('rule.'+id)[0],why:t('rule.'+id)[1]}))):'')
  +lr.map(x=>{const[vl,vk]=urlV(x.r);return verdict(vl,esc(t('linkIn'))+': <span class="mono" dir="ltr">'+esc(x.l)+'</span>',esc(t(vk))+' · '+esc(t('owner',{d:x.r.reg}))+' · '+esc(x.r.sig[0].t))}).join('')
  +`<label>${esc(t('where'))}</label><div class="pre">${html}</div>`;
 finding('msg',l==='bad'?'Au':null,'f_msg',null,9);addHist('Au','msgT',l,k,null,risk+'/100');
});

/* ---------- AUTHENTICITY: headers ---------- */
$('#hdrbtn').addEventListener('click',()=>{
 const raw=$('#hdr').value.replace(/\r/g,'').replace(/\n[ \t]+/g,' '),o=$('#hdrout'),H={};
 raw.split('\n').forEach(line=>{const m=line.match(/^([A-Za-z0-9-]+):\s*(.*)$/);if(m)(H[m[1].toLowerCase()]=H[m[1].toLowerCase()]||[]).push(m[2])});
 if(!H.from){o.innerHTML=verdict('warn',esc(t('hdrNoFrom')),esc(t('hdrNoFromW')));return}
 const dom=s=>(((s||'').match(/@([a-z0-9.-]+)/i)||[])[1]||'').toLowerCase();
 const from=H.from[0],fd=dom(from),rp=dom((H['return-path']||[''])[0]),rt=dom((H['reply-to']||[''])[0]);
 const ar=(H['authentication-results']||[]).join(' ; ')+' '+(H['arc-authentication-results']||[]).join(' ');
 const res=k=>((ar.match(new RegExp('\\b'+k+'=(\\w+)','i'))||[])[1]||'').toLowerCase()||(k==='spf'&&H['received-spf']?H['received-spf'][0].split(/\s/)[0].toLowerCase():'');
 const sig=[];let risk=0;
 [['SPF','spf','whySPF',20],['DKIM','dkim','whyDKIM',20],['DMARC','dmarc','whyDMARC',45]].forEach(([n,k,why,w])=>{const v=res(k);
  if(!v){sig.push({lvl:'warn',t:t('hNone',{x:n}),why:t('hNoneW')});risk+=10}else if(v==='pass')sig.push({lvl:'ok',t:t('hPass',{x:n}),why:t(why)});else{sig.push({lvl:'bad',t:t('hFail',{x:n,v}),why:t(why)});risk+=w}});
 const dm=res('dmarc');
 if(rp&&fd&&regDomain(rp)!==regDomain(fd)){sig.push({lvl:'info',t:t('hRP',{d:rp}),why:t('hRPW')});if(dm!=='pass')risk+=10}
 if(rt&&fd&&regDomain(rt)!==regDomain(fd)){sig.push({lvl:'warn',t:t('hRT',{d:rt}),why:t('hRTW')});risk+=20}
 const disp=(from.split('<')[0]||'').toLowerCase(),b=BRANDS.find(([n,ds,ks])=>ks.some(k=>k.length>=4&&disp.includes(k))||disp.includes(n.toLowerCase()));
 if(b&&fd&&!b[1].some(d=>fd===d||fd.endsWith('.'+d))){sig.push({lvl:'bad',t:t('hDisp',{b:b[0],d:fd}),why:t('hDispW')});risk+=35}
 risk=Math.min(100,risk);const l=risk>=40?'bad':risk>=15?'warn':'ok';
 o.innerHTML=verdict(l,esc(t(l==='bad'?'hvBad':l==='warn'?'hvMid':'hvOk')),esc(t('shown',{d:fd})))+sigList(sig)+xbox(`<dl class="kv"><dt>From</dt><dd class="mono" dir="ltr">${esc(from)}</dd><dt>Return-Path</dt><dd class="mono">${esc(rp||'-')}</dd><dt>Reply-To</dt><dd class="mono">${esc(rt||'-')}</dd><dt>${esc(t('hops'))}</dt><dd>${(H.received||[]).length}</dd><dt>Message-ID</dt><dd class="mono" dir="ltr">${esc((H['message-id']||['-'])[0])}</dd></dl>`);
 finding('hdr',l==='bad'?'Au':null,'f_hdr',{d:fd},8);addHist('Au','hdrT',l,l==='bad'?'hvBad':l==='warn'?'hvMid':'hvOk',null,fd);
});

/* ---------- NON-REPUDIATION ---------- */
let keys=null,ident=null;const EC={name:'ECDSA',namedCurve:'P-256'},SG={name:'ECDSA',hash:'SHA-256'};
const fingerprint=async j=>(await digest('SHA-256',enc.encode(`${j.crv}:${j.x}:${j.y}`))).slice(0,32).toUpperCase().match(/.{4}/g).join(' ');
async function setIdentity(priv,pub,name){
 keys={priv,pub};const j=await crypto.subtle.exportKey('jwk',pub),pk={kty:j.kty,crv:j.crv,x:j.x,y:j.y};ident={name:name||'—',publicKey:pk,fingerprint:await fingerprint(pk)};
 $('#keyout').innerHTML=verdict('ok',esc(t('keyReady',{n:ident.name})),esc(t('keyReadyW')))+`<dl class="kv" style="margin-top:10px"><dt>${esc(t('fp'))}</dt><dd class="fp" dir="ltr">${ident.fingerprint}</dd></dl><div class="row"><button class="btn ghost" id="fpcopy">${esc(t('copyFp'))}</button><button class="btn ghost" id="privcopy">${esc(t('copyKey'))}</button></div><p class="note">${esc(t('keyWarn'))}</p>`+xbox(`<dl class="kv"><dt>Algorithm</dt><dd>ECDSA P-256 / SHA-256 (WebCrypto)</dd><dt>Public JWK</dt><dd class="mono" dir="ltr">${esc(JSON.stringify(pk))}</dd><dt>Fingerprint</dt><dd>SHA-256("crv:x:y"), first 128 bits</dd></dl>`);
 $('#fpcopy').addEventListener('click',e=>copy(ident.fingerprint,e.target));$('#privcopy').addEventListener('click',async e=>{const kp=$('#keypass').value;if(kp.length<8){$('#keyout .note').textContent=t('keyPassShort');$('#keypass').focus();return}const jw=await crypto.subtle.exportKey('jwk',keys.priv);const data=TXT+b64(await encryptBytes(enc.encode(JSON.stringify(jw)),kp));copy(JSON.stringify({type:'pillarwise-key',v:2,name:ident.name,data}),e.target)});$('#signbtn').disabled=false;setRes('NR','key','ok')}
$('#keygen').addEventListener('click',async()=>{const kp=await crypto.subtle.generateKey(EC,true,['sign','verify']);await setIdentity(kp.privateKey,kp.publicKey,$('#signame').value.trim())});
$('#keyimpbtn').addEventListener('click',async()=>{const ta=$('#keyimp');if(ta.style.display==='none'){ta.style.display='block';ta.focus();return}
 try{const s=JSON.parse(ta.value);let jw=s.key;if(s.data){jw=JSON.parse(dec.decode(await decryptBytes(unb64(s.data.slice(TXT.length)),$('#keypass').value)))}const priv=await crypto.subtle.importKey('jwk',jw,EC,true,['sign']),pub=await crypto.subtle.importKey('jwk',{kty:jw.kty,crv:jw.crv,x:jw.x,y:jw.y,ext:true},EC,true,['verify']);$('#signame').value=s.name||'';await setIdentity(priv,pub,s.name);ta.style.display='none';ta.value=''}catch(e){$('#keyout').innerHTML=verdict('bad',esc(t('keyBad')))}});
const canon=r=>JSON.stringify({v:r.v,type:r.type,signer:{name:r.signer.name,fingerprint:r.signer.fingerprint,publicKey:{kty:r.signer.publicKey.kty,crv:r.signer.publicKey.crv,x:r.signer.publicKey.x,y:r.signer.publicKey.y}},content:{kind:r.content.kind,name:r.content.name,size:r.content.size,sha256:r.content.sha256},statement:r.statement,signedAt:r.signedAt});
async function contentOf(fe,te){const f=fe.files[0];if(f)return{kind:'file',name:f.name,size:f.size,sha256:await digest('SHA-256',await f.arrayBuffer())};const x=te.value;if(!x)return null;const b=enc.encode(x);return{kind:'text',name:'',size:b.length,sha256:await digest('SHA-256',b)}}
$('#signbtn').addEventListener('click',async()=>{
 const o=$('#signout');if(!keys){o.innerHTML=verdict('warn',esc(t('signNeedKey')));return}
 const c=await contentOf($('#sigfile'),$('#sigtext'));if(!c){o.innerHTML=verdict('warn',esc(t('signNeed')));return}
 const r={v:1,type:'pillarwise-signed-receipt',signer:{name:ident.name,fingerprint:ident.fingerprint,publicKey:ident.publicKey},content:c,statement:$('#signote').value.trim(),signedAt:new Date().toISOString()};
 r.signature=b64(await crypto.subtle.sign(SG,keys.priv,enc.encode(canon(r))));const s=JSON.stringify(r,null,1);
 o.innerHTML=verdict('ok',esc(t('signed')),esc(t('signedW')))+`<textarea class="mono" dir="ltr" readonly>${esc(s)}</textarea><div class="row"><button class="btn ghost" id="rcopy">${esc(t('copyRec'))}</button></div>`+xbox(`<p class="note">The signature covers the content's SHA-256, the public key, statement and timestamp. The timestamp is the signer's own clock; for legal-grade evidence add an RFC 3161 trusted timestamp or a qualified e-signature.</p>`);
 $('#rcopy').addEventListener('click',e=>copy(s,e.target));addHist('NR','signT','ok','signed',null,c.kind==='file'?c.name:'');
});
$('#verbtn').addEventListener('click',async()=>{
 const o=$('#verout');let r;try{r=JSON.parse($('#vrec').value);if(!/signed-receipt$/.test(r.type))throw 0}catch(e){o.innerHTML=verdict('warn',esc(t('vBadRec')));return}
 const sig=[];let ok=true;
 try{const pub=await crypto.subtle.importKey('jwk',{...r.signer.publicKey,ext:true},EC,false,['verify']);if(await crypto.subtle.verify(SG,pub,unb64(r.signature),enc.encode(canon(r))))sig.push({lvl:'ok',t:t('sigOk'),why:t('sigOkW')});else{ok=false;sig.push({lvl:'bad',t:t('sigBad'),why:t('sigBadW')})}}catch(e){ok=false;sig.push({lvl:'bad',t:t('sigErr'),why:t('sigBadW')})}
 let realFp='';try{realFp=await fingerprint(r.signer.publicKey)}catch(e){}
 if(realFp!==r.signer.fingerprint){ok=false;sig.push({lvl:'bad',t:t('fpTamper'),why:t('sigBadW')})}
 const c=await contentOf($('#vfile'),$('#vtext'));
 if(!c)sig.push({lvl:'warn',t:t('noOrig'),why:t('noOrigW')});else if(c.sha256===r.content.sha256)sig.push({lvl:'ok',t:t('cOk'),why:t('cOkW')});else{ok=false;sig.push({lvl:'bad',t:t('cBad'),why:t('cBadW')})}
 const exp=$('#vfp').value.toUpperCase().replace(/[^0-9A-F]/g,'');let idOk=null;
 if(exp){idOk=exp===realFp.replace(/ /g,'');sig.push(idOk?{lvl:'ok',t:t('idOk'),why:t('idOkW',{n:r.signer.name})}:{lvl:'bad',t:t('idBad'),why:t('idBadW',{n:r.signer.name})});if(!idOk)ok=false}
 else sig.push({lvl:'warn',t:t('idUnk'),why:t('idUnkW')});
 const l=!ok?'bad':idOk?'ok':'warn';addHist('NR','verT',l,!ok?'vFail':idOk?'vOk':'vPart',{n:r.signer.name},r.signer.name);
 o.innerHTML=verdict(l,esc(!ok?t('vFail'):idOk?t('vOk',{n:r.signer.name}):t('vPart')),esc(t('vAt',{d:new Date(r.signedAt).toLocaleString(L)}))+(r.statement?' · “'+esc(r.statement)+'”':''))+sigList(sig)+xbox(`<dl class="kv"><dt>${esc(t('fp'))}</dt><dd class="fp" dir="ltr">${realFp}</dd><dt>SHA-256</dt><dd class="mono" dir="ltr">${esc(r.content.sha256)}</dd></dl>`);
});

setMode(expert);show(location.hash.slice(1)||'ov');applyLang();if(!store.get('seen',false))openDlg('welcome');
}
