import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import DashboardNav from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Scale } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

const weightLogSchema = z.object({
  weight: z.string().transform((val) => parseInt(val, 10)),
  date: z.string().transform((val) => new Date(val)),
});

export default function WeightLog() {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(weightLogSchema),
    defaultValues: {
      weight: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const { data: weightLogs, isLoading } = useQuery({
    queryKey: ["/api/weight/logs"],
  });

  const addWeightMutation = useMutation({
    mutationFn: async (data: z.infer<typeof weightLogSchema>) => {
      const res = await apiRequest("POST", "/api/weight/logs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weight/logs"] });
      form.reset();
      toast({
        title: "Weight logged",
        description: "Your weight has been recorded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to log weight",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: z.infer<typeof weightLogSchema>) {
    addWeightMutation.mutate(data);
  }

  const chartData = weightLogs
    ?.map((log: any) => ({
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
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-3xl font-bold mb-8">Weight Tracking</h1>

          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Log New Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Enter weight" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={addWeightMutation.isPending}
                    >
                      {addWeightMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Log Weight
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                  </div>
                ) : weightLogs?.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Current Weight</p>
                      <p className="text-2xl font-bold">
                        {weightLogs[0].weight} kg
                      </p>
                    </div>
                    {weightLogs.length > 1 && (
                      <div>
                        <p className="text-sm text-gray-500">Weight Change</p>
                        <p className="text-2xl font-bold">
                          {(weightLogs[0].weight - weightLogs[weightLogs.length - 1].weight).toFixed(1)} kg
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Scale className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No weight data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Weight Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : chartData?.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
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
                <div className="text-center text-gray-500 py-8">
                  <p>Start logging your weight to see progress</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weight History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : weightLogs?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Weight (kg)</TableHead>
                      <TableHead>Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weightLogs.map((log: any, index: number) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{log.weight}</TableCell>
                        <TableCell>
                          {index < weightLogs.length - 1 ? (
                            <span
                              className={
                                log.weight - weightLogs[index + 1].weight > 0
                                  ? "text-red-500"
                                  : "text-green-500"
                              }
                            >
                              {(log.weight - weightLogs[index + 1].weight).toFixed(1)} kg
                            </span>
                          ) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No weight logs found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
