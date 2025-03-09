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
import { format, parseISO } from "date-fns"; // Added parseISO for date handling
import { Loader2 } from "lucide-react";

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

  // Sort weight logs by date in ascending order
  const sortedWeightLogs = weightLogs?.sort((a, b) => new Date(a.date) - new Date(b.date));

  const weightData = sortedWeightLogs?.map((log) => ({
    date: format(parseISO(log.date), "MMM d"), // Use parseISO for consistent date parsing
    weight: log.weight,
  }));


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
              value={`${sortedWeightLogs?.[sortedWeightLogs.length -1]?.weight || "N/A"} kg`} // Show latest weight
              description="Last recorded weight"
            />
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Active Diet Plan</p>
                  {dietPlans?.find(plan => plan.isActive) ? (
                    <p className="font-bold">{dietPlans.find(plan => plan.isActive)?.name}</p>
                  ) : (
                    <p className="text-gray-400">No active plan</p>
                  )}
                  <p className="text-xs text-gray-500">Personalized meal plan</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Active Workout Plan</p>
                  {workoutPlans?.find(plan => plan.isActive) ? (
                    <p className="font-bold">{workoutPlans.find(plan => plan.isActive)?.name}</p>
                  ) : (
                    <p className="text-gray-400">No active plan</p>
                  )}
                  <p className="text-xs text-gray-500">Custom exercise routine</p>
                </div>
              </CardContent>
            </Card>
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

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {i === 0
                          ? "Updated weight log"
                          : i === 1
                          ? "Generated new diet plan"
                          : "Created workout routine"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date().setDate(new Date().getDate() - i), "PPP")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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