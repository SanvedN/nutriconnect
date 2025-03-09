import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CookingPot } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const recipeFormSchema = z.object({
  meal: z.string(),
  ingredients: z.string(),
  goals: z.string(),
});

export default function RecipeGenerator() {
  const { toast } = useToast();
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      meal: "",
      ingredients: "",
      goals: "",
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof recipeFormSchema>) => {
      const res = await apiRequest("POST", "/api/recipe/generate", data);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedRecipe(data.recipe);
      toast({
        title: "Recipe generated",
        description: "Your personalized recipe is ready!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate recipe",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: z.infer<typeof recipeFormSchema>) {
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
          <h1 className="text-3xl font-bold mb-8">AI Recipe Generator</h1>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Generate New Recipe</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="meal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meal Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select meal type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="breakfast">Breakfast</SelectItem>
                            <SelectItem value="lunch">Lunch</SelectItem>
                            <SelectItem value="dinner">Dinner</SelectItem>
                            <SelectItem value="snack">Snack</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ingredients"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Ingredients</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter ingredients (comma separated)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="goals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nutritional Goals</FormLabel>
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
                            <SelectItem value="high_protein">High Protein</SelectItem>
                            <SelectItem value="low_carb">Low Carb</SelectItem>
                            <SelectItem value="low_calorie">Low Calorie</SelectItem>
                            <SelectItem value="balanced">Balanced</SelectItem>
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
                    Generate Recipe
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {generatedRecipe ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CookingPot className="h-6 w-6" />
                    {generatedRecipe.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">Ingredients</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {generatedRecipe.ingredients.map((ingredient: string, index: number) => (
                          <li key={index} className="text-gray-600">{ingredient}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Instructions</h3>
                      <ol className="list-decimal list-inside space-y-2">
                        {generatedRecipe.instructions.map((step: string, index: number) => (
                          <li key={index} className="text-gray-600">{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Nutritional Information</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(generatedRecipe.nutrition).map(([key, value]: [string, any]) => (
                          <div key={key}>
                            <p className="text-sm text-gray-500 capitalize">{key}</p>
                            <p className="font-medium">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <CookingPot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Fill out the form above to generate a personalized recipe!</p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}
