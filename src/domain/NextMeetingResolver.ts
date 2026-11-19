import { Calendar } from "./Calendar";

export class NextMeetingResolver {
  static resolve(minutes: string, meetingDate: string): string | null {
    const match = /下次(?:例会|会议)\s*[:：]?\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/.exec(minutes);
    if (!match) return null;
    const year = Number(meetingDate.slice(0, 4));
    return Calendar.iso(year, Number(match[1]), Number(match[2]));
  }
}
