import React from "react";

type Props = {
  title: React.ReactNode;
  children: React.ReactNode;
};

export function Board({title, children }: Props) {
  return (
    <div className="bg-white border border-black/10 rounded-[14px] p-6">
      <h3 className="font-bold mb-4">{title}</h3>
      {children}
    </div>
  );
}
