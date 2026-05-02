import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./tailwind.css"; // MUST be first import
import "./glitch-theme.css"; // Glitch / terminal visual theme (loaded after Tailwind to override)
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
    <App />
    </BrowserRouter>
);
