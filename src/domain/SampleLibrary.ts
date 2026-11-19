import type { SampleId } from "./types";

export class SampleLibrary {
  static textUrl(sampleId: SampleId): string {
    return sampleId === "factory" ? "/fixtures/factory-weekly.txt" : "/fixtures/mes-weekly.txt";
  }

  static docxUrl(sampleId: SampleId): string {
    return sampleId === "factory" ? "/fixtures/factory-weekly.docx" : "/fixtures/mes-weekly.docx";
  }

  static docxName(sampleId: SampleId): string {
    return sampleId === "factory" ? "二号工厂生产周会纪要.docx" : "MES升级项目周例会纪要.docx";
  }

  static async loadText(sampleId: SampleId): Promise<string> {
    const response = await fetch(this.textUrl(sampleId));
    if (!response.ok) {
      throw new Error("样例纪要读取失败");
    }
    return (await response.text()).trim();
  }
}
