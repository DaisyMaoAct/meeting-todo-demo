"use client";

import type { KeyboardEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar } from "@/domain/Calendar";
import { DateField } from "@/domain/DateField";
import { Directory } from "@/domain/Directory";
import { InboxService } from "@/domain/InboxService";
import { RoleKeys } from "@/domain/RoleKeys";
import type { Role, SessionState } from "@/domain/types";

const roles = [
  { id: "organizer", label: "发起人" },
  { id: "assignee", label: "负责人" },
] as const;

export function HeaderBar({
  session,
  onRole,
  onActor,
  onDate,
}: {
  session: SessionState;
  onRole: (role: Role) => void;
  onActor: (actorId: string | null) => void;
  onDate: (simulatedDate: string) => void;
}) {
  const pathname = usePathname();
  const count =
    session.role === "assignee" && session.actorId
      ? InboxService.forOwner(session.notifications, session.actorId).length
      : 0;

  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-sm font-semibold text-white">
              纪要
            </div>
            <div>
              <p className="text-xs tracking-wide text-muted">会议纪要 → 待办自动跟进</p>
              <h1 className="text-xl font-semibold leading-tight">会议待办</h1>
            </div>
          </div>
          <div
            role="radiogroup"
            aria-label="当前角色"
            className="flex rounded-full border border-line bg-background p-1"
            onKeyDown={(event) => moveRole(event, session.role, onRole)}
          >
            {roles.map((item) => {
              const selected = session.role === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  data-testid={`role-${item.id}`}
                  onClick={() => onRole(item.id)}
                  className={
                    selected
                      ? "rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white"
                      : "rounded-full px-4 py-1.5 text-sm text-muted hover:text-foreground"
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-background px-3 py-2">
          <label className="flex items-center gap-2 text-sm" htmlFor="simulated-date">
            <span className="font-medium">模拟时间</span>
            <input
              id="simulated-date"
              type="date"
              data-testid="simulated-date"
              value={session.simulatedDate}
              onChange={(event) => {
                if (DateField.isIso(event.target.value)) onDate(event.target.value);
              }}
              className="rounded-lg border border-line bg-white px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <span className="text-muted">{Calendar.weekday(session.simulatedDate)}</span>
          </label>
          {session.role === "assignee" ? (
            <label className="flex items-center gap-2 text-sm" htmlFor="actor-select">
              <span className="font-medium">当前身份</span>
              <select
                id="actor-select"
                data-testid="actor-select"
                value={session.actorId ?? ""}
                onChange={(event) => onActor(event.target.value || null)}
                className="rounded-lg border border-line bg-white px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <option value="">选择你是谁</option>
                {Directory.contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {Directory.label(contact)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <nav aria-label="演示页面" className="ml-auto flex flex-wrap gap-2">
            <Link href="/" className={navClass(pathname === "/")}>
              会议
            </Link>
            <Link href="/notifications" data-testid="open-notifications" className={navClass(pathname === "/notifications")}>
              通知
              {count > 0 ? (
                <span
                  className={
                    pathname === "/notifications"
                      ? "ml-1 rounded-full bg-white/20 px-1.5 text-xs"
                      : "ml-1 rounded-full bg-accent px-1.5 text-xs text-white"
                  }
                >
                  {count}
                </span>
              ) : null}
            </Link>
            <Link
              href="/sync/microsoft-365"
              data-testid="open-sync-design"
              className={navClass(pathname === "/sync/microsoft-365")}
            >
              同步设计
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

function navClass(active: boolean): string {
  return active
    ? "inline-flex items-center rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white"
    : "inline-flex items-center rounded-full border border-line bg-white px-3 py-1.5 text-sm hover:border-accent";
}

function moveRole(event: KeyboardEvent<HTMLDivElement>, role: Role, onRole: (role: Role) => void) {
  const next = RoleKeys.next(role, event.key);
  if (!next) return;
  event.preventDefault();
  onRole(next);
  event.currentTarget.querySelector<HTMLButtonElement>(`[data-testid="role-${next}"]`)?.focus();
}
