import { useId, type ReactNode } from "react";

export function VellumField({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="vm-field">
      <span className="vm-key">{label}</span>
      {children}
      {helper != null && <div className="vm-field-helper">{helper}</div>}
    </div>
  );
}

export function VellumSegmented<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
  full,
}: {
  label: string;
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  full?: boolean;
}) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={full ? "vm-segmented vm-segmented-full" : "vm-segmented"}
    >
      {options.map((option) => (
        <label key={option.value} className="vm-segment">
          <input
            type="radio"
            className="vm-segment-input"
            name={name}
            value={option.value}
            checked={option.value === value}
            disabled={disabled}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

export function VellumCheckbox({
  label,
  checked,
  onChange,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="vm-check vm-check-teal">
      <input
        type="checkbox"
        className="vm-check-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="vm-check-box">
        <svg
          viewBox="0 0 14 14"
          className="vm-check-tick"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="square"
          aria-hidden="true"
        >
          <path d="M2.5 7.5 5.5 10.5 11.5 3.5" />
        </svg>
      </span>
      <span className="vm-check-label">{label}</span>
    </label>
  );
}
