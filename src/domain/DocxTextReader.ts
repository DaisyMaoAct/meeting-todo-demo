import { ExtractionError } from "./ExtractionError";

export class DocxTextReader {
  static async read(data: ArrayBuffer | Uint8Array): Promise<string> {
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(data);
    const entry = zip.file("word/document.xml");
    if (!entry) {
      throw new ExtractionError("这份 docx 里没有正文。");
    }
    const xml = await entry.async("string");
    return this.toPlainText(xml);
  }

  static toPlainText(xml: string): string {
    const lines: string[] = [];
    for (const paragraph of xml.split(/<\/w:p>/)) {
      const parts = [...paragraph.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].map((match) =>
        this.decode(match[1]),
      );
      const line = parts.join("").trim();
      if (line) lines.push(line);
    }
    return lines.join("\n");
  }

  private static decode(value: string): string {
    return value
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
  }
}
