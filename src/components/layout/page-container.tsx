"use client";

import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <main className="flex-1 overflow-auto p-8 bg-zinc-950">
      <div className="max-w-7xl mx-auto space-y-6">
        {children}
      </div>
    </main>
  );
}
