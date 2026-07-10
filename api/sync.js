import { neon } from '@neondatabase/serverless';
import { timingSafeEqual } from 'node:crypto';

const profiles=[
  {name:'Kelly',username:'Kelly_B_C'},
  {name:'Amy',username:'AmyCritten3'},
  {name:'John Kelly',username:'jklions'},
  {name:'Davy',username:'Hollandlopguy'}
];
const connection=process.env.DATABASE_URL||process.env.POSTGRES_URL;
const equal=(value,secret)=>{const a=Buffer.from(String(value||'')),b=Buffer.from(String(secret||''));return a.length===b.length&&a.length>0&&timingSafeEqual(a,b)};

async function getProfile(profile){
  const url=`https://www.duolingo.com/2017-06-30/users?username=${encodeURIComponent(profile.username)}`;
  const response=await fetch(url,{headers:{'user-agent':'CrittendenFamilyDashboard/1.0'}});
  if(!response.ok)throw new Error(`Duolingo returned ${response.status} for ${profile.name}`);
  const user=(await response.json()).users?.[0];
  const spanish=user?.courses?.find(course=>course.learningLanguage==='es');
  if(!user||!spanish)throw new Error(`Spanish profile not found for ${profile.name}`);
  return {...profile,xp:Number(spanish.xp||0),streak:Number(user.streak||0)};
}

export default async function handler(req,res){
  if(!connection)return res.status(503).json({error:'Database unavailable'});
  const cron=req.headers.authorization===`Bearer ${process.env.CRON_SECRET}`;
  const family=req.method==='POST'&&equal(req.body?.pin,process.env.UPDATE_PIN);
  if(!cron&&!family)return res.status(401).json({error:'Unauthorized'});
  try{
    const results=await Promise.all(profiles.map(getProfile));
    const sql=neon(connection);
    await sql`UPDATE learners SET username='AmyCritten3' WHERE username='Amy Crittenden'`;
    await sql`UPDATE learners SET username='Hollandlopguy' WHERE username='Davy Crittenden'`;
    for(const p of results)await sql`UPDATE learners SET xp=${p.xp},streak=${p.streak},updated_at=NOW() WHERE username=${p.username}`;
    const total=results.reduce((sum,p)=>sum+p.xp,0),kelly=results[0];
    await sql`INSERT INTO progress_history (username,xp,streak,lessons,words,total_xp) VALUES (${kelly.username},${kelly.xp},${kelly.streak},0,0,${total})`;
    return res.status(200).json({ok:true,syncedAt:new Date().toISOString(),profiles:results});
  }catch(error){console.error(error);return res.status(502).json({error:'Duolingo sync failed. Manual updates are still available.'});}
}
