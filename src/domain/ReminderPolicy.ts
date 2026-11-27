import { Calendar } from "./Calendar";
import { DateField } from "./DateField";

export type ReminderOutcome = "none" | "past" | "wait" | "scheduled" | "backfill";

export class ReminderPolicy {
  /**
   * 到期日前一个自然日发一次。
   * 截止日尚未结束、但提醒日已过或已不足一个自然日时，结果是补发。
   * 没有截止日期，或模拟日已经晚于截止日期，则不发。
   */
  static outcome(dueDate: string | null, simulatedDate: string): ReminderOutcome {
    if (!dueDate || !DateField.isIso(dueDate) || !DateField.isIso(simulatedDate)) return "none";
    if (simulatedDate > dueDate) return "past";
    const point = Calendar.addDays(dueDate, -1);
    if (simulatedDate < point) return "wait";
    if (simulatedDate === point) return "scheduled";
    return "backfill";
  }
}
