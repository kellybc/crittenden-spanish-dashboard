const starter = [
  {name:'Kelly', username:'Kelly_B_C', emoji:'K', xp:0, streak:0, lessons:0, words:0, accent:'#7658d5', soft:'#eee9fb'},
  {name:'Amy', username:'AmyCritten3', emoji:'A', xp:0, streak:0, lessons:0, words:0, accent:'#23a566', soft:'#e2f5ea'},
  {name:'John Kelly', username:'jklions', emoji:'JK', xp:0, streak:0, lessons:0, words:0, accent:'#ef8438', soft:'#fcebdd'},
  {name:'Davy', username:'Hollandlopguy', emoji:'D', xp:0, streak:0, lessons:0, words:0, accent:'#418bc7', soft:'#e2f0fa'}
];
let members=starter, history=[], weekly=[], daily=[];
const $=s=>document.querySelector(s), fmt=n=>Number(n).toLocaleString();
function render(){
  const ranked=[...members].sort((a,b)=>b.xp-a.xp);
  $('#memberGrid').innerHTML=ranked.map((m,i)=>`<article class="member-card" style="--accent:${m.accent};--soft:${m.soft}"><div class="card-top"><div class="avatar">${m.emoji}</div><span class="rank">#${i+1}</span></div><h3>${m.name}</h3><span class="username">@${m.username}</span><span class="level">Spanish learner · ${m.streak?'On a roll':'Getting started'}</span><div class="member-stats"><div><strong>${fmt(m.xp)}</strong><small>Total XP</small></div><div><strong>🔥 ${m.streak}</strong><small>Day streak</small></div><div><strong>${m.lessons}</strong><small>Lessons</small></div><div><strong>${m.words}</strong><small>Words</small></div></div></article>`).join('');
  $('#leaderboard').innerHTML=ranked.map((m,i)=>`<div class="leader-row"><span>${['🥇','🥈','🥉','4'][i]||i+1}</span><div class="mini-person"><span class="mini-avatar" style="background:${m.soft};color:${m.accent}">${m.emoji}</span><div><strong>${m.name}</strong><br><small>${m.streak} day streak</small></div></div><strong>${fmt(m.xp)} XP</strong></div>`).join('');
  const sums=k=>members.reduce((t,m)=>t+Number(m[k]),0),xp=sums('xp'),lessons=sums('lessons'),words=sums('words'),streak=Math.max(...members.map(m=>m.streak));
  $('#totalXp').textContent=fmt(xp);$('#heroXp').textContent=fmt(xp);$('#activeStreak').textContent=`${streak} days`;$('#heroStreak').textContent=streak;$('#totalLessons').textContent=fmt(lessons);$('#wordsLearned').textContent=fmt(words);
  $('#goalLessons').textContent=`${lessons} / 200`;$('#lessonProgress').style.width=`${Math.min(100,lessons/2)}%`;$('#goalWords').textContent=`${words} / 600`;$('#wordProgress').style.width=`${Math.min(100,words/6)}%`;
  $('#memberSelect').innerHTML=members.map((m,i)=>`<option value="${i}">${m.name}</option>`).join('');
  const dates=members.map(m=>new Date(m.updated_at||0).getTime()).filter(Boolean);$('#lastUpdated').textContent=dates.length?new Date(Math.max(...dates)).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'today';
  renderChart();renderWeekly();
}
function renderChart(){
  let vals=history.map(h=>Number(h.total_xp)).slice(-6);if(!vals.length)vals=[0];const max=Math.max(...vals,1);
  $('#chart').innerHTML=vals.map(v=>`<i class="bar" style="height:${Math.max(3,v/max*92)}%" data-value="${fmt(v)} XP"></i>`).join('');
  const labels=history.slice(-6).map(h=>new Date(h.recorded_at).toLocaleDateString(undefined,{month:'short',day:'numeric'}));
  $('.chart-labels').innerHTML=(labels.length?labels:['Today']).map(x=>`<span>${x}</span>`).join('');
}
function renderWeekly(){
  const board=$('#weeklyBoard');if(!board)return;
  if(!weekly.length){board.innerHTML='<p class="weekly-empty">Weekly tracking begins with the next Duolingo sync.</p>';return}
  const max=Math.max(...weekly.map(m=>Number(m.weekly_xp)),1),leader=weekly[0];
  board.innerHTML=weekly.map((m,i)=>`<div class="weekly-row"><span class="weekly-rank">${['🥇','🥈','🥉','4'][i]||i+1}</span><span class="mini-avatar" style="background:${m.soft};color:${m.accent}">${m.emoji}</span><div class="weekly-person"><strong>${m.name}</strong><div class="weekly-meter"><i style="width:${Math.max(3,m.weekly_xp/max*100)}%;background:${m.accent}"></i></div></div><strong class="weekly-xp">${fmt(m.weekly_xp)}<small> XP</small></strong></div>`).join('');
  $('#weeklyHeadline').textContent=leader.weekly_xp>0?`${leader.name} is choosing the treat—for now!`:'A fresh challenge is underway!';
  const end=new Date(weekly[0].ends_at),days=Math.max(0,Math.ceil((end-Date.now())/86400000));
  $('#challengeCountdown').textContent=`${days} day${days===1?'':'s'} left · ${end.toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/Chicago'})}`;
}function fillForm(){const m=members[Number($('#memberSelect').value)];['xp','streak','lessons','words'].forEach(k=>$(`#${k}Input`).value=m[k])}
function openDialog(){fillForm();$('#formMessage').textContent='';$('#entryDialog').showModal()}
async function loadShared(){try{const r=await fetch('/api/progress',{cache:'no-store'});if(!r.ok)throw new Error();const data=await r.json();members=data.members;history=data.history||[];weekly=data.weekly||[];daily=data.daily||[];render()}catch{render()}}
$('#openEntry').onclick=openDialog;$('#openEntryHero').onclick=openDialog;$('#memberSelect').onchange=fillForm;
$('#entryForm').addEventListener('submit',async e=>{
  if(e.submitter?.value==='cancel')return;e.preventDefault();const button=e.submitter,i=Number($('#memberSelect').value);
  button.disabled=true;button.firstChild.textContent='Saving… ';$('#formMessage').textContent='';
  const update={username:members[i].username,pin:$('#pinInput').value};['xp','streak','lessons','words'].forEach(k=>update[k]=Number($( `#${k}Input`).value));
  try{const r=await fetch('/api/progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(update)});const data=await r.json();if(!r.ok)throw new Error(data.error||'Could not save');members=data.members;history=data.history||[];weekly=data.weekly||[];daily=data.daily||[];render();$('#pinInput').value='';$('#entryDialog').close()}catch(err){$('#formMessage').textContent=err.message}finally{button.disabled=false;button.firstChild.textContent='Save for everyone '}
});
render();loadShared();
