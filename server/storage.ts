import { MongoClient, ObjectId } from 'mongodb';
import { InsertUser, User, DietPlan, WorkoutPlan, WeightLog, Post, Comment, Like } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Add Recipe type
type Recipe = {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string[];
  nutrition: Record<string, string>;
  userId: string;
  createdAt: Date;
  mealType: string;
};

type CreateRecipe = Omit<Recipe, "id" | "userId" | "createdAt">;

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;

  // Password reset operations
  saveResetToken(userId: string, token: string, expiry: Date): Promise<void>;
  getResetToken(token: string): Promise<{ userId: string; expiry: Date } | undefined>;
  deleteResetToken(token: string): Promise<void>;

  // Diet plan operations
  createDietPlan(userId: string, plan: Omit<DietPlan, "id" | "userId">): Promise<DietPlan>;
  getDietPlans(userId: string): Promise<DietPlan[]>;
  updateDietPlan(id: string, data: Partial<DietPlan>): Promise<DietPlan>;
  deleteDietPlan(id: string): Promise<void>;
  deactivateAllDietPlans(userId: string): Promise<void>;
  activateDietPlan(id: string): Promise<DietPlan>;

  // Workout plan operations  
  createWorkoutPlan(userId: string, plan: Omit<WorkoutPlan, "id" | "userId">): Promise<WorkoutPlan>;
  getWorkoutPlans(userId: string): Promise<WorkoutPlan[]>;
  updateWorkoutPlan(id: string, data: Partial<WorkoutPlan>): Promise<WorkoutPlan>;
  deleteWorkoutPlan(id: string): Promise<void>;

  // Weight log operations
  createWeightLog(userId: string, log: Omit<WeightLog, "id" | "userId">): Promise<WeightLog>;
  getWeightLogs(userId: string): Promise<WeightLog[]>;

  // Community operations
  createPost(userId: string, post: Omit<Post, "id" | "userId" | "createdAt">): Promise<Post>;
  getPosts(): Promise<Post[]>;
  deletePost(id: string): Promise<void>;

  createComment(userId: string, postId: string, comment: Omit<Comment, "id" | "userId" | "postId" | "createdAt">): Promise<Comment>;
  getComments(postId: string): Promise<Comment[]>;
  deleteComment(id: string): Promise<void>;

  createLike(userId: string, postId: string): Promise<Like>;
  deleteLike(userId: string, postId: string): Promise<void>;
  getLikes(postId: string): Promise<Like[]>;

  // Recipe operations
  createRecipe(userId: string, recipe: CreateRecipe): Promise<Recipe>;
  getRecipes(userId: string): Promise<Recipe[]>;
  updateRecipe(id: string, data: Partial<Recipe>): Promise<Recipe>;
  deleteRecipe(id: string): Promise<void>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private dietPlans: Map<string, DietPlan> = new Map();
  private workoutPlans: Map<string, WorkoutPlan> = new Map();
  private weightLogs: Map<string, WeightLog> = new Map();
  private posts: Map<string, Post> = new Map();
  private comments: Map<string, Comment> = new Map();
  private likes: Map<string, Like> = new Map();
  private recipes: Map<string, Recipe> = new Map();
  private resetTokens: Map<string, { userId: string; expiry: Date }> = new Map();
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.generateId();
    const user = { id, ...insertUser };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error('User not found');

    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    user.password = hashedPassword;
    this.users.set(userId, user);
  }

  async saveResetToken(userId: string, token: string, expiry: Date): Promise<void> {
    this.resetTokens.set(token, { userId, expiry });
  }

  async getResetToken(token: string): Promise<{ userId: string; expiry: Date } | undefined> {
    return this.resetTokens.get(token);
  }

  async deleteResetToken(token: string): Promise<void> {
    this.resetTokens.delete(token);
  }

  async createDietPlan(userId: string, plan: Omit<DietPlan, "id" | "userId">): Promise<DietPlan> {
    const id = this.generateId();
    const dietPlan = { id, userId, ...plan, isActive: true }; // Ensure new plans are active
    this.dietPlans.set(id, dietPlan);
    return dietPlan;
  }

  async getDietPlans(userId: string): Promise<DietPlan[]> {
    return Array.from(this.dietPlans.values()).filter(plan => plan.userId === userId);
  }

  async updateDietPlan(id: string, data: Partial<DietPlan>): Promise<DietPlan> {
    const plan = this.dietPlans.get(id);
    if (!plan) throw new Error('Diet plan not found');

    const updatedPlan = { ...plan, ...data };
    this.dietPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deleteDietPlan(id: string): Promise<void> {
    this.dietPlans.delete(id);
  }

  async deactivateAllDietPlans(userId: string): Promise<void> {
    for (const [id, plan] of this.dietPlans) {
      if (plan.userId === userId && plan.isActive) {
        plan.isActive = false;
        this.dietPlans.set(id, plan);
      }
    }
  }

  async activateDietPlan(id: string): Promise<DietPlan> {
    const plan = this.dietPlans.get(id);
    if (!plan) throw new Error('Diet plan not found');

    await this.deactivateAllDietPlans(plan.userId); // Deactivate others before activating this one

    const updatedPlan = { ...plan, isActive: true };
    this.dietPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async createWorkoutPlan(userId: string, plan: Omit<WorkoutPlan, "id" | "userId">): Promise<WorkoutPlan> {
    const id = this.generateId();
    const workoutPlan = { id, userId, ...plan };
    this.workoutPlans.set(id, workoutPlan);
    return workoutPlan;
  }

  async getWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
    return Array.from(this.workoutPlans.values()).filter(plan => plan.userId === userId);
  }

  async updateWorkoutPlan(id: string, data: Partial<WorkoutPlan>): Promise<WorkoutPlan> {
    const plan = this.workoutPlans.get(id);
    if (!plan) throw new Error('Workout plan not found');
    
    const updatedPlan = { ...plan, ...data };
    this.workoutPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deleteWorkoutPlan(id: string): Promise<void> {
    this.workoutPlans.delete(id);
  }

  async deactivateAllWorkoutPlans(userId: string): Promise<void> {
    for (const [id, plan] of this.workoutPlans) {
      if (plan.userId === userId && plan.isActive) {
        plan.isActive = false;
        this.workoutPlans.set(id, plan);
      }
    }
  }

  async activateWorkoutPlan(id: string): Promise<WorkoutPlan> {
    const plan = this.workoutPlans.get(id);
    if (!plan) throw new Error('Workout plan not found');

    await this.deactivateAllWorkoutPlans(plan.userId); // Deactivate others before activating this one

    const updatedPlan = { ...plan, isActive: true };
    this.workoutPlans.set(id, updatedPlan);
    return updatedPlan;

    const updatedPlan = { ...plan, ...data };
    this.workoutPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deleteWorkoutPlan(id: string): Promise<void> {
    this.workoutPlans.delete(id);
  }

  async createWeightLog(userId: string, log: Omit<WeightLog, "id" | "userId">): Promise<WeightLog> {
    const id = this.generateId();
    const weightLog = { id, userId, ...log };
    this.weightLogs.set(id, weightLog);
    return weightLog;
  }

  async getWeightLogs(userId: string): Promise<WeightLog[]> {
    return Array.from(this.weightLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createPost(userId: string, post: Omit<Post, "id" | "userId" | "createdAt">): Promise<Post> {
    const id = this.generateId();
    const newPost = { id, userId, ...post, createdAt: new Date() };
    this.posts.set(id, newPost);
    return newPost;
  }

  async getPosts(): Promise<Post[]> {
    return Array.from(this.posts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deletePost(id: string): Promise<void> {
    this.posts.delete(id);
    // Delete associated comments and likes
    Array.from(this.comments.entries())
      .filter(([_, comment]) => comment.postId === id)
      .forEach(([commentId]) => this.comments.delete(commentId));
    Array.from(this.likes.entries())
      .filter(([_, like]) => like.postId === id)
      .forEach(([likeId]) => this.likes.delete(likeId));
  }

  async createComment(userId: string, postId: string, comment: Omit<Comment, "id" | "userId" | "postId" | "createdAt">): Promise<Comment> {
    const id = this.generateId();
    const newComment = { id, userId, postId, ...comment, createdAt: new Date() };
    this.comments.set(id, newComment);
    return newComment;
  }

  async getComments(postId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteComment(id: string): Promise<void> {
    this.comments.delete(id);
  }

  async createLike(userId: string, postId: string): Promise<Like> {
    const id = this.generateId();
    const like = { id, userId, postId, createdAt: new Date() };
    this.likes.set(id, like);
    return like;
  }

  async deleteLike(userId: string, postId: string): Promise<void> {
    const likeToDelete = Array.from(this.likes.entries())
      .find(([_, like]) => like.userId === userId && like.postId === postId);
    if (likeToDelete) {
      this.likes.delete(likeToDelete[0]);
    }
  }

  async getLikes(postId: string): Promise<Like[]> {
    return Array.from(this.likes.values())
      .filter(like => like.postId === postId);
  }

  async createRecipe(userId: string, recipe: CreateRecipe): Promise<Recipe> {
    const id = this.generateId();
    const newRecipe = {
      id,
      userId,
      ...recipe,
      createdAt: new Date(),
    };
    this.recipes.set(id, newRecipe);
    return newRecipe;
  }

  async getRecipes(userId: string): Promise<Recipe[]> {
    return Array.from(this.recipes.values())
      .filter(recipe => recipe.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateRecipe(id: string, data: Partial<Recipe>): Promise<Recipe> {
    const recipe = this.recipes.get(id);
    if (!recipe) throw new Error('Recipe not found');

    const updatedRecipe = { ...recipe, ...data };
    this.recipes.set(id, updatedRecipe);
    return updatedRecipe;
  }

  async deleteRecipe(id: string): Promise<void> {
    this.recipes.delete(id);
  }
}

export const storage = new MemStorage();