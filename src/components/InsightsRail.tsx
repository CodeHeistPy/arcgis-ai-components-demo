import type { DashboardConfig } from "../lib/agents";
import { formatInt } from "../lib/dashboard";
import type { Segment } from "../lib/dashboard";
import type { DashboardState } from "./useDashboardStats";

interface Props {
  state: DashboardState;
  cfg: DashboardConfig;
}

/**
 * Left insights rail: a risk-tier donut and a project-type bar chart. Both
 * reflect the assistant's current query (the `current` stats). Bars are scaled
 * against the unfiltered `overall` max so they visibly shrink as a query
 * narrows the set. Charts are hand-rolled SVG/CSS — no chart dependency.
 */
export function InsightsRail({ state, cfg }: Props) {
  const { overall, current, filtered, viewSynced, status } = state;
  const loading = status !== "ready" || !current || !overall;
  const lensLabel =
    filtered && viewSynced ? "query + view" : viewSynced ? "in view" : "current query";

  const tierSegs = orderSegments(current?.tier, cfg.tierOrder);
  const typeSegs = orderSegments(current?.type, cfg.typeOrder);
  const typeMax = Math.max(
    1,
    ...orderSegments(overall?.type, cfg.typeOrder).map((s) => s.count),
  );

  return (
    <aside className="rail" aria-label="Portfolio insights">
      <div className="rail__head">
        <span>Insights</span>
        {(filtered || viewSynced) && !loading && (
          <span className="rail__chip">{lensLabel}</span>
        )}
      </div>

      <section className="card rail__card">
        <h3 className="card__title">Risk Tier</h3>
        {loading ? (
          <div className="rail__skeleton" />
        ) : (
          <div className="donut-wrap">
            <Donut segments={tierSegs} colors={cfg.tierColors} total={current!.count} />
            <ul className="legend">
              {tierSegs.map((s) => (
                <li key={s.key}>
                  <span
                    className="legend__swatch"
                    style={{ background: cfg.tierColors[s.key] ?? "#9aa5b1" }}
                  />
                  <span className="legend__label">{s.key}</span>
                  <span className="legend__val">{formatInt(s.count)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="card rail__card">
        <h3 className="card__title">Project Type</h3>
        {loading ? (
          <div className="rail__skeleton" />
        ) : (
          <ul className="bars">
            {typeSegs.map((s) => (
              <li className="bar" key={s.key}>
                <div className="bar__row">
                  <span className="bar__label" title={s.key}>
                    {s.key}
                  </span>
                  <span className="bar__val">{formatInt(s.count)}</span>
                </div>
                <div className="bar__track">
                  <div
                    className="bar__fill"
                    style={{
                      width: `${(s.count / typeMax) * 100}%`,
                      background: cfg.typeColors?.[s.key] ?? "#2b6ca3",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}

function orderSegments(
  segs: Segment[] | undefined,
  order: string[],
): Segment[] {
  const by = new Map((segs ?? []).map((s) => [s.key, s]));
  return order.map((k) => by.get(k) ?? { key: k, count: 0, value: 0 });
}

function Donut({
  segments,
  colors,
  total,
}: {
  segments: Segment[];
  colors: Record<string, string>;
  total: number;
}) {
  const size = 128;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const sum = segments.reduce((a, s) => a + s.count, 0);

  let offset = 0;
  const arcs = segments
    .filter((s) => s.count > 0)
    .map((s) => {
      const len = sum > 0 ? (s.count / sum) * c : 0;
      const el = (
        <circle
          key={s.key}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors[s.key] ?? "#9aa5b1"}
          strokeWidth={stroke}
          strokeDasharray={`${len} ${c - len}`}
          strokeDashoffset={-offset}
          style={{ transition: "stroke-dasharray .4s ease, stroke-dashoffset .4s ease" }}
        />
      );
      offset += len;
      return el;
    });

  return (
    <svg
      className="donut"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label="Risk tier distribution"
    >
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--track)"
          strokeWidth={stroke}
        />
        {arcs}
      </g>
      <text className="donut__num" x="50%" y="48%" textAnchor="middle">
        {formatInt(total)}
      </text>
      <text className="donut__cap" x="50%" y="63%" textAnchor="middle">
        projects
      </text>
    </svg>
  );
}
