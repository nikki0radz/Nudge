package com.nicole.nudge;
import java.time.Instant;
import java.util.TimeZone;
public class ReminderScheduleTest {
 static long at(String s){return Instant.parse(s).toEpochMilli();}
 static void check(long actual,String expected){if(actual!=at(expected))throw new AssertionError(actual+" != "+expected);}
 public static void main(String[] args){
  TimeZone.setDefault(TimeZone.getTimeZone("Europe/London"));long now=at("2026-11-03T10:00:00Z"),past=at("2026-11-02T10:00:00Z");
  check(ReminderSchedule.next(now,past,"09:00","20:00","balanced"),"2026-11-04T09:00:00Z");
  check(ReminderSchedule.next(now,0,"09:00","20:00","gentle"),"2026-11-05T09:00:00Z");
  check(ReminderSchedule.next(now,at("2026-11-03T12:00:00Z"),"09:00","20:00","balanced"),"2026-11-03T11:00:00Z");
  for(int i=0;i<60;i++){long next=ReminderSchedule.next(now,past,"09:00","20:00","balanced");if(next<=now)throw new AssertionError("Repeat stopped");now=next;}
  check(ReminderSchedule.next(at("2026-10-24T18:00:00Z"),past,"09:00","20:00","balanced"),"2026-10-25T12:00:00Z");
  check(ReminderSchedule.next(at("2026-03-28T10:00:00Z"),0,"09:00","20:00","balanced"),"2026-03-29T08:00:00Z");
  System.out.println("Native repeat cadence, overdue persistence, quiet hours, pace, future deadlines and DST passed.");
 }
}
