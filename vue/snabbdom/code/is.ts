export const array = Array.isArray;
// 判断是文本内容
export function primitive(s: any): s is string | number {
  return (
    typeof s === "string" ||
    typeof s === "number" ||
    s instanceof String ||
    s instanceof Number
  );
}
