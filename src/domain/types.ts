export type Role = "organizer" | "assignee";

export type Contact = {
  id: string;
  name: string;
  title: string;
};

export type SampleId = "factory" | "mes";

export type Meeting = {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  organizerId: string;
  recorderId: string | null;
  attendeeIds: readonly string[];
  sampleId: SampleId;
};

export type TodoStatus = "pending" | "assigned" | "unassigned" | "completed";

export type ExtractedTodo = {
  id: string;
  title: string;
  ownerId: string | null;
  dueDate: string | null;
  status: TodoStatus;
  needsAttention: boolean;
};

export type Phase = "idle" | "extracting" | "failed" | "review" | "confirmed";

export type NotificationKind = "assigned" | "reminder";

export type NotificationEntry = "meeting" | "todo";

export type ReminderKind = "scheduled" | "backfill";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  reminder: ReminderKind | null;
  todoId: string;
  ownerId: string;
  title: string;
  dueDate: string | null;
  entry: NotificationEntry;
  href: string;
  createdOn: string;
};

export type SessionState = {
  role: Role;
  actorId: string | null;
  simulatedDate: string;
  meetingId: string | null;
  minutes: string;
  fileName: string | null;
  todos: ExtractedTodo[];
  phase: Phase;
  error: string | null;
  notifications: AppNotification[];
  reminderSkips: string[];
};

export type TodoPatch = {
  title?: string;
  ownerId?: string | null;
  dueDate?: string | null;
};
