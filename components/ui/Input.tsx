import { InputHTMLAttributes, ReactNode, forwardRef, useId } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, helper, iconLeft, iconRight, className = '', id, ...rest },
  ref
) {
  const auto = useId();
  const inputId = id ?? auto;
  const errId = error ? `${inputId}-err` : undefined;

  const inputClass = [
    'block w-full rounded-lg border bg-white px-3 py-2 text-sm',
    'text-ink-900 placeholder:text-ink-400',
    'transition-colors duration-150 focus:outline-none',
    error
      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
      : 'border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
    iconLeft ? 'pl-9' : '',
    iconRight ? 'pr-9' : '',
    className,
  ].join(' ');

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-xs font-medium text-ink-700 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {iconLeft && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">{iconLeft}</span>
        )}
        <input ref={ref} id={inputId} aria-invalid={!!error} aria-describedby={errId} className={inputClass} {...rest} />
        {iconRight && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">{iconRight}</span>}
      </div>
      {error ? (
        <p id={errId} className="text-xs text-red-600 mt-1" role="alert">{error}</p>
      ) : helper ? (
        <p className="text-xs text-ink-500 mt-1">{helper}</p>
      ) : null}
    </div>
  );
});
