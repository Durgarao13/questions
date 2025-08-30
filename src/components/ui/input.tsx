import React from "react";
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-lg bg-slate-800/80 border border-slate-700 px-3 h-12 text-slate-100 ${props.className||""}`} />;
}
