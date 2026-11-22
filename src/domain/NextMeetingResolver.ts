import { Calendar } from "./Calendar";

export class NextMeetingResolver {
  static resolve(minutes: string, meetingDate: string): string | null {
    const match = /下次(?:例会|会议)\s*[:：]?\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/.exec(minutes);
    if (!match) return null;
    const year = Number(meetingDate.slice(0, 4));
    const month = Number(match[1]);
    const day = Number(match[2]);
    const sameYear = Calendar.iso(year, month, day);
    if (!sameYear) return null;
    if (Calendar.isBefore(sameYear, meetingDate)) {
      return Calendar.iso(year + 1, month, day);
    }
    return sameYear;
  }
}
