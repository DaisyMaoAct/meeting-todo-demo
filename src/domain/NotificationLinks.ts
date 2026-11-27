import type { Meeting, NotificationEntry } from "./types";

export class NotificationLinks {
  static forOwner(
    meeting: Meeting,
    ownerId: string,
    todoId: string,
  ): { entry: NotificationEntry; href: string } {
    if (this.insideMeeting(meeting, ownerId)) {
      return { entry: "meeting", href: `/?meeting=${meeting.id}` };
    }
    return { entry: "todo", href: `/todos/${todoId}` };
  }

  static insideMeeting(meeting: Meeting, personId: string): boolean {
    return personId === meeting.organizerId || meeting.attendeeIds.includes(personId);
  }
}
