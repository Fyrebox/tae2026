import express from 'express';
import crypto from 'node:crypto';
import { DELIVERY_DATES } from './schedule-data.js';
import { SUPERVISION, groupDayFields, inheritSupervision, ensureGroupDays, auditGroupDay } from './schedule-supervision.js';

const studentFields = 'id, name, group_number AS "group", unit, notes, version';
const presentationFields = `id, student_id AS "studentId", day::text AS date,
  to_char(start_time,'HH24:MI') AS "startTime", to_char(end_time,'HH24:MI') AS "endTime", version`;
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
        const groupDays=await query(`SELECT ${groupDayFields} FROM schedule.group_days ORDER BY day,group_number`);
        return {students:students.rows,presentations:inheritSupervision(presentations.rows,students.rows,groupDays.rows),groupDays:groupDays.rows};
      });
      res.json({...data,dates:[...new Set([...DELIVERY_DATES,...data.presentations.map(p=>p.date),...data.groupDays.map(d=>d.date)])].sort(),timezone:'Australia/Melbourne',admin:req.scheduleAdmin});
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
  function validateDay(date) {
    const parsed=typeof date==='string'?new Date(date+'T12:00:00Z'):new Date(NaN);
    if(typeof date!=='string'||!/^2026-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)throw fail(400,'Choose a valid date in 2026.');
  }
  function validatePresentation(body) {
    if(body?.supervision!==undefined)throw fail(400,'Labels are now set for the whole group and day. Refresh the page to edit them.');
    validateDay(body?.date);
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
  async function withLabel(query,presentation) {
    const label=await query(`SELECT d.supervision FROM schedule.group_days d JOIN schedule.students s ON s.group_number=d.group_number
      WHERE s.id=$1 AND d.day=$2`,[presentation.studentId,presentation.date]);
    return {...presentation,supervision:label.rows[0]?.supervision||'recorded'};
  }
  router.patch('/group-days/:date/:group',requireAdmin,async(req,res,next)=>{
    try{
      validateDay(req.params.date);
      if(!/^[1-3]$/.test(req.params.group)||!SUPERVISION.includes(req.body?.supervision)||!Number.isInteger(req.body?.version))throw fail(400,'Choose a group and Matt, David or Recorded.');
      const group=Number(req.params.group),date=req.params.date;
      const result=await store.transaction(async query=>{
        const days=(await query(`SELECT ${groupDayFields} FROM schedule.group_days WHERE day=$1 ORDER BY group_number`,[date])).rows;
        const before=days.find(d=>d.group===group);
        if(!before)throw fail(404,'This group delivery day was not found. Refresh the page.');
        if(before.version!==req.body.version)throw fail(409,'This group day changed elsewhere. Close and reopen its label before saving.');
        const other=req.body.supervision==='recorded'?null:days.find(d=>d.group!==group&&d.supervision===req.body.supervision);
        if(other&&!req.body.swapWith)throw fail(409,'That instructor is assigned to another group that day. Swap the group labels?',{code:'group-supervision-swap',swapTarget:other});
        if(req.body.swapWith&&(!other||other.group!==req.body.swapWith.group||other.version!==req.body.swapWith.version))throw fail(409,'The other group day changed elsewhere. Close and reopen the label before saving.');
        if(before.supervision===req.body.supervision)return {groupDays:[before]};
        const planned=[{...before,supervision:req.body.supervision},...(other?[{...other,supervision:before.supervision}]:[])];
        // Clear both instructors inside the transaction before exchanging unique labels.
        await query("UPDATE schedule.group_days SET supervision='recorded' WHERE day=$1 AND group_number=ANY($2::int[])",[date,planned.map(d=>d.group)]);
        const saved=(await query(`UPDATE schedule.group_days d SET supervision=x.label,version=d.version+1
          FROM unnest($1::int[],$2::text[]) AS x(group_id,label) WHERE d.day=$3 AND d.group_number=x.group_id
          RETURNING ${groupDayFields}`,[planned.map(d=>d.group),planned.map(d=>d.supervision),date])).rows;
        for(const day of saved)await auditGroupDay(query,other?'group supervision swapped':'group supervision updated',days.find(d=>d.group===day.group),day);
        return {groupDays:saved};
      });res.json(result);
    }catch(err){next(err);}
  });
  router.post('/presentations',requireAdmin,async(req,res,next)=>{
    try{
      const data=validatePresentation(req.body);
      const result=await store.transaction(async query=>{
        const student=await query('SELECT id FROM schedule.students WHERE id=$1',[req.body.studentId]);
        if(!student.rowCount)throw fail(404,'Student not found.');
        await checkCapacity(query,data.date,req.body.studentId);
        await checkOverlap(query,data,req.body.studentId,null,req.body.allowOverlap);
        await ensureGroupDays(query,data.date);
        const inserted=await query(`INSERT INTO schedule.presentations(id,student_id,day,start_time,end_time) VALUES($1,$2,$3,$4,$5) RETURNING ${presentationFields}`,[crypto.randomUUID(),req.body.studentId,data.date,data.startTime,data.endTime]);
        const saved=await withLabel(query,inserted.rows[0]);
        await audit(query,'presentation added',req.body.studentId,null,saved); return saved;
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
        const previous=await withLabel(query,old.rows[0]);
        await ensureGroupDays(query,data.date);
        const updated=await query(`UPDATE schedule.presentations SET day=$1,start_time=$2,end_time=$3,version=version+1 WHERE id=$4 RETURNING ${presentationFields}`,[data.date,data.startTime,data.endTime,req.params.id]);
        const saved=await withLabel(query,updated.rows[0]);
        await audit(query,'presentation updated',previous.studentId,previous,saved);return saved;
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
        await audit(query,'presentation removed',old.rows[0].studentId,await withLabel(query,old.rows[0]),null);
      });res.json({ok:true});
    }catch(err){next(err);}
  });
  router.get('/admin/history',requireAdmin,async(req,res,next)=>{
    try{const result=await store.query(`SELECT c.id,c.created_at AS "createdAt",c.action,COALESCE(s.name,'Group '||c.group_number) AS name,c.group_number AS "group",c.before_data AS before,c.after_data AS after FROM schedule.changes c LEFT JOIN schedule.students s ON s.id=c.student_id ORDER BY c.id DESC LIMIT 30`);res.json(result.rows);}catch(err){next(err);}
  });
  router.use((err,req,res,next)=>{
    const status=err.code==='23505'?409:(err.status||500);
    if(status===500)console.error('Schedule request failed:',err.code||err.name);
    res.status(status).json({error:err.code==='23505'?(err.constraint==='one_instructor_per_day'?'This instructor is already assigned to a group that day. Refresh the page.':'This student already has a presentation on that date.'):status===500?'The schedule could not be saved. Please try again.':err.message,...(['overlap','group-supervision-swap'].includes(err.code)?{code:err.code,...(err.conflicts?{conflicts:err.conflicts}:{}),...(err.swapTarget?{swapTarget:err.swapTarget}:{})}:{})});
  });
  return router;
}
