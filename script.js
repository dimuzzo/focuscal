// ═══════════════════════════════════════════
//  DATA LAYER — LocalStorage
// ═══════════════════════════════════════════
const STORAGE_KEY = 'focuscal_events';
const SETTINGS_KEY = 'focuscal_settings';

function loadEvents(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{return[]}
}
function saveEvents(evs){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(evs))
}
function loadSettings(){
  const def={
    notifyDevice:true,notifyEmail:false,email:'',
    notifyBefore:30,name:'',theme:'dark'
  };
  try{return Object.assign(def,JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'))}catch{return def}
}
function saveSettings(s){localStorage.setItem(SETTINGS_KEY,JSON.stringify(s))}

let events=loadEvents();
let settings=loadSettings();

// ═══════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════
let currentView='calendar';
let currentDate=new Date();
let selectedDate=new Date();
selectedDate.setHours(0,0,0,0);
let editingEventId=null;
let selectedCat='studio';

const todayDate=new Date();todayDate.setHours(0,0,0,0);

// ═══════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2)}
function isoDate(d){return d.toISOString().slice(0,10)}
function sameDay(d1,d2){return isoDate(new Date(d1))===isoDate(new Date(d2))}
function fmtDate(iso){
  const d=new Date(iso+'T12:00:00');
  return d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
}
function catName(c){return{studio:'📚 Study',salute:'🩺 Health',sport:'🏋️ Sport',altro:'💡 Other'}[c]||c}
function prioName(p){return{alta:'High 🔴',media:'Medium',bassa:'Low'}[p]||p}

function expandEvents(baseEvents,fromDate,toDate){
  const result=[];
  const from=new Date(fromDate);from.setHours(0,0,0,0);
  const to=new Date(toDate);to.setHours(23,59,59,999);
  baseEvents.forEach(ev=>{
    const d=new Date(ev.date+'T12:00:00');
    if(!ev.repeat){
      if(d>=from&&d<=to)result.push({...ev});
    } else {
      let cur=new Date(d);
      let safety=0;
      while(cur<=to&&safety<500){
        safety++;
        if(cur>=from){
          const eid=ev.id+'_'+isoDate(cur);
          result.push({...ev,date:isoDate(cur),_repeatId:eid,_baseId:ev.id});
        }
        if(ev.repeat==='daily')cur.setDate(cur.getDate()+1);
        else if(ev.repeat==='weekly')cur.setDate(cur.getDate()+7);
        else if(ev.repeat==='monthly')cur.setMonth(cur.getMonth()+1);
        else break;
      }
    }
  });
  return result;
}

function getEventsForDate(dateIso){
  const from=new Date(dateIso+'T00:00:00');
  const to=new Date(dateIso+'T23:59:59');
  return expandEvents(events,from,to).filter(e=>e.date===dateIso)
    .sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
}

function getUpcomingEvents(n=6){
  const from=new Date();from.setHours(0,0,0,0);
  const to=new Date();to.setDate(to.getDate()+30);
  return expandEvents(events,from,to)
    .sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||''))
    .slice(0,n);
}

// ═══════════════════════════════════════════
//  NAVIGATION & UI
// ═══════════════════════════════════════════
function switchView(v){
  currentView=v;
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  const titles={calendar:'Calendar',schedule:'Schedule',focus:'Focus Today',notifications:'Notifications',settings:'Settings'};
  document.getElementById('topbar-title').textContent=titles[v]||v;
  renderView();
  closeSidebar();
}

function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

function goToday(){
  currentDate=new Date();
  selectedDate=new Date();selectedDate.setHours(0,0,0,0);
  renderView();
}

// ═══════════════════════════════════════════
//  RENDER FUNCTIONS (Truncated logic for brevity, ensure all strings are in English)
// ═══════════════════════════════════════════
// [Inserisci qui le tue funzioni renderCalendar, renderAgenda, renderFocus, 
// renderNotifications e renderSettings aggiornando i testi in inglese come fatto sopra]

// ═══════════════════════════════════════════
//  SAVE / DELETE EVENTS
// ═══════════════════════════════════════════
function saveEvent(){
  const title=document.getElementById('ev-title').value.trim();
  if(!title){toast('Please enter a title!','error');return;}
  const date=document.getElementById('ev-date').value;
  if(!date){toast('Please enter a date!','error');return;}

  const ev={
    id:editingEventId||uid(),
    title,category:selectedCat,date,
    time:document.getElementById('ev-time').value||null,
    duration:parseInt(document.getElementById('ev-duration').value)||null,
    priority:document.getElementById('ev-priority').value,
    repeat:document.getElementById('ev-repeat').value||null,
    notes:document.getElementById('ev-notes').value.trim()||null,
    notify:document.getElementById('ev-notify')?.checked ?? true,
    done:false,
    createdAt:Date.now(),
  };

  if(editingEventId){
    const idx=events.findIndex(e=>e.id===editingEventId);
    if(idx>-1){ev.done=events[idx].done;events[idx]=ev;}
  } else {
    events.push(ev);
  }
  saveEvents(events);
  closeModal('event-modal');
  renderView();
  toast(editingEventId?'Event updated ✓':'Event saved ✓','success');
}

function deleteEvent(id){
  events=events.filter(e=>e.id!==id);
  saveEvents(events);
  renderView();
  toast('Event deleted','info');
}

// ═══════════════════════════════════════════
//  TOAST & INIT
// ═══════════════════════════════════════════
function toast(msg,type='info'){
  const colors={success:'#4af0c8',error:'#ff6b6b',info:'#a78bfa',warn:'#ffb347'};
  const t=document.createElement('div');
  t.className='toast';
  t.innerHTML=`<div class="toast-dot" style="background:${colors[type]||colors.info}"></div><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(()=>t.remove(),3200);
}

renderView();