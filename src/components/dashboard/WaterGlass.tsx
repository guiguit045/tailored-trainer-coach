import { motion } from "framer-motion";

interface WaterGlassProps {
  percentage: number;
}

export default function WaterGlass({ percentage }: WaterGlassProps) {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  
  return (
    <div className="relative w-32 h-48 mx-auto">
      <svg
        viewBox="0 0 120 180"
        className="w-full h-full drop-shadow-lg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glass body - outer container */}
        <defs>
          {/* Gradient for glass effect */}
          <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.1)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.3)" />
          </linearGradient>
          
          {/* Water gradient */}
          <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          
          {/* Shine effect gradient */}
          <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>

          {/* Clip path for water */}
          <clipPath id="glassClip">
            <path d="M 20 20 L 30 160 L 90 160 L 100 20 Z" />
          </clipPath>
        </defs>
        
        {/* Glass container background */}
        <motion.path
          d="M 20 20 L 30 160 L 90 160 L 100 20 Z"
          fill="url(#glassGradient)"
          stroke="hsl(var(--border))"
          strokeWidth="3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Water with wave animation */}
        <g clipPath="url(#glassClip)">
          <motion.path
            d={`M 20 ${160 - (140 * clampedPercentage) / 100} Q 35 ${160 - (140 * clampedPercentage) / 100 - 3} 50 ${160 - (140 * clampedPercentage) / 100} T 80 ${160 - (140 * clampedPercentage) / 100} T 100 ${160 - (140 * clampedPercentage) / 100} L 100 160 L 20 160 Z`}
            fill="url(#waterGradient)"
            initial={{ 
              d: `M 20 160 Q 35 157 50 160 T 80 160 T 100 160 L 100 160 L 20 160 Z`
            }}
            animate={{
              d: [
                `M 20 ${160 - (140 * clampedPercentage) / 100} Q 35 ${160 - (140 * clampedPercentage) / 100 - 3} 50 ${160 - (140 * clampedPercentage) / 100} T 80 ${160 - (140 * clampedPercentage) / 100} T 100 ${160 - (140 * clampedPercentage) / 100} L 100 160 L 20 160 Z`,
                `M 20 ${160 - (140 * clampedPercentage) / 100} Q 35 ${160 - (140 * clampedPercentage) / 100 + 3} 50 ${160 - (140 * clampedPercentage) / 100} T 80 ${160 - (140 * clampedPercentage) / 100} T 100 ${160 - (140 * clampedPercentage) / 100} L 100 160 L 20 160 Z`,
                `M 20 ${160 - (140 * clampedPercentage) / 100} Q 35 ${160 - (140 * clampedPercentage) / 100 - 3} 50 ${160 - (140 * clampedPercentage) / 100} T 80 ${160 - (140 * clampedPercentage) / 100} T 100 ${160 - (140 * clampedPercentage) / 100} L 100 160 L 20 160 Z`,
              ]
            }}
            transition={{
              d: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          />

          {/* Bubbles */}
          {clampedPercentage > 10 && (
            <>
              <motion.circle
                cx="40"
                cy={160 - (140 * clampedPercentage) / 100 + 20}
                r="2"
                fill="rgba(255, 255, 255, 0.5)"
                animate={{
                  cy: [
                    160 - (140 * clampedPercentage) / 100 + 20,
                    160 - (140 * clampedPercentage) / 100 - 10
                  ],
                  opacity: [0.5, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
              <motion.circle
                cx="70"
                cy={160 - (140 * clampedPercentage) / 100 + 30}
                r="3"
                fill="rgba(255, 255, 255, 0.4)"
                animate={{
                  cy: [
                    160 - (140 * clampedPercentage) / 100 + 30,
                    160 - (140 * clampedPercentage) / 100 - 5
                  ],
                  opacity: [0.4, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.5
                }}
              />
              <motion.circle
                cx="55"
                cy={160 - (140 * clampedPercentage) / 100 + 40}
                r="1.5"
                fill="rgba(255, 255, 255, 0.6)"
                animate={{
                  cy: [
                    160 - (140 * clampedPercentage) / 100 + 40,
                    160 - (140 * clampedPercentage) / 100 - 8
                  ],
                  opacity: [0.6, 0]
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 1
                }}
              />
            </>
          )}
        </g>

        {/* Glass shine effect */}
        <motion.ellipse
          cx="35"
          cy="60"
          rx="8"
          ry="25"
          fill="url(#shineGradient)"
          opacity="0.4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        />

        {/* Percentage text */}
        <motion.text
          x="60"
          y="95"
          textAnchor="middle"
          className="text-2xl font-bold"
          fill="currentColor"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {Math.round(clampedPercentage)}%
        </motion.text>
      </svg>
      
      {/* Droplets falling effect when adding water */}
      {clampedPercentage > 0 && (
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Droplet className="h-4 w-4 text-blue-500" />
        </motion.div>
      )}
    </div>
  );
}

// Droplet component for the falling effect
function Droplet({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        fill="currentColor"
      />
    </svg>
  );
}
