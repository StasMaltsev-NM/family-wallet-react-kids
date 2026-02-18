export type BalanceSizeTier = "normal" | "compact" | "tight";

export const getBalanceSizeTier = (value: number): BalanceSizeTier => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const digits = String(Math.abs(Math.trunc(safeValue))).length;

  if (digits >= 8) return "tight";
  if (digits >= 6) return "compact";
  return "normal";
};
