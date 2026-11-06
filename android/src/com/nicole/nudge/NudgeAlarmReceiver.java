package com.nicole.nudge;
import android.app.*;
import android.content.*;
import android.os.Build;
import org.json.*;
public class NudgeAlarmReceiver extends BroadcastReceiver {
 static PendingIntent alarmIntent(Context c,JSONObject task){Intent i=new Intent(c,NudgeAlarmReceiver.class).setAction("fire").putExtra("id",task.optString("id"));return PendingIntent.getBroadcast(c,task.optString("id").hashCode(),i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
 static void scheduleOne(Context c,JSONObject task){long when=Math.max(task.optLong("next"),System.currentTimeMillis()+5000);AlarmManager alarm=(AlarmManager)c.getSystemService(Context.ALARM_SERVICE);PendingIntent pi=alarmIntent(c,task);if(Build.VERSION.SDK_INT<31||alarm.canScheduleExactAlarms())alarm.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,when,pi);else alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,when,pi);}
 static void scheduleAll(Context c,JSONObject data)throws Exception{
  SharedPreferences prefs=c.getSharedPreferences("nudge",0);JSONObject old=new JSONObject(prefs.getString("reminders","{\"tasks\":[]}"));JSONArray before=old.optJSONArray("tasks"),incoming=data.optJSONArray("tasks"),tasks=new JSONArray(),actions=new JSONArray(prefs.getString("actions","[]"));
  AlarmManager alarms=(AlarmManager)c.getSystemService(Context.ALARM_SERVICE);NotificationManager notifications=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
  if(before!=null)for(int i=0;i<before.length();i++)alarms.cancel(alarmIntent(c,before.getJSONObject(i)));
  if(incoming!=null)for(int i=0;i<incoming.length();i++){
   JSONObject task=incoming.getJSONObject(i);boolean done=task.optBoolean("done")||task.optBoolean("demo");
   for(int j=0;j<actions.length();j++){JSONObject a=actions.getJSONObject(j);if(!task.optString("id").equals(a.optString("id")))continue;if("done".equals(a.optString("type")))done=true;else if(task.optLong("next")==a.optLong("previousNext",-1))task.put("next",a.getLong("next"));}
   if(!done)tasks.put(task);
  }
  if(before!=null)for(int i=0;i<before.length();i++){
   JSONObject previous=before.getJSONObject(i),replacement=null;for(int j=0;j<tasks.length();j++)if(previous.optString("id").equals(tasks.getJSONObject(j).optString("id")))replacement=tasks.getJSONObject(j);
   if(replacement==null||previous.optLong("next")!=replacement.optLong("next")||!previous.optString("title").equals(replacement.optString("title"))||previous.optLong("deadline")!=replacement.optLong("deadline")){notifications.cancel(previous.optString("id").hashCode());ReminderOverlay.hide(previous.optString("id"));}
  }
  data.put("tasks",tasks);if(!prefs.edit().putString("reminders",data.toString()).commit())throw new IllegalStateException("Could not save reminders");
  for(int i=0;i<tasks.length();i++)scheduleOne(c,tasks.getJSONObject(i));
 }
 static long next(JSONObject state,JSONObject task){
  long now=System.currentTimeMillis();JSONObject s=state.optJSONObject("settings");
  long fallback=ReminderSchedule.next(now,task.optLong("deadline"),s==null?"09:00":s.optString("start","09:00"),s==null?"20:00":s.optString("end","20:00"),s==null?"balanced":s.optString("pace","balanced"),task.optString("id"));
  boolean overdue=task.optLong("deadline")>0&&task.optLong("deadline")<=now;
  JSONArray plan=task.optJSONArray("followups");
  for(int i=0;plan!=null&&i<plan.length();i++){long slot=plan.optLong(i);if(slot>now+60000&&(!overdue||slot<=fallback))return slot;}
  if(task.optBoolean("backlog")&&task.optLong("deadline")==0)return now+7L*86400000;
  return fallback;
 }

 static void queue(JSONArray actions,String id,String type,long previous,long next)throws Exception{
  int snoozes=("snooze".equals(type)||"dismiss".equals(type))?1:0;for(int i=actions.length()-1;i>=0;i--)if(id.equals(actions.getJSONObject(i).optString("id"))){snoozes+=actions.getJSONObject(i).optInt("snoozeCount");previous=actions.getJSONObject(i).optLong("previousNext",previous);actions.remove(i);}
  actions.put(new JSONObject().put("id",id).put("type",type).put("snoozeCount",snoozes).put("previousNext",previous).put("next",next));
 }
 @Override public void onReceive(Context c,Intent intent){
  String id=intent.getStringExtra("id"),action=intent.getAction();if(id==null)return;NotificationManager manager=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);SharedPreferences prefs=c.getSharedPreferences("nudge",0);
  try{
   JSONObject state=new JSONObject(prefs.getString("reminders","{\"tasks\":[]}"));JSONArray tasks=state.optJSONArray("tasks"),actions=new JSONArray(prefs.getString("actions","[]"));JSONObject task=null;int index=-1;
   for(int i=0;tasks!=null&&i<tasks.length();i++)if(id.equals(tasks.getJSONObject(i).optString("id"))){task=tasks.getJSONObject(i);index=i;break;}if(task==null)return;
   if(!"fire".equals(action)&&!"snooze".equals(action)&&!"dismiss".equals(action))return;
   long previous=task.optLong("next");if("fire".equals(action)&&previous>System.currentTimeMillis()+5000)return;
   if(!"fire".equals(action))task.put("snoozes",task.optInt("snoozes")+1);
   // Delivery already armed its calendar-aware follow-up. Dismiss keeps that slot.
   long nextTime="dismiss".equals(action)&&previous>System.currentTimeMillis()?previous:"snooze".equals(action)?System.currentTimeMillis()+3600000L:next(state,task);
   task.put("next",nextTime);queue(actions,id,"fire".equals(action)?"reschedule":action,previous,nextTime);
   // Arm the next check-in before posting. Swiping or opening the notification cannot stop it.
   if(!prefs.edit().putString("actions",actions.toString()).putString("reminders",state.toString()).commit())throw new IllegalStateException("Could not save reminder schedule");
   if(!"done".equals(action))scheduleOne(c,task);
   if(!"fire".equals(action)){ReminderOverlay.hide(id);manager.cancel(id.hashCode());return;}
   manager.createNotificationChannel(new NotificationChannel("nudges","Gentle nudges",NotificationManager.IMPORTANCE_DEFAULT));
   PendingIntent open=PendingIntent.getActivity(c,id.hashCode(),new Intent(c,MainActivity.class),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
   Intent done=new Intent(c,NudgeAlarmReceiver.class).setAction("done").putExtra("id",id),snooze=new Intent(c,NudgeAlarmReceiver.class).setAction("snooze").putExtra("id",id);
   boolean overdue=task.optLong("deadline")>0&&task.optLong("deadline")<=System.currentTimeMillis();
   Notification notification=new Notification.Builder(c,"nudges").setSmallIcon(R.drawable.ic_nudge).setContentTitle(overdue?"Still on your list":"A little nudge").setContentText(task.optString("title")).setStyle(new Notification.BigTextStyle().bigText(task.optString("title"))).setContentIntent(open).setAutoCancel(true)
    .addAction(new Notification.Action.Builder(null,"Remind me in 1 hour",PendingIntent.getBroadcast(c,(id+"snooze").hashCode(),snooze,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE)).build())
    .addAction(new Notification.Action.Builder(null,"Pick a custom time",PendingIntent.getActivity(c,(id+"custom").hashCode(),new Intent(c,MainActivity.class).putExtra("customTaskId",id),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE)).build()).build();
   try{manager.notify(id.hashCode(),notification);}catch(SecurityException denied){android.util.Log.w("Nudge","Notification permission unavailable");}
   ReminderOverlay.show(c,task,previous);
  }catch(Exception e){android.util.Log.e("Nudge","Reminder delivery failed",e);}
 }
}
