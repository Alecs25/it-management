import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="form-control w-full">
      <div className="label">
        <span className="label-text">{label}</span>
      </div>
      <input className={`input input-bordered w-full ${className ?? ""}`} {...props} />
      {error ? (
        <div className="label">
          <span className="label-text-alt text-error">{error}</span>
        </div>
      ) : null}
    </label>
  );
}
