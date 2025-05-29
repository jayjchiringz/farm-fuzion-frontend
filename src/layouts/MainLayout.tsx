// src/layouts/MainLayout.tsx
import { ReactNode } from "react";
import ThemeToggle from "../components/ThemeToggle";
import React from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen transition-colors duration-300 bg-white text-brand-dark dark:bg-brand-dark dark:text-brand-apple">
      <ThemeToggle />
      {children}
    </div>
  );
}
