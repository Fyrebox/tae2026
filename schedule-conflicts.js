// Only shared-room clashes count: compare actual intervals within one group/day.
// Adjacent sessions and simultaneous presentations in other groups are allowed.
export function scheduleConflicts(presentations,students) {
  const people=new Map(students.map(s=>[s.id,s]));
  const days=new Map();
  for(const p of presentations){
    const student=people.get(p.studentId);
    if(!student||!p.startTime||!p.endTime||p.startTime>=p.endTime)continue;
    const key=student.group+':'+p.date;
    if(!days.has(key))days.set(key,[]);
    days.get(key).push({...p,name:student.name,group:student.group});
  }
  const conflicts=[];
  for(const day of days.values()){
    day.sort((a,b)=>a.startTime.localeCompare(b.startTime)||a.id.localeCompare(b.id));
    for(let i=0;i<day.length;i++)for(let j=i+1;j<day.length;j++){
      const a=day[i],b=day[j];
      if(b.startTime>=a.endTime)break;
      if(a.startTime>=b.endTime)continue;
      const pair=[a,b].sort((x,y)=>x.id.localeCompare(y.id));
      conflicts.push({group:a.group,date:a.date,presentationIds:pair.map(p=>p.id),
        startTime:a.startTime>b.startTime?a.startTime:b.startTime,endTime:a.endTime<b.endTime?a.endTime:b.endTime,
        presentations:pair.map(({id,studentId,name,startTime,endTime})=>({id,studentId,name,startTime,endTime}))});
    }
  }
  return conflicts.sort((a,b)=>a.group-b.group||a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime)||a.presentationIds.join(':').localeCompare(b.presentationIds.join(':')));
}
