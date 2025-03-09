import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Dumbbell, Save, Trash } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

const workoutFormSchema = z.object({
  equipment: z.string(),
  goals: z.string(),
  level: z.string(),
});

export default function WorkoutPlanner() {
  const { toast } = useToast();
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      equipment: "",
      goals: "",
      level: "",
    },
  });

  const { data: workoutPlans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["/api/workout/plans"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof workoutFormSchema>) => {
      const res = await apiRequest("POST", "/api/workout/generate", data);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedPlan(data.plan);
      toast({
        title: "Workout plan generated",
        description: "Your personalized workout plan is ready!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const savePlanMutation = useMutation({
    mutationFn: async (plan: any) => {
      const res = await apiRequest("POST", "/api/workout/plans", {
        name: "Custom Workout Plan",
        plan,
        isAiGenerated: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout/plans"] });
      toast({
        title: "Plan saved",
        description: "Workout plan has been saved to your collection",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      await apiRequest("DELETE", `/api/workout/plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout/plans"] });
      toast({
        title: "Plan deleted",
        description: "Workout plan has been removed from your collection",
      });
    },
  });

  function onSubmit(data: z.infer<typeof workoutFormSchema>) {
    generateMutation.mutate(data);
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="pl-64 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-3xl font-bold mb-8">AI Workout Planner</h1>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Generate New Workout Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="equipment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Equipment</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select equipment availability" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Equipment</SelectItem>
                            <SelectItem value="minimal">Basic Equipment</SelectItem>
                            <SelectItem value="full">Full Gym</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="goals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fitness Goals</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your goal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="strength">Strength</SelectItem>
                            <SelectItem value="endurance">Endurance</SelectItem>
                            <SelectItem value="weight_loss">Weight Loss</SelectItem>
                            <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fitness Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Generate Plan
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {generatedPlan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Generated Workout Plan
                    <Button
                      onClick={() => savePlanMutation.mutate(generatedPlan)}
                      disabled={savePlanMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Plan
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {generatedPlan && typeof generatedPlan === 'object' && (
                      Object.entries(generatedPlan.weeklyWorkoutPlan?.days || generatedPlan).map(([day, exercises]: [string, any]) => (
                        <div key={day} className="border-b pb-4">
                          <h3 className="font-semibold mb-2 capitalize">{day}</h3>
                          <div className="space-y-4">
                            {Array.isArray(exercises) ? (
                              exercises.map((exercise: any, index: number) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                  <h4 className="font-medium mb-1">{exercise.name || 'Exercise'}</h4>
                                  <p className="text-sm text-gray-600">
                                    {exercise.sets && `${exercise.sets} sets`} 
                                    {exercise.reps && ` × ${exercise.reps} reps`}
                                    {exercise.weight && ` @ ${exercise.weight}`}
                                    {exercise.duration && ` for ${exercise.duration}`}
                                  </p>
                                  {exercise.notes && (
                                    <p className="text-xs text-gray-500 mt-1">{exercise.notes}</p>
                                  )}
                                </div>
                              ))
                            ) : typeof exercises === 'object' ? (
                              Object.entries(exercises).map(([name, details]: [string, any], index: number) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                  <h4 className="font-medium mb-1">{name}</h4>
                                  <p className="text-sm text-gray-600">
                                    {typeof details === 'string' 
                                      ? details 
                                      : typeof details === 'object' 
                                        ? JSON.stringify(details) 
                                        : String(details)}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-600">{String(exercises)}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {isLoadingPlans ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : workoutPlans?.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Saved Workout Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workoutPlans.map((plan: any) => (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(plan.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deletePlanMutation.mutate(plan.id)}
                        disabled={deletePlanMutation.isPending}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No saved workout plans yet. Generate your first plan above!</p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}