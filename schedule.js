import express from 'express';
import crypto from 'node:crypto';
import { DELIVERY_DATES } from './schedule-data.js';
import { SUPERVISION, instructorConflicts, supervisionIssues } from './schedule-supervision.js';

const studentFields = 'id, name, group_number AS "group", unit, notes, version';
const presentationFields = `id, student_id AS "studentId", day::text AS date,
  to_char(start_time,'HH24:MI') AS "startTime", to_char(end_time,'HH24:MI') AS "endTime", supervision, version`;
const fail = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });
const digest = s => crypto.createHash('sha256').update(s).digest();

export function createScheduleRouter(store, { pin = process.env.SCHEDULE_ADMIN_PIN, secure = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT_NAME === 'production', now = Date.now } = {}) {
  const router = express.Router();
  const sessions = new Map(), attempts = new Map(), writes = new Map();
  router.use(express.json({ limit: '4kb' }));
  router.use((req,res,next) => {
    res.set('Cache-Control','no-store');
    if (req.method !== 'GET' && req.headers.origin && req.headers.origin !== `${req.protocol}://${req.get('host')}`) {
      // Railway terminates HTTPS before Express.
      if (req.headers.origin !== `https://${req.get('host')}`) return res.status(403).json({ error: 'Please edit from this website.' });
    }
    const cookie = req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('schedule_admin='))?.slice(15);
    const expires = cookie && sessions.get(cookie);
    req.scheduleAdmin = !!expires && expires > now();
    req.scheduleToken = cookie;
    if (expires && !req.scheduleAdmin) sessions.delete(cookie);
    next();
  });
  const requireAdmin = (req,res,next) => req.scheduleAdmin ? next() : res.status(401).json({error:'Enter the organiser PIN to edit the schedule.'});
  function limit(map, req, max, interval) {
    const key = req.get('cf-connecting-ip') || req.ip;
    const current = now();
    if (map.size > 5000) for (const [k,v] of map) if (v.until <= current) map.delete(k);
    const state = map.get(key) || { count: 0, until: current + interval };
    if (state.until <= current) { state.count = 0; state.until = current + interval; }
    state.count++; map.set(key,state);
    if (state.count > max) throw fail(429,'Too many attempts. Please try again later.');
  }
  router.get('/', async (req,res,next) => {
    try {
      // One snapshot prevents mismatched students/presentations during edits.
      const data = await store.transaction(async query => {
        const students = await query(`SELECT ${studentFields} FROM schedule.students ORDER BY display_order`);
        const presentations = await query(`SELECT ${presentationFields} FROM schedule.presentations ORDER BY day,start_time NULLS LAST,id`);
        return {students:students.rows,presentations:presentations.rows};
      });
      res.json({...data,supervisionIssues:supervisionIssues(data.presentations,data.students),dates:[...new Set([...DELIVERY_DATES,...data.presentations.map(p=>p.date)])].sort(),timezone:'Australia/Melbourne',admin:req.scheduleAdmin});
    } catch(err) { next(err); }
  });
  router.post('/admin/login', (req,res,next) => {
    try {
      limit(attempts,req,8,15*60*1000);
      if (!pin) throw fail(503,'Schedule editing is not configured yet.');
      const supplied = typeof req.body?.pin === 'string' ? req.body.pin : '';
      if (!crypto.timingSafeEqual(digest(supplied),digest(pin))) throw fail(401,'Incorrect PIN. Please try again.');
      for (const [key,expiry] of sessions) if (expiry <= now()) sessions.delete(key);
      const token=crypto.randomBytes(32).toString('hex');
      sessions.set(token,now()+8*60*60*1000);
      res.cookie('schedule_admin',token,{httpOnly:true,sameSite:'strict',secure,path:'/api/schedule',maxAge:8*60*60*1000});
      res.json({ok:true});
    } catch(err) { next(err); }
  });
  router.post('/admin/logout', (req,res) => {
    sessions.delete(req.scheduleToken);
    res.clearCookie('schedule_admin',{httpOnly:true,sameSite:'strict',secure,path:'/api/schedule'});
    res.json({ok:true});
  });
  const audit = (query,action,studentId,before,after) => query('INSERT INTO schedule.changes(action,student_id,before_data,after_data) VALUES($1,$2,$3,$4)',[action,studentId,JSON.stringify(before),JSON.stringify(after)]);
  router.patch('/students/:id', async(req,res,next) => {
    try {
      limit(writes,req,60,10*60*1000);
      if(typeof req.body?.unit!=='string'||req.body.unit.trim().length>160||!Number.isInteger(req.body.version)) throw fail(400,'Enter a unit name of up to 160 characters.');
      const result=await store.transaction(async query=>{
        const old=await query(`SELECT ${studentFields} FROM schedule.students WHERE id=$1`,[req.params.id]);
        if(!old.rowCount) throw fail(404,'Student not found.');
        if(old.rows[0].version!==req.body.version) throw fail(409,'This student was updated elsewhere. Close and reopen their details before saving.');
        const updated=await query(`UPDATE schedule.students SET unit=$1,version=version+1 WHERE id=$2 RETURNING ${studentFields}`,[req.body.unit.trim(),req.params.id]);
        await audit(query,'unit updated',req.params.id,old.rows[0],updated.rows[0]); return updated.rows[0];
      }); res.json(result);
    } catch(err){next(err);}
  });
  function validatePresentation(body) {
    if(body?.supervision!==undefined&&body.supervision!==null&&!SUPERVISION.includes(body.supervision))throw fail(400,'Choose Matt, David or Recorded.');
    const parsed = typeof body?.date === 'string' ? new Date(body.date+'T12:00:00Z') : new Date(NaN);
    if(typeof body?.date!=='string'||!/^2026-\d{2}-\d{2}$/.test(body.date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==body.date) throw fail(400,'Choose a valid date in 2026.');
    const start=body.startTime||null,end=body.endTime||null;
    const time=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
    if(typeof start!=='string'||typeof end!=='string'||!time.test(start)||!time.test(end)) throw fail(400,'Enter a start and finish time for the 30-minute presentation.');
    const minutes = value => Number(value.slice(0,2))*60+Number(value.slice(3));
    if(start<'09:00'||end>'13:00'||minutes(end)-minutes(start)!==30) throw fail(400,'Presentations must be 30 minutes, between 9 am and 1 pm.');
    return {date:body.date,startTime:start,endTime:end};
  }
  async function checkCapacity(query,date,studentId,id='') {
    const result=await query(`SELECT count(*)::int AS count FROM schedule.presentations p
      JOIN schedule.students s ON s.id=p.student_id
      WHERE s.group_number=(SELECT group_number FROM schedule.students WHERE id=$1)
      AND p.day=$2 AND p.id<>$3`,[studentId,date,id]);
    if(result.rows[0].count>=6)throw fail(409,'This group already has six presentations on that date. Choose another delivery date.');
  }
  async function checkOverlap(query,data,studentId,id,allow) {
    if(!data.startTime||allow===true)return;
    const conflicts=await query(`SELECT s.name,to_char(p.start_time,'HH24:MI') AS start,to_char(p.end_time,'HH24:MI') AS finish
      FROM schedule.presentations p JOIN schedule.students s ON s.id=p.student_id
      WHERE s.group_number=(SELECT group_number FROM schedule.students WHERE id=$1)
      AND p.day=$2 AND p.id<>$3 AND p.start_time<($5::time+interval '10 minutes') AND p.end_time>($4::time-interval '10 minutes')`,[studentId,data.date,id||'',data.startTime,data.endTime]);
    if(conflicts.rowCount)throw fail(409,'This time overlaps another presentation or leaves less than a 10-minute break in the group.',{code:'overlap',conflicts:conflicts.rows});
  }
  async function checkInstructor(query,changes,allow) {
    if(allow===true)return;
    const current=(await query(`SELECT ${presentationFields} FROM schedule.presentations`)).rows;
    const key=c=>c.supervision+':'+c.presentationIds.join(':');
    const existing=new Set(instructorConflicts(current).map(key));
    const replacements=new Map(changes.map(p=>[p.id,p]));
    const planned=current.filter(p=>!replacements.has(p.id)).concat(changes);
    const conflicts=instructorConflicts(planned).filter(c=>c.presentationIds.some(id=>replacements.has(id))&&!existing.has(key(c)));
    if(conflicts.length)throw fail(409,'Matt or David is already assisting another presentation at this time.',{code:'instructor-conflict',conflicts});
  }
  router.post('/presentations',requireAdmin,async(req,res,next)=>{
    try{
      const data=validatePresentation(req.body);
      const result=await store.transaction(async query=>{
        const student=await query('SELECT id FROM schedule.students WHERE id=$1',[req.body.studentId]);
        if(!student.rowCount)throw fail(404,'Student not found.');
        await checkCapacity(query,data.date,req.body.studentId);
        await checkOverlap(query,data,req.body.studentId,null,req.body.allowOverlap);
        const id=crypto.randomUUID(),supervision=req.body.supervision??null;
        await checkInstructor(query,[{...data,id,studentId:req.body.studentId,supervision}],req.body.allowInstructorConflict);
        const inserted=await query(`INSERT INTO schedule.presentations(id,student_id,day,start_time,end_time,supervision) VALUES($1,$2,$3,$4,$5,$6) RETURNING ${presentationFields}`,[id,req.body.studentId,data.date,data.startTime,data.endTime,supervision]);
        await audit(query,'presentation added',req.body.studentId,null,inserted.rows[0]); return inserted.rows[0];
      });res.status(201).json(result);
    }catch(err){next(err);}
  });
  router.patch('/presentations/:id',requireAdmin,async(req,res,next)=>{
    try{
      const data=validatePresentation(req.body);
      const result=await store.transaction(async query=>{
        const old=await query(`SELECT ${presentationFields} FROM schedule.presentations WHERE id=$1`,[req.params.id]);
        if(!old.rowCount)throw fail(404,'Presentation not found.');
        if(old.rows[0].version!==req.body.version)throw fail(409,'This presentation changed elsewhere. Close and reopen the student details.');
        await checkCapacity(query,data.date,old.rows[0].studentId,req.params.id);
        await checkOverlap(query,data,old.rows[0].studentId,req.params.id,req.body.allowOverlap);
        const previous=old.rows[0],supervision=req.body.supervision===undefined?previous.supervision:req.body.supervision;
        let swap;
        if(supervision&&supervision!==previous.supervision){
          const matches=await query(`SELECT ${presentationFields} FROM schedule.presentations WHERE student_id=$1 AND supervision=$2 AND id<>$3 ORDER BY day,id`,[previous.studentId,supervision,previous.id]);
          if(matches.rowCount){
            swap=matches.rows.find(p=>p.id===req.body.swapWith?.id)||matches.rows[0];
            if(!req.body.swapWith)throw fail(409,'This student already has that label. Swap the two presentation labels?',{code:'supervision-swap',swapTarget:swap});
            if(swap.id!==req.body.swapWith.id||swap.version!==req.body.swapWith.version)throw fail(409,'The other presentation changed elsewhere. Close and reopen the student details.');
          }else if(req.body.swapWith)throw fail(409,'The other presentation changed elsewhere. Close and reopen the student details.');
        }
        const changes=[{...previous,...data,supervision},...(swap?[{...swap,supervision:previous.supervision}]:[])];
        await checkInstructor(query,changes,req.body.allowInstructorConflict);
        if(swap){
          const swapped=await query(`UPDATE schedule.presentations SET supervision=$1,version=version+1 WHERE id=$2 RETURNING ${presentationFields}`,[previous.supervision,swap.id]);
          await audit(query,'supervision swapped',swap.studentId,swap,swapped.rows[0]);
        }
        const updated=await query(`UPDATE schedule.presentations SET day=$1,start_time=$2,end_time=$3,supervision=$4,version=version+1 WHERE id=$5 RETURNING ${presentationFields}`,[data.date,data.startTime,data.endTime,supervision,req.params.id]);
        await audit(query,'presentation updated',old.rows[0].studentId,old.rows[0],updated.rows[0]);return updated.rows[0];
      });res.json(result);
    }catch(err){next(err);}
  });
  router.delete('/presentations/:id',requireAdmin,async(req,res,next)=>{
    try{
      await store.transaction(async query=>{
        const old=await query(`SELECT ${presentationFields} FROM schedule.presentations WHERE id=$1`,[req.params.id]);
        if(!old.rowCount)throw fail(404,'Presentation not found.');
        if(old.rows[0].version!==req.body?.version)throw fail(409,'This presentation changed elsewhere. Close and reopen the student details.');
        await query('DELETE FROM schedule.presentations WHERE id=$1',[req.params.id]);
        await audit(query,'presentation removed',old.rows[0].studentId,old.rows[0],null);
      });res.json({ok:true});
    }catch(err){next(err);}
  });
  router.get('/admin/history',requireAdmin,async(req,res,next)=>{
    try{const result=await store.query(`SELECT c.id,c.created_at AS "createdAt",c.action,s.name,c.before_data AS before,c.after_data AS after FROM schedule.changes c JOIN schedule.students s ON s.id=c.student_id ORDER BY c.id DESC LIMIT 30`);res.json(result.rows);}catch(err){next(err);}
  });
  router.use((err,req,res,next)=>{
    const status=err.code==='23505'?409:(err.status||500);
    if(status===500)console.error('Schedule request failed:',err.code||err.name);
    res.status(status).json({error:err.code==='23505'?'This student already has a presentation on that date.':status===500?'The schedule could not be saved. Please try again.':err.message,...(['overlap','instructor-conflict','supervision-swap'].includes(err.code)?{code:err.code,...(err.conflicts?{conflicts:err.conflicts}:{}),...(err.swapTarget?{swapTarget:err.swapTarget}:{})}:{})});
  });
  return router;
}
