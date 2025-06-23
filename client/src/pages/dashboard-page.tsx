import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import DashboardNav from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

const motivationalQuotes = [
  "Push yourself, because no one else is going to do it for you.",
  "Sweat is just fat crying.",
  "Discipline is doing it when you don’t feel like it.",
  "Don’t limit your challenges. Challenge your limits.",
  "Small progress is still progress.",
];
const quote =
  motivationalQuotes[new Date().getDate() % motivationalQuotes.length];
const trendingStyles = [
  "HIIT",
  "Pilates",
  "Mobility",
  "CrossFit",
  "Zone 2 Cardio",
];
const style = trendingStyles[new Date().getDay()];
const healthTips = [
  "Drink a glass of water first thing in the morning.",
  "Sleep at least 7 hours a night.",
  "Take a 10-minute walk after meals.",
  "Add greens to every plate.",
  "Practice mindful breathing for 3 minutes.",
];
const tip = healthTips[new Date().getDate() % healthTips.length];
const fitnessFacts = [
  "Muscle burns more calories than fat, even at rest.",
  "1 lb of fat equals ~3,500 calories.",
  "Stretching improves performance and reduces injury.",
  "Most fitness progress happens during recovery.",
];
const fact = fitnessFacts[new Date().getDay()];

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: weightLogs, isLoading: isLoadingWeightLogs } = useQuery({
    queryKey: ["/api/weight/logs"],
  });

  const { data: dietPlans, isLoading: isLoadingDietPlans } = useQuery({
    queryKey: ["/api/diet/plans"],
  });

  const { data: workoutPlans, isLoading: isLoadingWorkoutPlans } = useQuery({
    queryKey: ["/api/workout/plans"],
  });

  if (isLoadingWeightLogs || isLoadingDietPlans || isLoadingWorkoutPlans) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const weightData = weightLogs
    ?.map((log) => ({
      date: format(new Date(log.date), "MMM d"),
      weight: log.weight,
    }))
    .reverse();

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="pl-64 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name || user?.username}!
            </h1>
            <p className="text-gray-600">
              Track your progress and manage your health journey
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Current Weight"
              value={`${weightLogs?.[0]?.weight || "N/A"} kg`}
              description="Last recorded weight"
            />
            <StatsCard
              title="Daily Motivation"
              value={`“${quote}”`}
              description="Keep pushing forward"
            />
            <StatsCard
              title="Trending Workout"
              value={style}
              description="Try something new this week!"
            />
            <StatsCard
              title="Health Tip"
              value={tip}
              description="Small habits create big change"
            />
            <StatsCard
              title="Did You Know?"
              value={fact}
              description="Fitness facts for curiosity"
            />
          </div>

          {/* Weight Progress Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Weight Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {weightData && weightData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#22c55e"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No weight data recorded yet. Start tracking your progress!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Dashboard ends here */}
        </motion.div>
      </main>
    </div>
  );
}

function StatsCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
