import React from "react";
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "ghost"|"outline"|"secondary"; size?: "sm"|"md"|"lg" };
export function Button({ className="", ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold transition";
  return <button className={`${base} ${className}`} {...props} />;
}
