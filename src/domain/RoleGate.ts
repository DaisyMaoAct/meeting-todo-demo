import type { Role } from "./types";

export class RoleGate {
  static canDispatch(role: Role): boolean {
    return role === "organizer";
  }
}
