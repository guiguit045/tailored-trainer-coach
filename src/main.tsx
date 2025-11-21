import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';
import SplashScreen from "./components/SplashScreen";

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

// Check if app is installed (PWA mode)
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true;

const Root = () => {
  const [showSplash, setShowSplash] = useState(isStandalone);

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem 
      storageKey="fitness-app-theme"
    >
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : (
        <App />
      )}
    </ThemeProvider>
  );
};

createRoot(document.getElementById("root")!).render(<Root />);
