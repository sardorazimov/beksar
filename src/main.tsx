import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css"; // DİKKAT: Senin Tailwind CSS dosyanın adı App.css veya globals.css ise burayı ona göre değiştir!

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);