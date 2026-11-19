import { MeetingCatalog } from "@/domain/MeetingCatalog";
import { SampleLibrary } from "@/domain/SampleLibrary";
import type { Meeting } from "@/domain/types";

export function MinutesPanel({
  meeting,
  minutes,
  fileName,
  extracting,
  onMinutes,
  onPaste,
  onUpload,
  onExtract,
}: {
  meeting: Meeting | null;
  minutes: string;
  fileName: string | null;
  extracting: boolean;
  onMinutes: (minutes: string) => void;
  onPaste: () => void;
  onUpload: (file: File) => void;
  onExtract: () => void;
}) {
  return (
    <section id="minutes-panel" className="rounded-2xl border border-line bg-card p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">会议纪要</h2>
          <p className="mt-1 text-sm text-muted">
            可直接粘贴，或上传 .docx。正文只在浏览器里解析，截止时间按当前会议日期换算。
          </p>
        </div>
        {meeting ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="paste-sample"
              disabled={extracting}
              onClick={onPaste}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm hover:border-accent disabled:opacity-50"
            >
              填入样例纪要
            </button>
            <a
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm hover:border-accent"
              href={SampleLibrary.textUrl(meeting.sampleId)}
              target="_blank"
              rel="noreferrer"
            >
              查看样例原文
            </a>
            <a
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm hover:border-accent"
              data-testid="download-docx"
              href={SampleLibrary.docxUrl(meeting.sampleId)}
              download={SampleLibrary.docxName(meeting.sampleId)}
            >
              下载样例 docx
            </a>
          </div>
        ) : null}
      </div>
      <label className="mt-4 block text-sm font-medium" htmlFor="minutes">
        纪要正文
      </label>
      <textarea
        id="minutes"
        data-testid="minutes"
        value={minutes}
        spellCheck={false}
        disabled={extracting || !meeting}
        onChange={(event) => onMinutes(event.target.value)}
        placeholder={meeting ? "在这里粘贴会议纪要，或使用上方的样例。" : "请先关联一场会议。"}
        rows={8}
        className="mt-2 w-full resize-y rounded-xl border border-line bg-white px-3 py-2 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:bg-background"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label
          className={`inline-flex items-center rounded-lg border border-line bg-white px-3 py-2 text-sm ${
            extracting || !meeting ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-accent"
          }`}
        >
          选择 docx
          <input
            data-testid="docx-input"
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={extracting || !meeting}
            aria-label="上传 docx 纪要"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = "";
              if (file) onUpload(file);
            }}
            className="sr-only"
          />
        </label>
        <p className="text-sm text-muted" data-testid="loaded-file">
          {fileName ? `已载入：${fileName}` : "尚未选择文件"}
        </p>
        <button
          type="button"
          data-testid="extract"
          disabled={extracting || !meeting}
          aria-busy={extracting}
          onClick={onExtract}
          className="ml-auto rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {extracting ? "正在提取…" : "提取待办"}
        </button>
      </div>
      {meeting ? (
        <p className="mt-3 text-xs text-muted">
          当前会议：{meeting.title}，{MeetingCatalog.when(meeting)}
        </p>
      ) : null}
    </section>
  );
}
