import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface SkeletonCardProps {
  className?: string;
  height?: string;
}

const SkeletonCard = ({ className = "", height = "h-32" }: SkeletonCardProps) => {
  return (
    <Card className={`${height} ${className} overflow-hidden relative`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/50 to-transparent"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
        <div className="h-3 bg-muted rounded w-full animate-pulse" />
      </div>
    </Card>
  );
};

export default SkeletonCard;
