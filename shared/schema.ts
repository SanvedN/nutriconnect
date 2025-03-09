import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Update schema to use string IDs for MongoDB compatibility
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Changed from serial to text for MongoDB _id
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  age: integer("age"),
  weight: integer("weight"),
  height: integer("height"),
  activityLevel: text("activity_level"),
  fitnessGoals: text("fitness_goals"),
  dietaryPreferences: text("dietary_preferences"),
  targetWeight: integer("target_weight"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
});

// Update all tables to use string IDs
export const dietPlans = pgTable("diet_plans", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  plan: json("plan").notNull(),
  isAiGenerated: boolean("is_ai_generated").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workoutPlans = pgTable("workout_plans", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  plan: json("plan").notNull(),
  isAiGenerated: boolean("is_ai_generated").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const weightLogs = pgTable("weight_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  weight: integer("weight").notNull(),
  date: timestamp("date").notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull(),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const likes = pgTable("likes", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
  age: true,
  weight: true,
  height: true,
  activityLevel: true,
  fitnessGoals: true,
  dietaryPreferences: true,
  targetWeight: true,
  resetToken: true,
  resetTokenExpiry: true,
});

export const insertDietPlanSchema = createInsertSchema(dietPlans).pick({
  name: true,
  plan: true,
  isAiGenerated: true,
});

export const insertWorkoutPlanSchema = createInsertSchema(workoutPlans).pick({
  name: true,
  plan: true,
  isAiGenerated: true,
});

export const insertWeightLogSchema = z.object({
  weight: z.number().positive("Weight must be greater than 0"),
  date: z.date()
});

export const insertPostSchema = createInsertSchema(posts).pick({
  content: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type DietPlan = typeof dietPlans.$inferSelect;
export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type WeightLog = typeof weightLogs.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Like = typeof likes.$inferSelect;