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

export type TodoStatus = "pending" | "assigned" | "unassigned";

export type ExtractedTodo = {
  id: string;
  title: string;
  ownerId: string | null;
  dueDate: string | null;
  status: TodoStatus;
  needsAttention: boolean;
};

export type Phase = "idle" | "extracting" | "failed" | "review" | "confirmed";

export type SessionState = {
  role: Role;
  meetingId: string | null;
  minutes: string;
  fileName: string | null;
  todos: ExtractedTodo[];
  phase: Phase;
  error: string | null;
};

export type TodoPatch = {
  title?: string;
  ownerId?: string | null;
  dueDate?: string | null;
};
