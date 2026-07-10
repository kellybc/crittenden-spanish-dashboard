const starter = [
  {name:'Kelly', username:'Kelly_B_C', emoji:'K', xp:0, streak:0, lessons:0, words:0, accent:'#7658d5', soft:'#eee9fb'},
  {name:'Amy', username:'Amy Crittenden', emoji:'A', xp:0, streak:0, lessons:0, words:0, accent:'#23a566', soft:'#e2f5ea'},
  {name:'John Kelly', username:'jklions', emoji:'JK', xp:0, streak:0, lessons:0, words:0, accent:'#ef8438', soft:'#fcebdd'},
  {name:'Davy', username:'Davy Crittenden', emoji:'D', xp:0, streak:0, lessons:0, words:0, accent:'#418bc7', soft:'#e2f0fa'}
];
let members = JSON.parse(localStorage.getItem('vamos-family-data') || 'null') || starter;
const $ = s => document.querySelector(s);
const fmt = n => Number(n).toLocaleString();

function render(){
  const ranked=[...members].sort((a,b)=>b.xp-a.xp);
  $('#memberGrid').innerHTML=ranked.map((m,i)=>`<article class="member-card" style="--accent:${m.accent};--soft:${m.soft}"><div class="card-top"><div class="avatar">${m.emoji}</div><span class="rank">#${i+1}</span></div><h3>${m.name}</h3><span class="username">@${m.username || m.name}</span><span class="level">Spanish learner · ${m.streak ? 'On a roll' : 'Getting started'}</span><div class="member-stats"><div><strong>${fmt(m.xp)}</strong><small>Total XP</small></div><div><strong>🔥 ${m.streak}</strong><small>Day streak</small></div><div><strong>${m.lessons}</strong><small>Lessons</small></div><div><strong>${m.words}</strong><small>Words</small></div></div></article>`).join('');
  $('#leaderboard').innerHTML=ranked.map((m,i)=>`<div class="leader-row"><span>${['🥇','🥈','🥉','4'][i]||i+1}</span><div class="mini-person"><span class="mini-avatar" style="background:${m.soft};color:${m.accent}">${m.emoji}</span><div><strong>${m.name}</strong><br><small>${m.streak} day streak</small></div></div><strong>${fmt(m.xp)} XP</strong></div>`).join('');
  const sums=k=>members.reduce((t,m)=>t+Number(m[k]),0), xp=sums('xp'), lessons=sums('lessons'), words=sums('words'), streak=Math.max(...members.map(m=>m.streak));
  $('#totalXp').textContent=fmt(xp); $('#heroXp').textContent=fmt(xp); $('#activeStreak').textContent=`${streak} days`; $('#heroStreak').textContent=streak; $('#totalLessons').textContent=fmt(lessons); $('#wordsLearned').textContent=fmt(words);
  $('#goalLessons').textContent=`${lessons} / 200`; $('#lessonProgress').style.width=`${Math.min(100,lessons/2)}%`; $('#goalWords').textContent=`${words} / 600`; $('#wordProgress').style.width=`${Math.min(100,words/6)}%`;
  $('#memberSelect').innerHTML=members.map((m,i)=>`<option value="${i}">${m.name}</option>`).join('');
  $('#lastUpdated').textContent=localStorage.getItem('vamos-last-update') || 'today';
}
function chart(){const vals=[520,760,690,930,1040,1170];$('#chart').innerHTML=vals.map(v=>`<i class="bar" style="height:${v/12}%" data-value="${fmt(v)} XP"></i>`).join('')}
function fillForm(){const m=members[Number($('#memberSelect').value)];['xp','streak','lessons','words'].forEach(k=>$(`#${k}Input`).value=m[k])}
function openDialog(){fillForm();$('#entryDialog').showModal()}
$('#openEntry').onclick=openDialog; $('#openEntryHero').onclick=openDialog; $('#memberSelect').onchange=fillForm;
$('#entryForm').addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return; e.preventDefault();const i=Number($('#memberSelect').value);['xp','streak','lessons','words'].forEach(k=>members[i][k]=Number($(`#${k}Input`).value));localStorage.setItem('vamos-family-data',JSON.stringify(members));localStorage.setItem('vamos-last-update',new Date().toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}));render();$('#entryDialog').close()});
render();chart();
