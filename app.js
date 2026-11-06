
const D=window.DUTY_DATA,$=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const people=Object.fromEntries(D.teachers.map(t=>[t.Initials,t]));
const name=i=>$('mode').value==='full'?(people[i]?.Name||i):i;
function table(head,rows){return '<div class="scroll"><table><thead><tr>'+head.map(v=>'<th>'+esc(v)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}
function options(id,values,placeholder){$(id).innerHTML=(placeholder?'<option value="">'+esc(placeholder)+'</option>':'')+values.map(v=>'<option value="'+esc(v[0])+'">'+esc(v[1])+'</option>').join('')}
const ordered=[...D.roster].sort((a,b)=>a.Date.localeCompare(b.Date)||a.Start-b.Start);
function render(){
 const who=$('person').value;
 $('personal').innerHTML=ordered.filter(t=>t.Members.includes(who)).map(t=>'<div class="card"><strong>'+esc(t.Date)+' · '+esc(t.Exam)+' · '+esc(t.Kind)+'</strong><br>'+esc(t.Time||'Script Receive')+' | '+esc(t.Room)+'<br>'+esc(t.Members.map(name).join(', '))+'</div>').join('')||'<p>No duties assigned.</p>';
 const rows=ordered.filter(t=>t.Kind!=='Script Receive'&&(!$('date').value||t.Date===$('date').value)&&(!$('exam').value||t.Exam===$('exam').value)&&(!$('room').value||t.Room===$('room').value)&&(!$('teacher').value||t.Members.includes($('teacher').value)));
 $('roster').innerHTML=table(['Exam','Date','Shift','Room','Time','Invigilators'],rows.map(t=>[t.Exam,t.Date,t.Shift,t.Room,t.Time,t.Members.map(name).join(', ')]));
 const days=[...new Set(ordered.filter(t=>t.Kind==='Script Receive').map(t=>t.Date))];
 $('receivers').innerHTML=table(['Date','Members on duty'],days.map(d=>[d,ordered.filter(t=>t.Date===d&&t.Kind==='Script Receive').map(t=>t.Semester+' = '+t.Members.map(name).join(', ')).join('; ')]));
 $('totals').innerHTML=table(['Initials','Teacher','Regular','Retake','Receive','Medical','Total'],D.summary.map(t=>[t.Initials,t.Teacher,t.Regular,t.Retake,t['Script Receive'],t['Medical Center'],t.Total]));
 $('changes').innerHTML=D.swaps.length?D.swaps.map(e=>'<div class="card">'+esc(e.Applied)+table(['Duty','Date','Room','Before','After'],e.Before.map((b,i)=>[b.Kind,b.Date,b.Room,b.Members.map(name).join(', '),e.After[i].Members.map(name).join(', ')]))+'</div>').join(''):'<p>No applied duty swaps.</p>';
 const q=$('search').value.toLowerCase();
 $('contacts').innerHTML=table(['Initials','Name','Designation'],D.teachers.filter(t=>(t.Initials+' '+t.Name+' '+t.Designation).toLowerCase().includes(q)).map(t=>[t.Initials,t.Name,t.Designation]));
}
$('session').textContent=Object.values(D.metadata).map(m=>m.exam_title+' ('+m.session+')').join(' / ');
options('person',D.teachers.map(t=>[t.Initials,t.Initials+' — '+t.Name]));
options('teacher',D.teachers.map(t=>[t.Initials,t.Initials+' — '+t.Name]),'All teachers');
options('date',[...new Set(ordered.map(t=>t.Date))].map(d=>[d,d]),'All dates');
options('room',[...new Set(ordered.filter(t=>t.Kind!=='Script Receive').map(t=>t.Room))].map(r=>[r,r]),'All rooms');
try{if(people[localStorage.getItem('duty-person')])$('person').value=localStorage.getItem('duty-person')}catch{}
$('remember').onclick=()=>{try{localStorage.setItem('duty-person',$('person').value);$('remember').textContent='Remembered'}catch{$('remember').textContent='Storage unavailable'}};
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('main section').forEach(s=>s.hidden=s.id!==b.dataset.tab);document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x===b))});
['person','teacher','date','exam','room','mode'].forEach(id=>$(id).onchange=render);
$('clear').onclick=()=>{['date','exam','room','teacher'].forEach(id=>$(id).value='');render()};
$('search').oninput=render;$('print').onclick=()=>window.print();$('personal-print').onclick=()=>window.print();

function resetSwapDuties(){
 const who=$('swap-person').value;
 options('swap-duty',ordered.filter(t=>t.Members.includes(who)).map(t=>[t['Task ID'],t.Date+' | '+t.Kind+' | '+t.Room+' | '+t.Time]),'Select a duty');
 $('swap-results').innerHTML='';resetSwapDates();
}
function resetSwapDates(){
 const who=$('swap-person').value;
 const busy=new Set(ordered.filter(t=>t.Members.includes(who)).map(t=>t.Date));
 options('swap-date',[...new Set(ordered.map(t=>t.Date))].filter(d=>!busy.has(d)).map(d=>[d,d]),'Select an available date');
 $('swap-results').innerHTML='';
}
function findSwaps(){
 const who=$('swap-person').value,source=$('swap-duty').value,date=$('swap-date').value;
 if(!source||!date){$('swap-results').innerHTML='<p>Select a duty and an available date first.</p>';return;}
 const matches=(D.swapOptions?.[source+'|'+who]||[]).filter(o=>D.roster.find(t=>t['Task ID']===o[0])?.Date===date);
 $('swap-results').innerHTML=matches.length?table(['Teacher','Date','Time','Room','Duty'],matches.map(o=>{const t=D.roster.find(t=>t['Task ID']===o[0]);return [name(o[1]),t.Date,t.Time,t.Room,t.Kind]}))+'<p>Ask the operator to apply your selected exchange. This page does not modify the official roster.</p>':'<p>No valid swap is available for the selected dates.</p>';
}
options('swap-person',D.teachers.map(t=>[t.Initials,t.Initials+' — '+t.Name]));
$('swap-person').onchange=resetSwapDuties;$('swap-duty').onchange=resetSwapDates;
$('swap-date').onchange=()=>{$('swap-results').innerHTML=''};
$('find-swap').onclick=findSwaps;resetSwapDuties();
const oldMode=$('mode').onchange;$('mode').onchange=()=>{oldMode();if($('swap-results').innerHTML)findSwaps()};
$('revision').textContent=D.publication?.Revision?' | Version '+D.publication.Revision+' | Updated '+D.publication.Updated:'';
function downloadCalendar(){
 const who=$('person').value,items=ordered.filter(t=>t.Members.includes(who));
 const stamp=(t,n)=>{const [y,m,d]=t.Date.split('-').map(Number);return new Date(Date.UTC(y,m-1,d,0,n-360)).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')};
 const safe=s=>String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
 let lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//VU CSE//Duty Roster//EN'];
 items.forEach(t=>{const fullDay=t.Kind==='Script Receive';const start=fullDay?0:t.Start;const end=fullDay?1440:t.End;
 lines.push('BEGIN:VEVENT','UID:'+(D.publication?.Roster||'vu')+'-'+t['Task ID']+'-'+who+'@vu-duty','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),'DTSTART:'+stamp(t,start),'DTEND:'+stamp(t,end),'SUMMARY:'+safe(t.Kind+' - '+t.Exam),'LOCATION:'+safe(t.Room),'DESCRIPTION:'+safe(t.Members.map(name).join(', ')),'BEGIN:VALARM','TRIGGER:-PT20M','ACTION:DISPLAY','DESCRIPTION:Duty reminder','END:VALARM','END:VEVENT')});
 lines.push('END:VCALENDAR');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'}));a.download=who+'_Duties.ics';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
$('calendar').onclick=downloadCalendar;
$('google-calendar').onclick=()=>{downloadCalendar();window.open('https://calendar.google.com/calendar/u/0/r/settings/export','_blank','noopener')};
document.querySelector('nav button').classList.add('active');render();

