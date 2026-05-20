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
function prioName(p){return{high:'High 🔴',medium:'Medium',low:'Low'}[p]||p}

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
//  MODAL MANAGEMENT
// ═══════════════════════════════════════════
function openNewEvent(){
  editingEventId = null;
  document.getElementById('modal-title').textContent = "New event";
  document.getElementById('ev-title').value = "";
  document.getElementById('ev-date').value = isoDate(selectedDate);
  document.getElementById('ev-time').value = "";
  document.getElementById('ev-duration').value = "";
  document.getElementById('ev-priority').value = "medium";
  document.getElementById('ev-repeat').value = "";
  document.getElementById('ev-notes').value = "";
  selectCat(document.querySelector('.cat-btn'), 'studio');
  document.getElementById('event-modal').classList.add('open');
}

function closeModal(id){
  document.getElementById(id).classList.remove('open');
}

function selectCat(btn, cat){
  document.querySelectorAll('.cat-btn').forEach(b => {
    b.className = "cat-btn";
  });
  btn.classList.add('active-' + cat);
  selectedCat = cat;
}

// ═══════════════════════════════════════════
//  RENDER ENGINE
// ═══════════════════════════════════════════
function renderView(){
  updateSidebarStats();
  renderUpcomingStrip();
  
  const content = document.getElementById('content');
  if(currentView === 'calendar') renderCalendar(content);
  else if(currentView === 'schedule') renderSchedule(content);
  else if(currentView === 'focus') renderFocus(content);
  else if(currentView === 'notifications') renderNotifications(content);
  else if(currentView === 'settings') renderSettings(content);
}

function updateSidebarStats(){
  const statsDiv = document.getElementById('sidebar-stats');
  const todayEvs = getEventsForDate(isoDate(todayDate));
  const totalMonth = expandEvents(events, new Date(todayDate.getFullYear(), todayDate.getMonth(), 1), new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0)).length;
  
  statsDiv.innerHTML = `
    <div class="stat-row">
      <div class="stat-pill"><div class="val">${todayEvs.length}</div><div class="lbl">Today</div></div>
      <div class="stat-pill"><div class="val">${totalMonth}</div><div class="lbl">This Month</div></div>
    </div>
  `;
}

function renderUpcomingStrip(){
  const strip = document.getElementById('upcoming-strip');
  const upcoming = getUpcomingEvents();
  if(upcoming.length === 0){
    strip.innerHTML = `<span class="up-label">Upcoming:</span><span class="no-upcoming">No events ahead</span>`;
    return;
  }
  let html = `<span class="up-label">Upcoming:</span>`;
  upcoming.forEach(e => {
    html += `
      <div class="up-chip" onclick="openDetail('${e.id}', '${e.date}')">
        <div class="chip-dot ${e.category}"></div>
        <span>${e.title} (${fmtDate(e.date)})</span>
      </div>
    `;
  });
  strip.innerHTML = html;
}

function renderCalendar(container){
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayIndex = new Date(year, month, 1).getDay();
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Allinea a Lunedì
  
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevTotalDays = new Date(year, month, 0).getDate();
  
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  
  let html = `
    <div class="cal-nav">
      <button class="btn btn-icon" onclick="changeMonth(-1)">◀</button>
      <h3>${monthNames[month]} ${year}</h3>
      <button class="btn btn-icon" onclick="changeMonth(1)">▶</button>
    </div>
    <div class="cal-grid-header">
      <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
    </div>
    <div class="cal-grid">
  `;
  
  for(let i = startOffset; i > 0; i--){
    const d = prevTotalDays - i + 1;
    const dateObj = new Date(year, month - 1, d);
    html += renderDayCell(dateObj, true);
  }
  
  for(let d = 1; d <= totalDays; d++){
    const dateObj = new Date(year, month, d);
    html += renderDayCell(dateObj, false);
  }
  
  const remaining = 42 - (startOffset + totalDays);
  for(let i = 1; i <= remaining; i++){
    const dateObj = new Date(year, month + 1, i);
    html += renderDayCell(dateObj, true);
  }
  
  html += `</div><div class="day-detail" id="day-detail-area"></div>`;
  container.innerHTML = html;
  renderDayDetail();
}

function renderDayCell(dateObj, isOtherMonth){
  const iso = isoDate(dateObj);
  const dayNum = dateObj.getDate();
  const evs = getEventsForDate(iso);
  
  let classes = "cal-day";
  if(isOtherMonth) classes += " other-month";
  if(iso === isoDate(todayDate)) classes += " today";
  if(iso === isoDate(selectedDate)) classes += " selected";
  
  let dots = '<div class="dots">';
  evs.forEach(e => { dots += `<div class="dot ${e.category}"></div>`; });
  dots += '</div>';
  
  return `
    <div class="${classes}" onclick="selectDateCell('${iso}')">
      <div class="day-num">${dayNum}</div>
      ${dots}
    </div>
  `;
}

function changeMonth(dir){
  currentDate.setMonth(currentDate.getMonth() + dir);
  renderView();
}

function selectDateCell(iso){
  selectedDate = new Date(iso + 'T12:00:00');
  renderView();
}

function renderDayDetail(){
  const area = document.getElementById('day-detail-area');
  if(!area) return;
  
  const iso = isoDate(selectedDate);
  const evs = getEventsForDate(iso);
  
  let html = `
    <div class="day-detail-header">
      <h3>Events of ${fmtDate(iso)}</h3>
    </div>
  `;
  
  if(evs.length === 0){
    html += `<div class="empty"><div class="big">☕</div><p>No events scheduled for this day.</p></div>`;
  } else {
    html += `<div class="event-list">`;
    evs.forEach(e => {
      const timeStr = e.time ? `🕒 ${e.time}` : '📅 All day';
      html += `
        <div class="event-card" onclick="openDetail('${e.id}', '${iso}')">
          <div class="event-cat ${e.category}"></div>
          <div class="event-info">
            <div class="event-title">${e.title} ${e.repeat ? `<span class="repeat-badge">🔁 ${e.repeat}</span>` : ''}</div>
            <div class="event-meta">${timeStr} · <span class="tag ${e.category}">${catName(e.category)}</span></div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }
  area.innerHTML = html;
}

function openDetail(id, dateIso){
  const baseId = id.split('_')[0]; 
  const ev = events.find(e => e.id === baseId);
  if(!ev) return;
  
  editingEventId = baseId;
  document.getElementById('detail-title').textContent = ev.title;
  
  let bodyHtml = `
    <div style="margin-bottom:1rem;">
      <span class="tag ${ev.category}">${catName(ev.category)}</span>
      <span class="prio"><span class="prio-dot ${ev.priority}"></span>Priority: ${prioName(ev.priority)}</span>
    </div>
    <p><strong>Date:</strong> ${fmtDate(dateIso)} ${ev.repeat ? `(Repeats: ${ev.repeat})` : ''}</p>
    ${ev.time ? `<p><strong>Time:</strong> ${ev.time} ${ev.duration ? `(${ev.duration} min)` : ''}</p>` : ''}
    ${ev.notes ? `<p style="margin-top:0.75rem; white-space:pre-wrap; color:var(--text2); background:var(--bg2); padding:0.5rem; border-radius:4px;">${ev.notes}</p>` : ''}
  `;
  
  document.getElementById('detail-body').innerHTML = bodyHtml;
  
  document.getElementById('detail-delete-btn').onclick = () => { closeModal('detail-modal'); deleteEvent(baseId); };
  document.getElementById('detail-edit-btn').onclick = () => { closeModal('detail-modal'); triggerEdit(ev); };
  
  document.getElementById('detail-modal').classList.add('open');
}

function triggerEdit(ev){
  editingEventId = ev.id;
  document.getElementById('modal-title').textContent = "Edit Event";
  document.getElementById('ev-title').value = ev.title;
  document.getElementById('ev-date').value = ev.date;
  document.getElementById('ev-time').value = ev.time || "";
  document.getElementById('ev-duration').value = ev.duration || "";
  document.getElementById('ev-priority').value = ev.priority;
  document.getElementById('ev-repeat').value = ev.repeat || "";
  document.getElementById('ev-notes').value = ev.notes || "";
  
  const targetBtn = Array.from(document.querySelectorAll('.cat-btn')).find(b => b.dataset.cat === ev.category);
  if(targetBtn) selectCat(targetBtn, ev.category);
  
  document.getElementById('event-modal').classList.add('open');
}

function renderSchedule(container){
  const from = new Date(todayDate);
  const to = new Date(todayDate);
  to.setDate(to.getDate() + 60);
  
  const allEvs = expandEvents(events, from, to).sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||''));
  
  if(allEvs.length === 0){
    container.innerHTML = `<div class="empty"><div class="big">📋</div><p>Your schedule is completely empty for the next 60 days.</p></div>`;
    return;
  }
  
  const groups = {};
  allEvs.forEach(e => {
    if(!groups[e.date]) groups[e.date] = [];
    groups[e.date].push(e);
  });
  
  let html = `<div style="display:flex; flex-direction:column; gap:1.25rem;">`;
  Object.keys(groups).sort().forEach(dateIso => {
    const isToday = dateIso === isoDate(todayDate);
    html += `
      <div class="agenda-day">
        <div class="agenda-day-header">
          <span class="agenda-date-badge ${isToday?'today':''}">${fmtDate(dateIso)}</span>
        </div>
        <div class="event-list">
    `;
    groups[dateIso].forEach(e => {
      html += `
        <div class="event-card" onclick="openDetail('${e.id}', '${dateIso}')">
          <div class="event-cat ${e.category}"></div>
          <div class="event-info">
            <div class="event-title">${e.title}</div>
            <div class="event-meta">${e.time || 'All day'} · <span class="tag ${e.category}">${catName(e.category)}</span></div>
          </div>
        </div>
      `;
    });
    html += `</div></div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}

function renderFocus(container){
  const todayIso = isoDate(todayDate);
  const evs = getEventsForDate(todayIso);
  
  const cats = ['studio', 'salute', 'sport', 'altro'];
  let statsHtml = '<div class="progress-section"><h4>Today Progress</h4><div class="progress-cards">';
  
  cats.forEach(c => {
    const total = evs.filter(e => e.category === c).length;
    statsHtml += `
      <div class="progress-card ${c}" style="--prog: 100%">
        <div class="prog-num">${total}</div>
        <div class="prog-label">${catName(c)}</div>
      </div>
    `;
  });
  statsHtml += '</div></div>';
  
  let listHtml = '<h4>Focus Items</h4><div class="event-list" style="margin-top:0.75rem;">';
  if(evs.length === 0){
    listHtml += `<div class="empty"><div class="big">🎯</div><p>Clear mind! No tasks or activities for today.</p></div>`;
  } else {
    evs.forEach(e => {
      listHtml += `
        <div class="event-card" onclick="openDetail('${e.id}', '${todayIso}')">
          <div class="event-cat ${e.category}"></div>
          <div class="event-info">
            <div class="event-title" style="font-size:1rem; font-weight:600;">${e.title}</div>
            <div class="event-meta">${e.time || 'All day'} · Priority: ${prioName(e.priority)}</div>
          </div>
        </div>
      `;
    });
  }
  listHtml += '</div>';
  
  container.innerHTML = statsHtml + listHtml;
}

function renderNotifications(container){
  container.innerHTML = `
    <div class="notif-block">
      <h4>🔔 Local Push Reminders</h4>
      <div class="toggle-row">
        <div class="toggle-label">
          <div class="tl">In-App Alerts</div>
          <div class="ts">Triggers via background loops when the application tab is active</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="chk-notify" ${settings.notifyDevice?'checked':''} onchange="updateSettingsField('notifyDevice', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="notif-time-row">
        <label>Remind me before:</label>
        <select id="sel-time" onchange="updateSettingsField('notifyBefore', parseInt(this.value))">
          <option value="15" ${settings.notifyBefore===15?'selected':''}>15 minutes</option>
          <option value="30" ${settings.notifyBefore===30?'selected':''}>30 minutes</option>
          <option value="60" ${settings.notifyBefore===60?'selected':''}>1 hour</option>
        </select>
      </div>
    </div>
    
    <div class="notif-block">
      <h4>✉️ Desktop Email Client Redirection</h4>
      <div class="toggle-row">
        <div class="toggle-label">
          <div class="tl">Prefill Mailto Link</div>
          <div class="ts">Triggers your default local client system safely without data tracking</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="chk-email" ${settings.notifyEmail?'checked':''} onchange="updateSettingsField('notifyEmail', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="email-config" style="display: ${settings.notifyEmail?'block':'none'}" id="email-box">
        <input type="email" id="txt-email" value="${settings.email}" placeholder="yourname@domain.com" onchange="updateSettingsField('email', this.value)">
      </div>
    </div>
  `;
}

function updateSettingsField(field, value){
  settings[field] = value;
  saveSettings(settings);
  if(field === 'notifyEmail'){
    document.getElementById('email-box').style.display = value ? 'block' : 'none';
  }
  toast('Preferences altered successfully','success');
}

function renderSettings(container){
  container.innerHTML = `
    <div class="settings-section">
      <h4>Profile Identity</h4>
      <div class="form-group">
        <label>Display Owner Name</label>
        <input type="text" id="cfg-name" value="${settings.name}" placeholder="Anonymous Member" onchange="updateSettingsField('name', this.value)">
      </div>
    </div>
    
    <div class="settings-section">
      <h4>Data Sovereignty Backup</h4>
      <p style="font-size:0.82rem; color:var(--text2); margin-bottom:0.75rem;">Export your dataset onto a flat local JSON or synchronize it backwards.</p>
      <button class="btn" onclick="exportData()">📤 Download JSON File</button>
      <button class="btn" onclick="document.getElementById('import-file').click()">📥 Upload backup</button>
      <input type="file" id="import-file" style="display:none" accept=".json" onchange="importData(this)">
    </div>
    
    <div class="settings-section">
      <h4 style="color:var(--accent3);">Danger Zone Area</h4>
      <div class="danger-zone">
        <p style="font-size:0.82rem; margin-bottom:0.75rem;">Wiping configuration actions are destructive and completely unrecoverable.</p>
        <button class="btn danger" onclick="purgeSystemData()" style="border-color:var(--accent3); color:var(--accent3);">Wipe Database Instantly</button>
      </div>
    </div>
  `;
}

function exportData(){
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", "focuscal_backup.json");
  dlAnchor.click();
}

function importData(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try {
      const imported = JSON.parse(e.target.result);
      if(Array.isArray(imported)){
        events = imported;
        saveEvents(events);
        renderView();
        toast('Backup synchronized correctly','success');
      } else { toast('Invalid schema format','error'); }
    } catch { toast('Corrupted standard integrity','error'); }
  };
  reader.readAsText(file);
}

function purgeSystemData(){
  if(confirm("Are you sure you want to delete all your private calendar events permanently?")){
    localStorage.removeItem(STORAGE_KEY);
    events = [];
    renderView();
    toast('System database purged','info');
  }
}

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