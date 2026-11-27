export function MicrosoftSyncDesign() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
      <section
        className="rounded-2xl border border-line bg-card p-4 shadow-sm md:p-5"
        data-testid="m365-design"
      >
        <p className="text-sm font-medium text-accent">设计说明</p>
        <h2 className="mt-1 text-lg font-semibold">Microsoft 365 同步设计</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          确认派发之后，已派发的待办可以单向写到 Microsoft 365 的一个终点。本演示不实现 F7，下面没有任何实时同步。
        </p>

        <ol className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
          <li className="rounded-xl border border-line bg-background px-4 py-3">
            <p className="text-xs text-muted">时机</p>
            <p className="mt-1 font-medium">F2.4 确认并派发</p>
          </li>
          <span className="hidden text-center text-muted md:block" aria-hidden>
            →
          </span>
          <li className="rounded-xl border border-line bg-background px-4 py-3">
            <p className="text-xs text-muted">范围</p>
            <p className="mt-1 font-medium">只带走已派发待办</p>
          </li>
          <span className="hidden text-center text-muted md:block" aria-hidden>
            →
          </span>
          <li className="rounded-xl border border-accent/40 bg-accent/5 px-4 py-3">
            <p className="text-xs text-muted">方向</p>
            <p className="mt-1 font-medium">单向，只选一个终点</p>
          </li>
        </ol>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <article className="rounded-xl border border-line bg-white px-4 py-4">
            <h3 className="font-semibold">Outlook 任务</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              若选择 Outlook，待办只写成 Outlook 任务。不会同时写到 Planner，也不会从 Outlook 写回会议待办。
            </p>
          </article>
          <article className="rounded-xl border border-line bg-white px-4 py-4">
            <h3 className="font-semibold">Planner 任务</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              若选择 Planner，待办只写成 Planner 任务。不会同时写到 Outlook，也不会从 Planner 写回会议待办。
            </p>
          </article>
        </div>
        <p className="mt-3 text-sm text-muted">两条路互斥。一次同步只通向 Outlook 或 Planner，不能两边都写。</p>

        <div className="mt-5 rounded-xl border border-attention/30 bg-attention-bg px-4 py-4 text-attention">
          <p className="font-semibold">本演示不实现 F7</p>
          <p className="mt-1 text-sm leading-6">
            没有 Microsoft 365 登录，没有 Graph 调用，没有真实的 Outlook 或 Planner 写入。完成、通知和提醒都只留在这个浏览器里。
          </p>
        </div>

        <ul className="mt-5 list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
          <li>同步发生在发起人完成 F2.4 确认并派发之后。</li>
          <li>负责人为空、因此未派发的条目不进入同步。确认前的核对草稿也不同步。</li>
          <li>同步是单向的，不从 Microsoft 365 拉回状态。</li>
          <li>终点只有一个：Outlook 或 Planner，不会同时同步到两边。</li>
        </ul>
      </section>
    </main>
  );
}
