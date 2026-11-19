import type { Contact } from "./types";

export class Directory {
  static readonly contacts: readonly Contact[] = [
    { id: "wang-jianguo", name: "王建国", title: "生产部经理" },
    { id: "chen-jing", name: "陈静", title: "行政秘书主管" },
    { id: "zhang-ming", name: "张明", title: "采购部经理" },
    { id: "zhang-wei-purchase", name: "张伟", title: "采购" },
    { id: "zhang-wei-quality", name: "张伟", title: "质量" },
    { id: "li-qiang", name: "李强", title: "二号工厂工程师" },
    { id: "li-xiaolong", name: "李小龙", title: "二号工厂排班员" },
    { id: "sun-hao", name: "孙浩", title: "MES 项目" },
    { id: "liu-yang", name: "刘洋", title: "MES 项目" },
    { id: "wu-jia", name: "吴佳", title: "项目助理" },
    { id: "he-tao", name: "何涛", title: "销售总监" },
    { id: "lin-xiao", name: "林晓", title: "人力总监" },
    { id: "zhou-min", name: "周敏", title: "财务总监" },
    { id: "liu-zhenhua", name: "刘振华", title: "CIO" },
    { id: "sun-liqun", name: "孙立群", title: "总经理" },
  ];

  static byId(id: string): Contact | null {
    return this.contacts.find((contact) => contact.id === id) ?? null;
  }

  static label(contact: Contact): string {
    return `${contact.name}（${contact.title}）`;
  }
}
