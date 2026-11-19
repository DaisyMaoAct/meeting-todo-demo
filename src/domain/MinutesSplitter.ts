export class MinutesSplitter {
  static split(minutes: string): string[] {
    return minutes
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^\d+\s*[.、．]\s*/, "").replace(/^[-•*]\s+/, "").trim())
      .filter((line) => line.length > 0);
  }
}
