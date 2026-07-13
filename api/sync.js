import { neon } from '@neondatabase/serverless';
import { timingSafeEqual } from 'node:crypto';

const profiles=[
  {name:'Kelly',username:'Kelly_B_C',emoji:'K',accent:'#7658d5',soft:'#eee9fb'},
  {name:'Amy',username:'AmyCritten3',emoji:'A',accent:'#23a566',soft:'#e2f5ea'},
  {name:'John Kelly',username:'jklions',emoji:'JK',accent:'#ef8438',soft:'#fcebdd'},
  {name:'Davy',username:'Hollandlopguy',emoji:'D',accent:'#418bc7',soft:'#e2f0fa'}
];
const connection=process.env.DATABASE_URL||process.env.POSTGRES_URL;
const equal=(value,secret)=>{const a=Buffer.from(String(value||'')),b=Buffer.from(String(secret||''));return a.length===b.length&&a.length>0&&timingSafeEqual(a,b)};

async function setup(sql){
  await sql`CREATE TABLE IF NOT EXISTS learners (username TEXT PRIMARY KEY, name TEXT NOT NULL, emoji TEXT NOT NULL, accent TEXT NOT NULL, soft TEXT NOT NULL, xp INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0, lessons INTEGER NOT NULL DEFAULT 0, words INTEGER NOT NULL DEFAULT 0, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS progress_history (id BIGSERIAL PRIMARY KEY, username TEXT NOT NULL REFERENCES learners(username), xp INTEGER NOT NULL, streak INTEGER NOT NULL, lessons INTEGER NOT NULL, words INTEGER NOT NULL, total_xp INTEGER NOT NULL DEFAULT 0, recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS profile_snapshots (id BIGSERIAL PRIMARY KEY, username TEXT NOT NULL REFERENCES learners(username), xp INTEGER NOT NULL, streak INTEGER NOT NULL, captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS sync_state (id SMALLINT PRIMARY KEY CHECK (id=1), last_started_at TIMESTAMPTZ, last_completed_at TIMESTAMPTZ)`;
  await sql`INSERT INTO sync_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;
  for(const p of profiles)await sql`INSERT INTO learners (name,username,emoji,accent,soft) VALUES (${p.name},${p.username},${p.emoji},${p.accent},${p.soft}) ON CONFLICT (username) DO NOTHING`;
}

async function getProfile(profile){
  const url=`https://www.duolingo.com/2017-06-30/users?username=${encodeURIComponent(profile.username)}`;
  const response=await fetch(url,{headers:{'user-agent':'CrittendenFamilyDashboard/1.0'},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error(`Duolingo returned ${response.status} for ${profile.name}`);
  const user=(await response.json()).users?.[0];
  const spanish=user?.courses?.find(course=>course.learningLanguage==='es');
  if(!user||!spanish)throw new Error(`Spanish profile not found for ${profile.name}`);
  return {...profile,xp:Number(spanish.xp||0),streak:Number(user.streak||0)};
}

export default async function handler(req,res){
  if(!connection)return res.status(503).json({error:'Database unavailable'});
  if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed'});
  const cron=req.method==='GET'&&equal(req.headers.authorization?.replace(/^Bearer\s+/i,''),process.env.CRON_SECRET);
  if(req.method==='GET'&&!cron)return res.status(401).json({error:'Unauthorized'});
  const sql=neon(connection);
  try{
    await setup(sql);
    await sql`DELETE FROM learners WHERE username='AmyCritten3' AND EXISTS (SELECT 1 FROM learners WHERE username='Amy Crittenden')`;
    await sql`DELETE FROM learners WHERE username='Hollandlopguy' AND EXISTS (SELECT 1 FROM learners WHERE username='Davy Crittenden')`;
    await sql`UPDATE learners SET username='AmyCritten3' WHERE username='Amy Crittenden'`;
    await sql`UPDATE learners SET username='Hollandlopguy' WHERE username='Davy Crittenden'`;
    const lease=await sql`UPDATE sync_state SET last_started_at=NOW() WHERE id=1 AND (last_started_at IS NULL OR last_started_at<NOW()-INTERVAL '5 minutes') RETURNING last_started_at`;
    if(!lease.length){
      const state=await sql`SELECT last_completed_at FROM sync_state WHERE id=1`;
      if(cron)return res.status(200).json({ok:true,skipped:true,syncedAt:state[0]?.last_completed_at||null});
      res.setHeader('Retry-After','300');
      return res.status(429).json({error:'The dashboard was refreshed recently.',syncedAt:state[0]?.last_completed_at||null});
    }
    const settled=await Promise.allSettled(profiles.map(getProfile));
    const results=settled.filter(result=>result.status==='fulfilled').map(result=>result.value);
    if(!results.length)throw new Error('No Duolingo profiles could be refreshed');
    for(const p of results)await sql`UPDATE learners SET xp=${p.xp},streak=${p.streak},updated_at=NOW() WHERE username=${p.username}`;
    for(const p of results)await sql`INSERT INTO profile_snapshots (username,xp,streak) VALUES (${p.username},${p.xp},${p.streak})`;
    const totals=await sql`SELECT COALESCE(SUM(xp),0)::INTEGER total_xp FROM learners`;
    const first=results[0];
    await sql`INSERT INTO progress_history (username,xp,streak,lessons,words,total_xp) VALUES (${first.username},${first.xp},${first.streak},0,0,${totals[0].total_xp})`;
    const completed=await sql`UPDATE sync_state SET last_completed_at=NOW() WHERE id=1 RETURNING last_completed_at`;
    const failed=settled.length-results.length;
    return res.status(200).json({ok:true,syncedAt:completed[0].last_completed_at,updated:results.length,failed});
  }catch(error){
    console.error(error);
    return res.status(502).json({error:'Duolingo could not be reached. The last saved stats are still displayed.'});
  }
}
