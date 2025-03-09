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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Save, Trash } from "lucide-react";

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

  // Display all saved plans
  const { data: savedPlans = [], isLoading: isLoadingSavedPlans } = useQuery({
    queryKey: ["/api/workout/plans"],
  });

  // Get active plan
  const { data: activePlan, isLoading: isLoadingActivePlan } = useQuery({
    queryKey: ["/api/workout/plans/active"],
    retry: false,
    enabled: true,
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
                      <>
                        {/* Display title if available */}
                        {generatedPlan.title && (
                          <h2 className="text-xl font-bold">{generatedPlan.title}</h2>
                        )}

                        {/* Handle different possible data structures */}
                        {generatedPlan.days && Array.isArray(generatedPlan.days) ? (
                          // Format for array of day objects
                          generatedPlan.days.map((dayObj: any, index: number) => (
                            <div key={index} className="border-b pb-4">
                              <h3 className="font-semibold mb-2 capitalize">{dayObj.day}</h3>
                              <div className="grid gap-4">
                                {Array.isArray(dayObj.exercises) ? (
                                  dayObj.exercises.map((exercise: any, exIndex: number) => (
                                    <div key={exIndex} className="bg-gray-50 p-4 rounded-lg">
                                      {typeof exercise === 'string' ? (
                                        <p>{exercise}</p>
                                      ) : (
                                        <>
                                          <h4 className="font-medium mb-2">{exercise.name || "Exercise"}</h4>
                                          {exercise.sets && <p className="text-sm">Sets: {exercise.sets}</p>}
                                          {exercise.reps && <p className="text-sm">Reps: {exercise.reps}</p>}
                                          {exercise.rest && <p className="text-sm">Rest: {exercise.rest}</p>}
                                          {exercise.notes && <p className="text-sm mt-2 italic">{exercise.notes}</p>}
                                          {!exercise.sets && !exercise.reps && (
                                            <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(exercise, null, 2)}</pre>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <p>No detailed exercise information available</p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          // Format for weekday object structure
                          Object.entries(generatedPlan.weeklyWorkout?.days || generatedPlan).map(([day, exercises]: [string, any]) => (
                            <div key={day} className="border-b pb-4">
                              <h3 className="font-semibold mb-2 capitalize">{day}</h3>
                              <div className="grid gap-4">
                                {Array.isArray(exercises) ? (
                                  exercises.map((exercise: any, index: number) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                      <h4 className="font-medium mb-2">{exercise.name}</h4>
                                      <p className="text-sm">Sets: {exercise.sets}, Reps: {exercise.reps}</p>
                                      {exercise.rest && <p className="text-sm">Rest: {exercise.rest}</p>}
                                      {exercise.notes && <p className="text-sm mt-2 italic">{exercise.notes}</p>}
                                    </div>
                                  ))
                                ) : (
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    {typeof exercises === 'string' ? (
                                      <p>{exercises}</p>
                                    ) : (
                                      <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(exercises, null, 2)}</pre>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Active Workout Plan */}
          {activePlan && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Your Active Workout Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h3 className="text-lg font-medium mb-2">{activePlan.name}</h3>
                  <div className="space-y-4">
                    {Object.entries(activePlan.plan).map(([day, exercises]) => (
                      <div key={day} className="border-t pt-2">
                        <h4 className="font-medium capitalize">{day}</h4>
                        <div className="pl-4">
                          {Array.isArray(exercises) ? exercises.map((exercise, i) => (
                            <div key={i} className="mt-2">
                              <p className="text-sm">{typeof exercise === 'string' ? exercise : JSON.stringify(exercise)}</p>
                            </div>
                          )) : (
                            <p className="text-sm">{JSON.stringify(exercises)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
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

          {/* Display saved plans */}
          {savedPlans?.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Your Saved Workout Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {savedPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="p-4 border rounded-lg bg-muted/50"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-medium">{plan.name}</h3>
                        <div className="flex items-center space-x-2">
                          {plan.isActive ? (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await apiRequest("POST", `/api/workout/plans/${plan.id}/activate`);
                                  queryClient.invalidateQueries({ queryKey: ["/api/workout/plans"] });
                                  queryClient.invalidateQueries({ queryKey: ["/api/workout/plans/active"] });
                                  toast({
                                    title: "Plan activated",
                                    description: "Workout plan set as active",
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to activate plan",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        Created on {format(new Date(plan.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}