"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DocxTextReader } from "@/domain/DocxTextReader";
import { ExtractionError } from "@/domain/ExtractionError";
import { ExtractionRunner } from "@/domain/ExtractionRunner";
import { MeetingCatalog } from "@/domain/MeetingCatalog";
import { SampleLibrary } from "@/domain/SampleLibrary";
import { SessionActions } from "@/domain/SessionActions";
import { SessionStore } from "@/domain/SessionStore";
import type { Role, SessionState, TodoPatch } from "@/domain/types";
import { HeaderBar } from "./HeaderBar";
import { MeetingPanel } from "./MeetingPanel";
import { MinutesPanel } from "./MinutesPanel";
import { TodoPanel } from "./TodoPanel";

function subscribeToClient() {
  return () => {};
}

function readClient() {
  return true;
}

function readServer() {
  return false;
}

export function MeetingWorkspace() {
  const isClient = useSyncExternalStore(subscribeToClient, readClient, readServer);
  const [session, setSession] = useState<SessionState | null>(null);
  const extracting = useRef(false);
  const request = useRef(0);

  if (isClient && session === null) {
    setSession(SessionStore.load() ?? SessionStore.empty());
  }

  useEffect(() => {
    if (!session) return;
    SessionStore.save(session);
  }, [session]);

  if (!session) {
    return <div className="grid min-h-full place-items-center text-sm text-muted">正在恢复会话…</div>;
  }

  const view = session;
  const meeting = view.meetingId ? MeetingCatalog.byId(view.meetingId) : null;

  function update(recipe: (state: SessionState) => SessionState) {
    setSession((current) => (current ? recipe(current) : current));
  }

  function selectMeeting(meetingId: string) {
    request.current += 1;
    extracting.current = false;
    update((current) => SessionActions.selectMeeting(current, meetingId));
  }

  async function pasteSample() {
    if (!meeting || extracting.current) return;
    const meetingId = meeting.id;
    try {
      const text = await SampleLibrary.loadText(meeting.sampleId);
      update((current) =>
        current.meetingId === meetingId ? SessionActions.replaceMinutes(current, text, null) : current,
      );
    } catch {
      update((current) => SessionActions.failExtract(current, "样例纪要读取失败，请稍后重试。"));
    }
  }

  async function uploadDocx(file: File) {
    if (extracting.current) return;
    if (!file.name.toLowerCase().endsWith(".docx")) {
      update((current) => SessionActions.failExtract(current, "请上传 .docx 文件。"));
      return;
    }
    try {
      const text = await DocxTextReader.read(await file.arrayBuffer());
      if (!text.trim()) {
        update((current) => SessionActions.failExtract(current, "文档里没有可读取的正文。"));
        return;
      }
      update((current) => SessionActions.replaceMinutes(current, text, file.name));
    } catch (error) {
      const message = error instanceof ExtractionError ? error.message : "无法解析这份 docx。";
      update((current) => SessionActions.failExtract(current, message));
    }
  }

  async function extract() {
    if (extracting.current || !meeting) return;
    const meetingId = meeting.id;
    const meetingDate = meeting.date;
    const minutes = view.minutes;
    if (!minutes.trim()) {
      update((current) =>
        current.meetingId === meetingId
          ? SessionActions.failExtract(current, "会议纪要为空，请先粘贴或上传纪要。")
          : current,
      );
      return;
    }
    extracting.current = true;
    const token = request.current + 1;
    request.current = token;
    update((current) =>
      current.meetingId === meetingId ? SessionActions.beginExtract(current) : current,
    );
    try {
      const todos = await ExtractionRunner.run(minutes, meetingDate);
      update((current) =>
        current.meetingId === meetingId && request.current === token
          ? SessionActions.finishExtract(current, todos)
          : current,
      );
    } catch (error) {
      const message = error instanceof ExtractionError ? error.message : "提取失败，请重试。";
      update((current) =>
        current.meetingId === meetingId && request.current === token
          ? SessionActions.failExtract(current, message)
          : current,
      );
    } finally {
      if (request.current === token) extracting.current = false;
    }
  }

  function editTodo(id: string, patch: TodoPatch) {
    update((current) => SessionActions.edit(current, id, patch));
  }

  function confirm() {
    update((current) => SessionActions.confirm(current));
  }

  function setRole(role: Role) {
    update((current) => SessionActions.setRole(current, role));
  }

  return (
    <div className="min-h-full bg-background text-foreground">
      <HeaderBar role={view.role} onRole={setRole} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
        <MeetingPanel
          meetingId={view.meetingId}
          disabled={view.phase === "extracting"}
          onSelect={selectMeeting}
        />
        <MinutesPanel
          meeting={meeting}
          minutes={view.minutes}
          fileName={view.fileName}
          extracting={view.phase === "extracting"}
          onMinutes={(minutes) => update((current) => SessionActions.replaceMinutes(current, minutes, null))}
          onPaste={() => {
            void pasteSample();
          }}
          onUpload={(file) => {
            void uploadDocx(file);
          }}
          onExtract={() => {
            void extract();
          }}
        />
        <TodoPanel session={view} onEdit={editTodo} onConfirm={confirm} />
      </main>
    </div>
  );
}
