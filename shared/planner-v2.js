 
;(function(){
'use strict';













const GH_PAGES_ROOT = 'https://libbard.github.io/Byte';

function projectRoot(){
  const p = location.pathname;
  
  const g = p.search(/\/Byte\//i);
  if(g >= 0) return location.origin + p.slice(0, g) + '/Byte';
  
  const lv = p.search(/\/L\d+\//i);
  if(lv >= 0) return location.origin + p.slice(0, lv);
  
  const oth = p.search(/\/others\//i);
  if(oth >= 0) return location.origin + p.slice(0, oth);
  
  return location.origin + p.replace(/\/[^/]*$/, '');
}



function cfgURLs(rels, relFallbacks){
  if(typeof rels === 'string') rels = [rels];
  const root = projectRoot();
  const out  = [];
  
  for(const rel of rels) out.push(`${root}/${rel}`);
  
  if(root !== GH_PAGES_ROOT){
    for(const rel of rels) out.push(`${GH_PAGES_ROOT}/${rel}`);
  }
  
  if(relFallbacks) out.push(...relFallbacks);
  return [...new Set(out)];
}



const PROJECT_CFG_URLS = cfgURLs('config/project.json', [
  '../../config/project.json',    
  '../../../config/project.json'  
]);
const AI_WORKER_URL    = 'https://garden-planner.xxli50xx.workers.dev';
const FB_DEBOUNCE      = 2000;
const MAX_UNDO         = 15;


function getLvl(){
  const m=location.pathname.match(/\/L(\d+)\//i);
  if(m) return m[1];
  if(location.pathname.includes('/others/')) return 'others';
  return '5';
}
const LEVEL = getLvl();
function sKey()  { return `planner_v2_L${LEVEL}`; }
function prgKey(){ return `planner_v2_progress_L${LEVEL}`; }
function lgcKey(){ return `planner_legacy_pref_L${LEVEL}`; }
function lang()  { return localStorage.getItem('garden_lang')||'ar'; }
function isAr()  { return lang()==='ar'; }
function tx(a,e) { return isAr()?a:e; }
function uid()   { return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }


function applyLang(){
  const ar=isAr();
  
  document.documentElement.setAttribute('dir',ar?'rtl':'ltr');
  document.documentElement.setAttribute('lang',ar?'ar':'en');
  
  document.querySelectorAll('[data-ar]').forEach(el=>{
    const v=ar?el.dataset.ar:el.dataset.en;
    if(v!==undefined&&el.children.length===0)el.textContent=v;
  });
  
  const ltx=document.getElementById('lang-label');if(ltx)ltx.textContent=ar?'AR':'EN';
  
  document.querySelectorAll('.pv2-tab').forEach(t=>{
    const span=t.querySelector('span:last-child');
    if(!span)return;
    if(t.dataset.plan==='midterm')span.textContent=ar?'ميدتيرم':'Midterm';
    if(t.dataset.plan==='final')span.textContent=ar?'فاينل':'Final';
  });
  
  const bmp=document.getElementById('btn-mode-plan');if(bmp){const sp=bmp.querySelector('span');if(sp)sp.textContent=ar?'تخطيط':'Plan';}
  const bmt=document.getElementById('btn-mode-track');if(bmt){const sp=bmt.querySelector('span');if(sp)sp.textContent=ar?'متابعة':'Track';}
  
  
  document.querySelectorAll('[data-ar][data-en]').forEach(el=>{if(!el.children.length)el.textContent=ar?el.dataset.ar:el.dataset.en;});
  const logo=document.querySelector('.pv2-logo-text');if(logo)logo.textContent=ar?'خطة المذاكرة':'Study Plan';
  
  const prevBtn=document.querySelector('.pv2-nav-btn:first-child i');
  const nextBtn=document.querySelector('.pv2-nav-btn:nth-child(3) i');
  if(prevBtn)prevBtn.className=ar?'fas fa-chevron-right':'fas fa-chevron-left';
  if(nextBtn)nextBtn.className=ar?'fas fa-chevron-left':'fas fa-chevron-right';
  
  const navBtns=document.querySelectorAll('.pv2-nav-btn');
  if(navBtns[0])navBtns[0].title=ar?'السابق':'Previous';
  if(navBtns[1])navBtns[1].title=ar?'التالي':'Next';
  
  document.querySelectorAll('.pv2-tool-label').forEach(el=>{
    if(el.dataset.ar&&el.dataset.en)el.textContent=' '+(ar?el.dataset.ar:el.dataset.en);
  });
  document.querySelectorAll('.pv2-view-label').forEach(el=>{
    if(el.dataset.ar&&el.dataset.en)el.textContent=' '+(ar?el.dataset.ar:el.dataset.en);
  });
}


const PALETTE=['#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#10b981',
  '#14b8a6','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#64748b','#292524'];



const DAY_AR  = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const DAY_EN  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_ENS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MON_AR  = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const MON_EN  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKEND  = new Set([5,6]); 

function pad(n)      { return String(n).padStart(2,'0'); }
function toStr(d)    { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function today()     { return toStr(new Date()); }
function dObj(s)     { return new Date(s+'T00:00:00'); }
function addD(s,n)   { const d=dObj(s);d.setDate(d.getDate()+n);return toStr(d); }
function wkStart(s)  { const d=dObj(s);d.setDate(d.getDate()-d.getDay());return toStr(d); }
function moStart(s)  { const d=dObj(s);d.setDate(1);return toStr(d); }
function dIdx(s)     { return dObj(s).getDay(); }
function dName(s)    { return isAr()?DAY_AR[dIdx(s)]:DAY_EN[dIdx(s)]; }
function dNameS(s)   { return isAr()?DAY_AR[dIdx(s)]:DAY_ENS[dIdx(s)]; }
function mName(s)    { return isAr()?MON_AR[dObj(s).getMonth()]:MON_EN[dObj(s).getMonth()]; }
function yr(s)       { return dObj(s).getFullYear(); }
function dom(s)      { return dObj(s).getDate(); }
function dDiff(a,b)  { return Math.round((dObj(a)-dObj(b))/86400000); }
function fmt(s)      { return `${dom(s)}/${dObj(s).getMonth()+1}`; }
function fmtL(s)     { return `${dName(s)} ${dom(s)} ${mName(s)}`; }
function isWE(s)     { return WEEKEND.has(dIdx(s)); }


function fmtH(h){
  if(!h||h<=0) return '';
  const n=Math.round(h*10)/10;
  if(!isAr()) return `${n}h`;
  if(n===1)   return 'ساعة';
  if(n===2)   return 'ساعتان';
  if(n<=10)   return `${n} ساعات`;
  return `${n} ساعة`;
}


function defData(){
  return{ version:2, level:LEVEL, active_plan:'midterm',
    plans:{
      midterm:{start_date:'',end_date:'',course_exams:{},entries:{},excluded_courses:[]},
      final:  {start_date:'',end_date:'',course_exams:{},entries:{},excluded_courses:[]}
    },
    module_notes:{}, module_status:{}, custom_courses:[],
    _deletedMods:{}, _deletedCourses:[], _seenElectives:[], _autoExcludedElectives:[],
    settings:{view_mode:'week',chip_view:'compact',sidebar_collapsed:false,hours_per_day:null,app_mode:'plan'}
  };
}
function migrate(d){
  for(const t of['midterm','final']){
    if(!d.plans[t]) d.plans[t]={start_date:'',end_date:'',course_exams:{},entries:{},excluded_courses:[]};
    if(!d.plans[t].course_exams) d.plans[t].course_exams={};
    if(!d.plans[t].excluded_courses) d.plans[t].excluded_courses=[];
    if(!d.plans[t].end_date) d.plans[t].end_date=d.plans[t].exam_date||'';
  }
  if(!d.settings)       d.settings={};
  if(!d.settings.chip_view)     d.settings.chip_view='compact';
  if(!d.module_notes)   d.module_notes={};
  if(!d.module_status)  d.module_status={};
  if(!d._deletedMods)   d._deletedMods={};
  if(!d._deletedCourses) d._deletedCourses=[];
  if(!d._seenElectives) d._seenElectives=[];
  if(!d._autoExcludedElectives) d._autoExcludedElectives=[];
  if(!d.custom_courses) d.custom_courses=[];
  return d;
}


const S={
  data:null,cMap:null,projCfg:null,
  activePlan:'midterm',appMode:'plan',viewMode:'week',chipView:'compact',studyView:'cards',
  weekStart:null,monthDate:null,dragging:null,undoStack:[],_fbTimer:null,
  _touchGhost:null,_touchData:null,cardIdx:0,_cardInit:false
};

let _edgeNavTimer=null;
let _calSwipeSX=null,_calSwipeSY=null,_calSwipeOK=false;


async function loadData(){
  const key=sKey();
  if(window.FirebaseSync){
    try{
      const fb=await new Promise(res=>{
        const r=window.FirebaseSync.load?window.FirebaseSync.load(key):null;
        if(r&&typeof r.then==='function') r.then(res).catch(()=>res(null)); else res(r);
      });
      if(fb&&fb.version===2){S.data=migrate(fb);localStorage.setItem(key,JSON.stringify(S.data));return;}
    }catch(_){}
  }
  try{const raw=localStorage.getItem(key);if(raw){const d=JSON.parse(raw);if(d&&d.version===2){S.data=migrate(d);return;}}}catch(_){}
  S.data=defData();
}

function saveData(){
  if(!S.data)return;
  S.data.level=LEVEL;
  const key=sKey();
  localStorage.setItem(key,JSON.stringify(S.data));
  clearTimeout(S._fbTimer);
  S._fbTimer=setTimeout(()=>{
    if(!window.FirebaseSync)return;
    try{const fn=window.FirebaseSync.save||window.FirebaseSync.set;if(fn)fn(key,S.data);}catch(_){}
  },FB_DEBOUNCE);
  updatePrg();
}

function updatePrg(){
  let total=0,done=0;
  for(const p of Object.values(S.data.plans||{}))
    for(const e of Object.values(p.entries||{}))
      for(const item of(e.items||[]))if(item.type==='module'){total++;if(item.completed)done++;}
  
  if(S.data?.module_status)for(const[key,st]of Object.entries(S.data.module_status)){
    if(st==='mastered'){const[cid,mid]=key.split('_');
    const alreadyInCal=Object.values(S.data.plans||{}).some(p=>Object.values(p.entries||{}).some(e=>(e.items||[]).some(i=>i.type==='module'&&i.course_id===cid&&i.module_id===mid)));
    if(!alreadyInCal){total++;done++;}}
  }
  localStorage.setItem(prgKey(),JSON.stringify({total,completed:done,percent:total?Math.round(done/total*100):0}));
}

function snap()   { S.undoStack.push(JSON.stringify(S.data));if(S.undoStack.length>MAX_UNDO)S.undoStack.shift(); }
function doUndo() { if(!S.undoStack.length)return;S.data=JSON.parse(S.undoStack.pop());saveData();render(); }


function pData(t){ t=t||S.activePlan;if(!S.data.plans[t])S.data.plans[t]={start_date:'',end_date:'',course_exams:{},entries:{}};return S.data.plans[t]; }
function cPlan()     { return pData(S.activePlan); }
function ensE(d)     { const p=cPlan();if(!p.entries[d])p.entries[d]={items:[],day_note:''};return p.entries[d]; }


function dayHours(d){
  const e=cPlan().entries?.[d];if(!e)return 0;
  let total=0;
  (e.items||[]).forEach(item=>{
    if(item.type==='module'){
      const md=getMd(item.course_id,item.module_id);
      total += (md?.study_hours_estimate || 2) / (item.total_parts || 1);
    }
  });
  return Math.round(total*10)/10;
}

function dayOverCap(d){
  const cap=S.data?.settings?.hours_per_day;
  if(!cap)return false;
  return dayHours(d) > cap;
}
function cleanE(d)   { const p=cPlan();const e=p.entries[d];if(e&&!(e.items&&e.items.length)&&!e.day_note)delete p.entries[d]; }
function allFlat(pt) { const r=[];for(const[d,e]of Object.entries(pData(pt).entries||{}))for(const item of(e.items||[]))r.push({date:d,item});return r; }


function placedSet(pt){
  const s=new Set();
  
  for(const{item}of allFlat(pt||S.activePlan))if(item.type==='module')s.add(`${item.course_id}_${item.module_id}`);
  
  if(S.data?.module_status)for(const[key,st]of Object.entries(S.data.module_status))if(st==='mastered')s.add(key);
  return s;
}
function isPlaced(cid,mid){ return placedSet(S.activePlan).has(`${cid}_${mid}`); }


function countInstances(cid,mid,pt){
  let n=0;
  for(const{item}of allFlat(pt||S.activePlan)){
    if(item.type==='module'&&item.course_id===cid&&item.module_id===mid)n++;
  }
  return n;
}

function isModuleCompleted(cid,mid,pt){
  
  if(S.data?.module_status?.[`${cid}_${mid}`]==='mastered')return true;
  
  for(const{item}of allFlat(pt||S.activePlan)){
    if(item.type==='module'&&item.course_id===cid&&item.module_id===mid&&item.completed)return true;
  }
  return false;
}


function _autoInstanceLabel(cid,mid){
  const count=countInstances(cid,mid);
  if(count===0)return{kind:'study',n:0};
  return{kind:'review',n:count};  
}
function instanceLabel(item,arForce){
  
  if(item.custom_label)return item.custom_label;
  const ar=(arForce!==undefined?arForce:isAr());
  if(item.instance_kind==='review'){
    return ar?`مراجعة ${item.instance_n||1}`:`Review ${item.instance_n||1}`;
  }
  
  return '';  
}

function placeM(d,cid,mid,part,tot,opts){
  part=part||1;tot=tot||1;
  const e=ensE(d);e.items=e.items||[];
  
  
  if(part>1){
    if(e.items.some(i=>i.type==='module'&&i.course_id===cid&&i.module_id===mid&&(i.part||1)===part))return false;
    e.items.push({id:uid(),type:'module',course_id:cid,module_id:mid,part,total_parts:tot,completed:false,instance_kind:'study',instance_n:0});
    return true;
  }
  
  const{kind,n}=opts?.kind?{kind:opts.kind,n:opts.n||(kind==='review'?countInstances(cid,mid):0)}:_autoInstanceLabel(cid,mid);
  
  
  if(kind==='study'&&e.items.some(i=>i.type==='module'&&i.course_id===cid&&i.module_id===mid&&i.instance_kind==='study')){
    return false;
  }
  
  e.items.push({id:uid(),type:'module',course_id:cid,module_id:mid,part,total_parts:tot,completed:false,instance_kind:kind,instance_n:n});
  return true;
}
function placeEv(d,cid,et,label){ const e=ensE(d);e.items=e.items||[];e.items.push({id:uid(),type:'event',course_id:cid,event_type:et,label:label||evLabel(et,cid),completed:false}); }
function removeItem(d,id){ const p=cPlan();const e=p.entries[d];if(!e)return;e.items=(e.items||[]).filter(i=>i.id!==id);cleanE(d); }
function moveItem(from,to,id){
  if(from===to)return;const p=cPlan();const fe=p.entries[from];if(!fe)return;
  const item=(fe.items||[]).find(i=>i.id===id);if(!item)return;
  fe.items=fe.items.filter(i=>i.id!==id);cleanE(from);
  const te=ensE(to);te.items=te.items||[];te.items.push(item);
}
function toggleDone(d,id){
  const e=cPlan().entries[d];if(!e)return;const item=(e.items||[]).find(i=>i.id===id);if(!item)return;
  item.completed=!item.completed;saveData();render();
}
function splitItem(d,id){
  const e=cPlan().entries[d];if(!e)return;const item=(e.items||[]).find(i=>i.id===id);if(!item||item.type!=='module')return;
  snap();item.part=1;item.total_parts=2;placeM(addD(d,1),item.course_id,item.module_id,2,2);saveData();render();
}
function unsplitItem(d,id){
  const e=cPlan().entries[d];if(!e)return;const item=(e.items||[]).find(i=>i.id===id);if(!item||item.type!=='module')return;
  snap();const cid=item.course_id,mid=item.module_id;const targetKind=item.instance_kind||'study';const targetN=item.instance_n||0;
  item.part=1;item.total_parts=1;
  
  for(const[dt,en]of Object.entries(cPlan().entries)){
    en.items=(en.items||[]).filter(i=>!(i.type==='module'&&i.course_id===cid&&i.module_id===mid&&i.part===2&&(i.instance_kind||'study')===targetKind&&(i.instance_n||0)===targetN));
    cleanE(dt);
  }
  saveData();render();
}


const COLORS=['#2E86C1','#27AE60','#8E44AD','#E74C3C','#F39C12','#16A085','#6C3483','#1A5276'];
function cColor(cid){
  if(S.data?._colorOverrides?.[cid])return S.data._colorOverrides[cid];
  if(S.cMap?.courses?.[cid]?.color)return S.cMap.courses[cid].color;
  const cc=(S.data?.custom_courses||[]).find(x=>x.id===cid);if(cc?.color)return cc.color;
  let h=0;for(let i=0;i<cid.length;i++)h=(h*31+cid.charCodeAt(i))&0xfffffff;
  return COLORS[Math.abs(h)%COLORS.length];
}
function allCourses(){
  const list=[];
  const deletedCourses=new Set(S.data?._deletedCourses||[]);
  if(S.cMap?.courses) for(const[id,data]of Object.entries(S.cMap.courses)){
    if(deletedCourses.has(id))continue;
    const deleted=(S.data?._deletedMods?.[id]||[]);
    const mods=Object.entries(data.modules||{})
      .filter(([mid])=>!deleted.includes(mid))
      .map(([mid,md])=>({id:mid,name:isAr()?(md.title||mid):(md.title_en||md.title||mid),diff:md.module_difficulty||5,hours:md.study_hours_estimate||2,topics:md.topics||[]}));
    list.push({id,isCustom:false,isElective:!!data.is_elective,name:isAr()?(data.name||id):(data.name_en||data.name||id),color:data.color||cColor(id),mods});
  }
  for(const c of(S.data?.custom_courses||[]))
    list.push({id:c.id,isCustom:true,isElective:false,name:isAr()?(c.name_ar||c.name||c.id):(c.name_en||c.name||c.id),color:c.color||cColor(c.id),
      mods:(c.modules||[]).map((m,i)=>({id:`M${pad(i+1)}`,name:typeof m==='string'?m:(m.name||`Module ${i+1}`),diff:5,hours:2,topics:[]}))});
  return list;
}

function isCourseElective(cid){
  return !!(S.cMap?.courses?.[cid]?.is_elective);
}

function activeCoursesForPlan(planType){
  planType=planType||S.activePlan;
  const p=pData(planType);
  const excluded=new Set(p.excluded_courses||[]);
  return allCourses().filter(c=>!excluded.has(c.id));
}

function availableCurriculumCourses(){
  const active=new Set(allCourses().map(c=>c.id));
  const list=[];
  if(S.cMap?.courses)for(const[id,data]of Object.entries(S.cMap.courses)){
    if(active.has(id))continue;
    list.push({id,name:isAr()?(data.name||id):(data.name_en||data.name||id),color:data.color||cColor(id),wasDeleted:true});
  }
  return list;
}
function getMd(cid,mid){ return S.cMap?.courses?.[cid]?.modules?.[mid]||null; }
function mTitle(cid,mid){
  const md=getMd(cid,mid);if(!md){const cc=(S.data?.custom_courses||[]).find(x=>x.id===cid);if(cc){const idx=parseInt(mid.replace(/^M/i,''))-1;const m=(cc.modules||[])[idx];if(m)return typeof m==='string'?m:(m.name||mid);}return mid;}
  return isAr()?(md.title||mid):(md.title_en||md.title||mid);
}
function dLbl(s){ if(s>=8)return'critical';if(s>=6)return'hard';if(s>=3)return'medium';return'easy'; }
function dTx(l) { return{critical:tx('حرج','Critical'),hard:tx('صعب','Hard'),medium:tx('متوسط','Medium'),easy:tx('سهل','Easy')}[l]||l; }


const EV_TYPES=[
  {id:'midterm',icon:'📝',ar:'اختبار الميدتيرم',en:'Midterm Exam'},
  {id:'final',  icon:'🎓',ar:'اختبار الفاينل',  en:'Final Exam'},
  {id:'quiz',   icon:'✏️',ar:'كويز',             en:'Quiz'},
  {id:'assign', icon:'📋',ar:'واجب',             en:'Assignment'},
  {id:'project',icon:'💼',ar:'مشروع',            en:'Project'},
  {id:'review_mid', icon:'📖',ar:'مراجعة',    en:'Review'},
  {id:'review_final',icon:'📚',ar:'مراجعة',  en:'Review'},
  {id:'review_full', icon:'⭐',ar:'مراجعة شاملة',          en:'Full Review'},
  {id:'other',  icon:'📌',ar:'حدث آخر',          en:'Other'}
];
function evLabel(t,cid){ const e=EV_TYPES.find(x=>x.id===t);const l=e?(isAr()?e.ar:e.en):t,ic=e?e.icon:'📌';return cid?`${ic} ${l} — ${cid}`:`${ic} ${l}`; }


function dynamicEvLabel(item){
  if(!item||item.type!=='event')return item?.label||'';
  return evLabel(item.event_type, item.course_id);
}

function evTypeName(et){
  const e=EV_TYPES.find(x=>x.id===et);
  return e?(isAr()?e.ar:e.en):et;
}
function evIcon(t){ return(EV_TYPES.find(x=>x.id===t)||{icon:'📌'}).icon; }
function evColor(t){ return{midterm:'#f59e0b',final:'#ef4444',quiz:'#8b5cf6',assign:'#3b82f6',project:'#10b981',review_mid:'#6366f1',review_final:'#6366f1',review_full:'#f59e0b',other:'#64748b'}[t]||'#64748b'; }


function modal(html){
  const o=document.getElementById('pv2-modal-overlay');const c=document.getElementById('pv2-modal-content');
  if(!o||!c)return;c.innerHTML=html;o.classList.add('active');
  
  setTimeout(()=>{o.onclick=e=>{if(e.target===o)closeModal();};},80);
}
function closeModal(){ document.getElementById('pv2-modal-overlay')?.classList.remove('active'); }


function renderSidebar(){
  const container=document.getElementById('courses-list');if(!container)return;
  _initOpenCourses(); 
  
  const courses=activeCoursesForPlan(S.activePlan);
  const placed=placedSet(S.activePlan);const compact=S.chipView==='compact';
  const icon=document.getElementById('chip-view-icon');
  if(icon)icon.className=compact?'fas fa-list':'fas fa-th-large';

  
  const p=cPlan();
  const excluded=new Set(p.excluded_courses||[]);
  const deleted=new Set(S.data?._deletedCourses||[]);
  const restorable=[];
  if(S.cMap?.courses)for(const[id,data]of Object.entries(S.cMap.courses)){
    if(excluded.has(id)||deleted.has(id)){
      restorable.push({id,name:isAr()?(data.name||id):(data.name_en||data.name||id),color:cColor(id),reason:deleted.has(id)?'deleted':'excluded'});
    }
  }

  let coursesHTML='';
  if(!courses.length){
    coursesHTML=`<div style="padding:1rem;text-align:center;color:var(--text-muted);font-size:.82rem">${tx('لا توجد مواد في هذه الخطة','No courses in this plan')}</div>`;
  } else {
    coursesHTML=courses.map(course=>{
    const plcCnt=course.mods.filter(m=>placed.has(`${course.id}_${m.id}`)).length;
    const total=course.mods.length;const color=cColor(course.id);
    const isOpen=_openCourses.has(course.id);

    const modsHTML=compact?renderCompactMods(course,placed,color,isOpen):renderDetailedMods(course,placed,color,isOpen);

    return`<div class="pv2-course-section${isOpen?' open':''}${course.isElective?' is-elective':''}" id="csec-${course.id}">
      <div class="pv2-course-header" style="border-inline-start:3px solid ${color}">
        <div class="pv2-course-color-dot" style="background:${color};cursor:pointer" onclick="PV2.toggleCourse('${course.id}')"></div>
        <div class="pv2-course-header-info" style="cursor:pointer" onclick="PV2.toggleCourse('${course.id}')">
          <span class="pv2-course-name">${course.name}${course.isElective?' <span class="pv2-elective-mini-badge" title="'+tx('مادة اختيارية','Elective')+'">⭐</span>':''}</span>
          <span class="pv2-course-id">${course.id}</span>
        </div>
        <span class="pv2-course-count${plcCnt===total&&total>0?' done':''}">${plcCnt}/${total}</span>
        <button class="pv2-chip-info-btn" style="font-size:.7rem;min-width:26px;color:#a78bfa;border-color:rgba(167,139,250,.3)" onclick="PV2.showEditCourse('${course.id}')" title="${tx('تعديل المادة','Edit Course')}"><i class="fas fa-pen-to-square"></i></button>
        <button class="pv2-chip-info-btn" style="font-size:.7rem;min-width:26px;color:#ef4444;border-color:rgba(239,68,68,.3)" onclick="PV2.excludeCourseFromPlan('${course.id}')" title="${tx('إخراج من هذه الخطة','Exclude from this plan')}"><i class="fas fa-eye-slash"></i></button>
        <span class="pv2-course-toggle" id="ctgl-${course.id}" style="cursor:pointer" onclick="PV2.toggleCourse('${course.id}')">${isOpen?'▲':'▼'}</span>
      </div>
      ${modsHTML}
    </div>`;
  }).join('');
  }

  
  let restoreHTML='';
  if(restorable.length){
    restoreHTML=`<div class="pv2-restore-section">
      <div class="pv2-restore-header" onclick="PV2.toggleRestoreSection()">
        <i class="fas fa-rotate-left" style="color:#f59e0b"></i>
        <span>${tx('استعادة مواد','Restore Courses')}</span>
        <span class="pv2-restore-count">${restorable.length}</span>
        <i class="fas fa-chevron-down" id="restore-toggle-icon" style="margin-inline-start:auto;font-size:.7rem;color:var(--text-muted)"></i>
      </div>
      <div class="pv2-restore-list" id="pv2-restore-list" style="display:none">
        ${restorable.map(c=>`<div class="pv2-restore-item" onclick="PV2.restoreCourse('${c.id}')">
          <div class="pv2-restore-dot" style="background:${c.color}"></div>
          <div class="pv2-restore-info">
            <div class="pv2-restore-name">${c.name}</div>
            <div class="pv2-restore-meta">${c.id} · ${c.reason==='deleted'?tx('محذوفة','deleted'):tx('مستبعدة','excluded')}</div>
          </div>
          <i class="fas fa-plus" style="color:#10b981"></i>
        </div>`).join('')}
      </div>
    </div>`;
  }

  container.innerHTML=coursesHTML+restoreHTML;
  initTouch();
}


let _restoreSectionOpen=false;
function toggleRestoreSection(){
  const list=document.getElementById('pv2-restore-list');
  const icon=document.getElementById('restore-toggle-icon');
  if(!list)return;
  _restoreSectionOpen=!_restoreSectionOpen;
  list.style.display=_restoreSectionOpen?'flex':'none';
  if(icon)icon.style.transform=_restoreSectionOpen?'rotate(180deg)':'rotate(0deg)';
}


function restoreCourse(cid){
  const p=cPlan();
  if(p.excluded_courses)p.excluded_courses=p.excluded_courses.filter(x=>x!==cid);
  if(S.data._deletedCourses)S.data._deletedCourses=S.data._deletedCourses.filter(x=>x!==cid);
  saveData();render();
}


function excludeCourseFromPlan(cid){
  if(!confirm(tx(`إخراج ${cid} من خطة ${S.activePlan==='midterm'?'الميدتيرم':'الفاينل'}؟\n(يمكن استعادتها لاحقاً)`,`Exclude ${cid} from ${S.activePlan} plan?\n(You can restore later)`)))return;
  const p=cPlan();
  if(!p.excluded_courses)p.excluded_courses=[];
  if(!p.excluded_courses.includes(cid))p.excluded_courses.push(cid);
  
  for(const[d,e]of Object.entries(p.entries||{})){
    e.items=(e.items||[]).filter(i=>i.course_id!==cid);
    if(!e.items.length&&!e.day_note)delete p.entries[d];
  }
  if(p.course_exams)delete p.course_exams[cid];
  saveData();render();
}

function renderCompactMods(course,placed,color,open){
  const mods=course.mods.map(mod=>{
    const ip=placed.has(`${course.id}_${mod.id}`);
    const isDone=isModuleCompleted(course.id,mod.id);
    const instCount=countInstances(course.id,mod.id);
    const st=typeof getModStatus==='function'?getModStatus(course.id,mod.id):'new';
    
    
    const isMastered=(st==='mastered');
    const showCheck=isDone||isMastered;
    
    const startedIcon=(!showCheck&&st==='started')?'📖':'';
    
    let styleStr;
    if(showCheck){
      styleStr=`background:rgba(16,185,129,.15);color:#10b981;border:2px solid #10b981;opacity:.85`;
    } else if(ip){
      styleStr=`opacity:.65;border:2px solid ${color};background:transparent;color:${color}`;
    } else {
      styleStr=`background:${color};color:#fff;border:2px solid ${color}`;
    }
    const instBadge=instCount>1?` <span style="background:rgba(0,0,0,.2);padding:0 4px;border-radius:4px;font-size:.65em">×${instCount}</span>`:'';
    const checkIcon=showCheck?' ✓':'';
    return`<div class="pv2-mod-pill${ip?' placed':''}${showCheck?' completed':''}"
      style="${styleStr}"
      data-course="${course.id}" data-module="${mod.id}"
      draggable="true" title="${mod.id} — ${mod.name}${ip?` (${tx('مدرجة','placed')} ${instCount}×)`:''}${showCheck?` ✓ ${tx('مكتملة','completed')}`:''}"
      ondragstart="PV2._chipDragStart(event,'${course.id}','${mod.id}')"
      ondragend="PV2._chipDragEnd(event)"
      onclick="event.stopPropagation();PV2.showModStatusMenu('${course.id}','${mod.id}')"
      oncontextmenu="event.preventDefault();PV2.showModStatusMenu('${course.id}','${mod.id}')">${mod.id}${checkIcon}${startedIcon?` ${startedIcon}`:''}${instBadge}</div>`;
  }).join('');
  const revChips=typeof reviewChipsHTML==='function'?reviewChipsHTML(course.id,color):'';
  return`<div class="pv2-modules-list pv2-mods-compact" id="cmods-${course.id}" style="display:${open?'flex':'none'}">
    ${mods}${revChips}
    <button class="pv2-add-event-course-btn" style="width:100%;margin-top:4px" onclick="PV2.showAddEvModal(null,'${course.id}')"><i class="fas fa-plus"></i> ${tx('حدث','Event')}</button>
  </div>`;
}

function renderDetailedMods(course,placed,color,open){
  const chips=course.mods.map(mod=>{
    const ip=placed.has(`${course.id}_${mod.id}`);
    const isDone=isModuleCompleted(course.id,mod.id);
    const instCount=countInstances(course.id,mod.id);
    const dl=dLbl(mod.diff);const note=S.data.module_notes?.[`${course.id}_${mod.id}`]||'';
    const pts=allFlat(S.activePlan).filter(({item})=>item.type==='module'&&item.course_id===course.id&&item.module_id===mod.id);
    const pi=pts.length>1?` <small style="color:#10b981">(${tx('جزئين','2pts')})</small>`:'';
    return`<div class="pv2-module-chip${ip?' placed':''}${isDone?' completed':''}"
      data-course="${course.id}" data-module="${mod.id}"
      draggable="true"
      ondragstart="PV2._chipDragStart(event,'${course.id}','${mod.id}')"
      ondragend="PV2._chipDragEnd(event)">
      <div class="pv2-chip-id-bar" style="background:${color}">${mod.id}</div>
      <div class="pv2-chip-body">
        <div class="pv2-chip-title">${(mod.name||mod.id).slice(0,34)}${(mod.name||'').length>34?'…':''}</div>
        <div class="pv2-chip-meta">
          <span class="pv2-diff-badge ${dl}">${dTx(dl)}</span>
          ${mod.hours?`<span class="pv2-hours-badge">${fmtH(mod.hours)}</span>`:''}
          ${note?`<span class="pv2-note-dot" title="${note}">📝</span>`:''}
          ${isDone?`<span class="pv2-done-badge">✓ ${tx('تمت','done')}</span>`:(ip?`<span class="pv2-placed-badge">${instCount>1?`${instCount}×`:'✓'}${pi}</span>`:'')}
        </div>
      </div>
      <button class="pv2-chip-info-btn" title="${tx('تفاصيل','Details')}"
        onclick="(function(e){e.stopPropagation();e.preventDefault();setTimeout(function(){PV2.showModDetail('${course.id}','${mod.id}')},10);})(event)">
        <i class="fas fa-circle-info"></i>
      </button>
    </div>`;
  }).join('');
  return`<div class="pv2-modules-list pv2-mods-detailed" id="cmods-${course.id}" style="display:${open?'flex':'none'}">
    ${chips}
    ${typeof reviewChipsHTML==='function'?reviewChipsHTML(course.id,color):''}
    <div class="pv2-course-events-row"><button class="pv2-add-event-course-btn" onclick="PV2.showAddEvModal(null,'${course.id}')"><i class="fas fa-plus"></i> ${tx('إضافة حدث','Add Event')}</button></div>
  </div>`;
}


const _openCourses = new Set();
let _coursesInitialized = false;

function _initOpenCourses(){
  if(_coursesInitialized)return;
  _coursesInitialized=true;
  
  const courses=allCourses();
  if(courses.length)_openCourses.add(courses[0].id);
}

function toggleCourse(cid){
  const el=document.getElementById(`cmods-${cid}`);const sec=document.getElementById(`csec-${cid}`);const tgl=document.getElementById(`ctgl-${cid}`);
  if(!el)return;const open=el.style.display!=='none';
  el.style.display=open?'none':'flex';if(sec)sec.classList.toggle('open',!open);if(tgl)tgl.textContent=open?'▼':'▲';
  if(open)_openCourses.delete(cid);else _openCourses.add(cid);
}
function toggleChipView(){
  S.chipView=S.chipView==='detailed'?'compact':'detailed';
  S.data.settings.chip_view=S.chipView;
  saveData();renderSidebar();
}
function toggleSidebar(){
  const sb=document.getElementById('pv2-sidebar');const icon=document.getElementById('sidebar-toggle-icon');
  if(!sb)return;const c=sb.classList.toggle('collapsed');S.data.settings.sidebar_collapsed=c;
  if(icon)icon.className=`fas fa-chevron-${c?(isAr()?'left':'right'):(isAr()?'right':'left')}`;
  saveData();
}


function calItem(d,item,idx,total){
  const color=cColor(item.course_id);const done=item.completed;
  const moveButtons=`<div class="pv2-cal-item-move">
    <button class="pv2-move-btn" onclick="event.stopPropagation();PV2.moveItemUp('${d}','${item.id}')" ${idx===0?'disabled':''}>▲</button>
    <button class="pv2-move-btn" onclick="event.stopPropagation();PV2.moveItemDown('${d}','${item.id}')" ${idx>=total-1?'disabled':''}>▼</button>
  </div>`;
  if(item.type==='module'){
    const pt=item.total_parts>1?` (${item.part}/${item.total_parts})`:'';
    const title=mTitle(item.course_id,item.module_id);
    const note=S.data.module_notes?.[`${item.course_id}_${item.module_id}`]||'';
    const instLabel=instanceLabel(item);
    const instBadge=instLabel?`<span class="pv2-cal-inst-badge" title="${tx('اضغط للتعديل','Tap to edit')}">${instLabel}</span>`:'';
    return`<div class="pv2-cal-item${done?' done':''}${item.instance_kind==='review'?' review-instance':''}" draggable="true" data-item-id="${item.id}" data-date="${d}"
         ondragstart="PV2._calDragStart(event,'${d}','${item.id}')"
         ondragend="PV2._chipDragEnd(event)"
         onclick="PV2.showItemMenu('${d}','${item.id}')">
      <div class="pv2-cal-bar" style="background:${color}"></div>
      <div class="pv2-cal-body">
        <div class="pv2-cal-top"><span class="pv2-cal-badge" style="background:${color}">${item.course_id}</span><span class="pv2-cal-mid">${item.module_id}${pt}</span>${instBadge}</div>
        <div class="pv2-cal-title">${title.slice(0,28)}${title.length>28?'…':''}</div>
        ${note?'<div class="pv2-cal-note-dot">📝</div>':''}
      </div>
      ${total>1?moveButtons:''}
      <button class="pv2-item-done-btn${done?' done':''}" onclick="event.stopPropagation();PV2.toggleDone('${d}','${item.id}')">${done?'✓':'○'}</button>
    </div>`;
  }
  const isReview=item.event_type&&item.event_type.startsWith('review');
  const ec=isReview&&item.course_id?cColor(item.course_id):evColor(item.event_type);
  return`<div class="pv2-cal-item pv2-cal-event${done?' done':''}" draggable="true" data-item-id="${item.id}" data-date="${d}"
       ondragstart="PV2._calDragStart(event,'${d}','${item.id}')"
       ondragend="PV2._chipDragEnd(event)" onclick="PV2.showItemMenu('${d}','${item.id}')">
    <div class="pv2-cal-bar" style="background:${ec}"></div>
    <div class="pv2-cal-body">
      <div class="pv2-cal-top"><span class="pv2-cal-ev-icon">${evIcon(item.event_type)}</span>${item.course_id?`<span class="pv2-cal-mid">${item.course_id}</span>`:''}</div>
      <div class="pv2-cal-ev-label">${evLabel(item.event_type,item.course_id).slice(0,30)}</div>
    </div>
    ${total>1?moveButtons:''}
    <button class="pv2-item-done-btn${done?' done':''}" onclick="event.stopPropagation();PV2.toggleDone('${d}','${item.id}')">${done?'✓':'○'}</button>
  </div>`;
}


function renderWeek(){
  const grid=document.getElementById('calendar-grid');if(!grid)return;
  const p=cPlan();const todayS=today();let html='<div class="pv2-week-grid">';
  for(let i=0;i<7;i++){
    const d=addD(S.weekStart,i);const entry=p.entries[d];const items=entry?.items||[];
    const di=dIdx(d);
    const isToday=d===todayS,isExam=p.end_date&&d===p.end_date,isWknd=isWE(d);
    const beforeSt=p.start_date&&d<p.start_date,afterEnd=p.end_date&&d>p.end_date;
    
    const cExam=Object.entries(p.course_exams||{}).find(([,ed])=>ed===d);

    let cls='pv2-day-col';
    if(isToday) cls+=' is-today';
    if(isExam||cExam) cls+=' is-exam';
    if(isWknd) cls+=' is-weekend';
    if(beforeSt) cls+=' out-range';
    if(afterEnd) cls+=' after-end';
    
    const isRestDay=!items.length&&entry?.day_note;
    if(isRestDay) cls+=' day-rest';

    
    let hrs=0;
    items.forEach(item=>{
      if(item.type==='module'){const md=getMd(item.course_id,item.module_id);hrs+=(md?.study_hours_estimate||2)/(item.total_parts||1);}
    });
    const limitH=S.data.settings?.hours_per_day;
    const hrsWarn=limitH&&hrs>limitH;

    const examTag=cExam?`<div class="pv2-exam-tag">📝 ${cExam[0]}</div>`:(isExam?`<div class="pv2-exam-tag">${tx('الاختبار','Exam')}</div>`:'');

    html+=`<div class="${cls}" data-date="${d}">
      <div class="pv2-day-header">
        <div class="pv2-day-name">${dNameS(d)}</div>
        <div class="pv2-day-date">${fmt(d)}</div>
        ${examTag}
        ${hrs>0?`<div class="pv2-day-hrs${hrsWarn?' warn':''}">${fmtH(hrs)}</div>`:''}
      </div>
      <div class="pv2-day-body" ondragover="PV2._dragOver(event)" ondrop="PV2._drop(event,'${d}')" ondragleave="PV2._dragLeave(event)">
        ${items.map((item,ii)=>calItem(d,item,ii,items.length)).join('')}
        ${!beforeSt&&!afterEnd&&!isExam?`<button class="pv2-day-add-btn" onclick="PV2.showAddEvModal('${d}',null)">+ ${tx('إضافة','Add')}</button>`:''}
      </div>
      <div class="pv2-day-foot">
        ${entry?.day_note
          ?`<div class="pv2-day-note-txt" onclick="PV2.editDayNote('${d}')">📝 ${(entry.day_note||'').slice(0,24)}${entry.day_note.length>24?'…':''}</div>`
          :`<button class="pv2-day-note-btn" onclick="PV2.editDayNote('${d}')">+ ${tx('ملاحظة','Note')}</button>`}
      </div>
    </div>`;
  }
  html+='</div>';
  grid.innerHTML=html;
  initTouchDropZones();
}


function renderMonth(){
  const grid=document.getElementById('calendar-grid');if(!grid)return;
  const p=cPlan();const todayS=today();
  const d0=dObj(S.monthDate);const year=d0.getFullYear();const month=d0.getMonth();
  const first=new Date(year,month,1);const lastDay=new Date(year,month+1,0).getDate();
  const startPad=first.getDay();

  const hdrs=(isAr()?DAY_AR:DAY_ENS).map(d=>`<div class="pv2-mo-hdr">${d.slice(0,isAr()?3:3)}</div>`).join('');
  let cells='';
  for(let i=0;i<startPad;i++) cells+='<div class="pv2-mo-cell empty"></div>';
  for(let day=1;day<=lastDay;day++){
    const ds=`${year}-${pad(month+1)}-${pad(day)}`;
    const isToday=ds===todayS,isWknd=isWE(ds);
    const cExam=Object.entries(p.course_exams||{}).find(([,ed])=>ed===ds);
    const isExam=(p.end_date&&ds===p.end_date)||!!cExam;
    const entry=p.entries[ds];const items=entry?.items||[];
    const modItems=items.filter(i=>i.type==='module');
    const doneC=modItems.filter(i=>i.completed).length;
    const pct=modItems.length?Math.round(doneC/modItems.length*100):0;
    const dots=items.slice(0,6).map(item=>{
      const col=item.type==='module'?cColor(item.course_id):evColor(item.event_type);
      return`<div class="pv2-mo-dot${item.completed?' done':''}" style="background:${col}"></div>`;
    }).join('');
    const extra=items.length>6?`<span class="pv2-mo-more">+${items.length-6}</span>`:'';
    const isRestDay=!items.length&&entry?.day_note;
    let cls='pv2-mo-cell';
    if(isToday)cls+=' is-today';if(isExam)cls+=' is-exam';if(isWknd)cls+=' is-weekend';
    if(isRestDay)cls+=' day-rest';
    cells+=`<div class="${cls}" data-date="${ds}" ondragover="PV2._dragOver(event)" ondrop="PV2._drop(event,'${ds}')" ondragleave="PV2._dragLeave(event)" onclick="PV2._moDayClick('${ds}')">
      ${isExam?'<span class="pv2-mo-exam-icon">📝</span>':''}
      ${isRestDay?'<span class="pv2-mo-rest-icon" title="'+tx('يوم راحة','Rest day')+'">☕</span>':''}
      <div class="pv2-mo-num">${day}</div>
      <div class="pv2-mo-dots">${dots}${extra}</div>
      ${pct>0?`<div class="pv2-mo-prg"><div class="pv2-mo-prg-fill" style="width:${pct}%"></div></div>`:''}
    </div>`;
  }
  grid.innerHTML=`<div class="pv2-month-grid"><div class="pv2-mo-hdrs">${hdrs}</div><div class="pv2-mo-days">${cells}</div></div>`;
  initTouchDropZones();
}

function _moDayClick(d){S.weekStart=wkStart(d);S.viewMode='week';S.data.settings.view_mode='week';document.querySelectorAll('.pv2-view-btn').forEach(b=>b.classList.toggle('active',b.dataset.view==='week'));render();}


function renderLegend(){
  const el=document.getElementById('pv2-legend');if(!el)return;
  const courses=activeCoursesForPlan(S.activePlan);const placed=placedSet(S.activePlan);const p=cPlan();
  if(!courses.length){el.innerHTML='';return;}

  const courseHTML=courses.map(course=>{
    const total=course.mods.length;
    const plcCnt=course.mods.filter(m=>placed.has(`${course.id}_${m.id}`)).length;
    const doneC=allFlat(S.activePlan).filter(({item})=>item.type==='module'&&item.course_id===course.id&&item.completed).length;
    const plcPct=total?plcCnt/total*100:0;const donePct=total?doneC/total*100:0;
    const color=cColor(course.id);const rem=total-plcCnt;
    const examDate=p.course_exams?.[course.id];
    return`<div class="pv2-legend-course">
      <div class="pv2-legend-top">
        <div class="pv2-legend-dot" style="background:${color}"></div>
        <span class="pv2-legend-cid">${course.id}</span>
        <span class="pv2-legend-cname">${course.name}</span>
        ${examDate?`<span class="pv2-legend-exam">📝 ${fmt(examDate)}</span>`:''}
        <span class="pv2-legend-nums" dir="ltr">${isAr()?`${total}/${plcCnt}/${doneC}`:`${doneC}/${plcCnt}/${total}`}</span>
      </div>
      <div class="pv2-legend-bar">
        <div class="pv2-legend-bar-plc" style="width:${plcPct}%;background:${color};opacity:.4"></div>
        <div class="pv2-legend-bar-done" style="width:${donePct}%;background:${color}"></div>
      </div>
      ${rem>0?`<div class="pv2-legend-rem">${tx(`لم يوزع: ${rem} وحدة`,`Remaining: ${rem} modules`)}</div>`:
               `<div class="pv2-legend-done-tag">✓ ${tx('اكتمل التوزيع','Fully Placed')}</div>`}
    </div>`;
  }).join('');

  const examInfo=p.end_date?`<div class="pv2-legend-exam-info">📅 ${tx('آخر اختبار:','Last exam:')} <strong>${fmtL(p.end_date)}</strong>${p.start_date?' · '+tx('البداية:','Start:')+' '+fmtL(p.start_date):''}</div>`:'';
  el.innerHTML=`<div class="pv2-legend-inner">${examInfo}<div class="pv2-legend-label">📊 ${tx('تقدم المواد','Course Progress')} <small>${tx('(أنهيت/موزّعة/الكل)','(done/placed/total)')}</small></div><div class="pv2-legend-courses">${courseHTML}</div></div>`;
}


function updateLabel(){
  const el=document.getElementById('cal-label');if(!el)return;
  if(S.viewMode==='week'){
    const end=addD(S.weekStart,6);
    el.textContent=isAr()?`${dom(S.weekStart)} ${mName(S.weekStart)} — ${dom(end)} ${mName(end)} ${yr(end)}`:`${mName(S.weekStart)} ${dom(S.weekStart)} — ${mName(end)} ${dom(end)}, ${yr(end)}`;
  }else{el.textContent=`${mName(S.monthDate)} ${yr(S.monthDate)}`;}
}


function render(){
  applyLang();
  
  
  const _drawerWasOpen = (() => { const d=document.getElementById('pv2-drawer'); return d?d.classList.contains('open'):false; })();
  if(S.appMode==='plan'){
    renderSidebar();updateLabel();
    S.viewMode==='week'?renderWeek():renderMonth();
    renderLegend();
    if(isMobile()){
      renderMobileDrawer();
      if(_drawerWasOpen){const d=document.getElementById('pv2-drawer');if(d)d.classList.add('open');}
      if(S._selectedMod)_highlightTapDays();
    }
  }else renderStudy();
}


function _chipDragStart(e,cid,mid){S.dragging={src:'chip',cid,mid};e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('text/plain',JSON.stringify({src:'chip',cid,mid}));e.currentTarget.classList.add('dragging');document.addEventListener('dragover',_docDragEdge);}
function _calDragStart(e,d,id){S.dragging={src:'cal',d,id};e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',JSON.stringify({src:'cal',d,id}));e.currentTarget.classList.add('dragging');document.addEventListener('dragover',_docDragEdge);}
function _chipDragEnd(e){_clearEdgeNav();document.removeEventListener('dragover',_docDragEdge);S.dragging=null;e.currentTarget.classList.remove('dragging');document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'));}
function _dragOver(e){e.preventDefault();const src=S.dragging?.src;e.dataTransfer.dropEffect=(src==='chip'||src==='evchip')?'copy':'move';const col=e.currentTarget.closest('[data-date]');if(col)col.classList.add('drag-over');e.currentTarget.classList.add('drag-over');}
function _dragLeave(e){e.currentTarget.classList.remove('drag-over');e.currentTarget.closest('[data-date]')?.classList.remove('drag-over');}
function _drop(e,targetD){
  e.preventDefault();document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'));
  let data=S.dragging;
  if(!data){try{data=JSON.parse(e.dataTransfer.getData('text/plain'));}catch(_){return;}}
  if(!data)return;
  const p=cPlan();
  if(p.start_date&&targetD<p.start_date)return;
  if(p.end_date&&targetD>p.end_date)return;
  snap();
  if(data.src==='chip'){
    
    const cid=data.cid||data.c;const mid=data.mid||data.m;
    if(isPlaced(cid,mid)){showSplitConfirm(targetD,cid,mid);return;}
    placeM(targetD,cid,mid);
  }else if(data.src==='evchip'){
    placeEv(targetD,data.c,data.et,evLabel(data.et,data.c));
  }else{
    moveItem(data.d,targetD,data.id);
  }
  saveData();render();
}

function showSplitConfirm(targetD,cid,mid){
  const title=mTitle(cid,mid);
  const revN=countInstances(cid,mid); 
  const revLabel=revN===0?tx('مراجعة 1','Review 1'):tx(`مراجعة ${revN}`,`Review ${revN}`);
  modal(`<div class="pv2-modal-header"><h3 class="pv2-modal-title">📦 ${tx('الوحدة موزّعة بالفعل','Module already placed')}</h3><button class="pv2-modal-close" onclick="PV2.closeModal()">✕</button></div>
    <p style="color:var(--text-secondary);font-size:.88rem;margin:.5rem 0 1rem">${mid}: <strong>${title}</strong></p>
    <p style="color:var(--text-primary);font-size:.88rem;margin-bottom:1rem">${tx('كيف تريد إضافتها لهذا اليوم؟','How do you want to add it to this day?')}</p>
    <div class="pv2-modal-actions" style="flex-direction:column;gap:.5rem">
      <button class="pv2-btn-primary" style="width:100%;text-align:start;display:flex;align-items:center;gap:.5rem;justify-content:flex-start" onclick="PV2._addAsReview('${targetD}','${cid}','${mid}')">
        <span style="font-size:1.1rem">📖</span>
        <span style="flex:1">${tx('أضف كـ','Add as')} <strong>${revLabel}</strong></span>
      </button>
      <button class="pv2-btn-secondary" style="width:100%;text-align:start;display:flex;align-items:center;gap:.5rem;justify-content:flex-start" onclick="PV2._doSplit('${targetD}','${cid}','${mid}')">
        <span style="font-size:1.1rem">✂️</span>
        <span style="flex:1">${tx('قسّم الوحدة على جلستين','Split into 2 parts')}</span>
      </button>
      <button class="pv2-btn-secondary" style="margin-top:.25rem" onclick="PV2.closeModal()">${tx('إلغاء','Cancel')}</button>
    </div>`);
}
function _addAsReview(targetD,cid,mid){
  closeModal();snap();
  placeM(targetD,cid,mid,1,1,{kind:'review'});
  saveData();render();
}
function _doSplit(targetD,cid,mid){
  closeModal();snap();
  for(const[,entry]of Object.entries(cPlan().entries))
    for(const item of(entry.items||[]))if(item.type==='module'&&item.course_id===cid&&item.module_id===mid){item.part=1;item.total_parts=2;}
  placeM(targetD,cid,mid,2,2);saveData();render();
}


function initTouch(){
  document.querySelectorAll('.pv2-module-chip:not(.placed),.pv2-mod-pill:not(.placed)').forEach(el=>{
    el.removeEventListener('touchstart',_touchChipStart);el.addEventListener('touchstart',_touchChipStart,{passive:false});
  });
  document.querySelectorAll('.pv2-cal-item').forEach(el=>{
    el.removeEventListener('touchstart',_touchCalStart);el.addEventListener('touchstart',_touchCalStart,{passive:false});
  });
}
function initTouchDropZones(){ _initCalSwipe(); }












function _clearEdgeNav(){
  clearTimeout(_edgeNavTimer);
  _edgeNavTimer=null;
  const calArea=document.getElementById('calendar-area');
  if(calArea){calArea.classList.remove('edge-left','edge-right');}
}

function _calDragEdgeCheck(clientX){
  if(S.viewMode!=='week')return;
  const calArea=document.getElementById('calendar-area');if(!calArea)return;
  const rect=calArea.getBoundingClientRect();
  const threshold=68;
  const nearLeft=clientX-rect.left<threshold;
  const nearRight=rect.right-clientX<threshold;
  
  calArea.classList.toggle('edge-left',nearLeft);
  calArea.classList.toggle('edge-right',nearRight);
  if(!nearLeft&&!nearRight){_clearEdgeNav();return;}
  if(_edgeNavTimer)return;
  _edgeNavTimer=setTimeout(()=>{
    _edgeNavTimer=null;
    calArea.classList.remove('edge-left','edge-right');
    const ar=isAr();
    
    if(nearLeft){S.weekStart=addD(S.weekStart,ar?1:-1);}
    else{S.weekStart=addD(S.weekStart,ar?-1:1);}
    render();
  },700);
}

function _initCalSwipe(){
  const calArea=document.getElementById('calendar-area');if(!calArea)return;
  calArea.removeEventListener('touchstart',_calSwipeTS);
  calArea.removeEventListener('touchmove',_calSwipeTM);
  calArea.removeEventListener('touchend',_calSwipeTE);
  calArea.addEventListener('touchstart',_calSwipeTS,{passive:true});
  calArea.addEventListener('touchmove',_calSwipeTM,{passive:true});
  calArea.addEventListener('touchend',_calSwipeTE,{passive:true});
}


function _calSwipeTS(e){
  if(S._touchGhost||S._touchData)return;
  if(e.target.closest('.pv2-cal-item,.pv2-module-chip,.pv2-mod-pill,.pv2-mod-chip,.pv2-day-add-btn,.pv2-day-note-btn,.pv2-day-note-txt,.pv2-item-done-btn,.pv2-move-btn'))return;
  _calSwipeSX=e.touches[0].clientX;
  _calSwipeSY=e.touches[0].clientY;
  _calSwipeOK=true;
}

function _calSwipeTM(e){
  if(!_calSwipeOK||_calSwipeSX===null)return;
  const dx=Math.abs(e.touches[0].clientX-_calSwipeSX);
  const dy=Math.abs(e.touches[0].clientY-_calSwipeSY);
  if(dy>dx+12){_calSwipeOK=false;_calSwipeSX=null;}
}

function _calSwipeTE(e){
  if(!_calSwipeOK||_calSwipeSX===null)return;
  const dx=e.changedTouches[0].clientX-_calSwipeSX;
  _calSwipeOK=false;_calSwipeSX=null;
  if(S.viewMode!=='week'||Math.abs(dx)<50)return;
  
  
  const ar=isAr();
  const shift=ar?-Math.sign(dx):Math.sign(dx);
  S.weekStart=addD(S.weekStart,shift);
  render();
}



function _docDragEdge(e){_calDragEdgeCheck(e.clientX);}


function _touchChipStart(e){const el=e.currentTarget;if(el.dataset.event){S._touchData={src:'evchip',c:el.dataset.course,et:el.dataset.event};}else{S._touchData={src:'chip',cid:el.dataset.course,mid:el.dataset.module};}; _touchBegin(e,el);}
function _touchCalStart(e){const el=e.currentTarget;S._touchData={src:'cal',d:el.dataset.date,id:el.dataset.itemId};_touchBegin(e,el);}
function _touchBegin(e,src){
  const t=e.touches[0];
  S._touchGhost=src.cloneNode(true);
  Object.assign(S._touchGhost.style,{position:'fixed',top:`${t.clientY-20}px`,left:`${t.clientX-60}px`,width:'120px',opacity:'.85',zIndex:'9999',pointerEvents:'none',borderRadius:'6px',boxShadow:'0 8px 24px rgba(0,0,0,.3)',transform:'scale(.95)'});
  document.body.appendChild(S._touchGhost);
  document.addEventListener('touchmove',_touchMove,{passive:false});
  document.addEventListener('touchend',_touchEnd,{passive:false});
  document.addEventListener('touchcancel',_touchCancel,{passive:false});
  e.preventDefault();
}
function _touchMove(e){
  e.preventDefault();const t=e.touches[0];
  if(S._touchGhost){S._touchGhost.style.top=`${t.clientY-20}px`;S._touchGhost.style.left=`${t.clientX-60}px`;}
  document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'));
  const el=document.elementFromPoint(t.clientX,t.clientY);
  (el?.closest('.pv2-day-body')||el?.closest('.pv2-mo-cell'))?.classList.add('drag-over');
  
  if(S._touchGhost)_calDragEdgeCheck(t.clientX);
}
function _touchEnd(e){
  _clearEdgeNav();
  const t=e.changedTouches[0];
  if(S._touchGhost){S._touchGhost.remove();S._touchGhost=null;}
  document.removeEventListener('touchmove',_touchMove);document.removeEventListener('touchend',_touchEnd);document.removeEventListener('touchcancel',_touchCancel);
  document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'));
  const el=document.elementFromPoint(t.clientX,t.clientY);const dayEl=el?.closest('[data-date]');
  if(!dayEl||!S._touchData){S._touchData=null;return;}
  const targetD=dayEl.dataset.date;if(!targetD){S._touchData=null;return;}
  const p=cPlan();
  if(p.start_date&&targetD<p.start_date){S._touchData=null;return;}
  if(p.end_date&&targetD>p.end_date){S._touchData=null;return;}
  snap();
  if(S._touchData.src==='chip'){
    if(isPlaced(S._touchData.cid,S._touchData.mid)){showSplitConfirm(targetD,S._touchData.cid,S._touchData.mid);}
    else{placeM(targetD,S._touchData.cid,S._touchData.mid);saveData();render();}
  }else if(S._touchData.src==='evchip'){
    placeEv(targetD,S._touchData.c,S._touchData.et,evLabel(S._touchData.et,S._touchData.c));saveData();render();
  }else{moveItem(S._touchData.d,targetD,S._touchData.id);saveData();render();}
  S._touchData=null;
}
function _touchCancel(){_clearEdgeNav();if(S._touchGhost){S._touchGhost.remove();S._touchGhost=null;}document.removeEventListener('touchmove',_touchMove);document.removeEventListener('touchend',_touchEnd);document.removeEventListener('touchcancel',_touchCancel);S._touchData=null;}


function showItemMenu(d,itemId){
  const e=cPlan().entries[d];const item=(e?.items||[]).find(i=>i.id===itemId);if(!item)return;
  const isMod=item.type==='module';
  const instLabel=isMod?instanceLabel(item):'';
  const titleSuffix=instLabel?` <span style="font-size:.78rem;color:var(--text-muted);font-weight:600;background:rgba(167,139,250,.12);padding:2px 8px;border-radius:999px">${instLabel}</span>`:'';
  const title=isMod?`${item.course_id} — ${item.module_id}${item.total_parts>1?` (${item.part}/${item.total_parts})`:''}${titleSuffix}`:(item.label||'');
  const note=isMod?(S.data.module_notes?.[`${item.course_id}_${item.module_id}`]||''):'';
  const doneL=item.completed?tx('↩ إلغاء','↩ Undo'):tx('✅ أنهيت','✅ Done');
  
  const canEditLabel=isMod&&(item.instance_kind==='review'||item.custom_label);

  modal(`<div class="pv2-modal-header"><h3 class="pv2-modal-title">${title}</h3><button class="pv2-modal-close" onclick="PV2.closeModal()">✕</button></div>
    <div style="font-size:.8rem;color:var(--text-muted);margin-bottom:.75rem">${fmtL(d)}</div>
    <div class="pv2-menu-list">
      <button class="pv2-menu-btn" onclick="PV2.toggleDone('${d}','${itemId}');PV2.closeModal()">${doneL}</button>
      ${canEditLabel?`<button class="pv2-menu-btn" onclick="PV2.editInstanceLabel('${d}','${itemId}')">✏️ ${tx('تعديل تسمية المراجعة','Edit Review Label')}</button>`:''}
      ${isMod&&item.total_parts===1?`<button class="pv2-menu-btn" onclick="PV2.splitItem('${d}','${itemId}');PV2.closeModal()">✂️ ${tx('تقسيم لجلستين','Split 2 sessions')}</button>`:''}
      ${isMod&&item.total_parts>1?`<button class="pv2-menu-btn" onclick="PV2.unsplitItem('${d}','${itemId}');PV2.closeModal()">🔗 ${tx('دمج الأجزاء','Merge parts')}</button>`:''}
      ${isMod?`<button class="pv2-menu-btn" onclick="PV2.editModNote('${item.course_id}','${item.module_id}');PV2.closeModal()">📝 ${note?tx('تعديل الملاحظة','Edit Note'):tx('إضافة ملاحظة','Add Note')}</button>`:''}
      ${isMod?`<button class="pv2-menu-btn" onclick="PV2.showModDetail('${item.course_id}','${item.module_id}')">ℹ️ ${tx('تفاصيل الوحدة','Module Details')}</button>`:''}
      <button class="pv2-menu-btn danger" onclick="PV2._rmItem('${d}','${itemId}')">🗑️ ${tx('حذف','Remove')}</button>
    </div>`);
}
function editInstanceLabel(d,itemId){
  const e=cPlan().entries[d];const item=(e?.items||[]).find(i=>i.id===itemId);if(!item)return;
  const current=instanceLabel(item);
  modal(`<div class="pv2-modal-header"><h3 class="pv2-modal-title">✏️ ${tx('تسمية الجلسة','Session Label')}</h3><button class="pv2-modal-close" onclick="PV2.closeModal()">✕</button></div>
    <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:.75rem">${tx('اكتب تسمية مخصصة لهذه الجلسة (مثلاً: مراجعة ما قبل الاختبار، حل تمارين، …)','Custom label for this session (e.g. Pre-exam review, Problem solving, …)')}</p>
    <div class="pv2-form-group">
      <input type="text" id="inst-label-input" class="pv2-input" placeholder="${tx('مثلاً: مراجعة سريعة','e.g. Quick review')}" value="${item.custom_label||current}">
    </div>
    <p style="font-size:.75rem;color:var(--text-muted);margin-top:.5rem">${tx('💡 اتركها فارغة للعودة للتسمية التلقائية','💡 Leave empty to restore auto-label')}</p>
    <div class="pv2-modal-actions">
      <button class="pv2-btn-primary" onclick="PV2._saveInstanceLabel('${d}','${itemId}')">${tx('حفظ','Save')}</button>
      <button class="pv2-btn-secondary" onclick="PV2.closeModal()">${tx('إلغاء','Cancel')}</button>
    </div>`);
  setTimeout(()=>document.getElementById('inst-label-input')?.focus(),50);
}
function _saveInstanceLabel(d,itemId){
  const e=cPlan().entries[d];const item=(e?.items||[]).find(i=>i.id===itemId);if(!item)return;
  const val=document.getElementById('inst-label-input')?.value.trim();
  if(val)item.custom_label=val; else delete item.custom_label;
  saveData();closeModal();render();
}
function _rmItem(d,id){closeModal();snap();removeItem(d,id);saveData();render();}


function showModDetail(cid,mid){
  const md=getMd(cid,mid);const color=cColor(cid);const title=mTitle(cid,mid);
  const note=S.data.module_notes?.[`${cid}_${mid}`]||'';
  if(!md){
    modal(`<div class="pv2-modal-header"><h3 class="pv2-modal-title">${cid} — ${mid}</h3><button class="pv2-modal-close" onclick="PV2.closeModal()">✕</button></div>
      <p style="color:var(--text-secondary);font-size:.9rem;margin-bottom:.75rem">${title}</p>
      <div class="pv2-form-group"><label class="pv2-label">${tx('ملاحظتك','Your Note')}</label><textarea id="mdn-${cid}-${mid}" class="pv2-textarea pv2-textarea--sm">${note}</textarea></div>
      <div class="pv2-modal-actions"><button class="pv2-btn-primary" onclick="PV2._saveModNote('${cid}','${mid}')">${tx('حفظ','Save')}</button><button class="pv2-btn-secondary" onclick="PV2.closeModal()">${tx('إغلاق','Close')}</button></div>`);
    return;
  }
  const dl=dLbl(md.module_difficulty||5);const topics=md.topics||[];
  const mustKnow=topics.flatMap(t=>isAr()?(t.must_know||[]):(t.must_know_en||t.must_know||[]));
  const mustMem=topics.flatMap(t=>isAr()?(t.must_memorize||[]):(t.must_memorize_en||t.must_memorize||[]));
  const mistakes=topics.flatMap(t=>isAr()?(t.common_mistakes||[]):(t.common_mistakes_en||t.common_mistakes||[]));
  modal(`<div class="pv2-modal-header">
    <h3 class="pv2-modal-title"><span class="pv2-mod-badge" style="background:${color}">${mid}</span> ${tx('تفاصيل الوحدة','Module Details')}</h3>
    <button class="pv2-modal-close" onclick="PV2.closeModal()">✕</button>
  </div>
  <p style="font-size:1rem;font-weight:700;margin-bottom:.5rem;color:var(--text-primary)">${title}</p>
  <div class="pv2-mod-meta"><span class="pv2-diff-badge ${dl}">${dTx(dl)}</span>${md.study_hours_estimate?`<span>⏱ ${fmtH(md.study_hours_estimate)}</span>`:''}${topics.length?`<span>${topics.length} ${tx('مواضيع','topics')}</span>`:''}</div>
  ${mustKnow.slice(0,3).length?`<div class="pv2-mod-sec"><div class="pv2-mod-sec-title">🎯 ${tx('يجب أن تعرف','Must Know')}</div><ul class="pv2-mod-list">${mustKnow.slice(0,3).map(x=>`<li>${x}</li>`).join('')}</ul></div>`:''}
  ${mustMem.slice(0,3).length?`<div class="pv2-mod-sec"><div class="pv2-mod-sec-title">📝 ${tx('يجب حفظه','Must Memorize')}</div><ul class="pv2-mod-list">${mustMem.slice(0,3).map(x=>`<li>${x}</li>`).join('')}</ul></div>`:''}
  ${mistakes.slice(0,2).length?`<div class="pv2-mod-sec"><div class="pv2-mod-sec-title">⚠️ ${tx('أخطاء شائعة','Common Mistakes')}</div><ul class="pv2-mod-list">${mistakes.slice(0,2).map(x=>`<li>${x}</li>`).join('')}</ul></div>`:''}
  <div class="pv2-mod-sec"><div class="pv2-mod-sec-title">📝 ${tx('ملاحظتك','Your Note')}</div><textarea id="mdn-${cid}-${mid}" class="pv2-textarea pv2-textarea--sm">${note}</textarea></div>
  <div class="pv2-modal-actions"><button class="pv2-btn-primary" onclick="PV2._saveModNote('${cid}','${mid}')">${tx('حفظ الملاحظة','Save Note')}</button><button class="pv2-btn-secondary" onclick="PV2.closeModal()">${tx('إغلاق','Close')}</button></div>`);
}
function _saveModNote(cid,mid){
  const val=document.getElementById(`mdn-${cid}-${mid}`)?.value.trim();
  if(!S.data.module_notes)S.data.module_notes={};
  if(val)S.data.module_notes[`${cid}_${mid}`]=val;else delete S.data.module_notes[`${cid}_${mid}`];
  saveData();closeModal();render();
}


function editDayNote(d){
  const cur=cPlan().entries[d]?.day_note||'';
  modal(`<div class="pv2-modal-header"><h3 class="pv2-modal-title">📝 ${tx('ملاحظة اليوم','Day Note')}</h3><button class="pv2-modal-close" onclick="PV2.closeModal()">✕</button></div>
    <div style="font-size:.82rem;color:var(--text-muted);margin-bottom:.6rem">${fmtL(d)}</div>
    <div class="pv2-form-group"><textarea id="day-note-in" class="pv2-textarea">${cur}</textarea></div>
    <div class="pv2-modal-actions">
      <button class="pv2-btn-primary" onclick="PV2._saveDayNote('${d}')">${tx('حفظ','Save')}</button>
      ${cur?`<button class="pv2-btn-danger" onclick="PV2._saveDayNote('${d}','')">${tx('حذف','Delete')}</button>`:''}
      <button class="pv2-btn-secondary" onclick="PV2.closeModal()">${tx('إلغاء','Cancel')}</button>
    </div>`);
  setTimeout(()=>document.getElementById('day-note-in')?.focus(),100);
}
function _saveDayNote(d,force){
  const val=force!==undefined?force:(document.getElementById('day-note-in')?.value.trim()||'');
  const e=ensE(d);e.day_note=val;cleanE(d);saveData();closeModal();render();
}


function editModNote(cid,mid){
  const key=`${cid}_${mid}`;const cur=S.data.module_notes?.[key]||'';const title=mTitle(cid,mid);
  modal(`<div class="pv2-modal-header"><h3 class="pv2-modal-title">📝 ${mid}: ${title.slice(0,28)}</h3><button class="pv2-modal-close" onclick="PV2.closeModal()">✕</button></div>
    <div class="pv2-form-group"><label class="pv2-label">${tx('ملاحظتك على هذه الوحدة','Note for this module')}</label><textarea id="mdn-${cid}-${mid}" class="pv2-textarea">${cur}</textarea></div>
    <div class="pv2-modal-actions"><button class="pv2-btn-primary" onclick="PV2._saveModNote('${cid}','${mid}')">${tx('حفظ','Save')}</button><button class="pv2-btn-secondary" onclick="PV2.closeModal()">${tx('إلغاء','Cancel')}</button></div>`);
  setTimeout(()=>document.getElementById(`mdn-${cid}-${mid}`)?.focus(),100);
}


function showAddEvModal(d,cid){
  const courses=allCourses();
  const cOpts=courses.map(c=>`<option value="${c.id}"${cid===c.id?' selected':''}>${c.id} — ${c.name}</option>`).join('');
  const evOpts=EV_TYPES.map(e=>`<option value="${e.id}">${e.icon} ${isAr()?e.ar:e.en}</option>`).join('');
  modal(`<div class="pv2-modal-header"><h3 class="pv2-modal-title">➕ ${tx('إضافة جلسة أو حدث','Add Session / Event')}</h3><button class="pv2-modal-close" onclick="PV2.closeModal()">✕</button></div>
    <div class="pv2-form-group"><label class="pv2-label">📅 ${tx('التاريخ','Date')}</label><input type="date" id="ae-date" class="pv2-input" value="${d||today()}"></div>
    <div class="pv2-form-group" style="margin-top:.75rem"><label class="pv2-label">${tx('نوع الإضافة','Type')}</label>
    <select id="ae-type" class="pv2-select" onchange="PV2._aeType()">
      <option value="module">📚 ${tx('وحدة دراسية','Study Module')}</option>
      <option value="event">📌 ${tx('حدث','Event')}</option>
    </select></div>
    <div id="ae-mod-fields">
      <div class="pv2-form-group" style="margin-top:.75rem"><label class="pv2-label">${tx('المادة','Course')}</label><select id="ae-course" class="pv2-select" onchange="PV2._aeCourse()">${cOpts}</select></div>
      <div class="pv2-form-group" style="margin-top:.75rem"><label class="pv2-label">${tx('الوحدة','Module')}</label><select id="ae-module" class="pv2-select"></select></div>
    </div>
    <div id="ae-ev-fields" style="display:none">
      <div class="pv2-form-group" style="margin-top:.75rem"><label class="pv2-label">${tx('المادة (اختياري)','Course (optional)')}</label><select id="ae-ev-course" class="pv2-select"><option value="">— ${tx('بدون مادة','No course')} —</option>${cOpts}</select></div>
      <div class="pv2-form-group" style="margin-top:.75rem"><label class="pv2-label">${tx('نوع الحدث','Event Type')}</label><select id="ae-ev-type" class="pv2-select">${evOpts}</select></div>
      <div class="pv2-form-group" style="margin-top:.75rem"><label class="pv2-label">${tx('التسمية (اختياري)','Label (optional)')}</label><input type="text" id="ae-ev-label" class="pv2-input"></div>
    </div>
    <div class="pv2-modal-actions"><button class="pv2-btn-primary" onclick="PV2._addEv()">${tx('إضافة','Add')}</button><button class="pv2-btn-secondary" onclick="PV2.closeModal()">${tx('إلغاء','Cancel')}</button></div>`);
  _aeCourse();
  if(cid){const s=document.getElementById('ae-course');if(s){s.value=cid;_aeCourse();}const s2=document.getElementById('ae-ev-course');if(s2)s2.value=cid;}
}
function _aeType(){const t=document.getElementById('ae-type')?.value;document.getElementById('ae-mod-fields').style.display=t==='module'?'':'none';document.getElementById('ae-ev-fields').style.display=t==='event'?'':'none';}
function _aeCourse(){
  const cid=document.getElementById('ae-course')?.value;const sel=document.getElementById('ae-module');if(!sel)return;
  const course=allCourses().find(c=>c.id===cid);if(!course){sel.innerHTML='';return;}
  const placed=placedSet(S.activePlan);
  sel.innerHTML=course.mods.map(m=>`<option value="${m.id}">${m.id} — ${m.name}${placed.has(`${cid}_${m.id}`)?' ✓':''}</option>`).join('');
}
function _addEv(){
  const d=document.getElementById('ae-date')?.value;const type=document.getElementById('ae-type')?.value;
  if(!d){alert(tx('اختر تاريخاً','Select a date'));return;}
  snap();
  if(type==='module'){
    const cid=document.getElementById('ae-course')?.value;const mid=document.getElementById('ae-module')?.value;
    if(!cid||!mid)return;
    if(isPlaced(cid,mid)){closeModal();showSplitConfirm(d,cid,mid);return;}
    placeM(d,cid,mid);
  }else{
    const cid=document.getElementById('ae-ev-course')?.value||null;
    const et=document.getElementById('ae-ev-type')?.value||'other';
    const label=document.getElementById('ae-ev-label')?.value.trim()||'';
    placeEv(d,cid,et,label||evLabel(et,cid));
  }
  saveData();closeModal();render();
}


function showAddCourseModal(){
  modal(`<div class="pv2-modal-header"><h3 class="pv2-modal-title">➕ ${tx('إضافة مادة','Add Course')}</h3><button class="pv2-modal-close" onclick="PV2.closeModal()">✕</button></div>
    <div class="pv2-form-group" style="margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid var(--border-color)">
      <label class="pv2-label">🔍 ${tx('ابحث برمز المادة','Search by course code')}</label>
      <input type="text" id="ac-search" class="pv2-input" placeholder="${tx('اكتب رمز المادة...','Type course code...')}" oninput="PV2._filterCourses(this.value)" autocomplete="off">
      <div id="ac-search-results" class="pv2-search-results" style="display:none"></div>
    </div>
    <div class="pv2-form-group"><label class="pv2-label">🏷️ ${tx('رمز المادة','Course Code')}</label><input type="text" id="ac-id" class="pv2-input" placeholder="${tx('مثلاً: CS310','e.g. CS310')}" maxlength="10"></div>
    <div class="pv2-form-group" style="margin-top:.75rem"><label class="pv2-label">📚 ${tx('الاسم بالعربية','Arabic Name')}</label><input type="text" id="ac-name-ar" class="pv2-input" placeholder="${tx('مثلاً: قواعد البيانات','e.g. قواعد البيانات')}"></div>
    <div class="pv2-form-group" style="margin-top:.75rem"><label class="pv2-label">📚 ${tx('الاسم بالإنجليزية','English Name')}</label><input type="text" id="ac-name-en" class="pv2-input" placeholder="${tx('مثلاً: Databases','e.g. Databases')}"></div>
    <div class="pv2-form-group" style="margin-top:.75rem"><label class="pv2-label">🔢 ${tx('عدد الوحدات','Number of Modules')}</label><input type="number" id="ac-cnt" class="pv2-input" min="1" max="30" value="13"></div>
    <details style="margin-top:.75rem"><summary style="font-size:.83rem;color:var(--text-secondary);cursor:pointer;font-weight:700">✏️ ${tx('تسمية الوحدات (اختياري)','Module Names (optional)')}</summary>
    <textarea id="ac-mods" class="pv2-textarea" style="margin-top:.5rem" placeholder="${tx('وحدة 1\nوحدة 2','Module 1\nModule 2')}"></textarea></details>
    <div class="pv2-form-group" style="margin-top:.75rem"><label class="pv2-label">🎨 ${tx('اللون','Color')}</label><div class="pv2-palette">${PALETTE.map(c=>`<button class="pv2-color-swatch" style="background:${c}" onclick="document.getElementById('ac-color').value='${c}'" title="${c}"></button>`).join('')}</div><input type="color" id="ac-color" class="pv2-input" style="height:36px;margin-top:.4rem" value="${PALETTE[Math.floor(Math.random()*PALETTE.length)]}"></div>
    <div class="pv2-modal-actions"><button class="pv2-btn-primary" onclick="PV2._saveCC()">${tx('إضافة','Add')}</button><button class="pv2-btn-secondary" onclick="PV2.closeModal()">${tx('إلغاء','Cancel')}</button></div>`);
}
function _filterCourses(query){
  const results=document.getElementById('ac-search-results');
  if(!query||query.length<1){results.style.display='none';return;}
  const q=query.toUpperCase();
  const matches=[];
  if(S.projCfg&&S.projCfg.subjects){
    for(const [code,s] of Object.entries(S.projCfg.subjects)){
      if(code.startsWith('__'))continue;
      if(code.toUpperCase().includes(q))matches.push({code,...s});
    }
  }
  if(matches.length===0){
    results.innerHTML=`<div class="pv2-search-no-results">${tx('لا نتائج','No results')}</div>`;
    results.style.display='';return;
  }
  const ar=isAr();
  results.innerHTML=matches.slice(0,10).map(m=>{
    const name=ar?(m.name_ar||m.name_en||m.code):(m.name_en||m.name_ar||m.code);
    let catBadge='';
    if(m.category&&S.projCfg.collections&&S.projCfg.collections.others&&S.projCfg.collections.others.categories&&S.projCfg.collections.others.categories[m.category]){
      const cat=ar?S.projCfg.collections.others.categories[m.category].name_ar:S.projCfg.collections.others.categories[m.category].name_en;
      catBadge=`<span class="pv2-search-cat">${cat}</span>`;
    }
    return `<div class="pv2-search-item" onclick="PV2._pickCourse('${m.code}')"><span class="pv2-search-code">${m.code}</span><span class="pv2-search-name">${name}</span>${catBadge}</div>`;
  }).join('');
  results.style.display='';
}
function _pickCourse(code){
  const s=S.projCfg&&S.projCfg.subjects?S.projCfg.subjects[code]:null;
  if(!s)return;
  const idEl=document.getElementById('ac-id');if(idEl)idEl.value=code;
  const arEl=document.getElementById('ac-name-ar');if(arEl)arEl.value=s.name_ar||s.name_en||'';
  const enEl=document.getElementById('ac-name-en');if(enEl)enEl.value=s.name_en||s.name_ar||'';
  const cntEl=document.getElementById('ac-cnt');if(cntEl)cntEl.value=s.modules||13;
  const colorEl=document.getElementById('ac-color');if(colorEl)colorEl.value=s.brand_500||'#64748b';
  const resEl=document.getElementById('ac-search-results');if(resEl)resEl.style.display='none';
  const searchEl=document.getElementById('ac-search');if(searchEl)searchEl.value='';

  
  S._pendingExtCourse = null;

  
  
  if(s.level && s.level !== LEVEL){
    const lvNum = s.level.replace('level','').replace('L','');
    const cmapUrls = cfgURLs(`L${lvNum}/data/curriculum_map.json`, [
      `../L${lvNum}/data/curriculum_map.json`,
      `../../L${lvNum}/data/curriculum_map.json`
    ]);
    const cb = '?v=' + (window._gardenVersion || Date.now());
    (async () => {
      for(const u of cmapUrls){
        try{
          const r = await fetch(u + cb);
          if(r.ok){
            const extMap = await r.json();
            if(extMap.courses && extMap.courses[code]){
              const extCourse = extMap.courses[code];
              
              S._pendingExtCourse = {code, data: extCourse};

              
              if(extCourse.modules){
                const modNames = Object.entries(extCourse.modules).map(([k,v]) =>
                  isAr() ? (v.title||k) : (v.title_en||v.title||k));
                const modsEl = document.getElementById('ac-mods');
                if(modsEl && modNames.length){
                  modsEl.value = modNames.join('\n');
                  const cnt = document.getElementById('ac-cnt');
                  if(cnt) cnt.value = modNames.length;
                }
              }
            }
            break;
          }
        }catch(_){}
      }
    })();
  }
}
function _saveCC(){
  const id=document.getElementById('ac-id')?.value.trim().toUpperCase();
  const nameAr=document.getElementById('ac-name-ar')?.value.trim();
  const nameEn=document.getElementById('ac-name-en')?.value.trim();
  const cnt=parseInt(document.getElementById('ac-cnt')?.value)||13;const color=document.getElementById('ac-color')?.value||'#64748b';
  const raw=document.getElementById('ac-mods')?.value.trim();
  if(!id||(!nameAr&&!nameEn)){alert(tx('أدخل الرمز والاسم','Enter code and name'));return;}
  if((S.data.custom_courses||[]).find(c=>c.id===id)||S.cMap?.courses?.[id]){alert(tx('الرمز موجود مسبقاً','Code already exists'));return;}
  const finalAr=nameAr||nameEn;
  const finalEn=nameEn||nameAr;

  
  
  if(S._pendingExtCourse && S._pendingExtCourse.code === id){
    if(!S.cMap)S.cMap={courses:{}};
    if(!S.cMap.courses)S.cMap.courses={};
    S.cMap.courses[id] = S._pendingExtCourse.data;
    S.cMap.courses[id].color = color;
    
    if(!S.data._mergedCourses)S.data._mergedCourses={};
    S.data._mergedCourses[id] = S._pendingExtCourse.data;
    S.data._mergedCourses[id].color = color;
    S._pendingExtCourse = null;
    saveData();closeModal();render();
    return;
  }

  
  const modNames=raw?raw.split('\n').map(l=>l.trim()).filter(Boolean):[];
  const modules=Array.from({length:cnt},(_,i)=>({name:modNames[i]||(isAr()?`وحدة ${i+1}`:`Module ${i+1}`)}));
  if(!S.data.custom_courses)S.data.custom_courses=[];
  S.data.custom_courses.push({id,name_ar:finalAr,name_en:finalEn,name:finalAr,color,modules});
  saveData();closeModal();render();
}


function editPlanSettings(){
  const p=cPlan();const courses=activeCoursesForPlan(S.activePlan);
  const hrs=S.data.settings?.hours_per_day;
  const courseExamFields=courses.map(c=>`
    <div class="pv2-form-group" style="margin-top:.6rem">
      <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem">
        <div style="width:10px;height:10px;border-radius:50%;background:${cColor(c.id)};flex-shrink:0"></div>
        <label class="pv2-label" style="margin:0">${c.id} — ${c.name}</label>
      </div>
      <input type="date" id="cex-${c.id}" class="pv2-input" value="${p.course_exams?.[c.id]||''}" placeholder="${tx('تاريخ الاختبار (اختياري)','Exam date (optional)')}">
    </div>`).join('');

  modal(`<div class="pv2-modal-header"><h3 class="pv2-modal-title">⚙️ ${tx('إعدادات الخطة','Plan Settings')}</h3><button class="pv2-modal-close" onclick="PV2.closeModal()">✕</button></div>
    <div class="pv2-form-group"><label class="pv2-label">📅 ${tx('تاريخ بدء المذاكرة','Study Start Date')}</label><input type="date" id="es-start" class="pv2-input" value="${p.start_date||''}"></div>
    <div class="pv2-form-group" style="margin-top:.75rem"><label class="pv2-label">🗓️ ${tx('تاريخ آخر اختبار','Last Exam Date')}</label><input type="date" id="es-end" class="pv2-input" value="${p.end_date||''}"></div>
    <div class="pv2-form-group" style="margin-top:.75rem">
      <label class="pv2-label">⏱️ ${tx('الحد الأقصى لساعات اليوم','Daily Hours Cap')}</label>
      <input type="number" id="es-hrs" class="pv2-input" min="1" max="16" value="${hrs||''}" placeholder="${tx('مثلاً: 4','e.g. 4')}">
      <small style="color:var(--text-muted);font-size:.72rem;margin-top:.25rem;display:block">${tx('🔔 ينبهك التقويم إذا تجاوز يوم الحد. يساعد التوزيع الذكي على عدم تكدّس وحدات بيوم واحد.','🔔 Calendar warns you if a day exceeds the cap. Smart Fill respects this limit.')}</small>
    </div>
    ${courses.length?`<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border-color)"><div class="pv2-label" style="margin-bottom:.5rem">📚 ${tx('تواريخ اختبارات المواد (اختياري)','Course Exam Dates (optional)')}</div>${courseExamFields}</div>`:''}
    <div class="pv2-modal-actions"><button class="pv2-btn-primary" onclick="PV2._saveSettings()">${tx('حفظ','Save')}</button><button class="pv2-btn-secondary" onclick="PV2.closeModal()">${tx('إلغاء','Cancel')}</button></div>`);
}
function _saveSettings(){
  const sv=document.getElementById('es-start')?.value;const ev=document.getElementById('es-end')?.value;const hv=parseInt(document.getElementById('es-hrs')?.value);
  if(!sv){alert(tx('اختر تاريخ البدء','Select start date'));return;}
  const p=cPlan();p.start_date=sv;p.end_date=ev||'';
  if(!isNaN(hv)&&hv>0)S.data.settings.hours_per_day=hv;else delete S.data.settings.hours_per_day;
  activeCoursesForPlan(S.activePlan).forEach(c=>{const v=document.getElementById(`cex-${c.id}`)?.value;if(v)p.course_exams[c.id]=v;else delete p.course_exams[c.id];});
  saveData();closeModal();render();
}
function confirmDelPlan(){
  modal(`<div class="pv2-modal-header"><h3 class="pv2-modal-title">🗑️ ${tx('حذف الخطة','Delete Plan')}</h3><button class="pv2-modal-close" onclick="PV2.closeModal()">✕</button></div>
    <p style="color:var(--text-secondary);font-size:.9rem;margin-bottom:1.2rem">${tx(`حذف خطة ${S.activePlan==='midterm'?'الميدتيرم':'الفاينل'} نهائياً — لا يمكن التراجع.`,`Delete ${S.activePlan} plan permanently.`)}</p>
    <div class="pv2-modal-actions"><button class="pv2-btn-danger" onclick="PV2._delPlan()">${tx('نعم احذف','Yes Delete')}</button><button class="pv2-btn-secondary" onclick="PV2.closeModal()">${tx('إلغاء','Cancel')}</button></div>`);
}
function _delPlan(){S.data.plans[S.activePlan]={start_date:'',end_date:'',course_exams:{},entries:{},excluded_courses:[]};saveData();closeModal();showSetup();}


function smartSchedule(){
  const p=cPlan();const unplaced=[];const placed=placedSet(S.activePlan);
  for(const c of activeCoursesForPlan(S.activePlan))for(const m of c.mods)if(!placed.has(`${c.id}_${m.id}`))unplaced.push({cid:c.id,mid:m.id});
  if(!unplaced.length){alert(tx('✅ كل الوحدات موزّعة بالفعل','✅ All modules already placed'));return;}
  const hrs=S.data.settings?.hours_per_day;

  modal(`<div class="pv2-modal-header"><h3 class="pv2-modal-title">🪄 ${tx('التوزيع الذكي','Smart Schedule')}</h3><button class="pv2-modal-close" onclick="PV2.closeModal()">✕</button></div>
    <p style="font-size:.88rem;color:var(--text-secondary);margin-bottom:.75rem">${tx(`سيوزّع ${unplaced.length} وحدة على أيام مذاكرتك.`,`Will distribute ${unplaced.length} modules across your study days.`)}</p>
    ${hrs?`<div style="background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.2);border-radius:var(--radius-md);padding:.6rem .8rem;margin-bottom:.75rem;font-size:.82rem;color:#a78bfa"><i class="fas fa-circle-info"></i> ${tx(`الحد اليومي: ${hrs} ${hrs===1?'ساعة':hrs===2?'ساعتان':hrs<=10?'ساعات':'ساعة'} — سيُحترم في التوزيع.`,`Daily cap: ${hrs}h — respected in distribution.`)}</div>`:''}
    <div class="pv2-form-group"><label class="pv2-label">${tx('جلسات يومياً (حد أقصى)','Sessions per day (max)')}</label>
      <select id="ss-sessions" class="pv2-select"><option value="1">1</option><option value="2" selected>2</option><option value="3">3</option><option value="4">4</option></select></div>
    <div class="pv2-form-group" style="margin-top:.75rem"><label class="pv2-label">${tx('أيام الراحة','Rest days')}</label>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.3rem">
        ${(isAr()?DAY_AR:DAY_EN).map((d,i)=>`<label style="display:flex;align-items:center;gap:.25rem;font-size:.8rem;cursor:pointer"><input type="checkbox" name="ss-rest" value="${i}"${i===5||i===6?' checked':''}>${d}</label>`).join('')}
      </div></div>
    <div class="pv2-modal-actions">
      <button class="pv2-btn-primary" onclick="PV2._doSchedule()">${tx('وزّع الآن','Fill Now')}</button>
      <button class="pv2-btn-secondary" onclick="PV2.closeModal()">${tx('إلغاء','Cancel')}</button>
    </div>`);
}
function _doSchedule(){
  const sessions=parseInt(document.getElementById('ss-sessions')?.value)||2;
  const restSet=new Set(Array.from(document.querySelectorAll('input[name="ss-rest"]:checked')).map(i=>parseInt(i.value)));
  const p=cPlan();const startStr=p.start_date||today();const endStr=p.end_date;
  const placed=placedSet(S.activePlan);const courses=activeCoursesForPlan(S.activePlan);
  
  
  
  
  const queues=courses.map(c=>c.mods.filter(m=>!placed.has(`${c.id}_${m.id}`)).map(m=>({cid:c.id,mid:m.id,examDate:p.course_exams?.[c.id]||endStr||addD(startStr,60)})));
  const queue=[];let qi=0,any=true;
  while(any){any=false;for(const q of queues){if(qi<q.length){queue.push(q[qi]);any=true;}}qi++;}
  snap();let cnt=0;

  
  const dayOK=(ds,item)=>{
    const di=dIdx(ds);
    if(restSet.has(di))return false;
    if(item.examDate&&ds>=item.examDate)return false;
    if(endStr&&ds>endStr)return false;
    return true;
  };

  
  
  
  
  
  for(const item of queue){
    let ptr=startStr;
    for(let tries=0;tries<365;tries++){
      if(dayOK(ptr,item)){
        const en=p.entries[ptr];
        const mc=(en?.items||[]).filter(x=>x.type==='module').length;
        if(mc<sessions){placeM(ptr,item.cid,item.mid);cnt++;break;}
      }
      ptr=addD(ptr,1);
    }
  }

  saveData();closeModal();render();
  setTimeout(()=>alert(tx(`✅ تم توزيع ${cnt} وحدة.`,`✅ ${cnt} modules distributed.`)),100);
}


async function aiGenerate(){
  const p=cPlan();
  if(!p.start_date){alert(tx('أعدّ الخطة أولاً','Set up the plan first'));return;}
  const courses=activeCoursesForPlan(S.activePlan);if(!courses.length){alert(tx('لا توجد مواد','No courses'));return;}

  
  const config={plan_type:S.activePlan,daily_sessions:2,modules_per_session:1,start_date:p.start_date,
    rest_days:['friday','saturday'],busy_dates:[],hours_per_day:S.data.settings?.hours_per_day||null,
    courses:Object.fromEntries(courses.map(c=>([c.id,{active:true,exam_date:p.course_exams?.[c.id]||p.end_date||'',included_modules:c.mods.map(m=>m.id),self_rating:Object.fromEntries(c.mods.map(m=>[m.id,getModStatus(c.id,m.id)==='mastered'?'mastered':'not_studied']))}])))};

  modal(`<div style="text-align:center;padding:2rem"><div style="font-size:2.5rem">🤖</div><div style="font-weight:800;font-size:1rem;margin:.75rem 0">${tx('الذكاء الاصطناعي يُعدّ الجدول...','AI is building your schedule...')}</div><div class="pv2-loading-spinner" style="margin:.5rem auto"></div></div>`);

  try{
    const richCurriculum={};
    for(const[id,data]of Object.entries(config.courses)){const cd=S.cMap?.courses?.[id];if(cd)richCurriculum[id]={name:cd.name_en||cd.name,modules:Object.fromEntries(Object.entries(cd.modules||{}).map(([mid,md])=>[mid,{title:md.title_en||md.title,difficulty:md.module_difficulty||5,hours:md.study_hours_estimate||2}]))};}
    const prompt={curriculum:richCurriculum,config,request:tx('أنشئ جدول مذاكرة يوزّع المودلات بشكل متوازن مع مراعاة الصعوبة وتواريخ الاختبارات','Create a balanced study schedule distributing modules by difficulty and exam dates')};
    const res=await fetch(AI_WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'schedule',payload:prompt})});
    if(!res.ok)throw new Error('AI request failed');
    const aiData=await res.json();
    
    if(aiData?.days&&Array.isArray(aiData.days)){
      snap();
      for(const day of aiData.days){
        if(!day.date||!day.sessions)continue;
        const dateStr=day.date;
        for(const session of day.sessions){
          if(session.mode==='exam')continue;
          if(session.session_type==='core'&&session.course_id&&session.module_id){
            const mid=(session.module_id||'').replace(/ \(\d+\/\d+\)/,'').trim().split(' + ')[0];
            if(mid)placeM(dateStr,session.course_id,mid,session.part||1,session.total_parts||1);
          }
        }
      }
      saveData();closeModal();render();
    }else{
      
      closeModal();_doScheduleAuto();
    }
  }catch(err){
    console.warn('AI failed, using smart schedule:',err);
    closeModal();_doScheduleAuto();
    alert(tx('⚠️ فشل الذكاء، تم التوزيع الذكي المحلي بدلاً.','⚠️ AI failed, used smart local schedule.'));
  }
}

function _doScheduleAuto(){
  
  const p=cPlan();const startStr=p.start_date||today();const endStr=p.end_date;
  const placed=placedSet(S.activePlan);const courses=activeCoursesForPlan(S.activePlan);const restSet=new Set([5,6]);
  const hourCap=S.data.settings?.hours_per_day||null;
  const queues=courses.map(c=>c.mods.filter(m=>!placed.has(`${c.id}_${m.id}`)).map(m=>({cid:c.id,mid:m.id,examDate:p.course_exams?.[c.id]||endStr||addD(startStr,60)})));
  const queue=[];let qi=0,any=true;
  while(any){any=false;for(const q of queues){if(qi<q.length){queue.push(q[qi]);any=true;}}qi++;}
  snap();
  const dayHoursAt=ds=>{const en=p.entries[ds];if(!en)return 0;let h=0;(en.items||[]).forEach(it=>{if(it.type==='module'){const md=getMd(it.course_id,it.module_id);h+=(md?.study_hours_estimate||2)/(it.total_parts||1);}});return h;};
  const dayOK=(ds,item)=>{if(restSet.has(dIdx(ds)))return false;if(item.examDate&&ds>=item.examDate)return false;if(endStr&&ds>endStr)return false;return true;};
  const skipped=[];
  
  for(const item of queue){
    let ptr=startStr,done=false;
    const modHrs=(getMd(item.cid,item.mid)?.study_hours_estimate||2);
    for(let t=0;t<365;t++){
      if(dayOK(ptr,item)){
        const en=p.entries[ptr];const mc=(en?.items||[]).filter(x=>x.type==='module').length;
        if(mc<2 && (!hourCap || dayHoursAt(ptr)+modHrs<=hourCap)){placeM(ptr,item.cid,item.mid);done=true;break;}
      }
      ptr=addD(ptr,1);
    }
    if(!done)skipped.push(item);
  }
  
  for(const item of skipped){
    let ptr=startStr;
    for(let t=0;t<365;t++){
      if(dayOK(ptr,item)){
        const en=p.entries[ptr];const mc=(en?.items||[]).filter(x=>x.type==='module').length;
        if(mc<2){placeM(ptr,item.cid,item.mid);break;}
      }
      ptr=addD(ptr,1);
    }
  }
  saveData();render();
}


function setStudyView(v){S.studyView=v;if(!S.data.settings)S.data.settings={};S.data.settings.study_view=v;if(v==='cards'){S.cardIdx=0;S._cardInit=false;}saveData();renderStudy();}
function _flipCard(idx){document.getElementById(`pv2-card-inner-${idx}`)?.classList.toggle('flipped');}
function _cardNext(){const ad=_getActiveDays();if(S.cardIdx<ad.length-1){S.cardIdx++;renderStudy();}}
function _cardPrev(){if(S.cardIdx>0){S.cardIdx--;renderStudy();}}
function _getActiveDays(){const p=cPlan();return Object.entries(p.entries).filter(([,e])=>(e.items||[]).length>0||e.day_note).sort(([a],[b])=>a.localeCompare(b));}

function renderStudy(){
  const container=document.getElementById('study-content');if(!container)return;
  const p=cPlan();const todayS=today();const courses=allCourses();
  const activeDays=_getActiveDays();
  const planLbl=S.activePlan==='midterm'?tx('الميدتيرم','Midterm'):tx('الفاينل','Final');

  if(!activeDays.length){
    container.innerHTML=`<div class="pv2-study-inner"><div style="text-align:center;padding:3rem;color:var(--text-muted)"><div style="font-size:3rem;margin-bottom:1rem">📭</div><p style="font-weight:700;font-size:1.1rem">${tx('لا توجد جلسات مجدولة','No sessions scheduled')}</p><button class="plan-action-btn btn-regenerate" style="margin-top:1.5rem" onclick="PV2.switchMode('plan')"><i class="fas fa-calendar-alt"></i> ${tx('ابدأ التخطيط','Start Planning')}</button></div></div>`;
    return;
  }

  
  let totalMods=0,doneMods=0;const perC={};
  for(const[,e]of activeDays)for(const item of(e.items||[])){if(item.type!=='module')continue;totalMods++;if(item.completed)doneMods++;if(!perC[item.course_id])perC[item.course_id]={t:0,d:0};perC[item.course_id].t++;if(item.completed)perC[item.course_id].d++;}
  const progressBars=Object.entries(perC).map(([cid,pc])=>{const pct=pc.t?Math.round(pc.d/pc.t*100):0;const color=cColor(cid);return`<div class="course-progress-item"><span class="course-progress-name" style="color:${color}">${cid}</span><div class="course-progress-bar"><div class="course-progress-fill" style="width:${pct}%;background:${color}"></div></div><span class="course-progress-meta">${pct}%</span></div>`;}).join('');

  const dLeft=p.end_date?Math.max(0,dDiff(p.end_date,todayS)):null;
  const headerHTML=`<div class="plan-header"><div class="plan-header-top"><div class="plan-header-left"><h2>📅 ${tx(`جدول ${planLbl}`,`${planLbl} Schedule`)}</h2><div class="plan-header-meta">${p.start_date?fmtL(p.start_date):''} ${p.end_date?'→ '+fmtL(p.end_date):''} ${dLeft!==null?`· ${tx(`${dLeft} يوم`,`${dLeft}d left`)}`:''}
</div></div><div class="plan-header-actions"><button class="plan-action-btn btn-regenerate" onclick="PV2.switchMode('plan')"><i class="fas fa-calendar-alt"></i> ${tx('التقويم','Calendar')}</button><button class="plan-action-btn btn-pdf" onclick="PV2.exportPrint()"><i class="fas fa-print"></i> ${tx('طباعة','Print')}</button></div></div></div>
<div class="course-progress-bars">${progressBars}</div>
<div class="view-mode-toggle"><button class="view-mode-btn${S.studyView==='cards'?' active':''}" onclick="PV2.setStudyView('cards')"><i class="fas fa-clone"></i> ${tx('بطاقات','Cards')}</button><button class="view-mode-btn${S.studyView==='list'?' active':''}" onclick="PV2.setStudyView('list')"><i class="fas fa-list"></i> ${tx('عرض الكل','Show All')}</button></div>`;

  const bodyHTML=S.studyView==='cards'?_studyCardView(activeDays,todayS):_studyListView(activeDays,todayS,p);
  container.innerHTML=`<div class="pv2-study-inner">${headerHTML}${bodyHTML}</div>`;
  if(S.studyView==='list'){setTimeout(()=>{const el=container.querySelector('.day-section.today-section');if(el)el.scrollIntoView({behavior:'smooth',block:'center'});},150);}
}

function _studyCardView(activeDays,todayS){
  if(!S._cardInit){
    const ti=activeDays.findIndex(([d])=>d===todayS);
    if(ti>=0)S.cardIdx=ti;else{const fi=activeDays.findIndex(([d])=>d>todayS);if(fi>=0)S.cardIdx=fi;}
    S._cardInit=true;
  }
  if(S.cardIdx>=activeDays.length)S.cardIdx=Math.max(0,activeDays.length-1);
  const [d,entry]=activeDays[S.cardIdx];const isToday=d===todayS;const items=entry.items||[];
  const isRestDay=items.length===0&&entry.day_note;

  
  if(isRestDay){
    return`<div class="card-3d-container">
      <div class="card-top-bar"><div class="card-counter">${tx(`اليوم ${S.cardIdx+1} من ${activeDays.length}`,`Day ${S.cardIdx+1} of ${activeDays.length}`)}</div></div>
      <div class="card-day-header${isToday?' today':''}">
        <div class="card-day-label-group"><span class="card-day-text">${fmtCard(d)}</span></div>
        ${isToday?`<span class="card-today-badge">⏳ ${tx('اليوم','Today')}</span>`:''}
      </div>
      <div class="rest-day-card">
        <div class="rest-day-icon">☕</div>
        <div class="rest-day-title">${tx('يوم راحة','Rest Day')}</div>
        <div class="rest-day-message">${entry.day_note}</div>
        <div class="rest-day-sub">${tx('استمتع بيومك! 🌿','Enjoy your day! 🌿')}</div>
      </div>
      <div class="card-nav">
        <button class="card-nav-btn" onclick="PV2._cardPrev()" ${S.cardIdx===0?'disabled':''}><i class="fas fa-arrow-right"></i> ${tx('السابق','Prev')}</button>
        <button class="card-nav-btn" onclick="PV2._cardNext()" ${S.cardIdx>=activeDays.length-1?'disabled':''}>${tx('التالي','Next')} <i class="fas fa-arrow-left"></i></button>
      </div>
    </div>`;
  }

  const cards=items.map((item,idx)=>{
    if(item.type==='event'){
      const ec=evColor(item.event_type);
      return`<div class="sc-scene mobile-3d-off"><div class="sc-card${item.completed?' completed':''}" id="pv2-card-inner-${idx}"><div class="sc-face sc-front" style="border-top:3px solid ${ec}"><div class="card-session-top-row"><span class="card-session-badge medium">${evIcon(item.event_type)}</span></div><div class="card-course-name">${item.label||''}</div>${item.course_id?`<div class="card-course-subtitle">${item.course_id}</div>`:''}<button class="card-session-done-btn" onclick="PV2.toggleDone('${d}','${item.id}');PV2.renderStudy()">${item.completed?tx('↩ إلغاء','↩ Undo'):tx('✅ أنهيت','✅ Done')}</button></div></div></div>`;
    }
    const color=cColor(item.course_id);const title=mTitle(item.course_id,item.module_id);
    const md=getMd(item.course_id,item.module_id);const diff=md?.module_difficulty||5;const dl=dLbl(diff);
    const pt=item.total_parts>1?` (${item.part}/${item.total_parts})`:'';
    const mustKnow=(md?.topics||[]).flatMap(t=>isAr()?(t.must_know||[]):(t.must_know_en||t.must_know||[]));
    const mustMem=(md?.topics||[]).flatMap(t=>isAr()?(t.must_memorize||[]):(t.must_memorize_en||t.must_memorize||[]));
    const commonMistakes=(md?.topics||[]).flatMap(t=>isAr()?(t.common_mistakes||[]):(t.common_mistakes_en||t.common_mistakes||[]));
    const note=S.data.module_notes?.[`${item.course_id}_${item.module_id}`]||'';
    const num=parseInt((item.module_id||'').replace(/^M/i,''));const url=!isNaN(num)?`../${item.course_id}/M${pad(num)}.html`:null;
    
    const topicNames=(md?.topics||[]).map(t=>isAr()?(t.title||t.title_en||t.name||''):(t.title_en||t.title||t.name_en||t.name||'')).filter(Boolean);
    let backSections='';
    if(mustKnow.length){
      backSections+=`<div class="card-back-group card-back-group--know">
        <div class="card-back-group-header"><span class="card-back-group-icon">🎯</span><span class="card-back-group-title">${tx('يجب أن تعرف','Must Know')}</span><span class="card-back-group-count">${mustKnow.length}</span></div>
        <ul class="card-back-list">${mustKnow.slice(0,5).map(x=>`<li>${x}</li>`).join('')}</ul>
      </div>`;
    }
    if(mustMem.length){
      backSections+=`<div class="card-back-group card-back-group--mem">
        <div class="card-back-group-header"><span class="card-back-group-icon">📝</span><span class="card-back-group-title">${tx('يجب أن تحفظ','Must Memorize')}</span><span class="card-back-group-count">${mustMem.length}</span></div>
        <ul class="card-back-list">${mustMem.slice(0,5).map(x=>`<li>${x}</li>`).join('')}</ul>
      </div>`;
    }
    if(commonMistakes.length){
      backSections+=`<div class="card-back-group card-back-group--mistake">
        <div class="card-back-group-header"><span class="card-back-group-icon">⚠️</span><span class="card-back-group-title">${tx('أخطاء شائعة','Common Mistakes')}</span><span class="card-back-group-count">${commonMistakes.length}</span></div>
        <ul class="card-back-list">${commonMistakes.slice(0,3).map(x=>`<li>${x}</li>`).join('')}</ul>
      </div>`;
    }
    if(!backSections&&topicNames.length){
      backSections+=`<div class="card-back-group card-back-group--topics">
        <div class="card-back-group-header"><span class="card-back-group-icon">📌</span><span class="card-back-group-title">${tx('المواضيع','Topics')}</span><span class="card-back-group-count">${topicNames.length}</span></div>
        <ul class="card-back-list">${topicNames.slice(0,6).map(n=>`<li>${n}</li>`).join('')}</ul>
      </div>`;
    }
    if(note){
      backSections+=`<div class="card-back-group card-back-group--note">
        <div class="card-back-group-header"><span class="card-back-group-icon">💡</span><span class="card-back-group-title">${tx('ملاحظتك','Your Note')}</span></div>
        <div class="card-back-note">${note}</div>
      </div>`;
    }
    if(!backSections){
      backSections=`<div class="card-back-empty">
        <span style="font-size:2.5rem;display:block;margin-bottom:.5rem">📚</span>
        <div style="font-weight:700;color:var(--text-primary);margin-bottom:.3rem">${title}</div>
        <div style="font-size:.85rem;color:var(--text-muted)">${tx('لا توجد تفاصيل لهذه الوحدة','No details for this module')}</div>
      </div>`;
    }
    const backContent=backSections;
    
    const diffColor={critical:'#9f1239',hard:'#f43f5e',medium:'#f59e0b',easy:'#10b981'}[dl]||'#64748b';
    return`<div class="sc-scene mobile-3d-off" id="pv2-card-scene-${idx}">
      <div class="sc-card${item.completed?' completed':''}" id="pv2-card-inner-${idx}" onclick="PV2._flipCard(${idx})">
        <div class="sc-face sc-front" style="border-inline-start:4px solid ${diffColor}">
          <div class="card-session-top-row">
            <span class="card-session-badge ${dl}">${tx('جلسة','Session')} ${idx+1}</span>
            <span class="card-diff-text">${tx('الصعوبة: ','Difficulty: ')}${diff} ${tx('من','of')} 10</span>
          </div>
          <div class="card-course-name">${item.course_id} — ${item.module_id}${pt}</div>
          <div class="card-course-subtitle">${title}</div>
          <div class="card-difficulty">
            <span class="card-diff-label ${dl}">${dTx(dl)}</span>
            <span class="card-diff-bar"><span class="card-diff-fill ${dl}" style="width:${diff*10}%"></span></span>
          </div>
          ${url?`<a href="${url}" class="study-link-btn" onclick="event.stopPropagation()">📖 ${tx('ادرس','Study')}</a>`:''}
          <button class="card-session-done-btn" onclick="event.stopPropagation();PV2.toggleDone('${d}','${item.id}');PV2.renderStudy()">${item.completed?tx('↩ إلغاء','↩ Undo'):tx('✅ أتممت مذاكرة المودل','✅ Module Complete')}</button>
          <div class="sc-hint">${tx('👆 اضغط للتفاصيل','👆 Tap for details')}</div>
        </div>
        <div class="sc-face sc-back" style="border-inline-start:4px solid ${diffColor}">
          <div class="card-back-session-title">${item.course_id} — ${item.module_id}${pt}</div>
          <div class="card-back-subtitle">${title}</div>
          <div class="sc-back-body">${backContent}</div>
          <div class="sc-hint">${tx('👆 اضغط للرجوع','👆 Tap to go back')}</div>
        </div>
      </div>
    </div>`;
  }).join('');

  return`<div class="card-3d-container">
    <div class="card-top-bar"><div class="card-counter">${tx(`اليوم ${S.cardIdx+1} من ${activeDays.length}`,`Day ${S.cardIdx+1} of ${activeDays.length}`)}</div></div>
    <div class="card-day-header${isToday?' today':''}">
      <div class="card-day-label-group"><span class="card-day-text">${fmtCard(d)}</span></div>
      ${isToday?`<span class="card-today-badge">⏳ ${tx('اليوم','Today')}</span>`:''}
    </div>
    <div class="session-cards-list">${cards}</div>
    ${entry.day_note?`<div class="card-tip">📝 ${entry.day_note}</div>`:''}
    <div class="card-nav">
      <button class="card-nav-btn" onclick="PV2._cardPrev()" ${S.cardIdx===0?'disabled':''}><i class="fas fa-arrow-right"></i> ${tx('السابق','Prev')}</button>
      <button class="card-nav-btn" onclick="PV2._cardNext()" ${S.cardIdx>=activeDays.length-1?'disabled':''}>${tx('التالي','Next')} <i class="fas fa-arrow-left"></i></button>
    </div>
  </div>`;
}

function _studyListView(activeDays,todayS,p){
  const startStr=p.start_date||activeDays[0]?.[0]||todayS;const weeks={};
  for(const[d,entry]of activeDays){const w=Math.max(1,Math.ceil((dDiff(d,startStr)+1)/7));if(!weeks[w])weeks[w]=[];weeks[w].push({d,entry});}
  let html='';
  for(const[w,days]of Object.entries(weeks).sort(([a],[b])=>parseInt(a)-parseInt(b))){
    html+=`<div class="week-section"><div class="week-label">📌 ${tx(`الأسبوع ${w}`,`Week ${w}`)}</div>`;
    for(const{d,entry}of days){
      const items=entry.items||[];const modItems=items.filter(i=>i.type==='module');
      const doneC=modItems.filter(i=>i.completed).length;const total=modItems.length;
      const isToday=d===todayS,isPast=d<todayS,allDone=total>0&&modItems.every(i=>i.completed);
      const isRestDay=items.length===0&&entry.day_note;

      
      if(isRestDay){
        html+=`<div class="day-section rest-day-section${isToday?' today-section':''}" data-date="${d}">
          <div class="day-header">
            <div class="day-label-group">
              <div class="day-label">${fmtCard(d)}</div>
              <span class="rest-day-tag">☕ ${tx('يوم راحة','Rest Day')}</span>
            </div>
            ${isToday?`<div class="day-status today">⏳ ${tx('اليوم','Today')}</div>`:''}
          </div>
          <div class="rest-day-note" onclick="PV2.editDayNote('${d}')">📝 ${entry.day_note}</div>
        </div>`;
        continue;
      }

      let sc='upcoming',st='';
      if(isToday){sc='today';st=`⏳ ${tx('اليوم','Today')}`;}
      else if(allDone){sc='completed';st=`✅ ${tx('منتهي','Done')}`;}
      else if(isPast){sc='past';}
      html+=`<div class="day-section${isToday?' today-section':''}${isPast&&!isToday?' past-section':''}" data-date="${d}" data-day-type="study">
        <div class="day-header"><div class="day-label-group"><div class="day-label">${fmtCard(d)}</div></div>
          <div class="day-header-right"><span class="day-progress-count">${doneC}/${total}</span>${st?`<div class="day-status ${sc}">${st}</div>`:''}</div>
        </div>`;
      for(const item of items){
        if(item.type==='event'){
          const _isRev=item.event_type&&item.event_type.startsWith('review');const ec=(_isRev&&item.course_id)?cColor(item.course_id):evColor(item.event_type);const evTxt=isAr()?(EV_TYPES.find(x=>x.id===item.event_type)?.ar||item.event_type):(EV_TYPES.find(x=>x.id===item.event_type)?.en||item.event_type);
          html+=`<div class="session-card${item.completed?' completed':''}" onclick="PV2.showItemMenu('${d}','${item.id}')"><div class="session-card-top"><span class="session-badge medium" style="background:${ec};border-color:${ec};color:#fff">${evIcon(item.event_type)} ${evTxt}</span></div><div class="session-course">${item.label||''}</div><div class="session-actions"><button class="session-action-btn session-complete-btn" onclick="event.stopPropagation();PV2.toggleDone('${d}','${item.id}')">${item.completed?tx('↩ إلغاء','↩ Undo'):tx('✅ أنهيت','✅ Done')}</button></div></div>`;
          continue;
        }
        const color=cColor(item.course_id);const title=mTitle(item.course_id,item.module_id);
        const md=getMd(item.course_id,item.module_id);const diff=md?.module_difficulty||5;const dl=dLbl(diff);
        const mustKnow=(md?.topics||[]).flatMap(t=>isAr()?(t.must_know||[]):(t.must_know_en||t.must_know||[]));
        const mustMem=(md?.topics||[]).flatMap(t=>isAr()?(t.must_memorize||[]):(t.must_memorize_en||t.must_memorize||[]));
        const note=S.data.module_notes?.[`${item.course_id}_${item.module_id}`]||'';
        const pt=item.total_parts>1?` (${item.part}/${item.total_parts})`:'';
        const num=parseInt((item.module_id||'').replace(/^M/i,''));const url=!isNaN(num)?`../${item.course_id}/M${pad(num)}.html`:null;
        const st2=getModStatus(item.course_id,item.module_id);
        html+=`<div class="session-card${item.completed?' completed':''}" onclick="PV2.showItemMenu('${d}','${item.id}')" style="border-inline-start:4px solid ${color}"><div class="session-card-top"><span class="session-badge ${dl}">${item.module_id}${pt}</span><span class="session-difficulty">${tx('الصعوبة: ','Diff: ')}${diff}/10</span>${st2!=='new'?`<span>${statusIcon(st2)}</span>`:''}</div><div class="session-course">${item.course_id} — ${title}</div><div class="session-details">${mustKnow.slice(0,2).map(x=>`<span>🎯 ${x}</span>`).join('')}${mustMem.slice(0,1).map(x=>`<span>📝 ${x}</span>`).join('')}${note?`<span style="color:#a78bfa">💡 ${note}</span>`:''}</div><div class="session-actions">${url?`<a href="${url}" class="session-action-btn study-link-btn" onclick="event.stopPropagation()">📖 ${tx('ادرس','Study')}</a>`:''}<button class="session-action-btn session-complete-btn" onclick="event.stopPropagation();PV2.toggleDone('${d}','${item.id}')">${item.completed?tx('↩ إلغاء','↩ Undo'):tx('✅ أنهيت','✅ Done')}</button></div>${entry.day_note?`<div class="session-link-alert">📝 ${entry.day_note}</div>`:''}</div>`;
      }
      html+='</div>';
    }
    html+='</div>';
  }
  return html;
}



function exportPrint(){ showPrintOptions(); }
function _exportPrintLegacy(){
  const p=cPlan();const todayS=today();const ar=isAr();
  const activeDays=Object.entries(p.entries).filter(([,e])=>(e.items||[]).length>0).sort(([a],[b])=>a.localeCompare(b));
  const planLbl=S.activePlan==='midterm'?(ar?'الميدتيرم':'Midterm'):(ar?'الفاينل':'Final');
  const diffColors={critical:'#9f1239',hard:'#ef4444',medium:'#f59e0b',easy:'#10b981'};

  
  const startStr=p.start_date||activeDays[0]?.[0]||todayS;
  const weeks={};
  for(const[d,entry]of activeDays){const w=Math.max(1,Math.ceil((dDiff(d,startStr)+1)/7));if(!weeks[w])weeks[w]=[];weeks[w].push({d,entry});}

  let bodyHTML='';
  for(const[w,days]of Object.entries(weeks).sort(([a],[b])=>parseInt(a)-parseInt(b))){
    bodyHTML+=`<div class="week-block"><h2 class="week-title">📌 ${ar?`الأسبوع ${w}`:`Week ${w}`}</h2>`;
    for(const{d,entry}of days){
      const items=entry.items||[];
      const modItems=items.filter(i=>i.type==='module');
      const doneC=modItems.filter(i=>i.completed).length;
      bodyHTML+=`<div class="day-block"><div class="day-hdr"><span class="day-name">${fmtL(d)}</span><span class="day-cnt">${doneC}/${modItems.length}</span></div>`;
      for(const item of items){
        if(item.type==='event'){
          const ec=evColor(item.event_type);const evTxt=ar?(EV_TYPES.find(x=>x.id===item.event_type)?.ar||item.event_type):(EV_TYPES.find(x=>x.id===item.event_type)?.en||item.event_type);
          bodyHTML+=`<div class="session-item session-event" style="border-color:${ec}"><div class="si-top"><span class="si-badge" style="background:${ec}">${evIcon(item.event_type)} ${evTxt}</span></div><div class="si-title">${item.label||''}</div></div>`;
          continue;
        }
        const color=cColor(item.course_id);const title=mTitle(item.course_id,item.module_id);
        const md=getMd(item.course_id,item.module_id);const diff=md?.module_difficulty||5;const dl=dLbl(diff);
        const dc=diffColors[dl];const pt=item.total_parts>1?` (${item.part}/${item.total_parts})`:'';
        const mustKnow=(md?.topics||[]).flatMap(t=>ar?(t.must_know||[]):(t.must_know_en||t.must_know||[]));
        const note=S.data.module_notes?.[`${item.course_id}_${item.module_id}`]||'';
        const st=getModStatus(item.course_id,item.module_id);const si=statusIcon(st);
        bodyHTML+=`<div class="session-item${item.completed?' done':''}" style="border-color:${dc}">
          <div class="si-top">
            <span class="si-badge" style="background:${dc}">${item.module_id}${pt}</span>
            <span class="si-course" style="color:${color}">${item.course_id}</span>
            <span class="si-diff" style="color:${dc}">${dTx(dl)} (${diff}/10)</span>
            ${si?`<span class="si-status">${si}</span>`:''}
            ${item.completed?'<span class="si-done">✅</span>':''}
          </div>
          <div class="si-title">${title}</div>
          ${mustKnow.slice(0,2).length?`<div class="si-points">${mustKnow.slice(0,2).map(x=>`<span>🎯 ${x}</span>`).join('')}</div>`:''}
          ${note?`<div class="si-note">💡 ${note}</div>`:''}
        </div>`;
      }
      if(entry.day_note) bodyHTML+=`<div class="day-note">📝 ${entry.day_note}</div>`;
      bodyHTML+='</div>';
    }
    bodyHTML+='</div>';
  }

  const win=window.open('','_blank');
  win.document.write(`<!DOCTYPE html><html lang="${lang()}" dir="${ar?'rtl':'ltr'}"><head><meta charset="UTF-8">
<title>${ar?`خطة مذاكرة ${planLbl}`:`${planLbl} Study Plan`}</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Tajawal',sans-serif;padding:1rem 1.5rem;margin:0;color:#0f172a;font-size:14px}
h1{font-size:1.4rem;font-weight:900;margin-bottom:.25rem;margin-top:0}
.meta{color:#64748b;font-size:.85rem;margin-bottom:1.5rem;font-weight:600}
.week-block{margin-bottom:1.5rem;page-break-inside:avoid}
.week-title{font-size:1.1rem;font-weight:900;color:#7c3aed;border-bottom:2px solid #e2e8f0;padding-bottom:.4rem;margin-bottom:.75rem}
.day-block{margin-bottom:1rem;padding:.75rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;page-break-inside:avoid}
.day-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem}
.day-name{font-weight:800;font-size:.95rem}
.day-cnt{font-size:.78rem;color:#64748b;font-weight:700;background:#e2e8f0;padding:.1rem .5rem;border-radius:999px}
.session-item{background:#fff;border-${ar?'right':'left'}:4px solid #e2e8f0;border-radius:6px;padding:.65rem .85rem;margin-bottom:.45rem;page-break-inside:avoid}
.session-item.done{opacity:.55}
.session-event{background:#fafafa}
.si-top{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.3rem}
.si-badge{padding:.18rem .55rem;border-radius:999px;font-size:.72rem;font-weight:800;color:#fff}
.si-course{font-size:.78rem;font-weight:800}
.si-diff{font-size:.72rem;font-weight:700}
.si-status{font-size:.78rem}
.si-done{font-size:.78rem}
.si-title{font-weight:700;font-size:.88rem;color:#1e293b;margin-bottom:.2rem}
.si-points{display:flex;flex-direction:column;gap:.15rem;font-size:.78rem;color:#475569;margin-top:.25rem}
.si-points span{display:block}
.si-note{font-size:.78rem;color:#6366f1;margin-top:.25rem;font-weight:600}
.day-note{font-size:.78rem;color:#6366f1;font-style:italic;margin-top:.3rem;padding:.3rem .5rem;background:#ede9fe;border-radius:4px}
@page{margin:1cm 1.5cm} @media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{padding:0;margin:0} .week-block{page-break-inside:avoid;margin-bottom:.75rem}}
</style></head><body>
<h1>📅 ${ar?`خطة مذاكرة ${planLbl} — المستوى ${LEVEL}`:`${planLbl} Study Plan — Level ${LEVEL}`}</h1>
<p class="meta">${p.start_date?fmtL(p.start_date):''} ${p.end_date?'→ '+fmtL(p.end_date):''} · ${ar?'طُبع في':'Printed'} ${fmtL(todayS)}</p>
${bodyHTML}
<script>window.onload=()=>window.print()<\/script>
</body></html>`);
  win.document.close();
}


function navPrev(){ if(S.viewMode==='week'){S.weekStart=addD(S.weekStart,-7);}else{const d=dObj(S.monthDate);d.setMonth(d.getMonth()-1);S.monthDate=moStart(toStr(d));} render(); }
function navNext(){ if(S.viewMode==='week'){S.weekStart=addD(S.weekStart,7);}else{const d=dObj(S.monthDate);d.setMonth(d.getMonth()+1);S.monthDate=moStart(toStr(d));} render(); }
function goToday() { const t=today();S.weekStart=wkStart(t);S.monthDate=moStart(t);render(); }
function setViewMode(mode){S.viewMode=mode;S.data.settings.view_mode=mode;document.querySelectorAll('.pv2-view-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===mode));saveData();render();}


function switchPlan(pt){
  S.activePlan=pt;S.data.active_plan=pt;saveData();
  document.querySelectorAll('.pv2-tab').forEach(t=>t.classList.toggle('active',t.dataset.plan===pt));
  const p=cPlan();if(!p.start_date){showSetup();}else{showPlanUI();render();}
}
function detectPlan(){
  if(S.data.active_plan)return S.data.active_plan;
  const t=today();const mid=pData('midterm');const fin=pData('final');
  if(mid.end_date&&t>mid.end_date&&fin.start_date)return'final';
  if(mid.start_date&&t>=mid.start_date)return'midterm';
  if(fin.start_date&&!mid.start_date)return'final';
  return'midterm';
}


function switchMode(mode){
  S.appMode=mode;S.data.settings.app_mode=mode;saveData();
  document.getElementById('btn-mode-plan')?.classList.toggle('active',mode==='plan');
  document.getElementById('btn-mode-track')?.classList.toggle('active',mode==='track');
  if(mode==='plan')showPlanUI();else showStudyUI();render();
}
function showPlanUI(){
  ['pv2-loading','pv2-setup','pv2-study'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  document.getElementById('pv2-planning').style.display='';
  document.getElementById('mode-toggle').style.display='';S.appMode='plan';
}
function showStudyUI(){
  ['pv2-loading','pv2-setup','pv2-planning'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  document.getElementById('pv2-study').style.display='';
  document.getElementById('mode-toggle').style.display='';S.appMode='track';
}


let wizardStep = 1;

function showSetup(){
  ['pv2-loading','pv2-planning','pv2-study'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  document.getElementById('pv2-setup').style.display='';
  document.getElementById('mode-toggle').style.display='none';
  wizardStep = 1;
  _updateWizard();
}

function selectPlanType(type) {
  S.activePlan = type;
  S.data.active_plan = type;
  
  document.querySelectorAll('.pv2-tab').forEach(t=>t.classList.toggle('active', t.dataset.plan===type));
  wizardStep = 2;
  _updateWizard();
}

function nextStep() {
  if (wizardStep === 2) {
    
    const checkboxes = document.querySelectorAll('.course-checkbox:checked');
    if (!checkboxes.length) {
      _showWizardError(tx('يجب اختيار مادة واحدة على الأقل.','Please select at least one course.'));
      return;
    }
    _hideWizardError();
    wizardStep = 3;
    _updateWizard();
  }
}

function prevStep() {
  if (wizardStep > 1) { wizardStep--; _updateWizard(); }
}

function _showWizardError(msg) {
  const box = document.getElementById('error-box');
  if (box) { box.textContent = msg; box.style.display = 'block'; }
}
function _hideWizardError() {
  const box = document.getElementById('error-box');
  if (box) box.style.display = 'none';
}

function _updateWizard() {
  
  document.querySelectorAll('.step').forEach(el => { el.style.display = 'none'; el.classList.remove('active'); });
  
  const stepIds = {1:'step-plan-type', 2:'step-courses', 3:'step-options'};
  const el = document.getElementById(stepIds[wizardStep]);
  if (el) { el.style.display = 'block'; el.classList.add('active'); }
  
  if (wizardStep === 2) _buildCourseList();
  
  if (wizardStep === 3) _renderOptionsStep();
  
  document.querySelectorAll('.wizard-step-indicator').forEach(ind => {
    const s = parseInt(ind.dataset.step);
    ind.classList.toggle('active', s === wizardStep);
    ind.classList.toggle('completed', s < wizardStep);
    ind.classList.toggle('done', s < wizardStep);
  });
  
  document.querySelectorAll('.wizard-connector').forEach((con, idx) => {
    const passed = (idx + 1) < wizardStep;
    con.classList.toggle('done', passed);
  });
}

function _buildCourseList() {
  const container = document.getElementById('course-list');
  if (!container) return;
  const p = cPlan();
  if (!p.excluded_courses) p.excluded_courses = [];
  const excluded = new Set(p.excluded_courses);
  
  const fullList = [];
  const deletedCourses = new Set(S.data?._deletedCourses||[]);
  if (S.cMap?.courses) for (const [id, data] of Object.entries(S.cMap.courses)) {
    const deletedMods = (S.data?._deletedMods?.[id] || []);
    const mods = Object.entries(data.modules || {})
      .filter(([mid]) => !deletedMods.includes(mid))
      .map(([mid, md]) => ({id: mid, name: isAr() ? (md.title || mid) : (md.title_en || md.title || mid)}));
    fullList.push({
      id,
      isCustom: false,
      isElective: !!data.is_elective,
      name: isAr() ? (data.name || id) : (data.name_en || data.name || id),
      mods,
      isRestoring: deletedCourses.has(id)
    });
  }
  for (const c of (S.data?.custom_courses || []))
    fullList.push({id: c.id, isCustom: true, isElective: false, name: c.name, mods: (c.modules || []).map((m, i) => ({id: `M${pad(i+1)}`, name: typeof m === 'string' ? m : (m.name || `Module ${i+1}`)})), isRestoring: false});

  if (!fullList.length) {
    container.innerHTML = `<div class="course-card"><div class="course-header"><div class="course-info"><div class="course-name">${tx('لا توجد مواد متاحة.','No courses available.')}</div></div></div></div>`;
    return;
  }

  
  const required = fullList.filter(c => !c.isElective);
  const electives = fullList.filter(c => c.isElective);

  const renderCard = (course) => {
    
    
    let isChecked;
    if (course.isRestoring) {
      isChecked = false;
    } else if (course.isElective) {
      
      
      
      
      const seenSet = new Set(S.data?._seenElectives || []);
      isChecked = seenSet.has(course.id) && !excluded.has(course.id);
    } else {
      
      isChecked = !excluded.has(course.id);
    }
    const color = cColor(course.id);
    const modBtns = course.mods.map(mod => {
      const st = getModStatus(course.id, mod.id);
      const isMastered = (st === 'mastered');
      return `<button class="pv2-mod-rating-btn ${isMastered ? 'mastered' : ''}" onclick="PV2._toggleWizardModMastered(this,'${course.id}','${mod.id}')" data-mid="${mod.id}"><span class="pv2-mod-rating-id">${mod.id}</span></button>`;
    }).join('');
    const electiveBadge = course.isElective ? `<span class="elective-badge">⭐ ${tx('اختيارية','Elective')}</span>` : '';
    const restoringBadge = course.isRestoring ? `<span style="color:#f59e0b;font-size:.7rem;margin-inline-start:.3rem;">↺ ${tx('محذوفة سابقاً','previously removed')}</span>` : '';
    return `
      <div class="course-card ${isChecked ? 'active' : ''}${course.isElective ? ' is-elective' : ''}" data-course-id="${course.id}" style="${isChecked ? `border-inline-start:4px solid ${color}` : ''}">
        <div class="course-header" onclick="PV2.toggleCourseSelection('${course.id}', this)">
          <input type="checkbox" class="course-checkbox" id="chk-${course.id}" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation(); PV2.toggleCourseSelection('${course.id}', this.parentElement)">
          <div class="course-color-dot" style="width:14px;height:14px;border-radius:50%;background:${color};flex-shrink:0"></div>
          <div class="course-info">
            <div class="course-id">${course.id}${electiveBadge}${restoringBadge}</div>
            <div class="course-name">${course.name}</div>
          </div>
        </div>
        <div class="course-config" style="display: ${isChecked ? 'block' : 'none'};">
          <div class="pv2-form-group" style="margin-bottom:.65rem">
            <label class="pv2-label">📅 ${tx('تاريخ الاختبار (اختياري)','Exam Date (optional)')}</label>
            <input type="date" class="pv2-input" id="scex-${course.id}" value="${p.course_exams?.[course.id]||''}" onchange="PV2.updateCourseExam('${course.id}', this.value)">
          </div>
          ${course.mods.length ? `<div class="course-modules-rating">
            <div style="font-size:.82rem;font-weight:700;color:var(--text-secondary);margin-bottom:.55rem">
              ${tx('🎯 الوحدات المتقنة (لن تُدرج في الجدول)','🎯 Mastered modules (won\'t be scheduled)')}
            </div>
            <div class="pv2-mods-rating-grid">${modBtns}</div>
          </div>` : ''}
        </div>
      </div>`;
  };  

  let html = '';
  
  required.forEach(course => { html += renderCard(course); });

  
  if (electives.length) {
    const anyElectiveActive = electives.some(c => !excluded.has(c.id));
    html += `
      <div class="electives-section">
        <button type="button" class="electives-toggle ${anyElectiveActive ? 'has-active' : ''}" onclick="PV2._toggleElectivesSection()">
          <span class="electives-toggle-icon">⭐</span>
          <span class="electives-toggle-title">${tx('المواد الاختيارية','Elective Courses')}</span>
          <span class="electives-toggle-count">${electives.length}</span>
          <i class="fas fa-chevron-down" id="electives-chevron"></i>
        </button>
        <div class="electives-list" id="electives-list" style="display:${anyElectiveActive ? 'block' : 'none'}">
          <p class="electives-hint">${tx('💡 المواد الاختيارية مغلقة افتراضياً — فعّلها إذا اخترتها هذا الفصل','💡 Elective courses are off by default — enable the ones you took')}</p>
          ${electives.map(c => renderCard(c)).join('')}
        </div>
      </div>`;
  }

  container.innerHTML = html;
}

function _toggleElectivesSection(){
  const list=document.getElementById('electives-list');
  const chev=document.getElementById('electives-chevron');
  if(!list)return;
  const isOpen=list.style.display!=='none';
  list.style.display=isOpen?'none':'block';
  if(chev)chev.style.transform=isOpen?'rotate(0deg)':'rotate(180deg)';
}

function toggleCourseSelection(id, el) {
  const card = el.closest('.course-card');
  if (!card) return;
  const chk = card.querySelector('.course-checkbox');
  const config = card.querySelector('.course-config');
  const p = cPlan();
  if (!p.excluded_courses) p.excluded_courses = [];
  if (!S.data._seenElectives) S.data._seenElectives = [];
  const isElective = !!(S.cMap?.courses?.[id]?.is_elective);
  if (el.tagName !== 'INPUT') { chk.checked = !chk.checked; }
  if (chk.checked) {
    card.classList.add('active');
    if (config) config.style.display = 'block';
    
    p.excluded_courses = p.excluded_courses.filter(x => x !== id);
    
    if (S.data._deletedCourses) S.data._deletedCourses = S.data._deletedCourses.filter(x => x !== id);
    
    if (isElective && !S.data._seenElectives.includes(id)) S.data._seenElectives.push(id);
    
    const color = cColor(id);
    card.style.borderInlineStart = `4px solid ${color}`;
    if (!p.course_exams) p.course_exams = {};
    if (p.course_exams[id] === undefined) p.course_exams[id] = '';
  } else {
    card.classList.remove('active');
    if (config) config.style.display = 'none';
    
    if (!p.excluded_courses.includes(id)) p.excluded_courses.push(id);
    if (p.course_exams) delete p.course_exams[id];
    card.style.borderInlineStart = '';
    
    if (isElective) S.data._seenElectives = S.data._seenElectives.filter(x => x !== id);
  }
  saveData();
}

function updateCourseExam(id, val) {
  const p = cPlan();
  if (!p.course_exams) p.course_exams = {};
  p.course_exams[id] = val;
}

function _toggleWizardModMastered(btn, cid, mid) {
  
  const wasMastered = getModStatus(cid, mid) === 'mastered';

  if (wasMastered) {
    
    setModStatus(cid, mid, 'new');
    
    const p = cPlan();
    for (const d of Object.keys(p.entries||{})) {
      if (p.entries[d].items) {
        const idx = p.entries[d].items.findIndex(i => i.type==='module' && i.course_id===cid && i.module_id===mid && i.completed && (i.total_parts||1)===1);
        if (idx !== -1) p.entries[d].items.splice(idx, 1);
        if (!p.entries[d].items.length && !p.entries[d].day_note) delete p.entries[d];
      }
    }
    
    if (btn && btn.isConnected) btn.classList.remove('mastered');
  } else {
    
    setModStatus(cid, mid, 'mastered');
    
    const p = cPlan();
    const todayStr = today();
    if (!p.entries) p.entries = {};
    if (!p.entries[todayStr]) p.entries[todayStr] = { items: [], day_note: '' };
    const placed = placedSet(S.activePlan);
    if (!placed.has(`${cid}_${mid}`)) {
      p.entries[todayStr].items.push({ id: uid(), type: 'module', course_id: cid, module_id: mid, part: 1, total_parts: 1, completed: true });
    } else {
      for (const d of Object.keys(p.entries)) {
        (p.entries[d].items||[]).forEach(i => { if (i.type==='module' && i.course_id===cid && i.module_id===mid) i.completed = true; });
      }
    }
    
    if (btn && btn.isConnected) btn.classList.add('mastered');
  }
  saveData();
}

function _renderOptionsStep() {
  const p = cPlan();
  const startEl = document.getElementById('setup-start');
  const endEl = document.getElementById('setup-end');
  if (startEl) startEl.value = p.start_date || today();
  if (endEl) endEl.value = p.end_date || (p.start_date ? addD(p.start_date, 30) : addD(today(), 30));
  const hoursEl = document.getElementById('setup-hours');
  if (hoursEl) hoursEl.value = S.data.settings?.hours_per_day || '';
}

function _collectSetupData(){
  const sv = document.getElementById('setup-start')?.value;
  const ev = document.getElementById('setup-end')?.value;
  const hv = parseInt(document.getElementById('setup-hours')?.value);
  if (!sv) { _showWizardError(tx('الرجاء تحديد تاريخ البدء','Please select start date')); return null; }
  if (!ev) { _showWizardError(tx('الرجاء تحديد تاريخ النهاية','Please select end date')); return null; }
  if (sv > ev) { _showWizardError(tx('تاريخ النهاية يجب أن يكون بعد البداية','End date must be after start date')); return null; }
  _hideWizardError();
  const p = cPlan();
  p.start_date = sv; p.end_date = ev;
  if (!isNaN(hv) && hv > 0) S.data.settings.hours_per_day = hv;
  else delete S.data.settings.hours_per_day;
  return p;
}

function finishSetup(mode) {
  if (!_collectSetupData()) return;
  saveData();
  showPlanUI();
  S.weekStart = wkStart(cPlan().start_date);
  S.monthDate = moStart(cPlan().start_date);
  render();
  if (mode === 'smart') setTimeout(() => smartSchedule(), 300);
  else if (mode === 'ai') setTimeout(() => aiGenerate(), 300);
}


function _startManual(){if(!_collectSetupData())return;saveData();showPlanUI();S.weekStart=wkStart(cPlan().start_date);S.monthDate=moStart(cPlan().start_date);render();}
function _startSmart(){if(!_collectSetupData())return;saveData();showPlanUI();S.weekStart=wkStart(cPlan().start_date);S.monthDate=moStart(cPlan().start_date);render();setTimeout(()=>smartSchedule(),300);}
function _startAI(){if(!_collectSetupData())return;saveData();showPlanUI();S.weekStart=wkStart(cPlan().start_date);S.monthDate=moStart(cPlan().start_date);render();setTimeout(()=>aiGenerate(),300);}


function showPrintOptions() {
  modal(`<div class="pv2-modal-header">
    <h3 class="pv2-modal-title">🖨️ ${tx('طباعة الجدول','Print Plan')}</h3>
    <button class="pv2-modal-close" onclick="PV2.closeModal()">✕</button>
  </div>
  <p style="color:var(--text-secondary);font-size:.88rem;margin-bottom:1rem">${tx('اختر نوع التقرير','Choose the report type')}</p>
  <div class="pv2-export-options">
    <button class="pv2-export-card" onclick="PV2.closeModal();PV2._doPrint('classic')">
      <div class="pv2-export-icon">📋</div>
      <div class="pv2-export-title">${tx('قائمة أسبوعية','Weekly List')}</div>
      <div class="pv2-export-desc">${tx('بطاقات مفصلة حسب الأسبوع','Detailed cards by week')}</div>
    </button>
    <button class="pv2-export-card" onclick="PV2.closeModal();PV2._doPrint('calendar')">
      <div class="pv2-export-icon">📅</div>
      <div class="pv2-export-title">${tx('جدول التقويم','Calendar Grid')}</div>
      <div class="pv2-export-desc">${tx('جدول مضغوط لكل المواد','Compact grid per course')}</div>
    </button>
  </div>
  <p style="font-size:.72rem;color:var(--text-muted);margin-top:.85rem;text-align:center;line-height:1.5">
    ${tx('💡 في نافذة الطباعة، اختر "حفظ كـ PDF" للحصول على ملف رقمي','💡 In the print dialog, choose "Save as PDF" for a digital file')}
  </p>`);
}

function _doPrint(mode) {
  if (mode === 'classic') _printClassic();
  else _printCalendar();
}

function _printClassic() {
  const p = cPlan(); const ar = isAr();
  const planLbl = S.activePlan === 'midterm' ? (ar?'الميدتيرم':'Midterm') : (ar?'الفاينل':'Final');

  
  const activeDays = Object.entries(p.entries).filter(([,e])=>(e.items||[]).length>0 || e.day_note).sort(([a],[b])=>a.localeCompare(b));
  if (!activeDays.length) { alert(tx('لا توجد جلسات للطباعة','No sessions to print')); return; }

  const startStr = p.start_date || activeDays[0]?.[0] || today();
  const endStr = p.end_date || activeDays[activeDays.length-1]?.[0] || today();
  const examDays = p.course_exams || {};

  
  const subjectsMap = {};
  if (S.projCfg?.subjects) {
    for (const [code, meta] of Object.entries(S.projCfg.subjects)) {
      if (typeof meta === 'object' && !code.startsWith('__')) subjectsMap[code] = meta;
    }
  }
  function hexToRgba(hex, alpha) {
    if (!hex || hex[0] !== '#') return `rgba(100,116,139,${alpha})`;
    const h = hex.replace('#','');
    const r = parseInt(h.substring(0,2),16);
    const g = parseInt(h.substring(2,4),16);
    const b = parseInt(h.substring(4,6),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  function getCourseStyle(cid) {
    const meta = subjectsMap[cid];
    const brand = meta?.brand_500 || cColor(cid) || '#475569';
    return {
      brand,
      icon: meta?.icon || 'fa-solid fa-book',
      softBg: hexToRgba(brand, 0.08),
      softBorder: hexToRgba(brand, 0.30),
      verySoftBg: hexToRgba(brand, 0.05)
    };
  }

  
  const weeks = {};
  for (const [d, entry] of activeDays) {
    const w = Math.max(1, Math.ceil((dDiff(d, startStr) + 1) / 7));
    if (!weeks[w]) weeks[w] = [];
    weeks[w].push({ d, entry });
  }
  const weekKeys = Object.keys(weeks).sort((a, b) => parseInt(a) - parseInt(b));

  
  function inferWeekTheme(wkNum, isFirst, isLast, hasExamThisWeek, hadExamPrevWeek) {
    if (isFirst) return ar ? 'التأسيس' : 'Foundation';
    if (wkNum === 2 && !hasExamThisWeek) return ar ? 'البناء' : 'Build';
    if (hasExamThisWeek && !hadExamPrevWeek) return ar ? 'بدء الاختبارات' : 'Exams Start';
    if (hasExamThisWeek && hadExamPrevWeek) return ar ? 'متابعة الاختبارات' : 'Continue Exams';
    if (isLast) return ar ? 'المرحلة النهائية' : 'Final Phase';
    return ar ? `الأسبوع ${wkNum}` : `Week ${wkNum}`;
  }

  
  const totalModules = activeDays.reduce((acc, [, e]) => acc + (e.items || []).filter(i => i.type === 'module').length, 0);
  const totalDays = activeDays.length;
  const weekCount = weekKeys.length;

  
  let bodyHTML = '';

  for (let wkIdx = 0; wkIdx < weekKeys.length; wkIdx++) {
    const w = weekKeys[wkIdx];
    const days = weeks[w];
    const wkNum = parseInt(w);
    const firstD = days[0].d;
    const lastD = days[days.length - 1].d;
    const wkRange = `${dom(firstD)} ${MON_EN[dObj(firstD).getMonth()].slice(0,3)} – ${dom(lastD)} ${MON_EN[dObj(lastD).getMonth()].slice(0,3)}`;
    const wkItemCount = days.reduce((acc, { entry }) => acc + (entry.items || []).filter(i => i.type === 'module').length, 0);

    const hasExamThisWeek = days.some(({d}) => Object.values(examDays).includes(d));
    const hadExamPrevWeek = wkIdx > 0 && weeks[weekKeys[wkIdx-1]].some(({d}) => Object.values(examDays).includes(d));
    const weekTheme = inferWeekTheme(wkNum, wkIdx === 0, wkIdx === weekKeys.length - 1, hasExamThisWeek, hadExamPrevWeek);

    bodyHTML += `<section class="week-page">
    <div class="week-divider">
      <div class="week-pill-container">
        <span class="week-pill">${ar?'الأسبوع':'Week'} ${wkNum}</span>
      </div>
      <div class="week-theme">${weekTheme} · ${wkRange} · ${wkItemCount} ${ar?'وحدة':'modules'}</div>
      <div class="week-line"></div>
    </div>`;

    for (const { d, entry } of days) {
      const items = entry.items || [];
      const dayIdx = dIdx(d);
      const dayName = (ar ? DAY_AR : DAY_EN)[dayIdx];
      const dayLong = ar
        ? `${dayName} ${dom(d)} ${MON_AR[dObj(d).getMonth()]}`
        : `${dayName}, ${MON_EN[dObj(d).getMonth()]} ${dom(d)}`;

      
      const examEntry = Object.entries(examDays).find(([, ed]) => ed === d);
      const isExamDay = !!examEntry;
      const isRestDay = items.length === 0 && entry.day_note;
      const onlyReviews = items.length > 0 && items.every(i => i.type === 'event' && i.event_type && i.event_type.includes('review'));

      let dayThemeClass = 'theme-study';
      let dayIcon = '📅';
      let typeLabel = '';
      if (isExamDay) {
        dayThemeClass = 'theme-exam';
        dayIcon = '📝';
        typeLabel = ar ? `يوم اختبار · ${examEntry[0]}` : `Exam Day · ${examEntry[0]}`;
      } else if (isRestDay) {
        dayThemeClass = 'theme-rest';
        dayIcon = '☕';
        typeLabel = ar ? 'يوم راحة' : 'Rest Day';
      } else if (onlyReviews) {
        dayThemeClass = 'theme-review';
        dayIcon = '🔄';
        typeLabel = ar ? 'يوم مراجعة' : 'Review Day';
      }

      const sessionCount = items.filter(i => i.type === 'module').length;
      const eventCount = items.filter(i => i.type === 'event').length;
      const totalCount = sessionCount + eventCount;
      const countLabel = ar
        ? `${totalCount} ${totalCount === 1 ? 'جلسة' : 'جلسات'}`
        : `${totalCount} ${totalCount === 1 ? 'session' : 'sessions'}`;

      bodyHTML += `<div class="day-wrapper ${dayThemeClass}">
        <div class="day-header">
          <div class="day-header-main">
            <span class="day-icon">${dayIcon}</span>
            <span class="day-date">${dayLong}</span>
          </div>
          <div class="day-header-meta">
            ${typeLabel ? `<span class="day-type-tag">${typeLabel}</span>` : ''}
            ${totalCount > 0 ? `<span class="day-count-tag">${countLabel}</span>` : ''}
          </div>
        </div>
        <div class="sessions-list">`;

      
      if (isRestDay) {
        bodyHTML += `<div class="rest-message">
          <span class="rest-icon"><i class="fa-solid fa-mug-hot"></i></span>
          <span class="rest-text">${entry.day_note}</span>
        </div>`;
      } else {
        
        for (const item of items) {
          const st = getCourseStyle(item.course_id);
          const courseName = (() => {
            const c = activeCoursesForPlan(S.activePlan).find(x => x.id === item.course_id);
            return c ? c.name : item.course_id;
          })();

          if (item.type === 'event') {
            
            const et = item.event_type || '';
            const isReview = et.includes('review');
            let revKind = '';
            if (et === 'review_mid') revKind = ar ? 'ميد' : 'Mid';
            else if (et === 'review_final') revKind = ar ? 'فاينل' : 'Final';
            else if (et === 'review_full') revKind = ar ? 'شاملة' : 'Full';

            const eventLabel = isReview
              ? (ar ? `مراجعة${revKind ? ` (${revKind})` : ''}` : `${revKind?revKind+' ':''}Review`)
              : (typeof evTypeName === 'function' ? evTypeName(et) : et);

            const icon = isReview
              ? (et === 'review_final' || et === 'review_full' ? 'fa-solid fa-book' : 'fa-solid fa-book-open-reader')
              : 'fa-solid fa-bookmark';

            bodyHTML += `<div class="session-item event-item">
              <div class="session-check-circle" style="border-color:${st.softBorder}"></div>
              <div class="session-content">
                <div class="session-top">
                  <div class="session-course-title">
                    <span class="c-id" style="color:${st.brand}">${item.course_id}</span>
                    <span class="event-pill" style="background:${st.softBg};color:${st.brand};border-color:${st.softBorder}">
                      <i class="${icon}"></i> ${eventLabel}
                    </span>
                    <span class="c-name">${courseName}</span>
                  </div>
                </div>
              </div>
            </div>`;
            continue;
          }

          
          const title = mTitle(item.course_id, item.module_id);
          const pt = item.total_parts > 1 ? ` <span class="pt-tag">${item.part}/${item.total_parts}</span>` : '';
          const md = getMd ? getMd(item.course_id, item.module_id) : null;
          const hrs = md?.study_hours_estimate
            ? `<span class="hrs-tag"><i class="fa-regular fa-clock"></i> ${fmtH(md.study_hours_estimate / (item.total_parts || 1))}</span>`
            : '';
          const diff = md?.module_difficulty || 5;
          let diffClass = 'easy', diffLabel = '';
          if (diff >= 9) { diffClass = 'critical'; diffLabel = ar ? 'حرج' : 'Critical'; }
          else if (diff >= 7) { diffClass = 'hard'; diffLabel = ar ? 'صعب' : 'Hard'; }
          else if (diff >= 4) { diffClass = 'medium'; diffLabel = ar ? 'متوسط' : 'Medium'; }
          else { diffClass = 'easy'; diffLabel = ar ? 'سهل' : 'Easy'; }
          const diffBadge = md?.module_difficulty ? `<span class="diff-badge ${diffClass}">${diffLabel}</span>` : '';

          const instLbl = typeof instanceLabel === 'function' ? instanceLabel(item) : '';
          const instTag = instLbl ? `<span class="inst-tag" style="color:${st.brand};border-color:${st.softBorder};background:${st.softBg}">${instLbl}</span>` : '';

          bodyHTML += `<div class="session-item${item.instance_kind==='review'?' is-review':''}" style="border-${ar?'right':'left'}-color:${st.brand}">
            <div class="session-check-circle" style="border-color:${st.softBorder}"></div>
            <div class="session-content">
              <div class="session-top">
                <div class="session-course-title">
                  <span class="c-id" style="color:${st.brand}">${item.course_id}</span>
                  <span class="m-id">${item.module_id}${pt}</span>
                  <span class="c-name">${title}</span>
                </div>
                <div class="session-tags">
                  ${instTag}
                  ${hrs}
                  ${diffBadge}
                </div>
              </div>
            </div>
          </div>`;
        }

        
        if (entry.day_note && !isRestDay) {
          bodyHTML += `<div class="day-note-row">
            <i class="fa-regular fa-lightbulb"></i> ${entry.day_note}
          </div>`;
        }
      }

      bodyHTML += `</div></div>`;
    }
    bodyHTML += `</section>`;
  }

  
  const allExams = activeCoursesForPlan(S.activePlan).filter(c => examDays[c.id]);
  const examChipsHTML = allExams.map(c => {
    const ed = examDays[c.id];
    const st = getCourseStyle(c.id);
    return `<span class="exam-chip" style="background:${st.softBg};color:${st.brand};border-color:${st.softBorder}">
      <i class="fa-solid fa-star"></i> <strong>${c.id}</strong>: ${dom(ed)} ${MON_EN[dObj(ed).getMonth()].slice(0,3)}
    </span>`;
  }).join('');

  
  const startMon = MON_EN[dObj(startStr).getMonth()].slice(0,3);
  const endMon = MON_EN[dObj(endStr).getMonth()].slice(0,3);
  const dateRange = `${startMon} ${dom(startStr)} – ${endMon} ${dom(endStr)} · ${dObj(startStr).getFullYear()}`;
  const subtitleText = ar
    ? `${planLbl} · ${totalDays} ${totalDays===1?'يوم':'يوم'} · ${weekCount} ${weekCount===1?'أسبوع':'أسابيع'} · ${totalModules} وحدة`
    : `${planLbl} Plan · ${totalDays} ${totalDays===1?'day':'days'} · ${weekCount} ${weekCount===1?'week':'weeks'} · ${totalModules} modules`;

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html dir="${ar?'rtl':'ltr'}" lang="${ar?'ar':'en'}"><head>
  <meta charset="UTF-8">
  <title>${planLbl} ${ar?'خطة المذاكرة':'Study Plan'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    @page { size: A4 portrait; margin: 10mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: ${ar?"'Noto Kufi Arabic', 'Inter', sans-serif":"'Inter', sans-serif"};
      font-size: 10pt;
      line-height: 1.6;
      color: #1e293b;
      background: #ffffff;
      direction: ${ar?'rtl':'ltr'};
    }

    .print-container { max-width: 100%; margin: 0 auto; }

    /* Document header */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 16px;
    }
    .doc-title {
      font-size: 24pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
      line-height: 1.1;
    }
    .doc-subtitle {
      font-size: 10.5pt;
      font-weight: 600;
      color: #64748b;
    }
    .doc-branding {
      font-size: 14pt;
      font-weight: 900;
      color: #0f766e;
      letter-spacing: -0.3px;
      opacity: 0.9;
    }

    /* Range + exam chips strip */
    .doc-range-strip {
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 10px;
      margin-bottom: 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      border: 1px solid #e2e8f0;
    }
    .doc-range-strip .range-label {
      font-size: 9.5pt;
      font-weight: 700;
      color: #475569;
      ${ar?'margin-left':'margin-right'}: 6px;
    }
    .exam-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 8.5pt;
      font-weight: 700;
      border: 1px solid;
      letter-spacing: .2px;
    }
    .exam-chip i { font-size: 7.5pt; }

    /* Plan grid layout */
    .plan-grid { display: block; }
    .plan-grid > * { margin-bottom: 14px; }

    /* Week divider */
    .week-divider {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 20px 0 10px 0;
      position: relative;
      page-break-after: avoid;
      break-after: avoid;
    }
    .week-pill-container { background: #ffffff; padding: 0 16px; z-index: 2; }
    .week-pill {
      background: #0f172a;
      color: #ffffff;
      padding: 5px 16px;
      border-radius: 20px;
      font-size: 10pt;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .week-theme {
      background: #ffffff;
      color: #475569;
      font-size: 10pt;
      font-weight: 700;
      padding: 4px 16px;
      margin-top: 6px;
      z-index: 2;
    }
    .week-line {
      position: absolute;
      top: 13px;
      left: 0; right: 0;
      height: 2px;
      background: #e2e8f0;
      z-index: 1;
    }

    /* Day wrapper */
    .day-wrapper {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 14px;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    /* Day themes — soft pastels (no violet) */
    .theme-study  .day-header { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .theme-exam   .day-header { background: #fff1f2; border-bottom: 1px solid #fecdd3; }
    .theme-review .day-header { background: #fffbeb; border-bottom: 1px solid #fde68a; }
    .theme-rest   .day-header { background: #f0fdfa; border-bottom: 1px solid #99f6e4; }

    .day-header {
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .day-header-main { display: flex; align-items: center; gap: 8px; }
    .day-icon { font-size: 13pt; }
    .day-date { font-size: 11pt; font-weight: 800; color: #0f172a; }

    .day-header-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .day-type-tag {
      font-size: 8.5pt;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 6px;
      background: rgba(0,0,0,0.05);
      color: #334155;
    }
    .theme-exam .day-type-tag { background: #ffe4e6; color: #be123c; }
    .theme-review .day-type-tag { background: #fef3c7; color: #b45309; }
    .theme-rest .day-type-tag { background: #ccfbf1; color: #0f766e; }

    .day-count-tag {
      font-size: 8.5pt;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 6px;
      background: #e2e8f0;
      color: #475569;
    }

    /* Sessions list */
    .sessions-list { display: flex; flex-direction: column; }

    .session-item {
      display: flex;
      padding: 10px 16px;
      border-bottom: 1px dashed #e2e8f0;
      position: relative;
      page-break-inside: avoid;
      break-inside: avoid;
      border-${ar?'right':'left'}: 3px solid transparent;
    }
    .session-item:last-child { border-bottom: none; }
    .session-item.is-review { background: #fefce8; }

    .session-check-circle {
      width: 20px;
      height: 20px;
      border: 2px solid #cbd5e1;
      border-radius: 50%;
      margin-top: 3px;
      margin-${ar?'left':'right'}: 12px;
      flex-shrink: 0;
      background: #fff;
    }

    .session-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .session-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      flex-wrap: wrap;
    }
    .session-course-title {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      line-height: 1.3;
    }
    .c-id {
      font-family: 'Inter', monospace;
      font-weight: 900;
      font-size: 10.5pt;
      letter-spacing: .2px;
    }
    .m-id {
      font-family: 'Inter', monospace;
      font-weight: 700;
      font-size: 9.5pt;
      color: #334155;
      background: #f1f5f9;
      padding: 1px 7px;
      border-radius: 5px;
    }
    .pt-tag {
      font-size: 7pt;
      font-weight: 600;
      color: #64748b;
      vertical-align: super;
    }
    .c-name {
      font-weight: 700;
      font-size: 9.5pt;
      color: #64748b;
    }

    .session-tags {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
      align-items: center;
      flex-wrap: wrap;
    }
    .inst-tag {
      font-size: 8pt;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid;
    }
    .hrs-tag {
      font-size: 8pt;
      font-weight: 700;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }

    /* Difficulty badges */
    .diff-badge {
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 8pt;
      font-weight: 800;
    }
    .diff-badge.easy { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .diff-badge.medium { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .diff-badge.hard { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
    .diff-badge.critical { background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }

    /* Event item (review) */
    .event-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 9pt;
      font-weight: 700;
      border: 1px solid;
      font-style: italic;
    }
    .event-pill i { font-size: 8pt; }

    /* Rest day message */
    .rest-message {
      padding: 16px;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      color: #0f766e;
    }
    .rest-icon { font-size: 18pt; }
    .rest-text { font-size: 11pt; font-weight: 600; font-style: italic; }

    /* Day note (yellow tint, end of day) */
    .day-note-row {
      padding: 8px 16px;
      background: #fefce8;
      border-top: 1px dashed #fde68a;
      color: #854d0e;
      font-size: 9pt;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .day-note-row i { color: #ca8a04; }

    /* Bottom footer */
    .doc-footer {
      text-align: center;
      margin-top: 26px;
      padding-top: 14px;
      border-top: 2px solid #f1f5f9;
      color: #94a3b8;
      font-size: 9pt;
      font-weight: 600;
    }
    .doc-footer .footer-brand {
      color: #0f766e;
      font-weight: 800;
    }

    @media print {
      body { background: #fff; }
      .day-wrapper { break-inside: avoid; page-break-inside: avoid; }
      .week-divider { break-after: avoid; page-break-after: avoid; }
      /* Each week starts on its own page */
      .week-page { break-after: page; page-break-after: always; }
      .week-page:last-child { break-after: auto; page-break-after: auto; }
    }
    /* Each week is a self-contained block */
    .week-page { display: block; }
  </style>
</head>
<body>
<div class="print-container">
  <!-- Header -->
  <div class="doc-header">
    <div class="header-left">
      <h1 class="doc-title">${ar?'خطة المذاكرة':'Study Plan'} · ${planLbl}</h1>
      <p class="doc-subtitle">${subtitleText}</p>
    </div>
    <div class="header-right doc-branding">${ar?'بايت':'Byte'}</div>
  </div>

  ${allExams.length ? `<div class="doc-range-strip">
    <span class="range-label"><i class="fa-regular fa-calendar"></i> ${dateRange}</span>
    ${examChipsHTML}
  </div>` : `<div class="doc-range-strip">
    <span class="range-label"><i class="fa-regular fa-calendar"></i> ${dateRange}</span>
  </div>`}

  <!-- Plan grid -->
  <div class="plan-grid">${bodyHTML}</div>

  <!-- Footer -->
  <div class="doc-footer">
    <span class="footer-brand">${ar?'بايت':'Byte'}</span> · ${ar?'مخطط المذاكرة الذكي':'Intelligent Study Planner'} · ${new Date().toLocaleDateString(ar?'ar':'en')}
  </div>
</div>
<script>setTimeout(function(){window.print();},400);<\/script>
</body>
</html>`);
  win.document.close();
}
function _printCalendar() {
  const p = cPlan(); const ar = isAr();
  const planLbl = S.activePlan === 'midterm' ? (ar?'خطة الميدتيرم':'Midterm Study Plan') : (ar?'خطة الفاينل':'Final Study Plan');

  
  const courses = activeCoursesForPlan(S.activePlan).filter(c => {
    const hasEntry = Object.values(p.entries||{}).some(e => (e.items||[]).some(i => i.course_id === c.id));
    const hasExam = p.course_exams?.[c.id];
    return hasEntry || hasExam;
  });
  if (!courses.length) { alert(tx('لا توجد مواد في الجدول','No courses in schedule')); return; }

  const startStr = p.start_date || today();
  const endStr = p.end_date || addD(startStr, 30);

  
  const allDates = [];
  let cur = startStr;
  while (cur <= endStr) { allDates.push(cur); cur = addD(cur, 1); }

  const examDays = p.course_exams || {};

  
  const subjectsMap = {};
  if (S.projCfg?.subjects) {
    for (const [code, meta] of Object.entries(S.projCfg.subjects)) {
      if (typeof meta === 'object' && !code.startsWith('__')) subjectsMap[code] = meta;
    }
  }

  
  const fallbackBrands = ['#16a34a','#0284c7','#d97706','#dc2626','#0891b2','#ca8a04','#65a30d','#0e7490'];
  const fallbackIcons = ['fa-solid fa-book','fa-solid fa-flask','fa-solid fa-laptop-code','fa-solid fa-square-root-variable','fa-solid fa-microscope','fa-solid fa-pen-fancy','fa-solid fa-chart-bar','fa-solid fa-puzzle-piece'];

  
  function hexToRgba(hex, alpha) {
    if (!hex || hex[0] !== '#') return `rgba(100,116,139,${alpha})`;
    const h = hex.replace('#','');
    const r = parseInt(h.substring(0,2),16);
    const g = parseInt(h.substring(2,4),16);
    const b = parseInt(h.substring(4,6),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  
  const courseStyles = {};
  courses.forEach((c, i) => {
    const meta = subjectsMap[c.id];
    const brand = meta?.brand_500 || c.color || fallbackBrands[i % fallbackBrands.length];
    courseStyles[c.id] = {
      brand: brand,
      icon: meta?.icon || fallbackIcons[i % fallbackIcons.length],
      headerBg: hexToRgba(brand, 0.10),   
      pillBg:   hexToRgba(brand, 0.12),   
      cellBg:   hexToRgba(brand, 0.05),   
      cellBorder: hexToRgba(brand, 0.18), 
      examBg:   hexToRgba(brand, 0.15),   
      iconBg:   '#ffffff'                  
    };
  });

  
  const weekPalette = [
    { bg: '#ecfdf5', accent: '#047857', soft: '#d1fae5' }, 
    { bg: '#eff6ff', accent: '#1e40af', soft: '#dbeafe' }, 
    { bg: '#fffbeb', accent: '#b45309', soft: '#fef3c7' }, 
    { bg: '#fff7ed', accent: '#c2410c', soft: '#ffedd5' }, 
    { bg: '#f0fdfa', accent: '#0f766e', soft: '#ccfbf1' }, 
    { bg: '#f8fafc', accent: '#475569', soft: '#f1f5f9' }  
  ];

  
  const weeks = [];
  let wkIdx = 1;
  for (let i = 0; i < allDates.length; i += 7) {
    weeks.push({ num: wkIdx++, dates: allDates.slice(i, i+7) });
  }

  
  const wkLabels = weeks.map((wk, idx) => {
    const hasExam = wk.dates.some(d => courses.some(c => examDays[c.id] === d));
    const prevWeekHadExam = idx > 0 && weeks[idx-1].dates.some(d => courses.some(c => examDays[c.id] === d));
    const isLast = idx === weeks.length - 1;
    if (idx === 0) return ar ? 'التأسيس' : 'Foundation';
    if (idx === 1 && !hasExam) return ar ? 'البناء' : 'Build';
    if (hasExam && !prevWeekHadExam) return ar ? 'بدء الاختبارات' : 'Exams Start';
    if (hasExam && prevWeekHadExam) return ar ? 'متابعة الاختبارات' : 'Continue Exams';
    if (isLast) return ar ? 'المرحلة النهائية' : 'Final Phase';
    return ar ? `الأسبوع ${idx+1}` : `Week ${idx+1}`;
  });

  
  const dayNamesShort = ar ? ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  
  const courseCardsHTML = courses.map((c) => {
    const style = courseStyles[c.id];
    const examD = examDays[c.id];
    const examFmt = examD ? `${dom(examD)} ${MON_EN[dObj(examD).getMonth()].slice(0,3)}` : '';
    
    const fullName = (c.name || c.id).slice(0, 24);
    return `<div class="course-card" style="background:${style.headerBg};border-color:${style.cellBorder};">
      <div class="cc-name">${fullName}</div>
      <div class="cc-icon" style="color:${style.brand};background:${style.iconBg};box-shadow:0 1pt 3pt ${hexToRgba(style.brand,0.20)}">
        <i class="${style.icon}"></i>
      </div>
      <div class="cc-code" style="color:${style.brand}">${c.id}</div>
      ${examD ? `<div class="cc-exam" style="background:${style.iconBg};color:${style.brand};border:1px solid ${style.cellBorder}"><span class="cc-star">⭐</span> <bdi>${examFmt}</bdi></div>` : ''}
    </div>`;
  }).join('');

  
  const courseHeadersHTML = courses.map((c) => {
    const style = courseStyles[c.id];
    return `<th class="course-th" style="border-top:2pt solid ${style.brand};background:${style.headerBg};">
      <div class="th-icon" style="color:${style.brand}"><i class="${style.icon}"></i></div>
      <div class="th-code" style="color:${style.brand}">${c.id}</div>
      <div class="th-name">${(c.name||'').slice(0,18)}</div>
    </th>`;
  }).join('');

  
  let tbodyHTML = '';
  for (const wk of weeks) {
    const wkLabel = wkLabels[wk.num - 1];
    const wkPal = weekPalette[Math.min(wk.num - 1, weekPalette.length - 1)];
    let wkCellPlaced = false;

    
    let totalRowsForWeek = 0;
    for (const dWeek of wk.dates) {
      const eWeek = p.entries?.[dWeek] || {};
      totalRowsForWeek += 1;
      if ((eWeek.items || []).length > 0 && eWeek.day_note) totalRowsForWeek += 1;
    }

    for (let di = 0; di < wk.dates.length; di++) {
      const d = wk.dates[di];
      const entry = p.entries?.[d] || {};
      const items = entry.items || [];
      const dayIdx = dIdx(d);
      const monthShort = MON_EN[dObj(d).getMonth()].slice(0,3);

      const examCoursesForDay = courses.filter(c => examDays[c.id] === d);
      const isExamDay = examCoursesForDay.length > 0;
      const isWeekend = isWE(d);

      
      let wkCell = '';
      if (!wkCellPlaced) {
        wkCell = `<td rowspan="${totalRowsForWeek}" class="wk-cell" style="background:${wkPal.bg};border-${ar?'left':'right'}:1px solid ${wkPal.soft};">
          <div class="wk-cell-inner">
            <span class="wk-num" style="color:${wkPal.accent}">${ar?'أسبوع':'WEEK'} ${wk.num}</span>
            <span class="wk-label" style="color:${wkPal.accent};opacity:.75">(${wkLabel})</span>
          </div>
        </td>`;
        wkCellPlaced = true;
      }

      
      if (isExamDay) {
        const ec = examCoursesForDay[0];
        const st = courseStyles[ec.id];
        const examCourseName = courses.find(c=>c.id===ec.id)?.name || '';
        const examLabelText = ar ? `${ec.id} ${examCourseName} — اختبار` : `${ec.id} ${examCourseName} EXAM`;

        tbodyHTML += `<tr class="exam-row" style="background:${st.examBg};">
          ${wkCell}
          <td class="date-cell"><strong>${dom(d)}</strong> <span class="date-mon">${monthShort}</span></td>
          <td class="day-cell">${dayNamesShort[dayIdx]}</td>
          <td colspan="${courses.length}" class="exam-cell-merged" style="color:${st.brand};">
            <span class="exam-star-pre">⭐</span>
            <strong>${examLabelText}</strong>
          </td>
        </tr>`;
        continue;
      }

      const hasItems = items.length > 0;
      const hasDayNote = !!entry.day_note;

      
      if (!hasItems && hasDayNote) {
        tbodyHTML += `<tr class="rest-row">
          ${wkCell}
          <td class="date-cell"><strong>${dom(d)}</strong> <span class="date-mon">${monthShort}</span></td>
          <td class="day-cell">${dayNamesShort[dayIdx]}</td>
          <td colspan="${courses.length}" class="rest-cell">
            <span class="rest-pill"><i class="fa-solid fa-mug-hot"></i> ${entry.day_note}</span>
          </td>
        </tr>`;
        continue;
      }

      
      const courseCellsHTML = courses.map(c => {
        const st = courseStyles[c.id];
        const cItems = items.filter(i => i.course_id === c.id && i.type === 'module');
        const cEvents = items.filter(i => i.course_id === c.id && i.type === 'event');
        let inner = '';

        if (cItems.length) {
          const pillsHTML = cItems.map(item => {
            const modTitle = mTitle(c.id, item.module_id);
            const isReviewModule = modTitle.toLowerCase().includes('review') || modTitle.includes('مراجعة');
            const isReviewInstance = item.instance_kind === 'review';
            const isReview = isReviewModule || isReviewInstance;
            const pt = item.total_parts > 1 ? `<sup>${item.part}/${item.total_parts}</sup>` : '';
            const reviewClass = isReview ? ' is-review' : '';
            return `<span class="mod-pill${reviewClass}" style="background:${st.pillBg};color:${st.brand};border:1px solid ${st.cellBorder}">${item.module_id}${pt}</span>`;
          }).join('');
          inner = `<div class="mod-pills-wrap">${pillsHTML}</div>`;
        } else if (cEvents.length) {
          inner = cEvents.map(item => {
            const et = item.event_type || '';
            const isReview = et && et.includes('review');
            let lbl;
            if (isReview) {
              if (et === 'review_mid') lbl = ar ? 'مراجعة ميد' : 'Mid Review';
              else if (et === 'review_final') lbl = ar ? 'مراجعة فاينل' : 'Final Review';
              else if (et === 'review_full') lbl = ar ? 'مراجعة شاملة' : 'Full Review';
              else lbl = ar ? 'مراجعة' : 'Review';
            } else {
              lbl = evTypeName(et);
            }
            return `<span class="ev-pill" style="color:${st.brand};border:1px dashed ${hexToRgba(st.brand,0.25)};background:transparent">${lbl}</span>`;
          }).join(' ');
        }

        
        return `<td class="course-cell">${inner}</td>`;
      }).join('');

      tbodyHTML += `<tr${isWeekend ? ' class="weekend-row"' : ''}>
        ${wkCell}
        <td class="date-cell"><strong>${dom(d)}</strong> <span class="date-mon">${monthShort}</span></td>
        <td class="day-cell">${dayNamesShort[dayIdx]}</td>
        ${courseCellsHTML}
      </tr>`;

      
      if (hasDayNote) {
        tbodyHTML += `<tr class="day-note-secondary">
          <td colspan="${courses.length + 2}" class="day-note-cell" style="text-align:${ar?'right':'left'}">
            <span class="note-pill"><i class="fa-regular fa-lightbulb"></i> ${entry.day_note}</span>
          </td>
        </tr>`;
      }
    }
  }

  
  const startMon = MON_EN[dObj(startStr).getMonth()].slice(0,3);
  const endMon = MON_EN[dObj(endStr).getMonth()].slice(0,3);
  const planRangeLabel = `${startMon} ${dom(startStr)} – ${endMon} ${dom(endStr)}`;

  
  const examListHTML = courses.filter(c => examDays[c.id]).map(c => {
    const examD = examDays[c.id];
    const st = courseStyles[c.id];
    return `<li><span class="exam-list-star">⭐</span> <strong style="color:${st.brand}">${c.id}</strong> <span class="exam-list-name">${(c.name||'').slice(0,20)}</span>: <span class="exam-list-date">${dom(examD)} ${MON_EN[dObj(examD).getMonth()].slice(0,3)}</span></li>`;
  }).join('');

  
  const STUDY_METHODS_AR = [
    ['<strong>بومودورو</strong> · 25 دقيقة تركيز + 5 راحة','بعد 4 جلسات · استرح 20 دقيقة','ابدأ بالأصعب وأنت في قمة تركيزك'],
    ['<strong>تقنية فاينمان</strong> · اشرح الموضوع بكلماتك','عند التعثر · ارجع للمصدر','بسّط حتى لا يبقى غموض'],
    ['<strong>التكرار المتباعد</strong> · راجع بعد ساعة','ثم بعد يوم · ثم بعد أسبوع','الذاكرة تثبت بالتباعد لا بالتكرار المتقارب'],
    ['<strong>الجلسات المركّزة</strong> · 90 دقيقة بلا مقاطعة','أغلق الإشعارات تماماً','الذهن يصل لذروة التركيز بعد 20 دقيقة']
  ];
  const STUDY_METHODS_EN = [
    ['<strong>Pomodoro</strong> · 25 min focus + 5 rest','After 4 sessions · 20 min break','Tackle hardest first at peak focus'],
    ['<strong>Feynman Technique</strong> · Explain in your own words','When stuck · return to the source','Simplify until no confusion remains'],
    ['<strong>Spaced Repetition</strong> · Review after 1 hour','Then after 1 day · then 1 week','Memory consolidates by spacing'],
    ['<strong>Deep Focus</strong> · 90 min uninterrupted','Silence all notifications','Peak focus arrives after 20 min']
  ];
  const SMART_TIPS_AR = [
    ['الاسترجاع النشط أقوى من القراءة','حلّ مسائل بعد كل مودل','راجع قبل النوم لتثبيت المعلومة','يوم الاختبار = مراجعة فقط'],
    ['اشرح الدرس لنفسك كأنك معلّم','اربط المعلومة الجديدة بمعلومة قديمة','نوّع المكان للتغلب على الملل','النوم الجيد > السهر للمذاكرة'],
    ['اختبر نفسك بأسئلة قديمة','اكتب الملخصات بخط يدك','تجنب الـ Multitasking تماماً','استخدم الفلاش كاردز للمفاهيم'],
    ['تعلّم الفكرة قبل الحفظ','رتب أولوياتك من الأصعب للأسهل','خصّص وقتاً للراحة لا تتنازل عنه','اشرب الماء بانتظام']
  ];
  const SMART_TIPS_EN = [
    ['Active recall beats rereading','Practice problems per module','Review before sleep to lock memory','Exam day = review only'],
    ['Teach the topic to yourself','Connect new info to old','Vary your study spot','Good sleep > late-night cramming'],
    ['Test yourself with past papers','Hand-write your summaries','Avoid multitasking entirely','Use flashcards for concepts'],
    ['Understand before memorizing','Order tasks hardest first','Protect rest time fiercely','Stay hydrated']
  ];
  const MOTIVATION_AR = [
    
    'على قدر العزم',           
    'فإن مع العسر',             
    'تؤخذ الدنيا غلابا',        
    'لا يفلّ الحديد إلا الحديد',
    'من جدّ وجد',
    'إذا غامرت في شرف',         
    'فاصبر لها صبرا جميلا',
    'كن جبلا',
    'إنّ الأمور بآخرها',
    'فلا الجبل العالي ينام',
    'من سار وصل',
    'بلغت السماء'
  ];
  const MOTIVATION_EN = [
    
    'Per Aspera ad Astra',      
    'Fortune Favors the Bold',  
    'Carpe Diem',                
    'Festina Lente',             
    'Veni Vidi Vici',            
    'Ad Astra',
    'Audaces Fortuna Iuvat',
    'Hold The Line',
    'This Too Shall Pass',
    'Nil Desperandum',           
    'Dum Spiro Spero',           
    'Sic Itur ad Astra'          
  ];

  const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];
  const methodSet = ar ? pickRandom(STUDY_METHODS_AR) : pickRandom(STUDY_METHODS_EN);
  const tipsSet = ar ? pickRandom(SMART_TIPS_AR) : pickRandom(SMART_TIPS_EN);
  const motivationPhrase = ar ? pickRandom(MOTIVATION_AR) : pickRandom(MOTIVATION_EN);
  const FOOTER_QUOTES_AR = [
    'وما نيلُ المطالبِ بالتمنّي · ولكن تُؤخذُ الدنيا غلابا',     
    'على قدر أهل العزمِ تأتي العزائم · وتأتي على قدر الكرامِ المكارم',  
    'إذا كنتَ ذا رأيٍ فكن ذا عزيمة · فإن فسادَ الرأي أن تترددا',   
    'بقدرِ الكدِّ تكتسبُ المعالي · ومن طلبَ العُلى سهرَ اليالي',
    'إذا غامرتَ في شرفٍ مرومٍ · فلا تقنعْ بما دونَ النجومِ',
	'ومن يتهيبْ صعودَ الجبالِ · يعشْ أبدَ الدهرِ بين الحفرِ',
	'إذا كانتِ النفوسُ كبارًا · تعبتْ في مرادِها الأجسامُ',
	'لا تحسبنَّ المجدَ تمرًا أنتَ آكلُهُ · لن تبلغَ المجدَ حتى تلعقَ الصبرَا',
	'ومن طلبَ العُلا من غيرِ كدٍّ · أضاعَ العمرَ في طلبِ المحالِ'
  ];
  const FOOTER_QUOTES_EN = [
    'It always seems impossible until it\'s done — Nelson Mandela',
    'The journey of a thousand miles begins with a single step — Lao Tzu',
    'Success is not final, failure is not fatal: it is the courage to continue that counts — Winston Churchill',
    'What lies behind us and what lies before us are tiny matters compared to what lies within us — R.W. Emerson',
    'Fall seven times, stand up eight — Japanese Proverb'
  ];
  const footerQuote = ar ? pickRandom(FOOTER_QUOTES_AR) : pickRandom(FOOTER_QUOTES_EN);

  const win = window.open('','_blank');
  win.document.write(`<!DOCTYPE html><html dir="${ar?'rtl':'ltr'}" lang="${ar?'ar':'en'}"><head>
  <meta charset="UTF-8">
  <title>${planLbl}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Amiri:ital,wght@0,700;1,700&family=Caveat:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: ${ar?"'Tajawal', 'Cairo', sans-serif":"'Plus Jakarta Sans', 'Quicksand', sans-serif"};
      background: #fff;
      color: #1e293b;
      font-size: 9pt;
      direction: ${ar?'rtl':'ltr'};
      padding: 3mm 5mm;
      line-height: 1.35;
      display: flex;
      flex-direction: column;
      min-height: calc(297mm - 6mm);
      box-sizing: border-box;
    }
    /* table must not flex-grow; it stays at content height */
    table { flex: 0 0 auto; }
    .layout-spacer { flex: 1 1 auto; min-height: 0; }

    /* ─── Page header — centered title with decorative arrows ─── */
    .pg-header {
      text-align: center;
      position: relative;
      padding: 2pt 0 3pt;
      margin-bottom: 3pt;
      min-height: 24pt;
    }
    .pg-title {
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: ${ar?'0pt':'1pt'};
      line-height: 1.05;
      margin: 0;
      display: inline-block;
      position: relative;
    }
    /* Decorative stars beside the title */
    .pg-title::before, .pg-title::after {
      content: '✦';
      color: #cbd5e1;
      font-size: 14pt;
      font-weight: 400;
      position: relative;
      top: -3pt;
      opacity: .65;
    }
    .pg-title::before { margin-${ar?'left':'right'}: 12pt; }
    .pg-title::after  { margin-${ar?'right':'left'}: 12pt; }

    .pg-range {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      ${ar ? 'left: 4pt;' : 'right: 4pt;'}
      color: #64748b;
      font-weight: 600;
      font-size: 9pt;
      letter-spacing: .4pt;
      display: inline-flex;
      align-items: center;
      gap: 6pt;
    }
    .pg-range::before { content: '»'; color: #94a3b8; font-weight: 600; font-size: 11pt; }
    .pg-range::after  { content: '«'; color: #94a3b8; font-weight: 600; font-size: 11pt; }

    /* ─── Course cards row (under title) ─── */
    .course-cards-row {
      display: grid;
      grid-template-columns: repeat(${courses.length}, 1fr);
      gap: 4pt;
      margin-bottom: 3pt;
    }
    .course-card {
      border-radius: 7pt;
      padding: 2pt 4pt 3pt;
      text-align: center;
      border: 1px solid;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1pt;
      position: relative;
    }
    .cc-name {
      font-weight: 700;
      font-size: 6.5pt;
      color: #334155;
      line-height: 1.08;
      min-height: 9pt;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 1pt;
    }
    .cc-icon {
      width: 14pt;
      height: 14pt;
      border-radius: 50%;
      display: inline-block;
      text-align: center;
      line-height: 14pt;
      font-size: 8pt;
      margin: 1pt 0;
    }
    .cc-icon i { display: inline-block; line-height: inherit; vertical-align: middle; }
    .cc-code {
      font-family: 'Plus Jakarta Sans', monospace;
      font-size: 8pt;
      font-weight: 900;
      letter-spacing: .3pt;
      margin-top: 0;
    }
    .cc-exam {
      margin-top: 1pt;
      font-size: 6.2pt;
      font-weight: 700;
      padding: 0.5pt 6pt;
      border-radius: 999pt;
      display: inline-flex;
      align-items: center;
      gap: 3pt;
      letter-spacing: .15pt;
    }
    .cc-exam .cc-star { font-size: 7pt; color: #f59e0b; }

    /* ─── Legend (between cards and table) ─── */
    .legend {
      display: flex;
      justify-content: center;
      gap: 14pt;
      margin-bottom: 3pt;
      font-size: 7pt;
      color: #64748b;
      font-weight: 600;
    }
    .legend-item { display: inline-flex; align-items: center; gap: 3pt; }
    .legend-swatch {
      display: inline-block;
      width: 9pt;
      height: 9pt;
      border-radius: 2pt;
      border: 1px solid;
    }
    .legend-star { color: #f59e0b; font-size: 9pt; }

    /* ─── Main table — compact, dense, max readability ─── */
    table {
      width: 100%;
      height: 1px; /* shrink-to-content; stops last row from stretching to fill page */
      table-layout: fixed;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 7.5pt;
      line-height: 1.15;
      background: #fff;
      border-radius: 8pt;
      overflow: hidden;
      box-shadow: 0 0 0 1px #f1f5f9, 0 1pt 3pt rgba(0,0,0,.03);
    }
    thead th {
      padding: 3pt 2pt;
      text-align: center;
      font-weight: 800;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .th-meta {
      background: #fafbfc;
      color: #64748b;
      font-size: 7pt;
      letter-spacing: .3pt;
    }
    .th-week-col { padding: 0 !important; background: #fafbfc; }
    .course-th { padding: 3pt 2pt 4pt !important; }
    .th-icon { font-size: 10pt; line-height: 1; margin-bottom: 1pt; }
    .th-code { font-weight: 900; font-size: 7pt; letter-spacing: .3pt; }
    .th-name { font-size: 5.5pt; color: #64748b; margin-top: 1pt; font-weight: 600; opacity: .8; line-height: 1.1; min-height: 12pt; display: flex; align-items: center; justify-content: center; padding: 0 1pt; }

    tbody td {
      padding: 0.5pt 3pt;
      border-bottom: 1px solid #f5f7fa;
      vertical-align: middle;
      text-align: center;
    }
    tbody tr:last-child td { border-bottom: 0; }
    /* Keep rows at natural height; prevents the last row from stretching
       to fill the page when the schedule ends mid-week. */
    tbody tr { height: 0; }

    /* Week vertical cell — colored per week (Sunrise→Sunset) */
    .wk-cell {
      position: relative;
      text-align: center;
      padding: 0 !important;
      vertical-align: middle;
      overflow: hidden;
    }
    /* Vertical text is absolutely positioned so it never forces the row
       (or the whole table) to grow taller than its real content. */
    .wk-cell-inner {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4pt;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      white-space: nowrap;
    }
    .wk-num { font-size: 7.5pt; font-weight: 900; letter-spacing: .5pt; }
    .wk-label { font-size: 5.5pt; font-weight: 600; letter-spacing: .15pt; }

    /* Date cell */
    .date-cell {
      font-weight: 700;
      color: #1e293b;
      font-size: 7.5pt;
      white-space: nowrap;
    }
    .date-cell strong { font-size: 8.5pt; font-weight: 800; color: #0f172a; }
    .date-cell .date-mon { font-size: 6.5pt; color: #94a3b8; text-transform: uppercase; font-weight: 600; margin-${ar?'right':'left'}: 2pt; letter-spacing: .3pt; }

    /* Day name cell */
    .day-cell {
      font-size: 7pt;
      color: #64748b;
      font-weight: 600;
      white-space: nowrap;
      letter-spacing: ${ar?'.1pt':'.3pt'};
      ${ar?'':'text-transform: uppercase;'}
    }
    .exam-star { color: #f59e0b; font-size: 8pt; margin-${ar?'right':'left'}: 1pt; }

    .course-cell {
      padding: 2pt 2pt;
      transition: none;
    }
    .empty-dash { color: #cbd5e1; font-weight: 400; }

    /* Module pills — soft tinted (Gemini style) */
    .mod-pills-wrap {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 2pt;
      justify-content: center;
      align-items: center;
      width: 100%;
    }
    .mod-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22pt;
      padding: 1pt 6pt;
      border-radius: 5pt;
      font-weight: 800;
      font-size: 7.5pt;
      letter-spacing: .2pt;
      line-height: 1;
      font-family: 'Plus Jakarta Sans', monospace;
      white-space: nowrap;
    }
    .mod-pill sup {
      font-size: 5pt;
      font-weight: 600;
      opacity: .85;
      margin-${ar?'right':'left'}: 2pt;
      vertical-align: super;
    }
    .mod-pill.is-review {
      font-style: italic;
      opacity: .9;
    }

    /* Event pill (review or other) — dashed border */
    .ev-pill {
      display: inline-block;
      padding: 1.5pt 8pt;
      border-radius: 999pt;
      font-size: 7pt;
      font-weight: 700;
      font-style: italic;
      letter-spacing: .15pt;
      white-space: nowrap;
    }

    /* Weekend rows — extremely subtle */
    .weekend-row td:not(.wk-cell) { background-color: rgba(248,250,252,.5); }

    /* Exam row — single course exam, full-width centered with brand tint */
    .exam-row { font-weight: 800; page-break-inside: avoid; }
    .exam-cell-merged {
      padding: 3pt 8pt !important;
      text-align: center;
      font-size: 8.5pt;
      letter-spacing: .15pt;
    }
    .exam-cell-merged .exam-star-pre { color: #f59e0b; margin-${ar?'left':'right'}: 4pt; font-size: 9pt; }

    /* Rest day row — soft mint tint */
    .rest-row td:not(.wk-cell) { background: rgba(20,184,166,.05); }
    .rest-cell { padding: 2.5pt 6pt !important; text-align: center; }
    .rest-pill {
      display: inline-flex;
      align-items: center;
      gap: 5pt;
      padding: 2pt 10pt;
      background: #f0fdfa;
      color: #0f766e;
      border: 1px solid #99f6e4;
      border-radius: 999pt;
      font-size: 7.5pt;
      font-weight: 700;
      font-style: italic;
      letter-spacing: .1pt;
    }

    /* Day note secondary row — light yellow tint */
    .day-note-secondary td { background: rgba(254,249,195,.35); padding: 3pt 8pt !important; }
    .note-pill {
      display: inline-flex;
      align-items: center;
      gap: 5pt;
      padding: 1.5pt 8pt;
      background: #fefce8;
      color: #854d0e;
      border: 1px solid #fde68a;
      border-radius: 999pt;
      font-size: 7pt;
      font-weight: 600;
      letter-spacing: .1pt;
    }

    /* Repeat thead on every page break */
    thead { display: table-header-group; }

    /* ─── Footer cards (4 cards: Method, Tips, Exam Dates, Cheer) ─── */
    .footer-grid {
      display: grid;
      grid-template-columns: 1fr 1.15fr 1.25fr .85fr;
      gap: 4pt;
      margin-top: 4pt;
    }
    .ftr-card {
      border-radius: 7pt;
      padding: 4pt 6pt 5pt;
      font-size: 6.8pt;
      border: 1px solid;
      page-break-inside: avoid;
      background: #ffffff;
    }
    /* Soft, low-saturation card backgrounds — Gemini-inspired */
    .ftr-card.method  { background: rgba(16,185,129,0.06);  border-color: rgba(16,185,129,0.30); }
    .ftr-card.tips    { background: rgba(59,130,246,0.05);  border-color: rgba(59,130,246,0.28); }
    .ftr-card.exams   { background: rgba(245,158,11,0.05);  border-color: rgba(245,158,11,0.32); }
    .ftr-card.cheer   {
      background: rgba(251,146,60,0.06);
      border-color: rgba(251,146,60,0.32);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3pt;
    }
    .ftr-card h4 {
      font-weight: 900;
      font-size: 7pt;
      margin-bottom: 3pt;
      text-align: center;
      letter-spacing: .3pt;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4pt;
    }
    .ftr-card.method h4   { color: #047857; }
    .ftr-card.tips h4     { color: #1e40af; }
    .ftr-card.exams h4    { color: #b45309; }
    .ftr-card.cheer h4    { color: #9a3412; }
    .ftr-card ul { list-style: none; padding: 0; margin: 0; }
    .ftr-card li {
      margin-bottom: 2pt;
      line-height: 1.35;
      color: #334155;
      padding-${ar?'right':'left'}: 11pt;
      position: relative;
      font-size: 6.8pt;
    }
    .ftr-card.method li::before { content: '⏱'; color: #059669; position: absolute; ${ar?'right':'left'}: 0; font-size: 6.5pt; top: 1pt; }
    .ftr-card.tips li::before   { content: '✓'; color: #2563eb; position: absolute; ${ar?'right':'left'}: 0; font-size: 7.5pt; top: 0; font-weight: 900; }
    .ftr-card.exams li::before  { content: '⭐'; color: #f59e0b; position: absolute; ${ar?'right':'left'}: 0; font-size: 6pt; top: 1pt; }
    .ftr-card.exams li {
      padding-${ar?'right':'left'}: 12pt;
      margin-bottom: 3pt;
      font-size: 6.8pt;
    }
    .ftr-card.exams .exam-list-name { color: #64748b; font-size: 6.5pt; }
    .ftr-card.exams .exam-list-date { font-weight: 700; color: #475569; }
    .ftr-card.exams .exam-list-star { display: none; }

    /* Cheer card */
    .cheer-icon { font-size: 18pt; line-height: 1; }
    .ftr-card.cheer .cheer-text {
      font-family: ${ar?"'Amiri', 'Tajawal', serif":"'Caveat', 'Plus Jakarta Sans', cursive"};
      font-style: ${ar?'italic':'normal'};
      font-size: ${ar?'15pt':'22pt'};
      font-weight: 700;
      color: #9a3412;
      letter-spacing: ${ar?'.2pt':'.3pt'};
      line-height: ${ar?'1.4':'1'};
      padding: 1pt 2pt;
    }

    /* Bottom motivate line */
    .pg-footer {
      text-align: center;
      margin-top: 4pt;
      font-size: 8pt;
      color: #64748b;
      font-weight: 600;
      letter-spacing: .3pt;
    }
    .pg-footer::before { content: '✦'; margin-${ar?'left':'right'}: 8pt; color: #cbd5e1; opacity: .7; }
    .pg-footer::after  { content: '✦'; margin-${ar?'right':'left'}: 8pt; color: #cbd5e1; opacity: .7; }

    @page { size: A4 portrait; margin: 3mm; }
    @media print {
      body { padding: 0; min-height: calc(297mm - 6mm); }
      .pg-header { margin-top: 1pt; }
      thead { display: table-header-group !important; }
      .exam-row, .rest-row { page-break-inside: avoid !important; break-inside: avoid !important; }
      .course-cards-row, .legend { page-break-after: avoid !important; break-after: avoid !important; }
      .footer-grid { page-break-before: auto; break-before: auto; }
    }
  </style></head><body>

  <!-- Title -->
  <header class="pg-header">
    <h1 class="pg-title">${planLbl}</h1>
    <div class="pg-range">${planRangeLabel}</div>
  </header>

  <!-- Course cards row -->
  <div class="course-cards-row">${courseCardsHTML}</div>

  <!-- Main Table -->
  <table>
    <colgroup>
      <col style="width:20pt">
      <col style="width:38pt">
      <col style="width:${ar?'42pt':'30pt'}">
      ${courses.map(()=>'<col>').join('')}
    </colgroup>
    <thead>
      <tr>
        <th class="th-meta th-week-col"></th>
        <th class="th-meta">${ar?'التاريخ':'Date'}</th>
        <th class="th-meta">${ar?'اليوم':'Day'}</th>
        ${courseHeadersHTML}
      </tr>
    </thead>
    <tbody>${tbodyHTML}</tbody>
  </table>

  <!-- Flexible spacer: absorbs leftover height so the table stays compact -->
  <div class="layout-spacer"></div>

  <!-- Footer cards -->
  <div class="footer-grid">
    <div class="ftr-card method">
      <h4><i class="fa-solid fa-stopwatch"></i> ${ar?'تقنية المذاكرة':'Study Method'}</h4>
      <ul>
        ${methodSet.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>
    <div class="ftr-card tips">
      <h4><i class="fa-solid fa-lightbulb"></i> ${ar?'نصائح ذكية':'Smart Tips'}</h4>
      <ul>
        ${tipsSet.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>
    <div class="ftr-card exams">
      <h4><i class="fa-solid fa-star"></i> ${ar?'مواعيد الاختبارات':'Exam Dates'}</h4>
      <ul>${examListHTML}</ul>
    </div>
    <div class="ftr-card cheer">
      <div class="cheer-text">${motivationPhrase}</div>
    </div>
  </div>

  <!-- Bottom motivate line -->
  <div class="pg-footer">${footerQuote}</div>

  <script>
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function(){ setTimeout(function(){ window.print(); }, 150); });
    } else {
      setTimeout(function(){ window.print(); }, 600);
    }
  <\/script>
  </body></html>`);
  win.document.close();
}


function hasLegacyPlan(){
  
  
  
  
  const keys=[`study_plan_L${LEVEL}_midterm`,`study_plan_L${LEVEL}_final`,`study_plan_L${LEVEL}_general`];
  if(LEVEL==='5') keys.push('study_plan_midterm','study_plan_final','study_plan_general');
  return keys.some(k=>{
    const raw=localStorage.getItem(k);
    if(!raw)return false;
    try{const p=JSON.parse(raw);return !!(p&&(p.days||p.plan_summary));}catch(_){localStorage.removeItem(k);return false;}
  });
}
function checkLegacy(){
  const hasOld=hasLegacyPlan();
  
  
  
  if(localStorage.getItem(lgcKey())==='legacy'){
    if(hasOld){activateLegacy();return true;}
    localStorage.setItem(lgcKey(),'new');
  }
  
  if(hasOld){const b=document.getElementById('legacy-banner');if(b){b.style.display='';b.innerHTML=`<div class="pv2-legacy-banner-inner"><span>🗂️ ${tx('لديك خطة بالنمط القديم.','You have old format plans.')}</span><div style="display:flex;gap:.5rem"><button onclick="PV2._goLegacy()">${tx('تجربة النمط القديم','Try Old Mode')}</button><button onclick="PV2._dismissLegacy()" style="background:none;border:none;color:var(--text-muted);cursor:pointer">✕</button></div></div>`;}}
  return false;
}
function _goLegacy(){localStorage.setItem(lgcKey(),'legacy');activateLegacy();}
function _dismissLegacy(){const b=document.getElementById('legacy-banner');if(b)b.style.display='none';}
function activateLegacy(){
  ['pv2-planning','pv2-setup','pv2-study','pv2-loading'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  document.getElementById('mode-toggle').style.display='none';
  const b=document.getElementById('legacy-banner');if(b){b.style.display='';b.innerHTML=`<div class="pv2-legacy-banner-inner"><span>🗂️ ${tx('النمط القديم مفعّل.','Old mode active.')}</span><button onclick="PV2._returnNew()">${tx('العودة للنمط الجديد','Return to New Mode')}</button></div>`;}
  const css=document.createElement('link');css.rel='stylesheet';css.href='../../shared/planner.css';document.head.appendChild(css);
  const root=document.createElement('div');root.id='legacy-planner-root';
  root.innerHTML=`<div class="planner-app" id="planner-app"><div class="error-box" id="error-box"></div><div class="continue-prompt" id="continue-prompt" style="display:none"><div class="continue-buttons"><button class="btn-primary" onclick="Planner.continuePlan()">${tx('استكمال','Continue')}</button><button class="btn-secondary" onclick="Planner.newPlan()">${tx('جديد','New')}</button></div></div><section id="step-plan-type" class="step active"></section><section id="step-courses" class="step"><div class="course-list" id="course-list"></div></section><section id="step-sessions" class="step"></section><section id="step-display" class="step"><div class="loading-screen" id="loading-screen"></div><div id="plan-content" style="display:none"></div></section></div>`;
  document.querySelector('.pv2-app').appendChild(root);
  const s=document.createElement('script');s.src='../../shared/planner.js';document.body.appendChild(s);
}
function _returnNew(){localStorage.setItem(lgcKey(),'new');location.reload();}


async function init(){
  document.getElementById('pv2-loading').style.display='';
  if(checkLegacy())return;

  
  
  const cmapRel = LEVEL === 'others' ? 'others/data/curriculum_map.json' : `L${LEVEL}/data/curriculum_map.json`;
  const curriculumURLs = cfgURLs(cmapRel, [
    '../data/curriculum_map.json'   
  ]);
  const cmapCacheBust = '?v=' + (window._gardenVersion || Date.now());
  for(const u of curriculumURLs){
    try{const r=await fetch(u + cmapCacheBust);if(r.ok){S.cMap=await r.json();break;}}catch(_){}
  }
  
  for(const u of PROJECT_CFG_URLS){
    try{
      const r=await fetch(u + cmapCacheBust);
      if(r.ok){S.projCfg=await r.json();break;}
    }catch(_){}
  }

  
  
  
  
  let electiveIds = [];
  if(S.projCfg?.levels){
    const lvKey=`level${LEVEL}`;
    const lvCfg=S.projCfg.levels[lvKey];
    electiveIds=(lvCfg?.electives||[]);
  } else if(LEVEL==='7'||LEVEL==='8'||LEVEL===7||LEVEL===8){
    
    electiveIds=['CS475','CS476','CS477','CS478'];
    console.info('[planner-v2] project.json not loaded, using fallback electives for L'+LEVEL);
  }

  if(electiveIds.length){
      
      const combinedURLs = cfgURLs(
        [
          'shared/data/curriculum_map_electives.json',    
          'data/electives/curriculum_map_electives.json'  
        ],
        [
          '../../shared/data/curriculum_map_electives.json',   
          '../../../shared/data/curriculum_map_electives.json', 
          '../data/curriculum_map_electives.json'               
        ]
      );
      let electiveMap=null;
      for(const u of combinedURLs){
        try{const r=await fetch(u);if(r.ok){electiveMap=await r.json();break;}}catch(_){}
      }

      
      if(!electiveMap){
        electiveMap={courses:{}};
        for(const eId of electiveIds){
          const perCourseURLs=cfgURLs(
            [
              `shared/data/electives/${eId}/curriculum_map.json`,
              `data/electives/${eId}/curriculum_map.json`
            ],
            [
              `../../shared/data/electives/${eId}/curriculum_map.json`,
              `../../../shared/data/electives/${eId}/curriculum_map.json`,
              `../data/electives/${eId}/curriculum_map.json`
            ]
          );
          for(const u of perCourseURLs){
            try{
              const r=await fetch(u);
              if(r.ok){
                const sub=await r.json();
                if(sub?.courses?.[eId]){electiveMap.courses[eId]=sub.courses[eId];break;}
              }
            }catch(_){}
          }
        }
      }

      
      if(!S.cMap)S.cMap={courses:{}};
      if(!S.cMap.courses)S.cMap.courses={};
      if(electiveMap?.courses){
        for(const eId of electiveIds){
          if(electiveMap.courses[eId]){
            S.cMap.courses[eId]={...electiveMap.courses[eId],is_elective:true};
          }
        }
      }
      
      for(const eId of electiveIds){
        if(S.cMap.courses[eId])S.cMap.courses[eId].is_elective=true;
      }
      
      if(S.projCfg?.subjects){
        for(const eId of electiveIds){
          if(S.cMap.courses[eId]){
            const subjMeta=S.projCfg.subjects[eId];
            if(subjMeta){
              if(subjMeta.brand_500&&!S.cMap.courses[eId].color)S.cMap.courses[eId].color=subjMeta.brand_500;
              if(!S.cMap.courses[eId].name)S.cMap.courses[eId].name=subjMeta.name_ar;
              if(!S.cMap.courses[eId].name_en)S.cMap.courses[eId].name_en=subjMeta.name_en;
            }
          }
        }
      }
    }
  await loadData();
  
  
  if(S.data?._mergedCourses){
    if(!S.cMap)S.cMap={courses:{}};
    if(!S.cMap.courses)S.cMap.courses={};
    for(const[id,data]of Object.entries(S.data._mergedCourses)){
      if(!S.cMap.courses[id])S.cMap.courses[id]=data;
    }
  }
  
  if(S.data?._colorOverrides&&S.cMap?.courses){
    for(const[id,col]of Object.entries(S.data._colorOverrides))
      if(S.cMap.courses[id])S.cMap.courses[id].color=col;
  }
  
  
  
  if(S.cMap?.courses){
    if(!S.data._autoExcludedElectives)S.data._autoExcludedElectives=[];
    if(!S.data._seenElectives)S.data._seenElectives=[];
    const autoExcluded=new Set(S.data._autoExcludedElectives);
    let changed=false;
    for(const[id,cdata]of Object.entries(S.cMap.courses)){
      if(cdata.is_elective&&!autoExcluded.has(id)){
        
        for(const pt of['midterm','final']){
          if(!S.data.plans[pt].excluded_courses)S.data.plans[pt].excluded_courses=[];
          if(!S.data.plans[pt].excluded_courses.includes(id))S.data.plans[pt].excluded_courses.push(id);
        }
        S.data._autoExcludedElectives.push(id);
        changed=true;
      }
    }
    if(changed)saveData();
  }
  S.activePlan=detectPlan();S.data.active_plan=S.activePlan;
  S.viewMode=S.data.settings?.view_mode||'week';
  S.appMode=S.data.settings?.app_mode||'plan';
  S.chipView=S.data.settings?.chip_view||'compact';
  S.studyView=S.data.settings?.study_view||'cards';

  document.querySelectorAll('.pv2-tab').forEach(t=>{t.classList.toggle('active',t.dataset.plan===S.activePlan);t.onclick=()=>switchPlan(t.dataset.plan);});
  document.querySelectorAll('.pv2-view-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===S.viewMode));
  document.getElementById('btn-mode-plan')?.classList.toggle('active',S.appMode==='plan');
  document.getElementById('btn-mode-track')?.classList.toggle('active',S.appMode==='track');

  if(S.data.settings?.sidebar_collapsed){const sb=document.getElementById('pv2-sidebar');if(sb)sb.classList.add('collapsed');const icon=document.getElementById('sidebar-toggle-icon');if(icon)icon.className=`fas fa-chevron-${isAr()?'left':'right'}`;}

  const p=cPlan();const anchor=p.start_date||today();
  S.weekStart=wkStart(anchor);S.monthDate=moStart(anchor);

  
  document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='z'){e.preventDefault();doUndo();}if((e.metaKey||e.ctrlKey)&&e.key==='ArrowLeft'){e.preventDefault();navNext();}if((e.metaKey||e.ctrlKey)&&e.key==='ArrowRight'){e.preventDefault();navPrev();}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
  document.addEventListener('garden:languageChanged',()=>{applyLang();render();});
  document.addEventListener('languageChanged',()=>{applyLang();render();});

  if(!p.start_date){showSetup();}
  else if(S.appMode==='track'){showStudyUI();render();}
  else{showPlanUI();render();}

  
  S._selectedMod=null;
  S._drawerActiveCourse=null;
  const handle=document.getElementById('pv2-drawer-handle');
  if(handle){
    
    handle.onclick=()=>PV2.toggleDrawer();
    
    let _touchStartY=null;
    handle.addEventListener('touchstart',e=>{_touchStartY=e.touches[0].clientY;},{passive:true});
    handle.addEventListener('touchmove',e=>{
      if(_touchStartY===null)return;
      const dy=e.touches[0].clientY-_touchStartY;
      const drawer=document.getElementById('pv2-drawer');
      if(dy>40&&drawer?.classList.contains('open')){
        drawer.classList.remove('open');
        _touchStartY=null;
      }
    },{passive:true});
    handle.addEventListener('touchend',()=>{_touchStartY=null;},{passive:true});
  }
  
  document.addEventListener('click',e=>{
    const drawer=document.getElementById('pv2-drawer');
    if(!drawer||!drawer.classList.contains('open'))return;
    if(!isMobile())return;
    
    if(drawer.contains(e.target))return;
    if(e.target.closest('#pv2-mobile-fab'))return;
    if(e.target.closest('.pv2-modal-overlay'))return;
    if(e.target.closest('.pv2-tap-indicator'))return;
    
    if(S._selectedMod&&e.target.closest('[data-date]'))return;
    drawer.classList.remove('open');
  });
  
  window.addEventListener('resize',()=>{if(isMobile())renderMobileDrawer();});
}



const STATUS_OPTS=[
  {id:'new',icon:'',ar:'جديدة',en:'New',color:'var(--text-muted)'},
  {id:'started',icon:'📖',ar:'بدأت الدراسة',en:'Started',color:'#3b82f6'},
  {id:'mastered',icon:'✅',ar:'متقنة',en:'Mastered',color:'#10b981'}
];
function statusIcon(s){return STATUS_OPTS.find(x=>x.id===s)?.icon||'';}
function getModStatus(cid,mid){return S.data.module_status?.[`${cid}_${mid}`]||'new';}
function setModStatus(cid,mid,status){
  if(!S.data.module_status)S.data.module_status={};
  if(status&&status!=='new')S.data.module_status[`${cid}_${mid}`]=status;
  else delete S.data.module_status[`${cid}_${mid}`];
  saveData();
  
  const setupVisible = document.getElementById('pv2-setup')?.style.display !== 'none';
  if(!setupVisible) renderSidebar();
}
function showModStatusMenu(cid,mid){
  const cur=getModStatus(cid,mid);const title=mTitle(cid,mid);
  modal(`<div class="pv2-modal-header">
    <h3 class="pv2-modal-title">${mid}: ${title.slice(0,28)}</h3>
    <button class="pv2-modal-close" onclick="PV2.closeModal()">✕</button>
  </div>
  <div class="pv2-label" style="margin-bottom:.5rem">${tx('حالة الوحدة:','Module Status:')}</div>
  <div class="pv2-menu-list">
    ${STATUS_OPTS.map(opt=>`<button class="pv2-menu-btn${cur===opt.id?' active-status':''}"
      onclick="PV2.setModStatus('${cid}','${mid}','${opt.id}');PV2.closeModal()"
      style="${cur===opt.id?`border-color:${opt.color};color:${opt.color}`:''}">
      ${opt.icon?opt.icon+' ':''}${isAr()?opt.ar:opt.en}${cur===opt.id?' ✓':''}
    </button>`).join('')}
    <button class="pv2-menu-btn danger" onclick="PV2._removeModEverywhere('${cid}','${mid}')">
      🗑️ ${tx('حذف من كل مكان','Remove Everywhere')}
    </button>
  </div>`);
}

function _setStatus(cid,mid,status){setModStatus(cid,mid,status);closeModal();}


function reviewChipsHTML(cid,color){
  return`<div class="pv2-review-chips">
    <div class="pv2-review-chip pv2-review-chip--mid" style="border-color:${color};color:${color}" draggable="true" data-course="${cid}" data-event="review_mid" ondragstart="PV2._evChipDrag(event,'${cid}','review_mid')" ondragend="PV2._chipDragEnd(event)"><span class="pv2-rev-icon">📖</span> ${tx('مراجعة ميد','Mid Rev.')}</div>
    <div class="pv2-review-chip pv2-review-chip--fin" style="border-color:${color};color:${color}" draggable="true" data-course="${cid}" data-event="review_final" ondragstart="PV2._evChipDrag(event,'${cid}','review_final')" ondragend="PV2._chipDragEnd(event)"><span class="pv2-rev-icon">📚</span> ${tx('مراجعة فاينل','Final Rev.')}</div>
    <div class="pv2-review-chip pv2-review-chip--full" style="border-color:${color};color:${color}" draggable="true" data-course="${cid}" data-event="review_full" ondragstart="PV2._evChipDrag(event,'${cid}','review_full')" ondragend="PV2._chipDragEnd(event)"><span class="pv2-rev-icon">⭐</span> ${tx('مراجعة نهائية','Full Rev.')}</div>
  </div>`;
}
function _evChipDrag(e,c,et){S.dragging={src:'evchip',c,et};e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('text/plain',JSON.stringify({src:'evchip',c,et}));e.currentTarget.classList.add('dragging');}


function showEditCourse(cid){
  const courses=allCourses();const course=courses.find(c=>c.id===cid);if(!course)return;
  const color=cColor(cid);
  const cc=(S.data.custom_courses||[]).find(c=>c.id===cid);
  
  const rawAr = cc ? (cc.name_ar||cc.name||'') : (S.cMap?.courses?.[cid]?.name||course.name);
  const rawEn = cc ? (cc.name_en||cc.name||'') : (S.cMap?.courses?.[cid]?.name_en||course.name);
  const paletteBtns=PALETTE.map(c=>`<button class="pv2-color-swatch${color===c?' selected':''}" style="background:${c}" onclick="PV2._pickColor('${cid}','${c}')" title="${c}"></button>`).join('');
  const modList=course.mods.map((m,i)=>`<div class="pv2-mod-edit-row"><span style="background:${color};color:#fff;padding:.15rem .35rem;border-radius:4px;font-size:.65rem;font-weight:800;flex-shrink:0">${m.id}</span><input type="text" value="${m.name}" id="modinput-${cid}-${i}" class="pv2-input" style="flex:1;padding:.3rem .5rem;font-size:.8rem"><button onclick="PV2._delMod('${cid}',${i})" class="pv2-btn-danger" style="padding:.2rem .5rem;font-size:.75rem">✕</button></div>`).join('');
  const nameFields = `
<div class="pv2-form-group"><label class="pv2-label">📚 ${tx('الاسم بالعربية','Arabic Name')}</label><input type="text" id="ec-name-ar" class="pv2-input" value="${rawAr.replace(/"/g,'&quot;')}"></div>
<div class="pv2-form-group" style="margin-top:.75rem"><label class="pv2-label">📚 ${tx('الاسم بالإنجليزية','English Name')}</label><input type="text" id="ec-name-en" class="pv2-input" value="${rawEn.replace(/"/g,'&quot;')}"></div>`;
  modal(`<div class="pv2-modal-header"><h3 class="pv2-modal-title">✏️ ${tx(`تعديل ${course.name}`,`Edit ${course.name}`)}</h3><button class="pv2-modal-close" onclick="PV2.closeModal()">✕</button></div>
${nameFields}
<div class="pv2-form-group" style="margin-top:.75rem"><label class="pv2-label">🎨 ${tx('اللون','Color')}</label><div class="pv2-palette">${paletteBtns}</div><input type="color" id="ec-color-custom" value="${color}" oninput="PV2._pickColor('${cid}',this.value)" class="pv2-input" style="width:42px;height:34px;padding:2px;cursor:pointer;margin-top:.4rem"></div>
<div class="pv2-form-group" style="margin-top:.75rem"><label class="pv2-label">${tx('الوحدات','Modules')}</label><div id="ec-mods" style="display:flex;flex-direction:column;gap:.3rem;max-height:200px;overflow-y:auto">${modList}</div><button class="pv2-btn-secondary" style="margin-top:.4rem;width:100%" onclick="PV2._addMod('${cid}')">+ ${tx('إضافة وحدة','Add Module')}</button></div>
<div class="pv2-modal-actions"><button class="pv2-btn-primary" onclick="PV2._saveEditCourse('${cid}')">${tx('حفظ','Save')}</button>${course.isCustom?`<button class="pv2-btn-danger" onclick="PV2._deleteCustomCourse('${cid}')">${tx('حذف المادة','Delete Course')}</button>`:''}<button class="pv2-btn-secondary" onclick="PV2.closeModal()">${tx('إلغاء','Cancel')}</button></div>`);
}
function _pickColor(cid,color){document.querySelectorAll('.pv2-color-swatch').forEach(b=>b.classList.toggle('selected',b.style.background===color||b.style.backgroundColor===color));const custom=document.getElementById('ec-color-custom');if(custom)custom.value=color;const cc=(S.data.custom_courses||[]).find(c=>c.id===cid);if(cc)cc.color=color;if(!cc){if(!S.data._colorOverrides)S.data._colorOverrides={};S.data._colorOverrides[cid]=color;if(S.cMap?.courses?.[cid])S.cMap.courses[cid].color=color;}saveData();}
function _saveEditCourse(cid){const nameAr=document.getElementById('ec-name-ar')?.value.trim();const nameEn=document.getElementById('ec-name-en')?.value.trim();const color=document.getElementById('ec-color-custom')?.value||cColor(cid);const cc=(S.data.custom_courses||[]).find(c=>c.id===cid);const finalAr=nameAr||nameEn;const finalEn=nameEn||nameAr;if(cc){if(finalAr){cc.name_ar=finalAr;cc.name_en=finalEn;cc.name=finalAr;}cc.color=color;const modsContainer=document.getElementById('ec-mods');if(modsContainer){const inputs=modsContainer.querySelectorAll('input[type="text"]');inputs.forEach((inp,i)=>{if(cc.modules[i]){if(typeof cc.modules[i]==='string')cc.modules[i]=inp.value;else cc.modules[i].name=inp.value;}});}}else if(S.cMap?.courses?.[cid]){if(finalAr)S.cMap.courses[cid].name=finalAr;if(finalEn)S.cMap.courses[cid].name_en=finalEn;S.cMap.courses[cid].color=color;if(!S.data._colorOverrides)S.data._colorOverrides={};S.data._colorOverrides[cid]=color;}saveData();closeModal();_coursesInitialized=false;_initOpenCourses();render();}
function _addMod(cid){const cc=(S.data.custom_courses||[]).find(c=>c.id===cid);if(!cc)return;cc.modules=cc.modules||[];cc.modules.push({name:isAr()?`وحدة ${cc.modules.length+1}`:`Module ${cc.modules.length+1}`});saveData();showEditCourse(cid);}
function _delMod(cid,idx){
  if(!confirm(tx('حذف هذه الوحدة؟','Delete this module?')))return;
  const cc=(S.data.custom_courses||[]).find(c=>c.id===cid);
  if(cc){
    
    cc.modules.splice(idx,1);
  }else{
    
    const course=allCourses().find(c=>c.id===cid);
    if(!course||idx>=course.mods.length)return;
    const mid=course.mods[idx].id;
    if(!S.data._deletedMods)S.data._deletedMods={};
    if(!S.data._deletedMods[cid])S.data._deletedMods[cid]=[];
    if(!S.data._deletedMods[cid].includes(mid))S.data._deletedMods[cid].push(mid);
  }
  saveData();showEditCourse(cid);
}
function _deleteCustomCourse(cid){if(!confirm(tx(`حذف مادة ${cid}؟`,`Delete course ${cid}?`)))return;S.data.custom_courses=(S.data.custom_courses||[]).filter(c=>c.id!==cid);if(S.data._mergedCourses&&S.data._mergedCourses[cid]){delete S.data._mergedCourses[cid];if(S.cMap?.courses?.[cid])delete S.cMap.courses[cid];}saveData();closeModal();_coursesInitialized=false;_initOpenCourses();render();}


function fmtCard(s){return`${dName(s)} ${dom(s)} ${mName(s)} ${yr(s)}`;}


function isMobile(){ return window.innerWidth<=700; }







function renderMobileDrawer(){
  if(!isMobile())return;
  const drawer=document.getElementById('pv2-drawer');if(!drawer)return;
  const courses=allCourses();if(!courses.length){const modsEl=document.getElementById('pv2-drawer-modules');if(modsEl)modsEl.innerHTML='<div style="padding:.75rem;color:var(--text-muted);font-size:.82rem">لا توجد مواد</div>';return;}const pl=placedSet(S.activePlan);
  if(!S._drawerActiveCourse&&courses.length) S._drawerActiveCourse=courses[0].id;

  
  const fabBadge=document.getElementById('pv2-fab-badge');
  if(fabBadge){
    let unplaced=0;for(const c of courses)unplaced+=c.mods.filter(m=>!pl.has(`${c.id}_${m.id}`)).length;
    fabBadge.textContent=unplaced>0?unplaced:'';
    fabBadge.style.display=unplaced>0?'flex':'none';
  }

  
  const tabsEl=document.getElementById('pv2-drawer-tabs');
  if(tabsEl){
    tabsEl.innerHTML=courses.map(c=>{
      const color=cColor(c.id);
      const plcCnt=c.mods.filter(m=>pl.has(`${c.id}_${m.id}`)).length;
      const isActive=S._drawerActiveCourse===c.id;
      return`<div class="pv2-drawer-tab-wrap">
        <button class="pv2-drawer-tab${isActive?' active':''}" style="--tab-color:${color}" onclick="PV2._drawerSelectCourse('${c.id}')">
          <span class="tab-dot" style="background:${color}"></span>${c.id} <span class="tab-count">${plcCnt}/${c.mods.length}</span>
        </button>
        <button class="pv2-drawer-tab-edit" style="color:${color}" onclick="PV2.showEditCourse('${c.id}')" title="${tx('تعديل المادة','Edit Course')}"><i class="fas fa-pen-to-square"></i></button>
      </div>`;
    }).join('')
    + `<button class="pv2-drawer-tab-add" onclick="PV2.showAddCourseModal()" title="${tx('إضافة مادة','Add Course')}" style="display:inline-flex;align-items:center;gap:.3rem;padding:.35rem .7rem;border:1.5px dashed var(--border,#cbd5e1);border-radius:8px;background:transparent;color:var(--text-secondary,#64748b);font-weight:700;font-size:.78rem;cursor:pointer;white-space:nowrap;flex-shrink:0"><i class="fas fa-plus"></i> ${tx('مادة','Course')}</button>`;
  }

  
  const modsEl=document.getElementById('pv2-drawer-modules');
  const revEl =document.getElementById('pv2-drawer-review');
  const course=courses.find(c=>c.id===S._drawerActiveCourse);
  if(modsEl&&course){
    const color=cColor(course.id);
    modsEl.innerHTML=course.mods.map(mod=>{
      const ip=pl.has(`${course.id}_${mod.id}`);
      const isDone=isModuleCompleted(course.id,mod.id);
      const instCount=countInstances(course.id,mod.id);
      const st=getModStatus(course.id,mod.id);const si=statusIcon(st);
      const isSel=S._selectedMod?.type==='module'&&S._selectedMod.courseId===course.id&&S._selectedMod.moduleId===mod.id;
      
      
      
      
      let bg,fg,bdr;
      if(isDone){bg='rgba(16,185,129,.12)';fg='#10b981';bdr='#10b981';}
      else if(ip){bg='transparent';fg=color;bdr=color;}
      else {bg=color;fg='#fff';bdr=color;}
      const countBadge=instCount>1?`<span class="pill-inst-count">×${instCount}</span>`:'';
      const checkMark=isDone?`<span class="pill-check">✓</span>`:'';
      return`<div class="pv2-drawer-mod-pill${ip?' placed':''}${isDone?' done':''}${isSel?' selected':''}"
        style="background:${bg};color:${fg};border-color:${bdr}"
        data-cid="${course.id}" data-mid="${mod.id}"
        onclick="PV2._drawerTapModule('${course.id}','${mod.id}')"
        oncontextmenu="event.preventDefault();PV2.showModStatusMenu('${course.id}','${mod.id}')"
        title="${mod.id} — ${mod.name}${ip?` (${tx('مدرجة','placed')} ${instCount}×)`:''}">${mod.id}${checkMark}${countBadge}${si&&!isDone?`<span class="pill-status">${si}</span>`:''}</div>`;
    }).join('');
  }
  if(revEl&&course){
    const revTypes=[
      {id:'review_mid',ar:'مراجعة ميد',en:'Mid Rev.',icon:'📖'},
      {id:'review_final',ar:'مراجعة فاينل',en:'Final Rev.',icon:'📚'},
      {id:'review_full',ar:'مراجعة نهائية',en:'Full Rev.',icon:'⭐'}
    ];
    revEl.innerHTML=revTypes.map(r=>{
      const isSel=S._selectedMod?.type==='event'&&S._selectedMod.courseId===course.id&&S._selectedMod.eventType===r.id;
      return`<button class="pv2-drawer-rev-chip pv2-drawer-rev-chip--${r.id.replace('review_','')}${isSel?' selected':''}" onclick="PV2._drawerTapReview('${course.id}','${r.id}')">
        <span class="pv2-rev-icon">${r.icon}</span> ${isAr()?r.ar:r.en}
      </button>`;
    }).join('');
  }
  
  setTimeout(initDrawerInteractions, 50);
}

function _drawerSelectCourse(cid){
  S._drawerActiveCourse=cid;
  
  if(S._selectedMod&&S._selectedMod.courseId!==cid&&S._selectedMod.type==='module'){
    S._selectedMod=null;_updateTapIndicator();
  }
  const drawer=document.getElementById('pv2-drawer');if(drawer)drawer.classList.add('open');
  renderMobileDrawer();
}

function _drawerTapModule(courseId,moduleId){
  
  
  
  if(S._selectedMod?.type==='module'&&S._selectedMod.courseId===courseId&&S._selectedMod.moduleId===moduleId){
    
    S._selectedMod=null;
  }else{
    S._selectedMod={type:'module',courseId,moduleId};
  }
  _updateTapIndicator();
  renderMobileDrawer();
  _highlightTapDays();
}

function _drawerTapReview(courseId,eventType){
  if(S._selectedMod?.type==='event'&&S._selectedMod.courseId===courseId&&S._selectedMod.eventType===eventType){
    S._selectedMod=null;
  }else{
    S._selectedMod={type:'event',courseId,eventType};
  }
  _updateTapIndicator();
  renderMobileDrawer();
  _highlightTapDays();
}

function _updateTapIndicator(){
  const el=document.getElementById('pv2-tap-indicator');
  const lbl=document.getElementById('pv2-tap-label');
  if(!el||!lbl)return;
  if(S._selectedMod){
    const sm=S._selectedMod;
    const eType=sm.type==='module'?null:(EV_TYPES.find(x=>x.id===sm.eventType)||{});const name=sm.type==='module'?`${sm.courseId} — ${sm.moduleId}`:(`${sm.courseId} — `+(isAr()?eType.ar:eType.en||sm.eventType||''));
    lbl.textContent=`${tx('اضغط على اليوم لإضافة:','Tap day to place:')} ${name}`;
    el.style.display='flex';
    
    const drawer=document.getElementById('pv2-drawer');
    if(drawer)drawer.style.marginBottom='44px';
  }else{
    el.style.display='none';
    const drawer=document.getElementById('pv2-drawer');
    if(drawer)drawer.style.marginBottom='';
  }
}

function _highlightTapDays(){
  const p=cPlan();
  
  document.querySelectorAll('.pv2-tap-overlay').forEach(el=>el.remove());
  document.querySelectorAll('.pv2-day-col').forEach(col=>{
    const d=col.dataset.date;if(!d)return;
    const inRange=(!p.start_date||d>=p.start_date)&&(!p.end_date||d<=p.end_date);
    col.classList.toggle('tap-ready',!!S._selectedMod&&inRange);
    col.onclick=null; 
    if(S._selectedMod&&inRange){
      
      const body=col.querySelector('.pv2-day-body');
      if(body){
        const ov=document.createElement('div');
        ov.className='pv2-tap-overlay';
        ov.onclick=e=>{e.stopPropagation();PV2._tapPlaceOnDay(d);};
        body.appendChild(ov);
      }
    }
  });
}

function _tapPlaceOnDay(dateStr){
  if(!S._selectedMod)return;
  const sm=S._selectedMod;
  snap();
  if(sm.type==='module'){
    if(isPlaced(sm.courseId,sm.moduleId)){
      showSplitConfirm(dateStr,sm.courseId,sm.moduleId);
      S._selectedMod=null;
    }else{
      placeM(dateStr,sm.courseId,sm.moduleId);
      S._selectedMod=null;
    }
  }else{
    placeEv(dateStr,sm.courseId,sm.eventType,evLabel(sm.eventType,sm.courseId));
    S._selectedMod=null;
  }
  _updateTapIndicator();
  _highlightTapDays();
  saveData();render();
  
  
  
  const drawer=document.getElementById('pv2-drawer');
  if(drawer)drawer.classList.add('open');
  renderMobileDrawer();
}

function cancelTapPlace(){
  S._selectedMod=null;
  _updateTapIndicator();
  _highlightTapDays();
  renderMobileDrawer();
}


function toggleDrawer(){
  const drawer=document.getElementById('pv2-drawer');if(!drawer)return;
  const willOpen=!drawer.classList.contains('open');
  drawer.classList.toggle('open');
  if(willOpen){
    const courses=allCourses();
    if(!S._drawerActiveCourse&&courses.length)S._drawerActiveCourse=courses[0].id;
    renderMobileDrawer();
  }
}


function moveItemUp(dateStr,itemId){
  const e=cPlan().entries[dateStr];if(!e||!e.items)return;
  const idx=e.items.findIndex(i=>i.id===itemId);if(idx<=0)return;
  snap();[e.items[idx-1],e.items[idx]]=[e.items[idx],e.items[idx-1]];
  saveData();render();
}
function moveItemDown(dateStr,itemId){
  const e=cPlan().entries[dateStr];if(!e||!e.items)return;
  const idx=e.items.findIndex(i=>i.id===itemId);if(idx<0||idx>=e.items.length-1)return;
  snap();[e.items[idx],e.items[idx+1]]=[e.items[idx+1],e.items[idx]];
  saveData();render();
}

function _removeModEverywhere(cid,mid){
  if(!confirm(tx(`حذف ${mid} من كل الخطط والجداول نهائياً؟`,`Delete ${mid} from all plans permanently?`)))return;
  closeModal();snap();
  
  for(const pt of['midterm','final']){
    const p=pData(pt);
    for(const[d,e]of Object.entries(p.entries||{})){
      e.items=(e.items||[]).filter(i=>!(i.type==='module'&&i.course_id===cid&&i.module_id===mid));
      if(e.items.length===0&&!e.day_note)delete p.entries[d];
    }
  }
  
  if(S.data.module_status)delete S.data.module_status[`${cid}_${mid}`];
  
  if(!S.data._deletedMods)S.data._deletedMods={};
  if(!S.data._deletedMods[cid])S.data._deletedMods[cid]=[];
  if(!S.data._deletedMods[cid].includes(mid))S.data._deletedMods[cid].push(mid);
  saveData();render();
}


function initDrawerInteractions(){
  let _lpTimer=null;let _lpMoved=false;
  document.querySelectorAll('.pv2-drawer-mod-pill').forEach(el=>{
    
    const fresh=el.cloneNode(true);
    el.parentNode?.replaceChild(fresh,el);
    fresh.addEventListener('touchstart',function(e){
      _lpMoved=false;
      const cid=this.dataset.cid;const mid=this.dataset.mid;
      if(!cid||!mid)return;
      _lpTimer=setTimeout(()=>{
        if(!_lpMoved){
          e.preventDefault();
          
          if(navigator.vibrate)navigator.vibrate(30);
          PV2.showModStatusMenu(cid,mid);
        }
      },500);
    },{passive:true});
    fresh.addEventListener('touchmove',function(){_lpMoved=true;clearTimeout(_lpTimer);},{passive:true});
    fresh.addEventListener('touchend',function(){clearTimeout(_lpTimer);},{passive:true});
    fresh.addEventListener('touchcancel',function(){clearTimeout(_lpTimer);},{passive:true});
  });
}

window.PV2={
  navPrev,navNext,goToday,setViewMode,
  switchPlan,switchMode,
  toggleSidebar,toggleCourse,toggleChipView,
  showAddEvModal,_aeType,_aeCourse,_addEv,
  showAddCourseModal,_saveCC,_filterCourses,_pickCourse,
  showModDetail,_saveModNote,editDayNote,_saveDayNote,editModNote,
  showItemMenu,_rmItem,toggleDone,splitItem,unsplitItem,
  _chipDragStart,_chipDragEnd,_calDragStart,_dragOver,_dragLeave,_drop,_evChipDrag,
  showSplitConfirm,_doSplit,_addAsReview,
  editInstanceLabel,_saveInstanceLabel,
  editPlanSettings,_saveSettings,confirmDelPlan,_delPlan,
  smartSchedule,_doSchedule,
  exportPrint,
  doUndo,closeModal,
  _moDayClick,
  _goLegacy,_dismissLegacy,_returnNew,
  _startManual,_startSmart,_startAI,
  
  renderMobileDrawer,_drawerSelectCourse,initDrawerInteractions,_drawerTapModule,_drawerTapReview,
  _tapPlaceOnDay,cancelTapPlace,toggleDrawer,
  
  moveItemUp,moveItemDown,
  
  setStudyView,
  renderStudy,
  _flipCard,_cardNext,_cardPrev,
  
  showModStatusMenu,setModStatus,_setStatus,statusIcon,_removeModEverywhere,
  
  showEditCourse,_pickColor,_saveEditCourse,_addMod,_delMod,_deleteCustomCourse,
  
  selectPlanType,nextStep,prevStep,finishSetup,
  toggleCourseSelection,updateCourseExam,_toggleWizardModMastered,
  _toggleElectivesSection,
  
  showPrintOptions,_doPrint,_printClassic,_printCalendar,
  
  excludeCourseFromPlan,restoreCourse,toggleRestoreSection,
  getProgress:()=>JSON.parse(localStorage.getItem(prgKey())||'{}'),
  getLevel:()=>LEVEL
};

document.addEventListener('DOMContentLoaded',init);
})();
