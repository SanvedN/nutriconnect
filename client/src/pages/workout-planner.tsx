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
import { Loader2, Dumbbell, Save, Trash, Plus, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, ScrollArea, Badge } from "@/components/ui/dialog"; // Added imports


const workoutFormSchema = z.object({
  equipment: z.string(),
  goals: z.string(),
  level: z.string(),
});

export default function WorkoutPlanner() {
  const { toast } = useToast();
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null); // Added state for selected plan

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

  const setActiveMutation = useMutation({ // Added mutation to set active plan
    mutationFn: async (planId: number) => {
      await apiRequest("PUT", `/api/workout/plans/${planId}/active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout/plans"] });
      toast({
        title: "Plan activated",
        description: "Workout plan is now active"
      })
    }
  })


  function formatPlanDisplay(plan: any) {
    if (!plan) return null;

    // Handle different plan structures
    const days = plan.days || plan.workoutPlan?.days || plan;

    if (Array.isArray(days)) {
      return days.map((day, index) => (
        <div key={index} className="border-b pb-4 last:border-0">
          <h3 className="font-semibold mb-2 capitalize">{day.day || `Day ${index + 1}`}</h3>
          {Array.isArray(day.exercises) ? (
            <div className="space-y-3">
              {day.exercises.map((exercise: any, exIndex: number) => (
                <div key={exIndex} className="bg-gray-50 p-3 rounded-lg">
                  {typeof exercise === 'string' ? (
                    <p>{exercise}</p>
                  ) : (
                    <>
                      <h4 className="font-medium">{exercise.name || 'Exercise'}</h4>
                      <p className="text-gray-600">
                        {exercise.sets && exercise.reps
                          ? `${exercise.sets} sets × ${exercise.reps} reps`
                          : exercise.description || JSON.stringify(exercise)}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <pre className="bg-gray-50 p-3 rounded-lg overflow-x-auto">
              {JSON.stringify(day, null, 2)}
            </pre>
          )}
        </div>
      ));
    }

    // Handle object structure
    return Object.entries(days).map(([day, exercises]) => (
      <div key={day} className="border-b pb-4 last:border-0">
        <h3 className="font-semibold mb-2 capitalize">{day}</h3>
        <div className="space-y-3">
          {Array.isArray(exercises) ?
            exercises.map((exercise: any, idx: number) => (
              <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium capitalize">
                  {typeof exercise === 'string' ? exercise : exercise.name || `Exercise ${idx + 1}`}
                </h4>
                {typeof exercise !== 'string' && (
                  <p className="text-gray-600">
                    {exercise.details || JSON.stringify(exercise, null, 2)}
                  </p>
                )}
              </div>
            ))
            :
            <pre className="bg-gray-50 p-3 rounded-lg overflow-x-auto">
              {JSON.stringify(exercises, null, 2)}
            </pre>
          }
        </div>
      </div>
    ));
  }

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

          {/* Form */}
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
                            <SelectItem value="home">Home/Minimal</SelectItem>
                            <SelectItem value="gym">Full Gym</SelectItem>
                            <SelectItem value="bodyweight">Bodyweight Only</SelectItem>
                            <SelectItem value="resistance_bands">Resistance Bands</SelectItem>
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
                        <FormLabel>Goals</FormLabel>
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
                            <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                            <SelectItem value="weight_loss">Weight Loss</SelectItem>
                            <SelectItem value="endurance">Endurance</SelectItem>
                            <SelectItem value="general_fitness">General Fitness</SelectItem>
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
                              <SelectValue placeholder="Select your fitness level" />
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

          {/* Generated Plan */}
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
                    {formatPlanDisplay(generatedPlan)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Saved Plans */}
          {isLoadingPlans ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : workoutPlans.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Saved Workout Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workoutPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{plan.name}</p>
                          {plan.isActive && (
                            <Badge variant="secondary" className="text-green-600">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : "No date"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPlan(plan)}
                        >
                          View Details
                        </Button>
                        {!plan.isActive && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setActiveMutation.mutate(plan.id)}
                            disabled={setActiveMutation.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deletePlanMutation.mutate(plan.id)}
                          disabled={deletePlanMutation.isPending}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <Plus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No saved workout plans yet. Generate your first plan above!</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plan Details Dialog */}
          <Dialog open={selectedPlan !== null} onOpenChange={() => setSelectedPlan(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>
                  {selectedPlan?.name}
                  {selectedPlan?.isActive && (
                    <Badge variant="secondary" className="ml-2 text-green-600">
                      Active Plan
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-full max-h-[calc(80vh-100px)] pr-4">
                <div className="space-y-6">
                  {selectedPlan && formatPlanDisplay(selectedPlan.plan)}
                </div>
              </ScrollArea>
              <Button onClick={()=> setSelectedPlan(null)}>Close</Button>
            </DialogContent>
          </Dialog>
        </motion.div>
      </main>
    </div>
  );
}