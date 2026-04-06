import type { ReactNode } from "react";
import { ROLE_LABELS } from "../utils/roleRedirect";
import type { UserRole } from "../types/auth";

interface PagePlaceholderProps {
  title: string;
  role: UserRole;
  description: ReactNode;
}

export const PagePlaceholder = ({
  title,
  role,
  description,
}: PagePlaceholderProps) => (
  <section className="page-stack">
    <header className="card page-hero">
      <p className="eyebrow">Sprint 3</p>
      <div className="page-hero__row">
        <div>
          <h1>{title}</h1>
          <p className="page-hero__description">{description}</p>
        </div>
        <span className="role-badge">{ROLE_LABELS[role]}</span>
      </div>
    </header>

    <article className="card placeholder-card">
      <h2>Vista principal</h2>
      <p>
        Aqui encontraras la informacion clave y los accesos principales para tu
        trabajo diario dentro de la plataforma.
      </p>
    </article>
  </section>
);
