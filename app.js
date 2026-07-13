const starter = [
  {name:'Kelly', username:'Kelly_B_C', emoji:'K', xp:0, streak:0, lessons:0, words:0, accent:'#7658d5', soft:'#eee9fb'},
  {name:'Amy', username:'AmyCritten3', emoji:'A', xp:0, streak:0, lessons:0, words:0, accent:'#23a566', soft:'#e2f5ea'},
  {name:'John Kelly', username:'jklions', emoji:'JK', xp:0, streak:0, lessons:0, words:0, accent:'#ef8438', soft:'#fcebdd'},
  {name:'Davy', username:'Hollandlopguy', emoji:'D', xp:0, streak:0, lessons:0, words:0, accent:'#418bc7', soft:'#e2f0fa'}
];
let members=starter, history=[], weekly=[], courseWeekly=[], daily=[], lastRefresh=0;
const $=s=>document.querySelector(s), fmt=n=>Number(n).toLocaleString(),esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function render(){
  const ranked=[...members].sort((a,b)=>b.xp-a.xp);
  const weeklyByUser=new Map(weekly.map(m=>[m.username,Number(m.weekly_xp)]));
  $('#memberGrid').innerHTML=ranked.map((m,i)=>`<article class="member-card" style="--accent:${m.accent};--soft:${m.soft}"><div class="card-top"><div class="avatar">${m.emoji}</div><span class="rank">#${i+1}</span></div><h3>${m.name}</h3><span class="username">@${m.username}</span><span class="level">Spanish learner · ${m.streak?'On a roll':'Getting started'}</span><div class="member-stats"><div><strong>${fmt(m.xp)}</strong><small>Total XP</small></div><div><strong>🔥 ${m.streak}</strong><small>Day streak</small></div><div><strong>${fmt(weeklyByUser.get(m.username)||0)}</strong><small>XP this week</small></div><div><strong>${m.streak>0?'Active':'Start today'}</strong><small>Practice status</small></div></div></article>`).join('');
  $('#leaderboard').innerHTML=ranked.map((m,i)=>`<div class="leader-row"><span>${['🥇','🥈','🥉','4'][i]||i+1}</span><div class="mini-person"><span class="mini-avatar" style="background:${m.soft};color:${m.accent}">${m.emoji}</span><div><strong>${m.name}</strong><br><small>${m.streak} day streak</small></div></div><strong>${fmt(m.xp)} XP</strong></div>`).join('');
  const sums=k=>members.reduce((t,m)=>t+Number(m[k]),0),xp=sums('xp'),weekXp=weekly.reduce((t,m)=>t+Number(m.weekly_xp),0),streak=Math.max(...members.map(m=>m.streak)),active=members.filter(m=>m.streak>0).length;
  $('#totalXp').textContent=fmt(xp);$('#heroXp').textContent=fmt(xp);$('#activeStreak').textContent=`${streak} days`;$('#heroStreak').textContent=streak;$('#weeklyXp').textContent=fmt(weekXp);$('#activeLearners').textContent=`${active} of ${members.length}`;
  $('#goalWeeklyXp').textContent=`${fmt(weekXp)} / 1,000 XP`;$('#weeklyXpProgress').style.width=`${Math.min(100,weekXp/10)}%`;$('#goalStreak').textContent=`${Math.min(streak,7)} / 7 days`;$('#streakProgress').style.width=`${Math.min(100,streak/7*100)}%`;
  const dates=members.map(m=>new Date(m.updated_at||0).getTime()).filter(Boolean),latest=dates.length?Math.max(...dates):0;lastRefresh=latest;$('#lastUpdated').textContent=latest?new Date(latest).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'today';
  renderChart();renderWeekly();renderCourseBreakdown();
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
}
function courseIcon(language,title){const icons={es:'🇪🇸',it:'🇮🇹',fr:'🇫🇷',de:'🇩🇪',ja:'🇯🇵',pt:'🇧🇷',zh:'🇨🇳',ko:'🇰🇷',chess:'♟️'};return /chess/i.test(title)?'♟️':icons[language]||'🌍'}
function renderCourseBreakdown(){
  const board=$('#courseBreakdown');if(!board)return;
  if(!courseWeekly.length){board.innerHTML='<p class="weekly-empty">Course-by-course tracking begins with the next sync.</p>';return}
  const grouped=members.map(member=>({member,courses:courseWeekly.filter(course=>course.username===member.username)})).filter(group=>group.courses.length);
  board.innerHTML=grouped.map(({member,courses})=>{const total=courses.reduce((sum,course)=>sum+Number(course.weekly_xp),0);return `<article class="course-person"><div class="course-person-head"><span class="mini-avatar" style="background:${member.soft};color:${member.accent}">${member.emoji}</span><div><strong>${member.name}</strong><small>${fmt(total)} XP across all courses this week</small></div></div><div class="course-list">${courses.map(course=>`<div class="course-row ${course.learning_language==='es'?'spanish-course':''}"><span class="course-icon">${courseIcon(course.learning_language,course.title)}</span><div><strong>${esc(course.title)}</strong><small>${course.learning_language==='es'?'Counts for movie night':'Bonus learning'}</small></div><div class="course-score"><strong>${fmt(course.weekly_xp)} XP</strong><small>${fmt(course.current_xp)} total</small></div></div>`).join('')}</div></article>`}).join('');
}
async function loadShared(){try{const r=await fetch('/api/progress',{cache:'no-store'});if(!r.ok)throw new Error();const data=await r.json();members=data.members;history=data.history||[];weekly=data.weekly||[];courseWeekly=data.courseWeekly||[];daily=data.daily||[];render()}catch{render()}}
async function syncNow(showMessage=true){
  const buttons=[...document.querySelectorAll('[data-sync]')],status=$('#syncStatus');buttons.forEach(button=>button.disabled=true);if(showMessage)status.textContent='Checking Duolingo…';
  try{const r=await fetch('/api/sync',{method:'POST'}),result=await r.json();if(!r.ok&&r.status!==429)throw new Error(result.error||'Refresh failed');await loadShared();if(showMessage)status.textContent=r.status===429?'Already up to date.':result.failed?`Updated ${result.updated} of ${members.length} profiles.`:'Stats are up to date!'}catch(error){if(showMessage)status.textContent=error.message}finally{buttons.forEach(button=>button.disabled=false)}
}
document.querySelectorAll('[data-sync]').forEach(button=>button.addEventListener('click',()=>syncNow(true)));
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastRefresh>15*60*1000)syncNow(false)});
setInterval(()=>syncNow(false),15*60*1000);
async function init(){render();await loadShared();await syncNow(false)}
init();
