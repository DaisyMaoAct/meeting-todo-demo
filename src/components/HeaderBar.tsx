import type { Role } from "@/domain/types";

const roles = [
  { id: "organizer", label: "发起人" },
  { id: "assignee", label: "负责人" },
] as const;

export function HeaderBar({ role, onRole }: { role: Role; onRole: (role: Role) => void }) {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-sm font-semibold text-white">
            纪要
          </div>
          <div>
            <p className="text-xs tracking-wide text-muted">会议纪要 → 待办自动跟进</p>
            <h1 className="text-xl font-semibold leading-tight">会议待办</h1>
          </div>
        </div>
        <div role="radiogroup" aria-label="当前角色" className="flex rounded-full border border-line bg-background p-1">
          {roles.map((item) => {
            const selected = role === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selected}
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
    </header>
  );
}
