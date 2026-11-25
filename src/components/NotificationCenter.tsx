"use client";

import Link from "next/link";
import { Calendar } from "@/domain/Calendar";
import { Directory } from "@/domain/Directory";
import { InboxService } from "@/domain/InboxService";
import { NotificationTone } from "@/domain/NotificationTone";
import type { AppNotification } from "@/domain/types";
import { useSession } from "./SessionProvider";

export function NotificationCenter() {
  const { session } = useSession();
  if (!session) return null;

  const actor = session.actorId ? Directory.byId(session.actorId) : null;
  const items =
    session.role === "assignee" && session.actorId
      ? InboxService.forOwner(session.notifications, session.actorId)
      : [];
  const reminderCount = items.filter((item) => item.kind === "reminder").length;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
      <section className="rounded-2xl border border-line bg-card p-4 shadow-sm md:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">通知</h2>
          <p className="text-sm text-muted">只在应用内发送，没有邮件。</p>
        </div>
        <p className="mt-3 text-sm text-muted">
          已派发的待办会通知当前负责人，内容包含事项、截止日期和入口。到期前 1 个自然日提醒一次；确认时若截止日还没结束、但已不足
          1 天，就立刻补发。已经过期、没有截止日期，或负责人为空，都不提醒。同一条待办最多一条提醒。
        </p>

        {session.role !== "assignee" ? (
          <p className="mt-4 rounded-xl bg-background px-4 py-4 text-sm" data-testid="notification-gate">
            通知发给负责人，不抄送发起人。请切换到「负责人」，再选择你要扮演的人。
          </p>
        ) : null}

        {session.role === "assignee" && !actor ? (
          <p className="mt-4 rounded-xl bg-background px-4 py-4 text-sm" data-testid="notification-gate">
            请先在页头选择当前身份。通知会按这个人过滤。
          </p>
        ) : null}

        {actor ? (
          <>
            <p className="mt-4 text-sm" data-testid="notification-summary">
              {Directory.label(actor)}：{items.length} 条通知，其中到期提醒 {reminderCount} 条。
            </p>
            {items.length === 0 ? (
              <p className="mt-3 text-sm text-muted">还没有发给这个人的通知。</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3" data-testid="notification-list">
                {items.map((item) => (
                  <NotificationCard key={item.id} note={item} />
                ))}
              </div>
            )}
          </>
        ) : null}
      </section>
    </main>
  );
}

function NotificationCard({ note }: { note: AppNotification }) {
  const due = note.dueDate ? Calendar.display(note.dueDate) : "未设置";
  return (
    <article
      className="rounded-xl border border-line bg-white px-4 py-4"
      data-testid={`notification-${note.kind}-${note.todoId}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${NotificationTone.className(note)}`}>
          {NotificationTone.label(note)}
        </span>
        <span className="text-xs text-muted">{Calendar.display(note.createdOn)}</span>
      </div>
      <h3 className="mt-2 text-base font-semibold">{note.title}</h3>
      <p className="mt-1 text-sm text-muted">
        {note.kind === "assigned"
          ? "这条待办已派发给你。"
          : note.reminder === "backfill"
            ? "确认时距离截止已不足 1 个自然日，这条提醒是补发的。"
            : "这是到期前 1 个自然日的提醒。"}
      </p>
      <p className="mt-2 text-sm" data-testid={`notification-due-${note.todoId}`}>
        截止时间：{due}
      </p>
      <p className="mt-1 text-sm text-muted">{NotificationTone.entryLabel(note)}</p>
      <Link
        href={note.href}
        data-testid={`notification-link-${note.todoId}-${note.kind}`}
        className="mt-3 inline-flex rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
      >
        {NotificationTone.linkLabel(note)}
      </Link>
    </article>
  );
}
