package com.nicole.nudge;
import java.util.Calendar;
/** An elapsed deadline never expires an unfinished reminder. */
final class ReminderSchedule {
 static long next(long now,long deadline,String start,String end,String pace){
  return next(now,deadline,start,end,pace,"");
 }
 static long next(long now,long deadline,String start,String end,String pace,String taskId){
  boolean overdue=deadline>0&&deadline<=now;
  long candidate=now+(overdue?2L:"gentle".equals(pace)?36L:18L)*3600000L;
  Calendar cal=Calendar.getInstance();cal.setTimeInMillis(candidate);
  String[] first=start.split(":"),last=end.split(":");int sh=Integer.parseInt(first[0]),sm=Integer.parseInt(first[1]),eh=Integer.parseInt(last[0]),em=Integer.parseInt(last[1]);
  int minutes=cal.get(Calendar.HOUR_OF_DAY)*60+cal.get(Calendar.MINUTE);
  if(minutes>=eh*60+em)cal.add(Calendar.DAY_OF_MONTH,1);
  if(minutes<sh*60+sm||minutes>=eh*60+em){
   cal.set(Calendar.HOUR_OF_DAY,sh);cal.set(Calendar.MINUTE,sm);cal.set(Calendar.SECOND,0);cal.set(Calendar.MILLISECOND,0);
   int spread=Math.max(1,Math.min(overdue?30:180,eh*60+em-sh*60-sm));
   cal.add(Calendar.MINUTE,Math.floorMod((taskId+cal.get(Calendar.YEAR)+":"+cal.get(Calendar.DAY_OF_YEAR)).hashCode(),spread));
  }
  candidate=cal.getTimeInMillis();
  if(deadline>now)candidate=Math.min(candidate,now+Math.max(1L,(deadline-now)/2));
  return candidate;
 }
}
