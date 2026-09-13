"use client";

import { AlertCircle } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useId } from "react";

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className = "",
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={`a-field ${className}`.trim()}>
      {label ? <label htmlFor={htmlFor}>{label}</label> : null}
      {children}
      {error ? (
        <span className="a-field-error">
          <AlertCircle size={13} aria-hidden="true" />
          {error}
        </span>
      ) : hint ? (
        <small>{hint}</small>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  prefix?: string;
};

export function Input({ label, hint, error, leading, trailing, prefix, className = "", ...rest }: InputProps) {
  const generatedId = useId();
  const id = rest.id ?? generatedId;

  const input = (
    <input
      {...rest}
      id={id}
      className={`a-input ${className}`.trim()}
      aria-invalid={error ? true : undefined}
    />
  );

  let control = input;
  if (leading || trailing) {
    control = (
      <div className="a-input-icon">
        {leading}
        {input}
        {trailing}
      </div>
    );
  } else if (prefix) {
    control = (
      <div className="a-prefix-input">
        <span>{prefix}</span>
        {input}
      </div>
    );
  }

  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      {control}
    </Field>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
};

export function Textarea({ label, hint, error, className = "", ...rest }: TextareaProps) {
  const generatedId = useId();
  const id = rest.id ?? generatedId;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <textarea
        {...rest}
        id={id}
        className={`a-textarea ${className}`.trim()}
        aria-invalid={error ? true : undefined}
      />
    </Field>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  options: { value: string; label: string }[];
};

export function Select({ label, hint, error, options, className = "", ...rest }: SelectProps) {
  const generatedId = useId();
  const id = rest.id ?? generatedId;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <select {...rest} id={id} className={`a-select ${className}`.trim()} aria-invalid={error ? true : undefined}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  name,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  name?: string;
}) {
  return (
    <label className="a-switch">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="a-switch__track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}
