(() => {
  const $ = id => document.getElementById(id);
  let state = null, group = 1, selected = null, editing = null, toastTimer, pendingMove = false, moveDate = null, moveGroup = null;
  const dateLabel = (date, weekday = true) => new Intl.DateTimeFormat('en-AU', {timeZone:'Australia/Melbourne',...(weekday?{weekday:'short'}:{}),day:'numeric',month:'short'}).format(new Date(date+'T12:00:00+11:00'));
  const timeLabel = value => { if (!value) return ''; const [h,m]=value.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'am':'pm'}`; };
  const timeRange = p => p.startTime ? `${timeLabel(p.startTime)} – ${timeLabel(p.endTime)}` : 'Time TBC';
  const minutes = value => Number(value.slice(0,2))*60+Number(value.slice(3));
  const clock = value => `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;
  function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
  function button(label,className,fn){const b=el('button',className,label);b.type='button';b.addEventListener('click',fn);return b;}
  function showError(id,message){$(id).textContent=message||'';$(id).hidden=!message;}
  function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('visible');toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4500);}
  async function api(path='',options={}){
    const response=await fetch('/api/schedule'+path,{...options,headers:{'Content-Type':'application/json',...options.headers},...(options.body?{body:JSON.stringify(options.body)}:{})});
    const data=await response.json().catch(()=>({error:'The server could not be reached. Please try again.'}));
    if(!response.ok)throw Object.assign(new Error(data.error||'Unable to save. Please try again.'),data,{status:response.status});
    return data;
  }
  function countBadge(count){return el('span','count-badge'+(count===3?' complete':''),count===3?'3 of 3 scheduled':count<3?`${count} of 3 scheduled`:`${count} scheduled · needs review`);}
  const presentationsFor = id => state.presentations.filter(p=>p.studentId===id);
  function applyAdmin(){
    document.body.classList.toggle('admin-on',state.admin);
    $('editSchedule').textContent=state.admin?'Editing unlocked ✓':'Edit schedule ↗';
    $('lockSchedule').hidden=!state.admin;$('history').hidden=!state.admin;
  }
  async function load({report=true}={}){
    try{
      state=await api();applyAdmin();
      const oldDate=$('dateFilter').value;
      $('dateFilter').replaceChildren(new Option('All delivery dates',''),...state.dates.map(d=>new Option(dateLabel(d),d)));
      if(state.dates.includes(oldDate))$('dateFilter').value=oldDate;
      $('studentCount').textContent=state.students.length;
      const reviewCount=state.students.filter(s=>presentationsFor(s.id).length!==3).length;
      document.querySelector('.source-note').classList.toggle('balanced',reviewCount===0);
      document.querySelector('.note-icon').textContent=reviewCount?'!':'✓';
      $('reviewSummary').textContent=reviewCount?`${reviewCount} students’ presentation counts need a check.`:'All students have three presentations scheduled · 30 minutes each.';
      showError('loadError','');$('retry').hidden=true;render();
      return true;
    }catch(err){if(report){showError('loadError',err.message);$('retry').hidden=false;}return false;}
    finally{$('tableWrap').setAttribute('aria-busy','false');}
  }
  function render(){
    if(!state)return;
    const query=$('search').value.trim().toLowerCase(),date=$('dateFilter').value;
    const groupStudents=state.students.filter(s=>s.group===group);
    const students=groupStudents.filter(s=>(s.name+' '+s.unit).toLowerCase().includes(query)&&(!date||presentationsFor(s.id).some(p=>p.date===date)));
    if(date)students.sort((a,b)=>(presentationsFor(a.id).find(p=>p.date===date)?.startTime||'').localeCompare(presentationsFor(b.id).find(p=>p.date===date)?.startTime||''));
    $('groupHeading').textContent='Group '+group;
    $('groupDescription').textContent=date?`${students.length} presentation${students.length===1?'':'s'} · 30 minutes each · 10+ min breaks`:`${groupStudents.length} students · Choose your name to add your course or unit.`;
    for(const tab of $('groupTabs').querySelectorAll('button'))tab.setAttribute('aria-pressed',String(Number(tab.dataset.group)===group));
    const wrap=$('tableWrap');wrap.replaceChildren();
    const dayCount=date?state.presentations.filter(p=>p.date===date&&groupStudents.some(s=>s.id===p.studentId)).length:0;
    $('movePresentation').hidden=!date;
    $('movePresentation').disabled=!!date&&dayCount>=6;
    $('movePresentation').title=dayCount>=6?'This group already has six presentations on this date.':'';
    const extended=!date&&state.dates.length>4;
    wrap.classList.toggle('calendar-overflow',extended);wrap.tabIndex=extended?0:-1;
    if(!students.length){
      const empty=el('div','empty-state');
      if(date&&!query&&dayCount===0){
        empty.append(el('p','',`No presentations scheduled for ${dateLabel(date)} in Group ${group} yet.`),el('p','field-hint','Use “Move a presentation here” to move an existing session. Organiser PIN required.'));
      }else empty.append(el('p','','No students match this filter in Group '+group+'.'));
      wrap.append(empty);return;
    }
    const dates=date?[date]:state.dates;
    const table=el('table','schedule-table'+(extended?' extended':''));
    const caption=el('caption','sr-only',`Group ${group} presentation schedule. All times are Melbourne time.`);table.append(caption);
    const head=el('thead'),headRow=el('tr');headRow.append(el('th','', 'Student / unit'));
    for(const d of dates){const th=el('th');th.scope='col';th.append(el('span','',dateLabel(d).split(',')[0].split(' ')[0]),el('span','day-number',dateLabel(d,false)));headRow.append(th);}
    head.append(headRow);table.append(head);
    const body=el('tbody');
    for(const student of students){
      const row=el('tr'),nameCell=el('td'),assignments=presentationsFor(student.id);
      nameCell.append(button(student.name,'student-name',()=>openStudent(student.id)),el('p','unit-preview'+(!student.unit?' empty':''),student.unit||'Add your course / unit'),countBadge(assignments.length));row.append(nameCell);
      for(const d of dates){
        const cell=el('td');cell.dataset.label=dateLabel(d);
        const session=assignments.find(p=>p.date===d);
        if(session){cell.append(el('span','presenting','Presenting'),el('span','slot-time',timeRange(session)));}
        else{const dash=el('span','no-session','—');dash.setAttribute('aria-label','No presentation scheduled');cell.append(dash);if(student.id==='abbey'&&d==='2026-11-06')cell.append(el('span','absence','Away'));}
        row.append(cell);
      }
      body.append(row);
    }
    table.append(body);wrap.append(table);
  }
  function requestMove(){
    if(!state||!$('dateFilter').value)return;
    if(!state.admin){pendingMove=true;openPin();return;}
    openMove();
  }
  function openMove(){
    moveDate=$('dateFilter').value;moveGroup=group;
    if(!moveDate||!state.admin)return;
    const candidates=state.students.filter(s=>s.group===moveGroup&&presentationsFor(s.id).length&&!presentationsFor(s.id).some(p=>p.date===moveDate));
    if(!candidates.length){toast('Every student in this group already presents on this date.');return;}
    $('moveGroup').textContent=`GROUP ${moveGroup} · ORGANISER EDITING`;
    $('moveTarget').textContent='New delivery date: '+new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Melbourne',dateStyle:'full'}).format(new Date(moveDate+'T12:00:00+11:00'));
    $('moveStudent').replaceChildren(...candidates.map(s=>new Option(s.name,s.id)));
    showError('moveError','');updateMoveSessions();$('moveDialog').showModal();
  }
  function updateMoveSessions(){
    const sessions=presentationsFor($('moveStudent').value).filter(p=>p.date!==moveDate).sort((a,b)=>a.date.localeCompare(b.date));
    $('moveSession').replaceChildren(...sessions.map(p=>new Option(dateLabel(p.date)+' · '+timeRange(p),p.id)));
    suggestMoveTime();
  }
  function suggestMoveTime(){
    const session=state.presentations.find(p=>p.id===$('moveSession').value);
    if(!session)return;
    const ids=state.students.filter(s=>s.group===moveGroup).map(s=>s.id);
    const booked=state.presentations.filter(p=>p.date===moveDate&&ids.includes(p.studentId)&&p.id!==session.id&&p.startTime&&p.endTime);
    const choices=[minutes(session.startTime||'09:00'),...Array.from({length:43},(_,i)=>540+i*5)];
    const start=choices.find(start=>start>=540&&start<=750&&booked.every(p=>start+30+10<=minutes(p.startTime)||start>=minutes(p.endTime)+10));
    $('moveStart').value=clock(start??540);$('moveEnd').value=clock((start??540)+30);
    showError('moveError',start===undefined?'No free 30-minute slot with a 10-minute break is available. Choose another delivery date.':'');
  }
  async function saveTimedPresentation(path,method,payload){
    try{await api(path,{method,body:payload});return true;}
    catch(err){
      if(err.code!=='overlap')throw err;
      const details=err.conflicts.map(c=>`${c.name}: ${timeLabel(c.start)} – ${timeLabel(c.finish)}`).join('\n');
      if(!confirm(`This overlaps a presentation or leaves less than a 10-minute break in this group:\n\n${details}\n\nSave this time anyway?`))return false;
      await api(path,{method,body:{...payload,allowOverlap:true}});return true;
    }
  }
  function openStudent(id){
    selected=id;editing=null;renderStudent();
    if(!$('studentDialog').open)$('studentDialog').showModal();
  }
  function renderStudent(){
    const student=state.students.find(s=>s.id===selected);if(!student)return;
    const assignments=presentationsFor(selected).sort((a,b)=>a.date.localeCompare(b.date)||(a.startTime||'').localeCompare(b.startTime||''));
    $('studentTitle').textContent=student.name;$('studentGroup').textContent=`GROUP ${student.group} · STUDENT DETAILS`;
    $('studentNote').textContent=student.notes;$('studentNote').hidden=!student.notes;
    $('unit').value=student.unit;showError('unitError','');showError('sessionError','');
    $('studentCountBadge').replaceChildren(countBadge(assignments.length));
    $('studentScheduleHelp').textContent=assignments.length===3?'All three presentations are scheduled.':assignments.length<3?'The target is three. An organiser needs to confirm the remaining presentation date.':'The target is three. An organiser needs to review these assignments.';
    $('studentSessions').replaceChildren();
    for(const p of assignments){
      const row=el('div','session-row'),info=el('div');info.append(el('strong','',dateLabel(p.date)),el('p','',timeRange(p)));row.append(info);
      if(state.admin){const actions=el('div','session-actions');actions.append(button('Edit','text-button',()=>openEditor(p)),button('Remove','text-button danger',()=>removePresentation(p)));row.append(actions);}
      $('studentSessions').append(row);
    }
    if(!assignments.length)$('studentSessions').append(el('p','field-hint','No presentations scheduled yet.'));
    $('addPresentation').hidden=!state.admin;$('studentEditHint').hidden=state.admin;$('sessionForm').hidden=true;
  }
  function openEditor(p=null){
    editing=p;
    $('sessionFormTitle').textContent=p?'Edit presentation':'Add a presentation';
    $('sessionDate').value=p?.date||$('dateFilter').value||'';
    $('startTime').value=p?.startTime||'09:00';$('endTime').value=p?.endTime||'09:30';
    showError('sessionError','');$('sessionForm').hidden=false;$('sessionDate').focus();
  }
  async function removePresentation(p){
    if(!confirm(`Remove ${dateLabel(p.date)} from ${state.students.find(s=>s.id===selected).name}’s schedule? This changes their presentation count.`))return;
    try{await api('/presentations/'+p.id,{method:'DELETE',body:{version:p.version}});if(await load())renderStudent();toast('Presentation removed.');}
    catch(err){showError('unitError',err.message);}
  }
  async function busy(form,fn){const submit=form.querySelector('[type=submit]');submit.disabled=true;try{await fn();}finally{submit.disabled=false;}}
  $('unitForm').addEventListener('submit',e=>{
    e.preventDefault();busy(e.currentTarget,async()=>{
      showError('unitError','');
      try{const student=state.students.find(s=>s.id===selected);await api('/students/'+selected,{method:'PATCH',body:{unit:$('unit').value,version:student.version}});if(await load())renderStudent();toast('Unit name saved for all presentations.');}
      catch(err){showError('unitError',err.message);}
    });
  });
  $('sessionForm').addEventListener('submit',e=>{
    e.preventDefault();busy(e.currentTarget,async()=>{
      showError('sessionError','');
      const payload={studentId:selected,date:$('sessionDate').value,startTime:$('startTime').value,endTime:$('endTime').value,...(editing?{version:editing.version}:{})};
      const path='/presentations'+(editing?'/'+editing.id:''),method=editing?'PATCH':'POST';
      try{
        if(!await saveTimedPresentation(path,method,payload))return;
        if(await load())renderStudent();toast('Presentation saved.');
      }catch(err){showError('sessionError',err.message);}
    });
  });
  function openPin(){showError('pinError','');$('schedulePin').value='';$('pinDialog').showModal();}
  $('editSchedule').addEventListener('click',()=>{if(state?.admin)toast('Editing is unlocked. Click a student to change their presentations.');else openPin();});
  $('unlockFromStudent').addEventListener('click',openPin);
  $('pinForm').addEventListener('submit',e=>{
    e.preventDefault();busy(e.currentTarget,async()=>{
      try{
        await api('/admin/login',{method:'POST',body:{pin:$('schedulePin').value}});
        const shouldMove=pendingMove;pendingMove=false;$('schedulePin').value='';$('pinDialog').close();
        if(await load()){
          if($('studentDialog').open)renderStudent();
          if(shouldMove)openMove();
        }
        toast('Schedule editing unlocked for this browser.');
      }
      catch(err){showError('pinError',err.message);}
    });
  });
  $('lockSchedule').addEventListener('click',async()=>{
    try{await api('/admin/logout',{method:'POST'});if(await load()&&$('studentDialog').open)renderStudent();toast('Schedule editing locked.');}catch(err){toast(err.message);}
  });
  $('movePresentation').addEventListener('click',requestMove);
  $('pinDialog').addEventListener('close',()=>{if(!state?.admin)pendingMove=false;});
  $('moveStudent').addEventListener('change',updateMoveSessions);
  $('moveSession').addEventListener('change',suggestMoveTime);
  $('moveStart').addEventListener('change',()=>{if($('moveStart').value)$('moveEnd').value=clock(minutes($('moveStart').value)+30);});
  $('moveForm').addEventListener('submit',e=>{
    e.preventDefault();busy(e.currentTarget,async()=>{
      showError('moveError','');
      const presentation=state.presentations.find(p=>p.id===$('moveSession').value);
      if(!presentation){showError('moveError','Choose a presentation to move.');return;}
      try{
        if(!await saveTimedPresentation('/presentations/'+presentation.id,'PATCH',{date:moveDate,startTime:$('moveStart').value,endTime:$('moveEnd').value,version:presentation.version}))return;
        $('moveDialog').close();await load();toast('Presentation moved. The student’s presentation count is unchanged.');
      }catch(err){showError('moveError',err.message);}
    });
  });
  $('history').addEventListener('click',async()=>{
    $('historyList').replaceChildren(el('p','field-hint','Loading changes…'));$('historyDialog').showModal();
    try{
      const changes=await api('/admin/history');$('historyList').replaceChildren();
      if(!changes.length)$('historyList').append(el('p','field-hint','No changes yet. The balanced class schedule is imported.'));
      for(const c of changes){
        const entry=el('div','history-entry');entry.append(el('strong','',c.name+' · '+c.action));
        const value=x=>!x?'':('unit'in x?x.unit||'(unit cleared)':dateLabel(x.date)+' · '+timeRange(x));
        const before=value(c.before),after=value(c.after);
        entry.append(el('p','',before&&after?before+' → '+after:after||before));
        entry.append(el('p','',new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Melbourne',dateStyle:'medium',timeStyle:'short'}).format(new Date(c.createdAt))));
        $('historyList').append(entry);
      }
    }catch(err){$('historyList').replaceChildren(el('p','error',err.message));}
  });
  for(const b of document.querySelectorAll('[data-close]'))b.addEventListener('click',()=>$(b.dataset.close).close());
  $('groupTabs').addEventListener('click',e=>{const target=e.target.closest('[data-group]');if(target){group=Number(target.dataset.group);render();}});
  $('search').addEventListener('input',render);$('dateFilter').addEventListener('change',render);$('retry').addEventListener('click',()=>load());
  $('startTime').addEventListener('change',()=>{
    const value=$('startTime').value;if(!value)return;
    const minutes=Number(value.slice(0,2))*60+Number(value.slice(3))+30;
    $('endTime').value=`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
  });
  $('addPresentation').addEventListener('click',()=>openEditor());$('cancelSession').addEventListener('click',()=>{$('sessionForm').hidden=true;});
  // Refresh between interactions without replacing a student's unfinished edits.
  setInterval(()=>{if(!document.hidden&&!document.querySelector('dialog[open]'))load({report:false});},30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!document.querySelector('dialog[open]'))load({report:false});});
  load();
})();
