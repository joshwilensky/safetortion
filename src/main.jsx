import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AppProvider } from "./context/AppContext.jsx";
import "./index.css";
import ToastProvider from "./components/ui/ToastProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <ToastProvider><App /></ToastProvider>
        
      </AppProvider>
    </BrowserRouter>
  </StrictMode>
);
