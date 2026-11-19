import type { TodoStatus } from "./types";

export class StatusTone {
  static label(status: TodoStatus): string {
    if (status === "assigned") return "已派发";
    if (status === "unassigned") return "未派发";
    return "待确认";
  }

  static className(status: TodoStatus): string {
    if (status === "assigned") return "bg-ok-bg text-ok";
    if (status === "unassigned") return "bg-danger-bg text-danger";
    return "bg-pending-bg text-pending";
  }
}
