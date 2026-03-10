import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "neutral" | "danger";
};

const variantClass: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "btn-primary",
  neutral: "btn-neutral",
  danger: "btn-error",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn ${variantClass[variant]} ${className ?? ""}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
