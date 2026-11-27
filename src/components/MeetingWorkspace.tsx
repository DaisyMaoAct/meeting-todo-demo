"use client";

import { useEffect, useRef } from "react";
import { DocxTextReader } from "@/domain/DocxTextReader";
import { ExtractionError } from "@/domain/ExtractionError";
import { ExtractionRunner } from "@/domain/ExtractionRunner";
import { MeetingCatalog } from "@/domain/MeetingCatalog";
import { SampleLibrary } from "@/domain/SampleLibrary";
import { SessionActions } from "@/domain/SessionActions";
import type { TodoPatch } from "@/domain/types";
import { MeetingPanel } from "./MeetingPanel";
import { MinutesPanel } from "./MinutesPanel";
import { useSession } from "./SessionProvider";
import { TodoPanel } from "./TodoPanel";

export function MeetingWorkspace() {
  const { session, update } = useSession();
  const extracting = useRef(false);
  const request = useRef(0);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("meeting");
    if (!requested || !MeetingCatalog.byId(requested)) return;
    update((current) => {
      if (current.meetingId === requested) return current;
      const untouched =
        current.phase === "idle" &&
        current.todos.length === 0 &&
        current.minutes === "" &&
        current.notifications.length === 0;
      if (!untouched) return current;
      return SessionActions.selectMeeting(current, requested);
    });
  }, [update]);

  if (!session) return null;

  const view = session;
  const meeting = view.meetingId ? MeetingCatalog.byId(view.meetingId) : null;

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
      DocxTextReader.assertFileSize(file.size);
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

  return (
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
  );
}
