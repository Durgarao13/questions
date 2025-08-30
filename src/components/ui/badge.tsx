import React from "react";
export function Badge({ className="", ...p }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs ${className}`} {...p} />;
}
