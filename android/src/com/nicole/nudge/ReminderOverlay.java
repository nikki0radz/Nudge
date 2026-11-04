package com.nicole.nudge;

import android.app.KeyguardManager;
import android.content.*;
import android.graphics.PixelFormat;
import android.graphics.BitmapFactory;
import java.io.InputStream;
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
 private static void edit(Context c,String id,boolean demo){hideAll();Intent i=new Intent(c,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);if(!demo)i.putExtra("customTaskId",id);try{c.startActivity(i);}catch(Exception ignored){}}
 private static void button(Context c,LinearLayout row,String label,int color,Runnable click){Button b=new Button(c);b.setText(label);b.setAllCaps(false);b.setTextSize(13);b.setTextColor(0xff633c48);b.setTypeface(Typeface.DEFAULT,Typeface.BOLD);b.setMinWidth(0);b.setMinimumWidth(0);b.setMinHeight(dp(c,44));b.setMinimumHeight(dp(c,44));b.setPadding(dp(c,6),0,dp(c,6),0);b.setBackground(paper(color,0,14,c));b.setOnClickListener(v->click.run());LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,-2,1);if(row.getChildCount()>0)lp.leftMargin=dp(c,6);row.addView(b,lp);}
 static void show(Context context,JSONObject task,long alertAt){
  final Context c=context.getApplicationContext();
  if(!enabled(c))return;
  KeyguardManager keyguard=(KeyguardManager)c.getSystemService(Context.KEYGUARD_SERVICE);
  if(keyguard!=null&&keyguard.isKeyguardLocked())return;
  hideAll();final String id=task.optString("id");final boolean demo=task.optBoolean("demo");
  FrameLayout shell=new FrameLayout(c);shell.setPadding(dp(c,4),dp(c,10),dp(c,4),dp(c,6));
  LinearLayout note=new LinearLayout(c);note.setOrientation(1);note.setPadding(dp(c,16),dp(c,12),dp(c,16),dp(c,16));note.setBackground(paper(0xfffff6df,0xffd8acb3,22,c));note.setElevation(dp(c,4));FrameLayout.LayoutParams noteLp=new FrameLayout.LayoutParams(-1,-2);noteLp.topMargin=dp(c,8);shell.addView(note,noteLp);
  long deadline=task.optLong("deadline"),now=System.currentTimeMillis();
  boolean overdue=deadline>0&&deadline<=now;
  int level=overdue?(int)Math.min(4,Math.max(task.optInt("snoozes"),(now-deadline)/86400000L)):0;
  String[] moods={"stern","side-eye","steam","facepalm","explode"};
  String[] remarks={"It’s still on my clipboard.","Hello from later.","My feathers are beginning to twitch.","I’ve started keeping minutes.","I have run out of feathers to ruffle."};
  TextView brand=text(c,overdue?"Office of unfinished business":"A little nudge from Olive",13,true);note.addView(brand);
  TextView title=text(c,task.optString("title"),27,true);title.setMaxLines(5);title.setEllipsize(android.text.TextUtils.TruncateAt.END);title.setGravity(Gravity.CENTER);title.setPadding(0,dp(c,10),0,dp(c,8));note.addView(title);
  LinearLayout aside=new LinearLayout(c);aside.setGravity(Gravity.CENTER);
  ImageView art=new ImageView(c);
  try(InputStream stream=c.getAssets().open("www/assets/stickers/olive-"+(overdue?moods[level]:"wave")+".png")){art.setImageBitmap(BitmapFactory.decodeStream(stream));}catch(Exception ignored){art.setImageResource(R.drawable.nudge_logo_foreground);}
  aside.addView(art,new LinearLayout.LayoutParams(dp(c,60),dp(c,60)));
  TextView line=text(c,overdue?remarks[level]:"Just tapping you on the shoulder.",14,false);line.setMaxWidth(dp(c,180));aside.addView(line);note.addView(aside);
  if(deadline>0){TextView due=text(c,(overdue?"Overdue · ":"Due · ")+DateFormat.getDateTimeInstance(DateFormat.SHORT,DateFormat.SHORT).format(new Date(deadline)),13,false);due.setGravity(Gravity.CENTER);note.addView(due);}
  LinearLayout actions=new LinearLayout(c);actions.setPadding(0,dp(c,10),0,0);button(c,actions,"In 1 hour",0xfff5ced6,()->action(c,id,"snooze",demo));button(c,actions,"Custom time",0xffdfd0ed,()->edit(c,id,demo));note.addView(actions);
  TextView close=text(c,"Dismiss · let Olive choose",14,false);close.setGravity(Gravity.CENTER);close.setMinHeight(dp(c,44));close.setOnClickListener(v->action(c,id,"dismiss",demo));note.addView(close);
  WindowManager wm=(WindowManager)c.getSystemService(Context.WINDOW_SERVICE);int width=Math.min(dp(c,420),c.getResources().getDisplayMetrics().widthPixels-dp(c,24));
  WindowManager.LayoutParams lp=new WindowManager.LayoutParams(width,-2,WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|WindowManager.LayoutParams.FLAG_DIM_BEHIND,PixelFormat.TRANSLUCENT);
  lp.gravity=Gravity.CENTER;lp.dimAmount=.32f;
  if(Build.VERSION.SDK_INT>=31&&wm.isCrossWindowBlurEnabled()){lp.flags|=WindowManager.LayoutParams.FLAG_BLUR_BEHIND;lp.setBlurBehindRadius(dp(c,14));}
  try{wm.addView(shell,lp);current=shell;currentId=id;manager=wm;handler.postDelayed(timeout,90000);}catch(Exception e){android.util.Log.w("Nudge","Floating note unavailable; notification remains",e);}
 }
}
