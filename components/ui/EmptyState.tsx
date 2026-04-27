import { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({ icon = '📭', title, description, action }: Props) {
  return (
    <div className="card text-center py-12 px-6 animate-fade-in">
      <div className="text-5xl mb-3 opacity-70">{icon}</div>
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-ink-500 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
