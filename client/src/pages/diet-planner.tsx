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
import { Loader2, Plus, Save, Trash } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

const dietPlanFormSchema = z.object({
  dietaryPreferences: z.string(),
  goals: z.string(),
});

export default function DietPlanner() {
  const { toast } = useToast();
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(dietPlanFormSchema),
    defaultValues: {
      dietaryPreferences: "",
      goals: "",
    },
  });

  const { data: dietPlans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["/api/diet/plans"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof dietPlanFormSchema>) => {
      const res = await apiRequest("POST", "/api/diet/generate", data);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedPlan(data.plan);
      toast({
        title: "Diet plan generated",
        description: "Your personalized diet plan is ready!",
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
      const res = await apiRequest("POST", "/api/diet/plans", {
        name: "Custom Diet Plan",
        plan,
        isAiGenerated: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diet/plans"] });
      toast({
        title: "Plan saved",
        description: "Diet plan has been saved to your collection",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      await apiRequest("DELETE", `/api/diet/plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diet/plans"] });
      toast({
        title: "Plan deleted",
        description: "Diet plan has been removed from your collection",
      });
    },
  });

  function onSubmit(data: z.infer<typeof dietPlanFormSchema>) {
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
          <h1 className="text-3xl font-bold mb-8">AI Diet Planner</h1>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Generate New Diet Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="dietaryPreferences"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dietary Preferences</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your dietary preference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vegetarian">Vegetarian</SelectItem>
                            <SelectItem value="vegan">Vegan</SelectItem>
                            <SelectItem value="omnivore">Omnivore</SelectItem>
                            <SelectItem value="keto">Keto</SelectItem>
                            <SelectItem value="paleo">Paleo</SelectItem>
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
                            <SelectItem value="weight_loss">Weight Loss</SelectItem>
                            <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="health">General Health</SelectItem>
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
                    Generated Diet Plan
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
                        
                        {/* Display days from different possible structures */}
                        {generatedPlan.days && Array.isArray(generatedPlan.days) ? (
                          // Format for array of day objects
                          generatedPlan.days.map((dayObj: any, index: number) => (
                            <div key={index} className="border-b pb-4">
                              <h3 className="font-semibold mb-2 capitalize">{dayObj.day}</h3>
                              <div className="grid gap-4">
                                {Array.isArray(dayObj.meals) ? (
                                  dayObj.meals.map((meal: any, mealIdx: number) => (
                                    <div key={mealIdx} className="bg-gray-50 p-4 rounded-lg">
                                      {typeof meal === 'string' ? (
                                        <p>{meal}</p>
                                      ) : (
                                        <>
                                          <h4 className="font-medium capitalize mb-2">{meal.name || "Meal"}</h4>
                                          <p>{meal.description || JSON.stringify(meal)}</p>
                                        </>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <p>No detailed meal information available</p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          // Format for weekday object structure
                          Object.entries(generatedPlan.weeklyDietPlan?.days || generatedPlan).map(([day, meals]: [string, any]) => (
                            <div key={day} className="border-b pb-4">
                              <h3 className="font-semibold mb-2 capitalize">{day}</h3>
                              <div className="grid gap-4">
                                {typeof meals === 'object' ? (
                                  Object.entries(meals).map(([meal, details]: [string, any]) => (
                                    <div key={meal} className="bg-gray-50 p-4 rounded-lg">
                                      <h4 className="font-medium capitalize mb-2">{meal}</h4>
                                      {typeof details === 'string' ? (
                                        <p>{details}</p>
                                      ) : (
                                        <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(details, null, 2)}</pre>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <p>{typeof meals === 'string' ? meals : JSON.stringify(meals)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </>
                    )}
                                <p className="text-sm text-gray-600">
                                  {typeof details === 'string' 
                                    ? details 
                                    : typeof details === 'object' 
                                      ? JSON.stringify(details) 
                                      : String(details)}
                                </p>
                              </div>
                            ))}
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
          ) : dietPlans?.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Saved Diet Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dietPlans.map((plan: any) => (
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
                  <Plus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No saved diet plans yet. Generate your first plan above!</p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}