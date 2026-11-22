import type { Role } from "./types";

export class RoleKeys {
  static readonly order = ["organizer", "assignee"] as const;

  static next(role: Role, key: string): Role | null {
    const index = this.order.indexOf(role);
    if (index < 0) return null;
    if (key === "ArrowRight" || key === "ArrowDown") {
      return this.order[(index + 1) % this.order.length];
    }
    if (key === "ArrowLeft" || key === "ArrowUp") {
      return this.order[(index - 1 + this.order.length) % this.order.length];
    }
    return null;
  }
}
