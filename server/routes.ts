import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import {
  insertDietPlanSchema,
  insertWorkoutPlanSchema,
  insertWeightLogSchema,
  insertPostSchema,
  insertCommentSchema,
} from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Middleware to ensure user is authenticated
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Recipe routes
  app.post("/api/recipes/generate", requireAuth, async (req, res) => {
    try {
      const { meal, ingredients, goals } = req.body;
      const prompt = `Generate a recipe for ${meal} using these ingredients: ${ingredients}, aligned with goals: ${goals}. Include preparation steps, macros and calories. Format as JSON with the following structure:

      {
        "name": "Recipe Name",
        "ingredients": ["ingredient1", "ingredient2"],
        "instructions": ["step1", "step2"],
        "nutrition": {
          "calories": "amount",
          "protein": "amount",
          "carbs": "amount",
          "fat": "amount"
        }
      }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;

      console.log("Full AI Response:", JSON.stringify(response, null, 2)); // Debugging

      let recipeText =
        response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!recipeText) throw new Error("AI response is empty or malformed");

      // Remove unwanted formatting (Markdown code blocks)
      recipeText = recipeText.replace(/^```json\n?|```$/g, "").trim();
      recipeText = recipeText.replace(/^```\n?|```$/g, "").trim();

      // Add extra safety for malformed JSON
      // Sometimes AI might include explanatory text before or after the JSON
      const jsonMatch = recipeText.match(/(\{.*\})/s);
      if (jsonMatch && jsonMatch[0]) {
        recipeText = jsonMatch[0];
      }

      // Parse JSON safely
      let recipe;
      try {
        recipe = JSON.parse(recipeText);
      } catch (jsonError) {
        console.error("JSON Parsing Error:", jsonError, "Text:", recipeText);

        // Fallback to a structured response if parsing fails
        recipe = {
          name: "Simple Recipe (AI response parsing failed)",
          ingredients: ["Please try again with more specific ingredients"],
          instructions: ["The AI response could not be properly formatted"],
          nutrition: {
            calories: "N/A",
            protein: "N/A",
            carbs: "N/A",
            fat: "N/A"
          }
        };
      }

      res.json({ recipe });
    } catch (error) {
      console.error("Recipe generation error:", error);
      res
        .status(500)
        .json({ message: "Failed to generate recipe", error: error.message });
    }
  });

  app.post("/api/recipes", requireAuth, async (req, res) => {
    try {
      // Convert string arrays back to proper format if they're stringified
      const recipe = {
        ...req.body,
        ingredients: Array.isArray(req.body.ingredients)
          ? req.body.ingredients
          : req.body.ingredients.split("\n"),
        instructions: Array.isArray(req.body.instructions)
          ? req.body.instructions
          : req.body.instructions.split("\n"),
      };

      const savedRecipe = await storage.createRecipe(req.user!.id, recipe);
      res.json(savedRecipe);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/recipes", requireAuth, async (req, res) => {
    try {
      const recipes = await storage.getRecipes(req.user!.id);
      res.json(recipes);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Diet plan routes
  app.post("/api/diet/generate", requireAuth, async (req, res) => {
    try {
      const { dietaryPreferences, goals } = req.body;
      const prompt = `Generate a weekly diet plan with the following preferences: ${dietaryPreferences} and goals: ${goals}. Include macro details and meal timings. Format as valid JSON without any additional text.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;

      let planText = response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!planText) throw new Error("AI response is empty or malformed");

      // Remove any code block formatting
      planText = planText.replace(/^```json\n?|```$/g, "").trim();
      planText = planText.replace(/^```\n?|```$/g, "").trim();

      // Extract JSON if embedded in text
      const jsonMatch = planText.match(/(\{.*\})/s);
      if (jsonMatch && jsonMatch[0]) {
        planText = jsonMatch[0];
      }

      // Parse JSON safely
      let plan;
      try {
        plan = JSON.parse(planText);
      } catch (jsonError) {
        console.error("JSON Parsing Error:", jsonError, "Text:", planText);
        // Provide a fallback structured response
        plan = {
          title: "Weekly Diet Plan (AI response parsing failed)",
          message: "Please try again with more specific dietary preferences",
          days: [
            { day: "Example", meals: ["Please try generating again"] }
          ]
        };
      }

      res.json({ plan });
    } catch (error) {
      console.error("Diet plan generation error:", error);
      res.status(500).json({ message: "Failed to generate diet plan", error: error.message });
    }
  });

  app.patch("/api/diet/plans/:id/activate", requireAuth, async (req, res) => {
    try {
      // First deactivate any currently active plan
      await storage.deactivateAllDietPlans(req.user!.id);

      // Then activate the selected plan
      const plan = await storage.activateDietPlan(req.params.id);
      res.json(plan);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post("/api/diet/plans", requireAuth, async (req, res) => {
    try {
      const validated = insertDietPlanSchema.parse(req.body);
      const plan = await storage.createDietPlan(req.user!.id, {
        ...validated,
        isActive: false // Ensure new plans are not active by default
      });
      res.json(plan);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/diet/plans", requireAuth, async (req, res) => {
    const plans = await storage.getDietPlans(req.user!.id);
    res.json(plans);
  });
  // Workout plan routes
  app.post("/api/workout/plans", requireAuth, async (req, res) => {
    try {
      const validated = insertWorkoutPlanSchema.parse(req.body);
      const plan = await storage.createWorkoutPlan(req.user!.id, validated);
      res.json(plan);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post("/api/workout/generate", requireAuth, async (req, res) => {
    try {
      const { equipment, goals, level } = req.body;
      const prompt = `Generate a weekly workout plan with available equipment: ${equipment}, goals: ${goals}, and fitness level: ${level}. Include exercises, sets, reps and rest periods. Format as valid JSON without any additional text.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;

      let planText = response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!planText) throw new Error("AI response is empty or malformed");

      // Remove any code block formatting
      planText = planText.replace(/^```json\n?|```$/g, "").trim();
      planText = planText.replace(/^```\n?|```$/g, "").trim();

      // Extract JSON if embedded in text
      const jsonMatch = planText.match(/(\{.*\})/s);
      if (jsonMatch && jsonMatch[0]) {
        planText = jsonMatch[0];
      }

      // Parse JSON safely
      let plan;
      try {
        plan = JSON.parse(planText);
      } catch (jsonError) {
        console.error("JSON Parsing Error:", jsonError, "Text:", planText);
        // Provide a fallback structured response
        plan = {
          title: "Weekly Workout Plan (AI response parsing failed)",
          message: "Please try again with more specific parameters",
          days: [
            { day: "Example", exercises: ["Please try generating again"] }
          ]
        };
      }

      res.json({ plan });
    } catch (error) {
      console.error("Workout plan generation error:", error);
      res.status(500).json({ message: "Failed to generate workout plan", error: error.message });
    }
  });

  app.patch("/api/workout/plans/:id/activate", requireAuth, async (req, res) => {
    try {
      // First deactivate any currently active plan
      await storage.deactivateAllWorkoutPlans(req.user!.id);

      // Then activate the selected plan
      const plan = await storage.activateWorkoutPlan(req.params.id);
      res.json(plan);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/workout/plans/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteWorkoutPlan(req.params.id);
      res.sendStatus(200);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/workout/plans", requireAuth, async (req, res) => {
    const plans = await storage.getWorkoutPlans(req.user!.id);
    res.json(plans);
  });

  // Weight log routes
  app.post("/api/weight/logs", requireAuth, async (req, res) => {
    try {
      // Ensure we're handling both Date objects and ISO strings
      const weightData = {
        weight: Number(req.body.weight),
        date: req.body.date instanceof Date ? req.body.date : new Date(req.body.date)
      };
      const log = await storage.createWeightLog(req.user!.id, weightData);
      res.json(log);
    } catch (error) {
      console.error("Weight log error:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/weight/logs", requireAuth, async (req, res) => {
    const logs = await storage.getWeightLogs(req.user!.id);
    res.json(logs);
  });

  // Community routes
  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const validated = insertPostSchema.parse(req.body);
      const post = await storage.createPost(req.user!.id, validated);
      res.json(post);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/posts", requireAuth, async (req, res) => {
    const posts = await storage.getPosts();
    res.json(posts);
  });

  app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      await storage.deletePost(parseInt(req.params.id));
      res.sendStatus(200);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post("/api/posts/:postId/comments", requireAuth, async (req, res) => {
    try {
      const validated = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(
        req.user!.id,
        parseInt(req.params.postId),
        validated,
      );
      res.json(comment);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/posts/:postId/comments", requireAuth, async (req, res) => {
    const comments = await storage.getComments(parseInt(req.params.postId));
    res.json(comments);
  });

  app.post("/api/posts/:postId/likes", requireAuth, async (req, res) => {
    try {
      const like = await storage.createLike(
        req.user!.id,
        parseInt(req.params.postId),
      );
      res.json(like);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/posts/:postId/likes", requireAuth, async (req, res) => {
    try {
      await storage.deleteLike(req.user!.id, parseInt(req.params.postId));
      res.sendStatus(200);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/posts/:postId/likes", requireAuth, async (req, res) => {
    const likes = await storage.getLikes(parseInt(req.params.postId));
    res.json(likes);
  });

  const httpServer = createServer(app);
  return httpServer;
}