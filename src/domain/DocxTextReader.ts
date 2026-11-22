import { ExtractionError } from "./ExtractionError";

type DocxEntry = {
  async(type: "string"): Promise<string>;
  _data?: { uncompressedSize?: number };
};

export class DocxTextReader {
  static readonly maxFileBytes = 4 * 1024 * 1024;
  static readonly maxDocumentXmlBytes = 2 * 1024 * 1024;

  static assertFileSize(bytes: number): void {
    if (bytes > this.maxFileBytes) {
      throw new ExtractionError("这份 docx 超过 4 MB，请换一份较小的文件。");
    }
  }

  static async read(data: ArrayBuffer | Uint8Array): Promise<string> {
    this.assertFileSize(data.byteLength);
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(data);
    const entry = zip.file("word/document.xml") as DocxEntry | null;
    if (!entry) {
      throw new ExtractionError("这份 docx 里没有正文。");
    }
    const uncompressed = entry._data?.uncompressedSize;
    if (typeof uncompressed === "number" && uncompressed > this.maxDocumentXmlBytes) {
      throw new ExtractionError("docx 正文过长，无法解析。");
    }
    const xml = await entry.async("string");
    if (xml.length > this.maxDocumentXmlBytes) {
      throw new ExtractionError("docx 正文过长，无法解析。");
    }
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
