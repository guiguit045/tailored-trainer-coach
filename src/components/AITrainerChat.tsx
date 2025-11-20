import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Sparkles, X, Send, Loader2, Mic, MicOff, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChat } from "@/utils/RealtimeAudio";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AITrainerChat = () => {
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! Sou o TrainerIA, seu personal trainer virtual. Como posso ajudá-lo com seus treinos e dieta hoje?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const realtimeChatRef = useRef<RealtimeChat | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-trainer-chat", {
        body: { messages: [...messages, userMessage] }
      });

      if (error) throw error;

      if (data?.message) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.message
        }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível se comunicar com o TrainerIA. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceMode = async () => {
    try {
      setIsLoading(true);
      
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const tokenEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/realtime-token`;
      
      const handleMessage = (event: any) => {
        console.log("Voice event:", event.type);
        
        if (event.type === "response.audio_transcript.delta") {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => 
                i === prev.length - 1 
                  ? { ...m, content: m.content + event.delta }
                  : m
              );
            }
            return [...prev, { role: "assistant", content: event.delta }];
          });
        } else if (event.type === "conversation.item.input_audio_transcription.completed") {
          setMessages(prev => [...prev, {
            role: "user",
            content: event.transcript
          }]);
        }
      };

      const handleSpeakingChange = (speaking: boolean) => {
        setIsSpeaking(speaking);
      };

      realtimeChatRef.current = new RealtimeChat(handleMessage, handleSpeakingChange);
      await realtimeChatRef.current.init(tokenEndpoint);
      
      setIsVoiceActive(true);
      setMode("voice");
      
      toast({
        title: "Modo de voz ativado",
        description: "Fale com o TrainerIA!"
      });
    } catch (error) {
      console.error("Error starting voice mode:", error);
      toast({
        title: "Erro ao ativar modo de voz",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopVoiceMode = () => {
    realtimeChatRef.current?.disconnect();
    realtimeChatRef.current = null;
    setIsVoiceActive(false);
    setIsSpeaking(false);
    setMode("text");
    
    toast({
      title: "Modo de voz desativado",
      description: "Voltando para modo texto"
    });
  };

  useEffect(() => {
    return () => {
      if (realtimeChatRef.current) {
        realtimeChatRef.current.disconnect();
      }
    };
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-16 w-16 rounded-full shadow-lg bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
            >
              <Sparkles className="h-8 w-8" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">TrainerIA</h2>
                      <p className="text-xs text-muted-foreground">Personal Trainer Virtual</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 container mx-auto px-4" ref={scrollRef}>
                <div className="py-6 space-y-4 max-w-3xl mx-auto">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <Card
                        className={`max-w-[80%] p-4 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </Card>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <Card className="max-w-[80%] p-4 bg-muted">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </Card>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>

              {/* Mode Toggle */}
              <div className="border-t bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
                <div className="container mx-auto px-4 py-3 max-w-3xl">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant={mode === "text" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (isVoiceActive) stopVoiceMode();
                        setMode("text");
                      }}
                      disabled={isLoading}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Texto
                    </Button>
                    <Button
                      variant={mode === "voice" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (mode === "voice") {
                          stopVoiceMode();
                        } else {
                          startVoiceMode();
                        }
                      }}
                      disabled={isLoading}
                    >
                      {isVoiceActive ? (
                        <MicOff className="h-4 w-4 mr-2" />
                      ) : (
                        <Mic className="h-4 w-4 mr-2" />
                      )}
                      Voz
                    </Button>
                  </div>
                  {isVoiceActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 text-center"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${isSpeaking ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
                        <p className="text-sm text-muted-foreground">
                          {isSpeaking ? "TrainerIA está falando..." : "Escutando..."}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Input */}
              {mode === "text" && (
              <div className="border-t bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
                <div className="container mx-auto px-4 py-4 max-w-3xl">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua pergunta sobre treino ou dieta..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim()}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
