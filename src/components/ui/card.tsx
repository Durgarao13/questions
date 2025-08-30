import React from "react";
export function Card({ className="", ...p }: React.HTMLAttributes<HTMLDivElement>) { return <div className={`rounded-xl border border-slate-700 bg-slate-900/90 ${className}`} {...p}/>; }
export function CardHeader({ className="", ...p }: React.HTMLAttributes<HTMLDivElement>) { return <div className={`p-4 ${className}`} {...p}/>; }
export function CardContent({ className="", ...p }: React.HTMLAttributes<HTMLDivElement>) { return <div className={`p-4 pt-0 ${className}`} {...p}/>; }
export function CardTitle({ className="", ...p }: React.HTMLAttributes<HTMLHeadingElement>) { return <h3 className={`text-lg font-bold ${className}`} {...p}/>; }
export function CardDescription({ className="", ...p }: React.HTMLAttributes<HTMLParagraphElement>) { return <p className={`text-sm text-slate-300 ${className}`} {...p}/>; }
