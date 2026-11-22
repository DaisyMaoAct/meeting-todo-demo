import { ExtractionError } from "./ExtractionError";
import { RulesEngine } from "./RulesEngine";
import type { ExtractedTodo } from "./types";

export class ExtractionRunner {
  static readonly delayMs = 2000;

  static async run(minutes: string, meetingDate: string): Promise<ExtractedTodo[]> {
    const text = minutes.trim();
    if (!text) {
      throw new ExtractionError("会议纪要为空，请先粘贴或上传纪要。");
    }
    await this.wait(this.delayMs);
    const todos = RulesEngine.extract(text, meetingDate);
    if (todos.length === 0) {
      throw new ExtractionError("没有识别到待办。先放放、大家再想想这类内容不会生成待办。");
    }
    return todos;
  }

  private static wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
