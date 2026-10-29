import { unzipSync, zipSync, strFromU8, strToU8 } from "fflate";
// Only inspected, blank input cells in the published 251210 application are populated.
export const APPLICATION_CELLS = {
  companyName: "C4",
  companyEnglishName: "C5",
  address: "C6",
  representative: "C9",
  contactName: "I9",
  contactEmail: "I10",
  phone: "C12",
  fax: "I12",
  businessNumber: "C13",
  billingContact: "E14",
  billingTitle: "K14",
  billingPhone: "E15",
  billingEmail: "K15",
  scope: "B25",
  process: "D25",
  rawMaterials: "D28",
  outsourcedProcess: "D29",
};
const xml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
export function buildApplicationWorkbook(template, data) {
  if (!data.companyName?.trim()) throw Error("회사명을 확인해 주세요.");
  const entries = unzipSync(new Uint8Array(template));
  const path = "xl/worksheets/sheet1.xml";
  if (!entries[path] || !entries["xl/workbook.xml"])
    throw Error("신청서 원본 양식을 확인해 주세요.");
  let sheet = strFromU8(entries[path]);
  for (const [field, cell] of Object.entries(APPLICATION_CELLS)) {
    const value = data[field];
    if (value === undefined || value === null || value === "") continue;
    const pattern = new RegExp(
      `<((?:\\w+:)?c)\\b([^>]*\\br="${cell}"[^>]*)(?:\\/>|>[\\s\\S]*?<\\/\\1>)`,
    );
    if (!pattern.test(sheet))
      throw Error(
        `신청서 입력 위치(${cell})가 변경되었습니다. 양식을 다시 검토해 주세요.`,
      );
    sheet = sheet.replace(pattern, (_, tag, attrs) => {
      const prefix = tag.includes(":") ? tag.split(":")[0] + ":" : "";
      return `<${tag}${attrs.replace(/\s+t="[^"]*"/g, "")} t="inlineStr"><${prefix}is><${prefix}t xml:space="preserve">${xml(String(value).slice(0, 2000))}</${prefix}t></${prefix}is></${tag}>`;
    });
  }
  entries[path] = strToU8(sheet);
  return zipSync(entries, { level: 6 });
}
