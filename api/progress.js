import { neon } from '@neondatabase/serverless';
import { timingSafeEqual } from 'node:crypto';

const seed = [
  ['Kelly','Kelly_B_C','K','#7658d5','#eee9fb'],
  ['Amy','Amy Crittenden','A','#23a566','#e2f5ea'],
  ['John Kelly','jklions','JK','#ef8438','#fcebdd'],
  ['Davy','Davy Crittenden','D','#418bc7','#e2f0fa']
];
const connection = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const safePin = input => {
  const a=Buffer.from(String(input||'')), b=Buffer.from(String(process.env.UPDATE_PIN||''));
  return a.length===b.length && a.length>0 && timingSafeEqual(a,b);
};
async function setup(sql){
  await sql`CREATE TABLE IF NOT EXISTS learners (username TEXT PRIMARY KEY, name TEXT NOT NULL, emoji TEXT NOT NULL, accent TEXT NOT NULL, soft TEXT NOT NULL, xp INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0, lessons INTEGER NOT NULL DEFAULT 0, words INTEGER NOT NULL DEFAULT 0, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS progress_history (id BIGSERIAL PRIMARY KEY, username TEXT NOT NULL REFERENCES learners(username), xp INTEGER NOT NULL, streak INTEGER NOT NULL, lessons INTEGER NOT NULL, words INTEGER NOT NULL, total_xp INTEGER NOT NULL DEFAULT 0, recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  for(const [name,username,emoji,accent,soft] of seed) await sql`INSERT INTO learners (name,username,emoji,accent,soft) VALUES (${name},${username},${emoji},${accent},${soft}) ON CONFLICT (username) DO NOTHING`;
}
async function read(sql){
  const members=await sql`SELECT name,username,emoji,accent,soft,xp,streak,lessons,words,updated_at FROM learners ORDER BY name`;
  const history=await sql`SELECT DATE_TRUNC('day',recorded_at) recorded_at,MAX(total_xp) total_xp FROM progress_history GROUP BY 1 ORDER BY 1 DESC LIMIT 42`;
  return {members,history:history.reverse()};
}
export default async function handler(req,res){
  if(!connection)return res.status(503).json({error:'Shared database is being connected. Please try again soon.'});
  try{
    const sql=neon(connection); await setup(sql);
    if(req.method==='GET')return res.status(200).json(await read(sql));
    if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
    if(!safePin(req.body?.pin))return res.status(401).json({error:'That family update PIN is not correct.'});
    const {username,xp,streak,lessons,words}=req.body;
    if(!seed.some(x=>x[1]===username)||[xp,streak,lessons,words].some(v=>!Number.isInteger(v)||v<0))return res.status(400).json({error:'Invalid progress update.'});
    await sql`UPDATE learners SET xp=${xp},streak=${streak},lessons=${lessons},words=${words},updated_at=NOW() WHERE username=${username}`;
    const totals=await sql`SELECT SUM(xp)::INTEGER total_xp FROM learners`;
    await sql`INSERT INTO progress_history (username,xp,streak,lessons,words,total_xp) VALUES (${username},${xp},${streak},${lessons},${words},${totals[0].total_xp})`;
    return res.status(200).json(await read(sql));
  }catch(error){console.error(error);return res.status(500).json({error:'The shared dashboard could not be updated.'});}
}
