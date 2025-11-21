import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { getAllAchievementsWithStatus } from "@/lib/achievementService";
import { Trophy, Lock } from "lucide-react";

export const AchievementsBadges = () => {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    setLoading(true);
    const data = await getAllAchievementsWithStatus();
    setAchievements(data);
    setLoading(false);
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          <h2 className="text-xl md:text-2xl font-bold">Conquistas</h2>
        </div>
        <Badge variant="secondary" className="text-base md:text-lg px-3 md:px-4 py-1.5 md:py-2">
          {unlockedCount}/{totalCount}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.achievement_type}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: index * 0.15,
              duration: 0.5,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
          >
            <motion.div
              whileHover={achievement.unlocked ? { 
                scale: 1.05,
                boxShadow: "0 10px 40px -10px hsl(var(--primary) / 0.4)"
              } : undefined}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={`p-4 text-center transition-all flex flex-col justify-between min-h-[160px] ${
                  achievement.unlocked
                    ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 shadow-lg cursor-pointer"
                    : "bg-muted/50 opacity-60 grayscale"
                }`}
              >
              <div className="relative flex flex-col items-center">
                <motion.div
                  className="text-4xl md:text-5xl mb-2 flex items-center justify-center"
                  animate={
                    achievement.unlocked
                      ? { rotate: [0, -10, 10, -10, 0] }
                      : {}
                  }
                  transition={{
                    duration: 0.5,
                    repeat: achievement.unlocked ? Infinity : 0,
                    repeatDelay: 3
                  }}
                >
                  {achievement.unlocked ? achievement.icon : <Lock className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground" />}
                </motion.div>
                
                {achievement.unlocked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1"
                  >
                    <Trophy className="w-4 h-4" />
                  </motion.div>
                )}
              </div>
              
              
              <div className="flex-1 flex flex-col items-center justify-center">
                <h3 className={`font-semibold text-sm mb-1 text-center ${achievement.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                  {achievement.title}
                </h3>
                <p className={`text-xs text-center ${achievement.unlocked ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                  {achievement.description}
                </p>
              </div>
              
              {achievement.unlocked && achievement.unlocked_at && (
                <p className="text-xs text-primary mt-2 text-center">
                  {new Date(achievement.unlocked_at).toLocaleDateString('pt-BR')}
                </p>
              )}
            </Card>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
