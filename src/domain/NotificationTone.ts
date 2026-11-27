import type { AppNotification } from "./types";

export class NotificationTone {
  static label(note: AppNotification): string {
    if (note.kind === "assigned") return "新待办";
    if (note.reminder === "backfill") return "补发提醒";
    return "到期提醒";
  }

  static className(note: AppNotification): string {
    if (note.kind === "reminder" && note.reminder === "backfill") return "bg-attention-bg text-attention";
    if (note.kind === "reminder") return "bg-pending-bg text-pending";
    return "bg-accent/10 text-accent";
  }

  static linkLabel(note: AppNotification): string {
    return note.entry === "meeting" ? "打开会议" : "查看待办";
  }

  static entryLabel(note: AppNotification): string {
    return note.entry === "meeting" ? "从这条通知进入会议" : "从这条通知进入待办详情";
  }
}
