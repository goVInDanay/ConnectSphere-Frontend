import React, { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-60 pb-16 lg:pb-0 min-h-screen">
        <div className="max-w-[680px] mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}

export function WideLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-60 pb-16 lg:pb-0 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
