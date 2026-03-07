import React from "react";

type Props = {
  title: string;
  children: React.ReactNode;
};

export function Board({ title, children }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}