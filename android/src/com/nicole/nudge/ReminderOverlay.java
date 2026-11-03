package com.nicole.nudge;

import android.app.KeyguardManager;
import android.content.*;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.*;
import android.provider.Settings;
import android.view.*;
import android.widget.*;
import org.json.*;
import java.text.DateFormat;
import java.util.Date;

/** Compact native sticky note. No WebView or additional notification-access permission. */
final class ReminderOverlay {
 private static View current;
 private static WindowManager manager;
 private static String currentId;
 private static final Handler handler=new Handler(Looper.getMainLooper());
 private static final Runnable timeout=()->hideAll();
 private static int dp(Context c,float n){return Math.round(n*c.getResources().getDisplayMetrics().density);}
 private static GradientDrawable paper(int color,int border,float radius,Context c){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(c,radius));if(border!=0)d.setStroke(dp(c,1),border);return d;}
 private static TextView text(Context c,String value,int size,boolean bold){TextView v=new TextView(c);v.setText(value);v.setTextSize(size);v.setTextColor(0xff72434d);if(bold)v.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return v;}
 static boolean enabled(Context c){return c.getSharedPreferences("nudge",0).getBoolean("stickyReminders",false)&&Settings.canDrawOverlays(c);}
 static void hide(String id){if(id!=null&&id.equals(currentId))hideAll();}
 static void hideAll(){handler.removeCallbacks(timeout);if(current!=null&&manager!=null)try{manager.removeView(current);}catch(IllegalArgumentException ignored){}current=null;currentId=null;manager=null;}
 private static void action(Context c,String id,String type,boolean demo){hideAll();if(demo)return;c.sendBroadcast(new Intent(c,NudgeAlarmReceiver.class).setAction(type).putExtra("id",id));}
 private static void edit(Context c,String id,boolean demo){hideAll();Intent i=new Intent(c,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);if(!demo)i.putExtra("editTaskId",id);try{c.startActivity(i);}catch(Exception ignored){}}
 private static void button(Context c,LinearLayout row,String label,int color,Runnable click){Button b=new Button(c);b.setText(label);b.setAllCaps(false);b.setTextSize(13);b.setTextColor(0xff633c48);b.setTypeface(Typeface.DEFAULT,Typeface.BOLD);b.setMinWidth(0);b.setMinimumWidth(0);b.setMinHeight(dp(c,44));b.setMinimumHeight(dp(c,44));b.setPadding(dp(c,6),0,dp(c,6),0);b.setBackground(paper(color,0,14,c));b.setOnClickListener(v->click.run());LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,-2,1);if(row.getChildCount()>0)lp.leftMargin=dp(c,6);row.addView(b,lp);}
 static void show(Context context,JSONObject task,long alertAt){
  final Context c=context.getApplicationContext();
  if(!enabled(c))return;
  KeyguardManager keyguard=(KeyguardManager)c.getSystemService(Context.KEYGUARD_SERVICE);
  if(keyguard!=null&&keyguard.isKeyguardLocked())return;
  hideAll();final String id=task.optString("id");final boolean demo=task.optBoolean("demo");
  FrameLayout shell=new FrameLayout(c);shell.setPadding(dp(c,4),dp(c,10),dp(c,4),dp(c,6));
  LinearLayout note=new LinearLayout(c);note.setOrientation(1);note.setPadding(dp(c,16),dp(c,12),dp(c,16),dp(c,16));note.setBackground(paper(0xfffff6df,0xffd8acb3,22,c));note.setElevation(dp(c,4));FrameLayout.LayoutParams noteLp=new FrameLayout.LayoutParams(-1,-2);noteLp.topMargin=dp(c,8);shell.addView(note,noteLp);
  LinearLayout head=new LinearLayout(c);head.setGravity(Gravity.CENTER_VERTICAL);TextView brand=text(c,"Nudge",15,true);head.addView(brand,new LinearLayout.LayoutParams(0,-2,1));TextView close=text(c,"×",26,false);close.setGravity(Gravity.CENTER);close.setContentDescription("Dismiss reminder; keep it active");close.setOnClickListener(v->hideAll());head.addView(close,new LinearLayout.LayoutParams(dp(c,44),dp(c,44)));note.addView(head);
  LinearLayout body=new LinearLayout(c);body.setGravity(Gravity.CENTER_VERTICAL);TextView title=text(c,task.optString("title"),19,true);title.setMaxLines(4);title.setEllipsize(android.text.TextUtils.TruncateAt.END);body.addView(title,new LinearLayout.LayoutParams(0,-2,1));ImageView art=new ImageView(c);art.setImageResource(R.drawable.nudge_logo_foreground);art.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);body.addView(art,new LinearLayout.LayoutParams(dp(c,54),dp(c,54)));note.addView(body);
  long deadline=task.optLong("deadline");boolean overdue=deadline>0&&deadline<=System.currentTimeMillis();long when=deadline>0?deadline:alertAt;
  TextView due=text(c,(overdue?"Overdue · ":deadline>0?"Due · ":"A little nudge · ")+DateFormat.getDateTimeInstance(DateFormat.SHORT,DateFormat.SHORT).format(new Date(when)),12,false);due.setPadding(0,dp(c,8),0,dp(c,12));note.addView(due);
  LinearLayout actions=new LinearLayout(c);button(c,actions,"✓ Done",0xffcfe3c5,()->action(c,id,"done",demo));button(c,actions,"Snooze",0xfff5ced6,()->action(c,id,"snooze",demo));button(c,actions,"Edit date",0xffdfd0ed,()->edit(c,id,demo));note.addView(actions);
  View tape=new View(c);tape.setRotation(-4);tape.setBackground(paper(0xffefb9ca,0,2,c));FrameLayout.LayoutParams tapeLp=new FrameLayout.LayoutParams(dp(c,72),dp(c,19),Gravity.TOP|Gravity.CENTER_HORIZONTAL);shell.addView(tape,tapeLp);tape.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
  WindowManager wm=(WindowManager)c.getSystemService(Context.WINDOW_SERVICE);int width=Math.min(dp(c,420),c.getResources().getDisplayMetrics().widthPixels-dp(c,24));WindowManager.LayoutParams lp=new WindowManager.LayoutParams(width,-2,WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,PixelFormat.TRANSLUCENT);lp.gravity=Gravity.TOP|Gravity.CENTER_HORIZONTAL;lp.y=dp(c,42);
  try{wm.addView(shell,lp);current=shell;currentId=id;manager=wm;handler.postDelayed(timeout,90000);}catch(Exception e){android.util.Log.w("Nudge","Floating note unavailable; notification remains",e);}
 }
}
