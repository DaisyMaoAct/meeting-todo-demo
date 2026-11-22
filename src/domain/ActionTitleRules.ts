export class ActionTitleRules {
  static resolve(item: string): string | null {
    const text = item.trim();
    if (!text || this.isNonAction(text) || this.isScheduleNote(text)) return null;
    return (
      this.yieldInvestigation(text) ??
      this.supplierQuote(text) ??
      this.trainingMaterial(text) ??
      this.shiftRoster(text) ??
      this.deliveryConfirmation(text) ??
      this.qualityCases(text) ??
      this.migrationDraft(text) ??
      text
    );
  }

  private static isNonAction(text: string): boolean {
    return /先放放|大家再想想/.test(text);
  }

  private static isScheduleNote(text: string): boolean {
    return /^下次(?:例会|会议)\s*[:：]/.test(text);
  }

  private static yieldInvestigation(text: string): string | null {
    const match = /([一二三四五六七八九十\d]+号线)良率/.exec(text);
    if (!match || !/原因/.test(text) || !/结论/.test(text)) return null;
    return `查明${match[1]}良率下降原因并给结论`;
  }

  private static supplierQuote(text: string): string | null {
    const match = /供应商\s*([A-Za-z])\s*的报价/.exec(text);
    if (!match || !/再谈一轮/.test(text)) return null;
    return `与供应商 ${match[1]} 再谈一轮报价`;
  }

  private static trainingMaterial(text: string): string | null {
    if (!/新员工培训材料/.test(text) || !/看看/.test(text)) return null;
    return "看新员工培训材料";
  }

  private static shiftRoster(text: string): string | null {
    if (!/夜班排班表/.test(text) || !/发出/.test(text)) return null;
    return "发出夜班排班表";
  }

  private static deliveryConfirmation(text: string): string | null {
    if (!/和供应商确认新的到货时间/.test(text)) return null;
    return "和供应商确认新的到货时间";
  }

  private static qualityCases(text: string): string | null {
    if (!/质量模块的测试用例/.test(text) || !/补齐/.test(text)) return null;
    return "补齐质量模块测试用例";
  }

  private static migrationDraft(text: string): string | null {
    if (!/数据迁移方案/.test(text) || !/初稿/.test(text)) return null;
    return "数据迁移方案初稿";
  }
}
