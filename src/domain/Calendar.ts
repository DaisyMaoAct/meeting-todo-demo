export class Calendar {
  static parse(iso: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!match) {
      throw new Error(`无效日期 ${iso}`);
    }
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }

  static iso(year: number, month: number, day: number): string | null {
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }
    return date.toISOString().slice(0, 10);
  }

  static addDays(iso: string, days: number): string {
    const date = this.parse(iso);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  static fridayOfWeek(iso: string): string {
    const daysFromMonday = (this.parse(iso).getUTCDay() + 6) % 7;
    const monday = this.addDays(iso, -daysFromMonday);
    return this.addDays(monday, 4);
  }

  static endOfMonth(iso: string): string {
    const date = this.parse(iso);
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
    return end.toISOString().slice(0, 10);
  }

  static display(iso: string): string {
    const [year, month, day] = iso.split("-");
    return `${year}年${Number(month)}月${Number(day)}日（${this.weekday(iso)}）`;
  }

  static weekday(iso: string): string {
    const labels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    return labels[this.parse(iso).getUTCDay()];
  }

  static isBefore(iso: string, other: string): boolean {
    return iso < other;
  }
}
