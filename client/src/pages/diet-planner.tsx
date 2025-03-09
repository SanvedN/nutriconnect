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
import { Loader2, Plus, Save, Trash, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const dietPlanFormSchema = z.object({
  dietaryPreferences: z.string(),
  goals: z.string(),
});

type DietPlan = {
  id: string;
  name: string;
  plan: any;
  isAiGenerated: boolean;
  isActive?: boolean;
  createdAt: string;
};

export default function DietPlanner() {
  const { toast } = useToast();
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<DietPlan | null>(null);

  const form = useForm({
    resolver: zodResolver(dietPlanFormSchema),
    defaultValues: {
      dietaryPreferences: "",
      goals: "",
    },
  });

  const { data: dietPlans = [], isLoading: isLoadingPlans } = useQuery<DietPlan[]>({
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
        name: `Diet Plan - ${new Date().toLocaleDateString()}`,
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

  const setActiveMutation = useMutation({
    mutationFn: async (planId: string) => {
      await apiRequest("PATCH", `/api/diet/plans/${planId}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diet/plans"] });
      toast({
        title: "Plan activated",
        description: "This is now your active diet plan",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
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

  function formatPlanDisplay(plan: any) {
    if (!plan) return null;

    // Handle different plan structures
    const days = plan.days || plan.weeklyPlan?.days || plan;

    if (Array.isArray(days)) {
      return days.map((day, index) => (
        <div key={index} className="border-b pb-4 last:border-0">
          <h3 className="font-semibold mb-2 capitalize">{day.day || `Day ${index + 1}`}</h3>
          {Array.isArray(day.meals) ? (
            <div className="space-y-3">
              {day.meals.map((meal: any, mealIndex: number) => (
                <div key={mealIndex} className="bg-gray-50 p-3 rounded-lg">
                  {typeof meal === 'string' ? (
                    <p>{meal}</p>
                  ) : (
                    <>
                      <h4 className="font-medium">{meal.name || 'Meal'}</h4>
                      {meal.description ? (
                        <p className="text-gray-600">{meal.description}</p>
                      ) : meal.foods ? (
                        <ul className="list-disc pl-5 mt-2 text-gray-600">
                          {meal.foods.map((food: string, i: number) => (
                            <li key={i}>{food}</li>
                          ))}
                        </ul>
                      ) : (
                        <div>
                          {Object.entries(meal).map(([key, value]) => {
                            if (key === 'name') return null;
                            return (
                              <div key={key} className="mt-1">
                                <strong className="capitalize">{key}:</strong>{" "}
                                {typeof value === 'string' ? value : 
                                 Array.isArray(value) ? (
                                   <ul className="list-disc pl-5 mt-1">
                                     {value.map((item: string, i: number) => (
                                       <li key={i}>{item}</li>
                                     ))}
                                   </ul>
                                 ) : JSON.stringify(value)}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-3 rounded-lg">
              {Object.entries(day).map(([key, value], idx) => {
                if (key === 'day') return null;
                return (
                  <div key={idx} className="mb-3">
                    <h4 className="font-medium capitalize">{key}</h4>
                    {typeof value === 'string' ? (
                      <p className="text-gray-600">{value}</p>
                    ) : Array.isArray(value) ? (
                      <ul className="list-disc pl-5 mt-1 text-gray-600">
                        {value.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">{JSON.stringify(value)}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ));
    }

    // Handle object structure (days of the week)
    if (days && typeof days === 'object') {
      return Object.entries(days).map(([day, meals], dayIndex) => (
        <div key={dayIndex} className="border-b pb-4 last:border-0">
          <h3 className="font-semibold mb-2 capitalize">{day}</h3>
          <div className="space-y-3">
            {Object.entries(meals as any).map(([mealName, details], idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium capitalize">{mealName}</h4>
                {typeof details === 'string' ? (
                  <p className="text-gray-600">{details}</p>
                ) : Array.isArray(details) ? (
                  <ul className="list-disc pl-5 mt-1 text-gray-600">
                    {details.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : typeof details === 'object' ? (
                  <div className="mt-2">
                    {Object.entries(details as any).map(([subKey, subValue], subIdx) => (
                      <div key={subIdx} className="mb-1">
                        <strong className="capitalize">{subKey}:</strong>{" "}
                        {typeof subValue === 'string' ? subValue : 
                         Array.isArray(subValue) ? (
                           <ul className="list-disc pl-5 mt-1">
                             {subValue.map((item: string, i: number) => (
                               <li key={i}>{item}</li>
                             ))}
                           </ul>
                         ) : JSON.stringify(subValue)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">{JSON.stringify(details)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ));
    }
    
    // Fallback for any other structure
    return (
      <div className="bg-gray-50 p-3 rounded-lg">
        <p>Plan structure is not recognized. Please check the format.</p>
      </div>
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
                    {formatPlanDisplay(generatedPlan)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {isLoadingPlans ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : dietPlans.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Saved Diet Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dietPlans.map((plan) => (
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
                  <p>No saved diet plans yet. Generate your first plan above!</p>
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
            </DialogContent>
          </Dialog>
        </motion.div>
      </main>
    </div>
  );
}