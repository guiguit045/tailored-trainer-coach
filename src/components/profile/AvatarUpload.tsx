import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Upload, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarChange: (url: string | null) => void;
}

const AvatarUpload = ({ currentAvatarUrl, onAvatarChange }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Formato inválido",
          description: "Por favor, envie uma imagem JPG, PNG ou WEBP",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      onAvatarChange(publicUrl);

      toast({
        title: "Foto atualizada! ✓",
        description: "Sua foto de perfil foi atualizada com sucesso",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erro ao enviar foto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Delete from storage
      if (currentAvatarUrl) {
        const path = currentAvatarUrl.split('/').pop();
        if (path) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${path}`]);
        }
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreviewUrl(null);
      onAvatarChange(null);

      toast({
        title: "Foto removida",
        description: "Sua foto de perfil foi removida",
      });
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      toast({
        title: "Erro ao remover foto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg bg-gradient-to-br from-primary to-secondary">
          <AnimatePresence mode="wait">
            {previewUrl ? (
              <motion.img
                key="avatar"
                src={previewUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              />
            ) : (
              <motion.div
                key="placeholder"
                className="w-full h-full flex items-center justify-center text-primary-foreground"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <User className="h-16 w-16" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {previewUrl && !uploading && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={removeAvatar}
            className="absolute top-0 right-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}

        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"
          >
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </motion.div>
        )}
      </motion.div>

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          size="sm"
          variant="outline"
        >
          <Upload className="h-4 w-4 mr-2" />
          {previewUrl ? "Alterar Foto" : "Adicionar Foto"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        JPG, PNG ou WEBP (máx. 5MB)
      </p>
    </div>
  );
};

export default AvatarUpload;
