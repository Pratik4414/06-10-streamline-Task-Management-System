
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize theme mode ASAP to avoid flash of wrong theme
try {
  const saved = localStorage.getItem('themeMode') || 'dark';
  const root = document.documentElement;
  
  if (saved === 'light') {
    root.setAttribute('data-theme', 'light');
  } else if (saved === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (saved === 'system') {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    if (mql.matches) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }
  }
} catch {}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
