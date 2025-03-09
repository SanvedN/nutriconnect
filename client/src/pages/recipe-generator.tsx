import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CookingPot, Plus, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const recipeFormSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  ingredients: z.string().min(1, "Ingredients are required"),
  instructions: z.string().min(1, "Instructions are required"),
  nutritionalGoals: z.string().optional(),
  mealType: z.string().min(1, "Meal type is required"),
});

const generateFormSchema = z.object({
  meal: z.string().min(1, "Meal type is required"),
  ingredients: z.string().min(1, "Ingredients are required"),
  goals: z.string().min(1, "Nutritional goals are required"),
});

type Recipe = {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string[];
  nutrition: Record<string, string>;
  userId: string;
  createdAt: string;
};

export default function RecipeGenerator() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("generate");
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);

  // Form for AI generation
  const generateForm = useForm({
    resolver: zodResolver(generateFormSchema),
    defaultValues: {
      meal: "",
      ingredients: "",
      goals: "",
    },
  });

  // Form for manual creation
  const createForm = useForm({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: "",
      ingredients: "",
      instructions: "",
      nutritionalGoals: "",
      mealType: "",
    },
  });

  // Get saved recipes
  const { data: savedRecipes = [], isLoading: isLoadingRecipes } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof generateFormSchema>) => {
      const res = await apiRequest("POST", "/api/recipes/generate", data);
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

  const createRecipeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof recipeFormSchema>) => {
      const res = await apiRequest("POST", "/api/recipes", {
        ...data,
        ingredients: data.ingredients.split('\n'),
        instructions: data.instructions.split('\n'),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      createForm.reset();
      toast({
        title: "Recipe created",
        description: "Your recipe has been saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create recipe",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveGeneratedMutation = useMutation({
    mutationFn: async (recipe: any) => {
      const res = await apiRequest("POST", "/api/recipes", {
        name: recipe.name,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        nutritionalGoals: recipe.nutrition,
        mealType: generateForm.getValues("meal"),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Recipe saved",
        description: "The generated recipe has been saved to your collection",
      });
    },
  });

  function onSubmitGenerate(data: z.infer<typeof generateFormSchema>) {
    generateMutation.mutate(data);
  }

  function onSubmitCreate(data: z.infer<typeof recipeFormSchema>) {
    createRecipeMutation.mutate(data);
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
          <h1 className="text-3xl font-bold mb-8">Recipe Manager</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="generate">AI Generate</TabsTrigger>
              <TabsTrigger value="create">Create Recipe</TabsTrigger>
            </TabsList>

            <TabsContent value="generate">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Generate New Recipe</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...generateForm}>
                    <form onSubmit={generateForm.handleSubmit(onSubmitGenerate)} className="space-y-6">
                      <FormField
                        control={generateForm.control}
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
                        control={generateForm.control}
                        name="ingredients"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Available Ingredients</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter ingredients (one per line)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generateForm.control}
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
            </TabsContent>

            <TabsContent value="create">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Create New Recipe</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-6">
                      <FormField
                        control={createForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipe Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter recipe name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createForm.control}
                        name="mealType"
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
                        control={createForm.control}
                        name="ingredients"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ingredients</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter ingredients (one per line)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createForm.control}
                        name="instructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instructions</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter instructions (one per line)"
                                className="min-h-[150px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createForm.control}
                        name="nutritionalGoals"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nutritional Information</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter nutritional information"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={createRecipeMutation.isPending}
                      >
                        {createRecipeMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Recipe
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Generated Recipe Display */}
          {generatedRecipe && activeTab === "generate" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CookingPot className="h-6 w-6" />
                    {generatedRecipe.name}
                  </CardTitle>
                  <Button
                    onClick={() => saveGeneratedMutation.mutate(generatedRecipe)}
                    disabled={saveGeneratedMutation.isPending}
                  >
                    {saveGeneratedMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Recipe
                  </Button>
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
          )}

          {/* Saved Recipes List */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Your Recipes</h2>
            {isLoadingRecipes ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : savedRecipes.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {savedRecipes.map((recipe) => (
                  <Card key={recipe.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CookingPot className="h-5 w-5" />
                        {recipe.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500 mb-2">
                        Created on {new Date(recipe.createdAt).toLocaleDateString()}
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-medium">Ingredients:</h4>
                        <ul className="list-disc list-inside">
                          {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                            <li key={index} className="text-sm text-gray-600">{ingredient}</li>
                          ))}
                          {recipe.ingredients.length > 3 && (
                            <li className="text-sm text-gray-400">
                              +{recipe.ingredients.length - 3} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <CookingPot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No recipes saved yet. Create one or generate with AI!</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}