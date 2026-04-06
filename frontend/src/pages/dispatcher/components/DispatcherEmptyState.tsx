import { Link } from "react-router-dom";

type DispatcherEmptyAction =
  | {
      label: string;
      tone?: "primary" | "ghost";
      to: string;
      onClick?: never;
    }
  | {
      label: string;
      tone?: "primary" | "ghost";
      onClick: () => void;
      to?: never;
    };

interface DispatcherEmptyStateProps {
  title: string;
  body: string;
  highlights?: string[];
  actions?: DispatcherEmptyAction[];
  compact?: boolean;
}

export const DispatcherEmptyState = ({
  title,
  body,
  highlights = [],
  actions = [],
  compact = false,
}: DispatcherEmptyStateProps) => (
  <div className={`empty empty--guided${compact ? " empty--compact" : ""}`}>
    <div className="empty__copy">
      <p className="empty__title">{title}</p>
      <p className="empty__body">{body}</p>
    </div>

    {highlights.length > 0 ? (
      <ul className="empty__list">
        {highlights.map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>
    ) : null}

    {actions.length > 0 ? (
      <div className="empty__actions">
        {actions.map((action) => {
          const className =
            action.tone === "primary" ? "button primary" : "button ghost";

          if ("to" in action && action.to) {
            return (
              <Link key={action.label} className={className} to={action.to}>
                {action.label}
              </Link>
            );
          }

          return (
            <button
              key={action.label}
              type="button"
              className={className}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          );
        })}
      </div>
    ) : null}
  </div>
);
