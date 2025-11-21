import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ReactNode, useRef } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  enableParallax?: boolean;
  delay?: number;
}

const AnimatedCard = ({ 
  children, 
  className = "", 
  enableParallax = true,
  delay = 0 
}: AnimatedCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), {
    stiffness: 400,
    damping: 30,
  });
  
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), {
    stiffness: 400,
    damping: 30,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableParallax || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    mouseX.set((e.clientX - centerX) / rect.width);
    mouseY.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: delay,
        ease: [0.43, 0.13, 0.23, 0.96],
      }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={enableParallax ? {
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      } : {}}
    >
      <Card 
        className={`${className} transition-shadow duration-300 hover:shadow-elegant cursor-pointer`}
        style={enableParallax ? {
          transform: "translateZ(0)",
        } : {}}
      >
        {children}
      </Card>
    </motion.div>
  );
};

export default AnimatedCard;
