import { Calendar } from "./Calendar";

export class DueDateResolver {
  static resolve(item: string, meetingDate: string, nextMeetingDate: string | null): string | null {
    if (/下次(?:会议|例会)前/.test(item)) {
      return this.keep(nextMeetingDate, meetingDate);
    }
    if (/(?:本)?月底前/.test(item)) {
      return this.keep(Calendar.endOfMonth(meetingDate), meetingDate);
    }
    if (/下周/.test(item)) {
      return this.keep(Calendar.addDays(Calendar.fridayOfWeek(meetingDate), 7), meetingDate);
    }
    if (/本周五前|本周五|这周五前|这周五|周五前/.test(item)) {
      return this.keep(Calendar.fridayOfWeek(meetingDate), meetingDate);
    }
    return null;
  }

  private static keep(due: string | null, meetingDate: string): string | null {
    if (!due || Calendar.isBefore(due, meetingDate)) return null;
    return due;
  }
}
