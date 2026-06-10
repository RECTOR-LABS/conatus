export interface FeedbackArrays {
  values: readonly bigint[];
  valueDecimals: readonly number[];
  tag1s: readonly string[];
  revokedStatuses: readonly boolean[];
}

export interface DimensionAggregate {
  dimension: string;
  count: number;
  average: number;
}

/** Client-side aggregation over readAllFeedback parallel arrays (getSummary needs explicit clients,
 *  so we aggregate here instead). Skips revoked; normalizes valueDecimals to plain numbers. */
export function aggregateFeedback(rows: FeedbackArrays): DimensionAggregate[] {
  const acc = new Map<string, { sum: number; count: number }>();
  for (let i = 0; i < rows.values.length; i++) {
    if (rows.revokedStatuses[i]) continue;
    const dim = rows.tag1s[i] ?? "untagged";
    const value = Number(rows.values[i] ?? 0n) / 10 ** (rows.valueDecimals[i] ?? 0);
    const cur = acc.get(dim) ?? { sum: 0, count: 0 };
    cur.sum += value;
    cur.count += 1;
    acc.set(dim, cur);
  }
  return [...acc.entries()]
    .map(([dimension, { sum, count }]) => ({ dimension, count, average: Math.round((sum / count) * 10) / 10 }))
    .sort((a, b) => a.dimension.localeCompare(b.dimension));
}
