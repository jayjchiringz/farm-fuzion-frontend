import React, { useEffect } from "react";

export default function ThemeToggle() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const html = document.documentElement;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const isDark = html.classList.contains("dark");
    html.classList.toggle("dark", !isDark);
    localStorage.setItem("theme", !isDark ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="absolute top-4 right-4 px-4 py-2 bg-brand-green text-white rounded hover:bg-brand-apple dark:bg-brand-apple dark:text-brand-dark dark:hover:bg-brand-dark dark:hover:text-brand-apple transition-colors z-50"
    >
      🌗
    </button>
  );
}
