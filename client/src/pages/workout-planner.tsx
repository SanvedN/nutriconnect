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
import { Loader2, Plus, Save, Trash, Check, Dumbbell } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const workoutFormSchema = z.object({
  equipment: z.string(),
  goals: z.string(),
  level: z.string(),
});

type WorkoutPlan = {
  _id: string;
  name: string;
  plan: any;
  isAiGenerated: boolean;
  isActive?: boolean;
  createdAt: string;
};

export default function WorkoutPlanner() {
  const { toast } = useToast();
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);

  const form = useForm({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      equipment: "",
      goals: "",
      level: "",
    },
  });

  const { data: workoutPlans = [], isLoading: isLoadingPlans } = useQuery<
    WorkoutPlan[]
  >({
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
        name: `Workout Plan - ${new Date().toLocaleDateString()}`,
        plan,
        isAiGenerated: true,
        isActive: false,
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

  const setActiveMutation = useMutation({
    mutationFn: async (planId: string) => {
      await apiRequest("PATCH", `/api/workout/plans/${planId}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/diet/plans"] });
      toast({
        title: "Plan activated",
        description: "This is now your active workout plan",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
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

  function formatWorkoutDisplay(plan: any) {
    if (!plan || !plan.workoutPlan || !plan.workoutPlan.weeklySchedule)
      return null;

    const weeklySchedule = plan.workoutPlan.weeklySchedule;

    return (
      <>
        {/* Display Plan Metadata */}
        <div className="mb-6">
          <p>
            <strong>Goal:</strong> {plan.workoutPlan.goal}
          </p>
          <p>
            <strong>Fitness Level:</strong> {plan.workoutPlan.fitnessLevel}
          </p>
          <p>
            <strong>Equipment:</strong> {plan.workoutPlan.availableEquipment}
          </p>
          {plan.workoutPlan.notes && (
            <p className="mt-2 italic">
              <strong>Notes:</strong> {plan.workoutPlan.notes}
            </p>
          )}
        </div>

        {/* Weekly Schedule */}
        {Object.entries(weeklySchedule).map(([day, dayData]: [string, any]) => (
          <div key={day} className="border-b pb-4 last:border-0">
            <h3 className="font-semibold mb-2 capitalize">{day}</h3>

            {dayData.focus && (
              <p className="text-gray-600 mb-3 italic">
                Focus: {dayData.focus}
              </p>
            )}

            {dayData.warmup && (
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Warmup: </span>
                {dayData.warmup}
              </p>
            )}

            {dayData.exercises && dayData.exercises.length > 0 ? (
              <div className="space-y-3">
                {dayData.exercises.map((exercise: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium">{exercise.name}</h4>
                    <div className="text-gray-600 text-sm">
                      {exercise.sets && <p>Sets: {exercise.sets}</p>}
                      {exercise.reps && <p>Reps: {exercise.reps}</p>}
                      {exercise.duration && (
                        <p>Duration: {exercise.duration}</p>
                      )}
                      {exercise.rest && <p>Rest: {exercise.rest}</p>}
                      {exercise.intensity && (
                        <p>Intensity: {exercise.intensity}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">
                {dayData.description || "No exercises scheduled"}
              </p>
            )}

            {dayData.cooldown && (
              <p className="text-gray-600 mt-2">
                <span className="font-medium">Cooldown: </span>
                {dayData.cooldown}
              </p>
            )}
          </div>
        ))}
      </>
    );
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
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
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
                              <SelectValue placeholder="Select available equipment" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Equipment</SelectItem>
                            <SelectItem value="basic">
                              Basic (Dumbbells, Resistance Bands)
                            </SelectItem>
                            <SelectItem value="home_gym">Home Gym</SelectItem>
                            <SelectItem value="full_gym">
                              Full Gym Access
                            </SelectItem>
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
                            <SelectItem value="hypertrophy">
                              Muscle Growth
                            </SelectItem>
                            <SelectItem value="weight_loss">
                              Weight Loss
                            </SelectItem>
                            <SelectItem value="endurance">Endurance</SelectItem>
                            <SelectItem value="general_fitness">
                              General Fitness
                            </SelectItem>
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
                            <SelectItem value="intermediate">
                              Intermediate
                            </SelectItem>
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
                    {formatWorkoutDisplay(generatedPlan)}
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
                  {workoutPlans.map((plan) => (
                    <div
                      key={plan._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{plan.name}</p>
                          {plan.isActive && (
                            <Badge
                              variant="secondary"
                              className="text-green-600"
                            >
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(plan.createdAt).toLocaleDateString()}
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
                            onClick={() => setActiveMutation.mutate(plan._id)}
                            disabled={setActiveMutation.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deletePlanMutation.mutate(plan._id)}
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
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>
                    No saved workout plans yet. Generate your first plan above!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plan Details Dialog */}
          <Dialog
            open={selectedPlan !== null}
            onOpenChange={() => setSelectedPlan(null)}
          >
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
                  {selectedPlan && formatWorkoutDisplay(selectedPlan.plan)}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </motion.div>
      </main>
    </div>
  );
}
