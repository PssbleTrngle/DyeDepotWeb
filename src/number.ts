export function int(from: number | string | null | undefined) {
  if (typeof from === "number") return from;
  if (!from) return undefined;
  const number = Number.parseInt(from);
  if (isNaN(number)) return undefined;
  return number;
}
