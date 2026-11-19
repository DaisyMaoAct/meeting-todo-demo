import { Directory } from "@/domain/Directory";
import { MeetingCatalog } from "@/domain/MeetingCatalog";

export function MeetingPanel({
  meetingId,
  disabled,
  onSelect,
}: {
  meetingId: string | null;
  disabled: boolean;
  onSelect: (meetingId: string) => void;
}) {
  const meeting = meetingId ? MeetingCatalog.byId(meetingId) : null;

  return (
    <section className="rounded-2xl border border-line bg-card p-4 shadow-sm md:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">关联会议</h2>
        <p className="text-sm text-muted">选择后自动带出会议信息</p>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {MeetingCatalog.meetings.map((item) => {
          const selected = item.id === meetingId;
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`meeting-${item.id}`}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onSelect(item.id)}
              className={
                selected
                  ? "rounded-xl border-2 border-accent bg-accent/5 px-4 py-3 text-left"
                  : "rounded-xl border border-line bg-white px-4 py-3 text-left hover:border-accent"
              }
            >
              <span className="block font-medium">{item.title}</span>
              <span className="mt-1 block text-sm text-muted">{MeetingCatalog.when(item)}</span>
            </button>
          );
        })}
      </div>
      {meeting ? (
        <dl className="mt-4 grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">标题</dt>
            <dd className="mt-1 font-medium" data-testid="meeting-title">
              {meeting.title}
            </dd>
          </div>
          <div>
            <dt className="text-muted">时间</dt>
            <dd className="mt-1 font-medium" data-testid="meeting-time">
              {MeetingCatalog.when(meeting)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">发起人</dt>
            <dd className="mt-1 font-medium" data-testid="meeting-organizer">
              {MeetingCatalog.personLabel(meeting.organizerId)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">记录人</dt>
            <dd className="mt-1 font-medium" data-testid="meeting-recorder">
              {MeetingCatalog.personLabel(meeting.recorderId)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted">参会人</dt>
            <dd className="mt-2 flex flex-wrap gap-2" data-testid="meeting-attendees">
              {meeting.attendeeIds.map((id) => {
                const contact = Directory.byId(id);
                return (
                  <span key={id} className="rounded-full bg-background px-3 py-1 text-sm">
                    {contact ? Directory.label(contact) : id}
                  </span>
                );
              })}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 text-sm text-muted">还没有关联会议。请先选择上面的一场演示会议。</p>
      )}
    </section>
  );
}
