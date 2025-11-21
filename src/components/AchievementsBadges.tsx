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
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Conquistas</h2>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {unlockedCount}/{totalCount}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.achievement_type}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`p-4 text-center transition-all ${
                achievement.unlocked
                  ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 shadow-lg"
                  : "bg-muted/50 opacity-60 grayscale"
              }`}
            >
              <div className="relative">
                <motion.div
                  className="text-5xl mb-2"
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
                  {achievement.unlocked ? achievement.icon : <Lock className="w-12 h-12 mx-auto text-muted-foreground" />}
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
              
              <h3 className={`font-semibold text-sm mb-1 ${achievement.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                {achievement.title}
              </h3>
              <p className={`text-xs ${achievement.unlocked ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                {achievement.description}
              </p>
              
              {achievement.unlocked && achievement.unlocked_at && (
                <p className="text-xs text-primary mt-2">
                  {new Date(achievement.unlocked_at).toLocaleDateString('pt-BR')}
                </p>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
