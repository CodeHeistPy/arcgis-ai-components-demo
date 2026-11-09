import type { DashboardConfig } from "../lib/agents";
import { formatInt, formatRisk, formatUSD } from "../lib/dashboard";
import type { DashboardState } from "./useDashboardStats";

interface Props {
  state: DashboardState;
  cfg: DashboardConfig;
  /** Whether the "sync to map view" lens is on. */
  syncView: boolean;
  onToggleSyncView: () => void;
}

interface Tile {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}

/**
 * Full-width band of executive KPI tiles. Values reflect the active lens (the
 * assistant's query and/or the map extent, via `current`); the portfolio total
 * stays visible as context on every tile, and a status label + toggle name the
 * lens in force so a narrowed number always reads as "X of Y", never a lonely X.
 */
export function KpiBand({ state, cfg, syncView, onToggleSyncView }: Props) {
  const { overall, current, filtered, viewSynced, status } = state;
  const narrowed = filtered || viewSynced;

  const tiles: Tile[] =
    status === "ready" && overall && current
      ? [
          {
            label: "Projects",
            value: formatInt(current.count),
            sub: narrowed ? `of ${formatInt(overall.count)} total` : "in portfolio",
          },
          {
            label: "High-Risk",
            value: formatInt(current.highRiskCount),
            sub: narrowed
              ? `of ${formatInt(overall.highRiskCount)}`
              : `${pct(overall.highRiskCount, overall.count)} of portfolio`,
            accent: true,
          },
          {
            label: "Contract Value",
            value: formatUSD(current.totalValue),
            sub: narrowed ? `of ${formatUSD(overall.totalValue)}` : "total active",
          },
          {
            label: "Avg Composite Risk",
            value: formatRisk(current.avgRisk),
            sub: narrowed ? `portfolio ${formatRisk(overall.avgRisk)}` : "scale 1.8–6.3",
          },
          {
            label: "Early-Const. Exposure",
            value: formatUSD(current.earlyExposure),
            sub: `high-risk, <${cfg.earlyCompleteBelow}% complete`,
            accent: true,
          },
        ]
      : PLACEHOLDERS;

  const statusLabel =
    status !== "ready"
      ? ""
      : filtered && viewSynced
        ? "Query + map view"
        : filtered
          ? "Current query"
          : viewSynced
            ? "In view"
            : "Full portfolio";

  return (
    <div className="kpi-band" role="group" aria-label="Portfolio key metrics">
      {tiles.map((t) => (
        <div className={`kpi-tile${t.accent ? " kpi-tile--accent" : ""}`} key={t.label}>
          <div className="kpi-tile__label">{t.label}</div>
          <div className="kpi-tile__value">{t.value}</div>
          <div className="kpi-tile__sub">{t.sub}</div>
        </div>
      ))}
      <div className="kpi-band__lens">
        {statusLabel && (
          <span className={`kpi-band__status${narrowed ? " is-narrowed" : ""}`}>
            {statusLabel}
          </span>
        )}
        <button
          type="button"
          role="switch"
          aria-checked={syncView}
          className={`lens-switch${syncView ? " is-on" : ""}`}
          onClick={onToggleSyncView}
          title="When on, every metric reflects only the projects currently visible on the map. Pan or zoom to read a region."
        >
          <span className="lens-switch__track" aria-hidden="true">
            <span className="lens-switch__thumb" />
          </span>
          <span className="lens-switch__label">Sync to map view</span>
        </button>
      </div>
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
