import { useState } from "react";
import { AssignmentService } from "@/domain/AssignmentService";
import { DateField } from "@/domain/DateField";
import { Directory } from "@/domain/Directory";
import { RoleGate } from "@/domain/RoleGate";
import { StatusTone } from "@/domain/StatusTone";
import type { ExtractedTodo, SessionState, TodoPatch } from "@/domain/types";

export function TodoPanel({
  session,
  onEdit,
  onConfirm,
}: {
  session: SessionState;
  onEdit: (id: string, patch: TodoPatch) => void;
  onConfirm: () => void;
}) {
  const tally = AssignmentService.tally(session.todos);
  const locked = session.phase !== "review";
  const canConfirm = RoleGate.canDispatch(session.role) && session.phase === "review";
  const showList = session.phase === "review" || session.phase === "confirmed";

  return (
    <section className="rounded-2xl border border-line bg-card p-4 shadow-sm md:p-5" id="todo-review">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">提取的待办</h2>
        {showList ? (
          <p className="text-sm text-muted" data-testid="todo-count">
            {session.todos.length} 条
            {session.phase === "review" ? "，全部待确认" : ""}
          </p>
        ) : null}
      </div>

      {session.phase === "extracting" ? (
        <div
          role="status"
          data-testid="extract-progress"
          className="mt-4 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-5"
        >
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <div>
            <p className="font-medium">正在提取待办…</p>
            <p className="text-sm text-muted">正在识别事项、负责人和截止时间，请稍候。</p>
          </div>
        </div>
      ) : null}

      {session.phase === "failed" ? (
        <div
          role="alert"
          data-testid="extract-error"
          className="mt-4 rounded-xl border border-danger/30 bg-danger-bg px-4 py-4 text-danger"
        >
          <p className="font-medium">提取失败</p>
          <p className="mt-1 text-sm">{session.error}</p>
        </div>
      ) : null}

      {showList ? (
        <>
          <p className="mt-3 text-sm text-muted">
            {session.phase === "confirmed"
              ? `已派发 ${tally.assigned} 条。${
                  tally.unassigned > 0
                    ? `${tally.unassigned} 条负责人为空，仍留在列表中，未派发。`
                    : ""
                }`
              : "确认前不会派发。负责人为空或没有可用截止日期时，标成需要处理。"}
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm" data-testid="todo-list">
              <caption className="sr-only">提取出的待办</caption>
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="px-2 py-2 font-medium">事项</th>
                  <th className="w-48 px-2 py-2 font-medium">负责人</th>
                  <th className="w-40 px-2 py-2 font-medium">截止时间</th>
                  <th className="w-24 px-2 py-2 font-medium">状态</th>
                  <th className="w-28 px-2 py-2 font-medium">标记</th>
                </tr>
              </thead>
              <tbody>
                {session.todos.map((todo, index) => (
                  <TodoRow
                    key={todo.id}
                    index={index + 1}
                    todo={todo}
                    locked={locked}
                    onEdit={(patch) => onEdit(todo.id, patch)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-testid="confirm"
              disabled={!canConfirm}
              onClick={onConfirm}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              确认并派发
            </button>
            <p className="text-sm text-muted">
              {session.phase === "confirmed"
                ? "已经确认。负责人为空的条目没有派发。"
                : RoleGate.canDispatch(session.role)
                  ? "当前是发起人，可以确认并派发。"
                  : "当前是负责人视角，不能确认并派发。"}
            </p>
          </div>
        </>
      ) : null}

      {session.phase === "idle" ? (
        <p className="mt-4 text-sm text-muted">提取完成后，待办会出现在这里，初始状态都是待确认。</p>
      ) : null}
    </section>
  );
}

function TodoRow({
  index,
  todo,
  locked,
  onEdit,
}: {
  index: number;
  todo: ExtractedTodo;
  locked: boolean;
  onEdit: (patch: TodoPatch) => void;
}) {
  const ownerMissing = todo.ownerId === null;
  const dueMissing = todo.dueDate === null;

  return (
    <tr className="border-b border-line align-top" data-testid={`todo-row-${index}`}>
      <td className="px-2 py-2">
        <label className="sr-only" htmlFor={`title-${todo.id}`}>
          第{index}条事项
        </label>
        <input
          id={`title-${todo.id}`}
          data-testid={`todo-title-${index}`}
          value={todo.title}
          disabled={locked}
          spellCheck={false}
          onChange={(event) => onEdit({ title: event.target.value })}
          className={fieldClass(false)}
        />
      </td>
      <td className="px-2 py-2">
        <label className="sr-only" htmlFor={`owner-${todo.id}`}>
          第{index}条负责人
        </label>
        <select
          id={`owner-${todo.id}`}
          data-testid={`todo-owner-${index}`}
          value={todo.ownerId ?? ""}
          disabled={locked}
          onChange={(event) => onEdit({ ownerId: event.target.value || null })}
          className={fieldClass(ownerMissing)}
        >
          <option value="">需要处理</option>
          {Directory.contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {Directory.label(contact)}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2">
        <DueInput
          value={todo.dueDate}
          disabled={locked}
          attention={dueMissing}
          testId={`todo-due-${index}`}
          label={`第${index}条截止时间`}
          onCommit={(dueDate) => onEdit({ dueDate })}
        />
      </td>
      <td className="px-2 py-3">
        <span
          data-testid={`todo-status-${index}`}
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${StatusTone.className(todo.status)}`}
        >
          {StatusTone.label(todo.status)}
        </span>
      </td>
      <td className="px-2 py-3">
        {todo.needsAttention ? (
          <span
            data-testid={`todo-flag-${index}`}
            className="inline-flex rounded-full bg-attention-bg px-2 py-0.5 text-xs font-semibold text-attention"
          >
            需要处理
          </span>
        ) : (
          <span data-testid={`todo-flag-${index}`} className="text-muted">
            —
          </span>
        )}
      </td>
    </tr>
  );
}

function DueInput({
  value,
  disabled,
  attention,
  testId,
  label,
  onCommit,
}: {
  value: string | null;
  disabled: boolean;
  attention: boolean;
  testId: string;
  label: string;
  onCommit: (dueDate: string | null) => void;
}) {
  const [draft, setDraft] = useState(value ?? "");
  const [source, setSource] = useState(value);
  if (source !== value) {
    setSource(value);
    setDraft(value ?? "");
  }

  return (
    <input
      aria-label={label}
      data-testid={testId}
      disabled={disabled}
      spellCheck={false}
      placeholder="需要处理"
      inputMode="numeric"
      value={draft}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        if (next.trim() === "") onCommit(null);
        else if (DateField.isIso(next.trim())) onCommit(next.trim());
      }}
      onBlur={() => {
        if (draft.trim() !== "" && !DateField.isIso(draft.trim())) setDraft(value ?? "");
      }}
      className={fieldClass(attention)}
    />
  );
}

function fieldClass(attention: boolean): string {
  return [
    "w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-80",
    attention ? "attention-field border-attention bg-attention-bg text-attention" : "border-line bg-white",
  ].join(" ");
}
