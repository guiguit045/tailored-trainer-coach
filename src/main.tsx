import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nova versão disponível! Deseja atualizar?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App pronto para funcionar offline');
  },
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider 
    attribute="class" 
    defaultTheme="light" 
    enableSystem 
    storageKey="fitness-app-theme"
  >
    <App />
  </ThemeProvider>
);
