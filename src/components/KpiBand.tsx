import type { DashboardConfig } from "../lib/agents";
import { formatInt, formatRisk, formatUSD } from "../lib/dashboard";
import type { DashboardState } from "./useDashboardStats";

interface Props {
  state: DashboardState;
  cfg: DashboardConfig;
}

interface Tile {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}

/**
 * Full-width band of executive KPI tiles. Values reflect the assistant's
 * current query (the `current` stats); when a filter is active each tile shows
 * the filtered value with an "of <overall>" context line.
 */
export function KpiBand({ state, cfg }: Props) {
  const { overall, current, filtered, status } = state;

  const tiles: Tile[] =
    status === "ready" && overall && current
      ? [
          {
            label: "Projects",
            value: formatInt(current.count),
            sub: filtered ? `of ${formatInt(overall.count)} total` : "in portfolio",
          },
          {
            label: "High-Risk",
            value: formatInt(current.highRiskCount),
            sub: filtered
              ? `of ${formatInt(overall.highRiskCount)}`
              : `${pct(overall.highRiskCount, overall.count)} of portfolio`,
            accent: true,
          },
          {
            label: "Contract Value",
            value: formatUSD(current.totalValue),
            sub: filtered ? `of ${formatUSD(overall.totalValue)}` : "total active",
          },
          {
            label: "Avg Composite Risk",
            value: formatRisk(current.avgRisk),
            sub: filtered ? `portfolio ${formatRisk(overall.avgRisk)}` : "scale 1.8–6.3",
          },
          {
            label: "Early-Const. Exposure",
            value: formatUSD(current.earlyExposure),
            sub: `high-risk, <${cfg.earlyCompleteBelow}% complete`,
            accent: true,
          },
        ]
      : PLACEHOLDERS;

  return (
    <div className="kpi-band" role="group" aria-label="Portfolio key metrics">
      {tiles.map((t) => (
        <div className={`kpi-tile${t.accent ? " kpi-tile--accent" : ""}`} key={t.label}>
          <div className="kpi-tile__label">{t.label}</div>
          <div className="kpi-tile__value">{t.value}</div>
          <div className="kpi-tile__sub">{t.sub}</div>
        </div>
      ))}
      {filtered && status === "ready" && (
        <span className="kpi-band__filter-pill" title="Metrics reflect the assistant's current query">
          Filtered by query
        </span>
      )}
    </div>
  );
}

const pct = (n: number, d: number): string =>
  d > 0 ? `${Math.round((n / d) * 100)}%` : "—";

const PLACEHOLDERS: Tile[] = [
  { label: "Projects", value: "—", sub: "loading…" },
  { label: "High-Risk", value: "—", sub: "loading…", accent: true },
  { label: "Contract Value", value: "—", sub: "loading…" },
  { label: "Avg Composite Risk", value: "—", sub: "loading…" },
  { label: "Early-Const. Exposure", value: "—", sub: "loading…", accent: true },
];
