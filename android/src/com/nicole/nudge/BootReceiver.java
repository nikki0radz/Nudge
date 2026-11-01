package com.nicole.nudge;
import android.content.*;import org.json.*;
public class BootReceiver extends BroadcastReceiver{public void onReceive(Context context,Intent intent){try{JSONObject data=new JSONObject(context.getSharedPreferences("nudge",0).getString("reminders","{\"tasks\":[]}"));NudgeAlarmReceiver.scheduleAll(context,data);BackupJob.schedule(context);}catch(Exception ignored){}}}
