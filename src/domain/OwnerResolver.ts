import type { Contact } from "./types";

export class OwnerResolver {
  static resolve(item: string, contacts: readonly Contact[]): Contact | null {
    const reassignment = /改由\s*([\u4e00-\u9fa5]{2,4})\s*(?:接手|负责)/.exec(item);
    if (reassignment) {
      return this.uniqueByName(reassignment[1], contacts);
    }

    const qualified = [
      ...item.matchAll(/@?\s*([\u4e00-\u9fa5]{2,4})\s*[（(]\s*([^）)]+?)\s*[）)]/g),
    ];
    if (qualified.length > 0) {
      return this.fromQualified(item, qualified, contacts);
    }

    if (this.hasUnresolvedPersonHint(item)) return null;
    return this.uniqueFullName(item, contacts);
  }

  private static fromQualified(
    item: string,
    qualified: RegExpMatchArray[],
    contacts: readonly Contact[],
  ): Contact | null {
    const matches = qualified.map((match) => this.matchQualified(match[1], match[2], contacts));
    if (matches.some((match) => match === null)) return null;
    const chosen = matches[0];
    if (!chosen) return null;
    const ids = new Set(matches.map((match) => match?.id));
    if (ids.size !== 1) return null;
    const otherNames = contacts.some(
      (contact) =>
        contact.id !== chosen.id &&
        contact.name !== chosen.name &&
        item.includes(contact.name),
    );
    return otherNames ? null : chosen;
  }

  private static matchQualified(
    name: string,
    tag: string,
    contacts: readonly Contact[],
  ): Contact | null {
    const hits = contacts.filter(
      (contact) => contact.name === name && this.tagMatches(contact.title, tag),
    );
    return hits.length === 1 ? hits[0] : null;
  }

  private static tagMatches(title: string, tag: string): boolean {
    const normalize = (value: string) => value.replace(/\s+/g, "");
    return normalize(title) === normalize(tag);
  }

  private static hasUnresolvedPersonHint(item: string): boolean {
    return /老[\u4e00-\u9fa5]|小[\u4e00-\u9fa5]|[\u4e00-\u9fa5]工(?!厂)|[\u4e00-\u9fa5]{1,2}经理/.test(
      item,
    );
  }

  private static uniqueFullName(item: string, contacts: readonly Contact[]): Contact | null {
    const hits = contacts.filter((contact) => item.includes(contact.name));
    const names = new Set(hits.map((contact) => contact.name));
    if (names.size !== 1) return null;
    const [onlyName] = names;
    const sameName = hits.filter((contact) => contact.name === onlyName);
    return sameName.length === 1 ? sameName[0] : null;
  }

  private static uniqueByName(name: string, contacts: readonly Contact[]): Contact | null {
    const hits = contacts.filter((contact) => contact.name === name);
    return hits.length === 1 ? hits[0] : null;
  }
}
