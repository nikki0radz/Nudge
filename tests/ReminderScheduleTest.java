package com.nicole.nudge;
import java.time.Instant;
import java.util.TimeZone;
import java.util.HashSet;
import java.util.Calendar;
public class ReminderScheduleTest {
 static long at(String s){return Instant.parse(s).toEpochMilli();}
 static void check(long actual,String expected){if(actual!=at(expected))throw new AssertionError(actual+" != "+expected);}
 static void range(long value,String first,String last){if(value<at(first)||value>=at(last))throw new AssertionError("Outside waking interval: "+value);}
 public static void main(String[] args){
  TimeZone.setDefault(TimeZone.getTimeZone("Europe/London"));long now=at("2026-11-03T10:00:00Z"),past=at("2026-11-02T10:00:00Z");
  check(ReminderSchedule.next(now,past,"09:00","20:00","balanced"),"2026-11-03T12:00:00Z");
  range(ReminderSchedule.next(now,0,"09:00","20:00","gentle"),"2026-11-05T09:00:00Z","2026-11-05T12:00:00Z");
  check(ReminderSchedule.next(now,at("2026-11-03T12:00:00Z"),"09:00","20:00","balanced"),"2026-11-03T11:00:00Z");
  for(int i=0;i<100;i++){long next=ReminderSchedule.next(now,past,"09:00","20:00","balanced","task");if(next<=now||next-now>86400000L)throw new AssertionError("Repeat stopped or postponed overdue work");now=next;}
  range(ReminderSchedule.next(at("2026-10-24T18:00:00Z"),past,"09:00","20:00","balanced"),"2026-10-25T09:00:00Z","2026-10-25T15:00:00Z");
  range(ReminderSchedule.next(at("2026-03-28T10:00:00Z"),0,"09:00","20:00","balanced"),"2026-03-29T08:00:00Z","2026-03-29T11:00:00Z");
  HashSet<Long> times=new HashSet<>();
  for(int i=0;i<20;i++)times.add(ReminderSchedule.next(at("2026-11-06T23:00:00Z"),past,"09:00","20:00","balanced","task-"+i));
  if(times.size()<10)throw new AssertionError("All tasks still share a morning default");
  System.out.println("Native overdue cadence, 100 continuing alarms, varied morning times, quiet hours, deadlines and DST passed.");
 }
}
