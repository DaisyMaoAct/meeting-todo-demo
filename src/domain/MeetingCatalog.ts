import { Calendar } from "./Calendar";
import { Directory } from "./Directory";
import type { Meeting } from "./types";

export class MeetingCatalog {
  static readonly meetings: readonly Meeting[] = [
    {
      id: "factory-weekly",
      title: "二号工厂生产周会",
      date: "2026-11-06",
      startTime: "8:30",
      organizerId: "wang-jianguo",
      recorderId: "chen-jing",
      attendeeIds: ["wang-jianguo", "chen-jing", "li-qiang", "li-xiaolong"],
      sampleId: "factory",
    },
    {
      id: "mes-weekly",
      title: "MES 升级项目周例会",
      date: "2026-11-07",
      startTime: null,
      organizerId: "wu-jia",
      recorderId: null,
      attendeeIds: ["wu-jia", "sun-hao", "liu-yang", "zhang-wei-purchase", "zhang-wei-quality"],
      sampleId: "mes",
    },
  ];

  static byId(id: string): Meeting | null {
    return this.meetings.find((meeting) => meeting.id === id) ?? null;
  }

  static when(meeting: Meeting): string {
    const [year, month, day] = meeting.date.split("-");
    const date = `${year}年${Number(month)}月${Number(day)}日（${Calendar.weekday(meeting.date)}）`;
    return meeting.startTime ? `${date} ${meeting.startTime}` : date;
  }

  static personLabel(id: string | null): string {
    if (!id) return "未指定";
    const contact = Directory.byId(id);
    return contact ? Directory.label(contact) : "未指定";
  }
}
