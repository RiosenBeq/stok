import { ReactNode } from 'react';

interface Props {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Section({ title, description, actions, children, className = '' }: Props) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 mb-3">
          <div>
            {title && <h2 className="h-section">{title}</h2>}
            {description && <p className="text-sm text-ink-500 mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
