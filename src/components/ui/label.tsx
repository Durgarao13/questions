import React from "react";
export function Label({ className="", ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`text-slate-200 ${className}`} {...p} />;
}
