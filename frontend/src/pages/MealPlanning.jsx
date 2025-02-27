import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, ChevronRight, Clock, Coffee, Edit, Plus, Salad, Utensils } from 'lucide-react'
import { useUser } from '../context/UserContexts'

const MealCard = ({ meal, time }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">
        {meal}
      </CardTitle>
      <Clock className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{time}</div>
    </CardContent>
  </Card>
)

const RecipeCard = ({ title, description, onClick }) => (
  <Card className="cursor-pointer hover:bg-gray-50" onClick={onClick}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  </Card>
)

const MealPlanning = () => {

  const { user } = useUser()
  const [activeTab, setActiveTab] = useState("mealPlanner")
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  const handleRecipeClick = (recipe) => {
    setSelectedRecipe(recipe)
  }

  const closeRecipeModal = () => {
    setSelectedRecipe(null)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-800 mb-6">Meal Planning and Recommendations</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="mealPlanner">Meal Planner</TabsTrigger>
          <TabsTrigger value="customMeals">Custom Meals</TabsTrigger>
          <TabsTrigger value="recipeSuggestions">Recipe Suggestions</TabsTrigger>
          <TabsTrigger value="ingredientSubstitution">Ingredient Substitution</TabsTrigger>
        </TabsList>

        <TabsContent value="mealPlanner">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Meal Plan</CardTitle>
              <CardDescription>Your personalized meal plan for optimal nutrition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MealCard meal="Breakfast" time="8:00 AM" />
                <MealCard meal="Lunch" time="12:30 PM" />
                <MealCard meal="Snack" time="3:30 PM" />
                <MealCard meal="Dinner" time="7:00 PM" />
              </div>
              <Button className="mt-4">
                Generate Weekly Plan
                <Calendar className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customMeals">
          <Card>
            <CardHeader>
              <CardTitle>Create Custom Meal</CardTitle>
              <CardDescription>Add your own meals to track nutrition</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mealName">Meal Name</Label>
                  <Input id="mealName" placeholder="Enter meal name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ingredients">Ingredients</Label>
                  <Textarea id="ingredients" placeholder="List ingredients (one per line)" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories</Label>
                  <Input id="calories" type="number" placeholder="Enter calorie count" />
                </div>
                <Button type="submit">
                  Add Custom Meal
                  <Plus className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipeSuggestions">
          <Card>
            <CardHeader>
              <CardTitle>Recipe Suggestions</CardTitle>
              <CardDescription>AI-powered recipe ideas based on your preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <RecipeCard
                  title="Quinoa Salad with Roasted Vegetables"
                  description="A nutritious and colorful salad packed with protein and fiber."
                  onClick={() => handleRecipeClick({
                    title: "Quinoa Salad with Roasted Vegetables",
                    ingredients: ["1 cup quinoa", "2 cups mixed vegetables (bell peppers, zucchini, eggplant)", "2 tbsp olive oil", "1 lemon, juiced", "Salt and pepper to taste"],
                    instructions: ["Cook quinoa according to package instructions.", "Preheat oven to 400°F (200°C).", "Chop vegetables and toss with 1 tbsp olive oil, salt, and pepper.", "Roast vegetables for 20-25 minutes.", "Mix cooked quinoa with roasted vegetables, remaining olive oil, and lemon juice.", "Season to taste and serve."]
                  })}
                />
                <RecipeCard
                  title="Grilled Chicken with Avocado Salsa"
                  description="A high-protein, low-carb meal perfect for muscle gain."
                  onClick={() => handleRecipeClick({
                    title: "Grilled Chicken with Avocado Salsa",
                    ingredients: ["2 chicken breasts", "1 avocado", "1 tomato", "1/4 red onion", "1 lime", "Cilantro", "Salt and pepper"],
                    instructions: ["Season chicken with salt and pepper and grill until cooked through.", "Dice avocado, tomato, and red onion.", "Mix diced ingredients with chopped cilantro and lime juice.", "Serve grilled chicken topped with avocado salsa."]
                  })}
                />
                <RecipeCard
                  title="Vegetarian Lentil Curry"
                  description="A hearty, plant-based meal rich in protein and fiber."
                  onClick={() => handleRecipeClick({
                    title: "Vegetarian Lentil Curry",
                    ingredients: ["1 cup red lentils", "1 can coconut milk", "1 onion", "2 cloves garlic", "1 tbsp curry powder", "1 tbsp oil", "Salt to taste"],
                    instructions: ["Sauté diced onion and minced garlic in oil until softened.", "Add curry powder and cook for 1 minute.", "Add lentils and coconut milk, simmer for 20 minutes.", "Season with salt and serve with rice or naan bread."]
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ingredientSubstitution">
          <Card>
            <CardHeader>
              <CardTitle>Ingredient Substitution</CardTitle>
              <CardDescription>Find healthier alternatives for your recipes</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ingredient">Ingredient to Substitute</Label>
                  <Input id="ingredient" placeholder="Enter an ingredient" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dietaryPreference">Dietary Preference</Label>
                  <Select id="dietaryPreference">
                    <option value="">Select preference</option>
                    <option value="lowCarb">Low Carb</option>
                    <option value="lowFat">Low Fat</option>
                    <option value="vegan">Vegan</option>
                    <option value="glutenFree">Gluten Free</option>
                  </Select>
                </div>
                <Button type="submit">
                  Find Substitutes
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Suggested Substitutions:</h3>
                <ul className="list-disc list-inside">
                  <li>Substitute 1</li>
                  <li>Substitute 2</li>
                  <li>Substitute 3</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-800">{selectedRecipe.title}</h2>
              <button onClick={closeRecipeModal} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Ingredients:</h3>
                <ul className="list-disc list-inside">
                  {selectedRecipe.ingredients.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Instructions:</h3>
                <ol className="list-decimal list-inside">
                  {selectedRecipe.instructions.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default MealPlanning;