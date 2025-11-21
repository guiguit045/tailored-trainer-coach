import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Download, Smartphone, Zap, Wifi, ArrowRight } from "lucide-react";

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if user has already seen install page
    const hasSeenInstall = localStorage.getItem("hasSeenInstallPage");
    if (hasSeenInstall === "true") {
      navigate("/auth");
      return;
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      handleSkip();
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [navigate]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // If prompt not available, just proceed
      handleSkip();
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("PWA instalado com sucesso!");
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
    handleSkip();
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenInstallPage", "true");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 space-y-6 bg-card/95 backdrop-blur border-border/50">
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center"
          >
            <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center shadow-elegant">
              <Download className="w-12 h-12 text-primary-foreground" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center space-y-2"
          >
            <h1 className="text-3xl font-bold text-foreground">
              Instale o FitPro
            </h1>
            <p className="text-muted-foreground">
              Tenha o app na tela inicial do seu celular
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <BenefitItem
              icon={<Smartphone className="w-5 h-5" />}
              title="App Nativo"
              description="Acesso rápido direto da tela inicial"
            />
            <BenefitItem
              icon={<Wifi className="w-5 h-5" />}
              title="Funciona Offline"
              description="Use mesmo sem internet"
            />
            <BenefitItem
              icon={<Zap className="w-5 h-5" />}
              title="Super Rápido"
              description="Carregamento instantâneo"
            />
          </motion.div>

          {/* Instructions */}
          {!isInstallable && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg"
            >
              <p className="font-semibold mb-2">Como instalar:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>iPhone: Toque em Compartilhar → Adicionar à Tela Inicial</li>
                <li>Android: Menu do navegador → Instalar aplicativo</li>
              </ul>
            </motion.div>
          )}

          {/* Install Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            {isInstallable && (
              <Button
                onClick={handleInstall}
                className="w-full"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Instalar Agora
              </Button>
            )}

            <Button
              onClick={handleSkip}
              variant={isInstallable ? "outline" : "default"}
              className="w-full"
              size="lg"
            >
              {isInstallable ? "Agora Não" : "Continuar"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};

const BenefitItem = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

export default Install;
