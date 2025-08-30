import React, { createContext, useContext, useState, cloneElement } from "react";
const Ctx = createContext<{open:boolean; setOpen: (v:boolean)=>void} | null>(null);

export function AlertDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Ctx.Provider value={{open,setOpen}}>{children}</Ctx.Provider>;
}
export function AlertDialogTrigger({ asChild, children }: any) {
  const ctx = useContext(Ctx)!;
  const child = asChild ? children : <button>{children}</button>;
  return cloneElement(child, { onClick: () => ctx.setOpen(true) });
}
export function AlertDialogContent({ children }: { children: React.ReactNode }) {
  const ctx = useContext(Ctx)!;
  if (!ctx.open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/50" onClick={()=>ctx.setOpen(false)} />
      <div className="relative w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-xl">{children}</div>
    </div>
  );
}
export const AlertDialogHeader = ({ children }: any) => <div className="mb-3">{children}</div>;
export const AlertDialogTitle = ({ children }: any) => <h3 className="text-lg font-bold">{children}</h3>;
export const AlertDialogDescription = ({ children }: any) => <p className="text-slate-300 text-sm">{children}</p>;
export const AlertDialogFooter = ({ children }: any) => <div className="mt-4 flex justify-end gap-2">{children}</div>;
export const AlertDialogCancel = (p: any) => <button className="px-3 py-2 rounded-lg bg-slate-700" {...p} />;
export const AlertDialogAction = (p: any) => <button className="px-3 py-2 rounded-lg bg-emerald-600 text-white" {...p} />;
