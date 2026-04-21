import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: number | string;
  helper?: ReactNode;
  tone?: "default" | "info" | "success" | "warning";
}

export const MetricCard = ({
  label,
  value,
  helper,
  tone = "default",
}: MetricCardProps) => (
  <article className={`kpi-card${tone === "default" ? "" : ` kpi-card--${tone}`}`}>
    <p className="kpi-label">{label}</p>
    <p className="kpi-value">{value}</p>
    {helper ? <p className="kpi-helper">{helper}</p> : null}
  </article>
);
