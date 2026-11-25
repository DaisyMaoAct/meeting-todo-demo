"use client";

import Link from "next/link";
import { Calendar } from "@/domain/Calendar";
import { Directory } from "@/domain/Directory";
import { MeetingCatalog } from "@/domain/MeetingCatalog";
import { NotificationLinks } from "@/domain/NotificationLinks";
import { SessionActions } from "@/domain/SessionActions";
import { StatusTone } from "@/domain/StatusTone";
import { useSession } from "./SessionProvider";

export function TodoDetail({ todoId }: { todoId: string }) {
  const { session, update } = useSession();
  if (!session) return null;

  const todo = session.todos.find((item) => item.id === todoId) ?? null;
  const meeting = session.meetingId ? MeetingCatalog.byId(session.meetingId) : null;

  if (!todo || !meeting) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
        <section className="rounded-2xl border border-line bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">找不到这条待办</h2>
          <p className="mt-2 text-sm text-muted">当前会话里没有这条记录。请从会议页或通知重新进入。</p>
          <Link href="/" className="mt-4 inline-flex text-sm font-medium text-accent">
            返回会议
          </Link>
        </section>
      </main>
    );
  }

  const owner = todo.ownerId ? Directory.byId(todo.ownerId) : null;
  const viewerInside =
    session.role === "organizer" ||
    (session.actorId !== null && NotificationLinks.insideMeeting(meeting, session.actorId));
  const canComplete = session.role === "assignee" && session.actorId === todo.ownerId && todo.status === "assigned";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
      <article
        className="rounded-2xl border border-line bg-card p-4 shadow-sm md:p-5"
        data-testid="todo-detail"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">待办详情</h2>
          <span
            data-testid="todo-detail-status"
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${StatusTone.className(todo.status)}`}
          >
            {StatusTone.label(todo.status)}
          </span>
        </div>
        <h3 className="mt-4 text-xl font-semibold leading-snug">{todo.title}</h3>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">负责人</dt>
            <dd className="mt-1 font-medium">{owner ? Directory.label(owner) : "未指定"}</dd>
          </div>
          <div>
            <dt className="text-muted">截止时间</dt>
            <dd className="mt-1 font-medium">{todo.dueDate ? Calendar.display(todo.dueDate) : "未设置"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted">来源会议</dt>
            <dd className="mt-1 font-medium">{meeting.title}</dd>
          </div>
        </dl>

        <div className="mt-5 border-t border-line pt-4">
          {todo.status === "completed" ? (
            <p className="text-sm">已完成。发起人查看这场会议时，同一条待办也会显示已完成。</p>
          ) : canComplete ? (
            <button
              type="button"
              data-testid="mark-complete"
              onClick={() => update((current) => SessionActions.complete(current, todo.id))}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
            >
              标记已完成
            </button>
          ) : (
            <p className="text-sm text-muted">{blockedReason(session.role, session.actorId, todo.ownerId, todo.status)}</p>
          )}
          <p className="mt-3 text-sm text-muted">这里不能改事项、负责人或截止日期，也没有进度备注和取消。</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link href="/notifications" className="font-medium text-accent">
            返回通知
          </Link>
          {viewerInside ? (
            <Link href={`/?meeting=${meeting.id}`} className="font-medium text-accent">
              返回会议
            </Link>
          ) : null}
        </div>
      </article>
    </main>
  );
}

function blockedReason(
  role: "organizer" | "assignee",
  actorId: string | null,
  ownerId: string | null,
  status: string,
): string {
  if (!ownerId || status === "unassigned") return "这条待办没有负责人，未派发，不能标记完成。";
  if (status === "pending") return "发起人还没有确认派发。";
  if (role !== "assignee") return "请切换到负责人，并选中当前负责人，才能标记完成。";
  if (!actorId) return "请先在页头选择你是谁。";
  return "当前身份不是这条待办的负责人。";
}
