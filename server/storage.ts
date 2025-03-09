import { MongoClient, ObjectId } from 'mongodb';
import { InsertUser, User, DietPlan, WorkoutPlan, WeightLog, Post, Comment, Like } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = "nutriconnect";

let mongoClient: MongoClient | null = null;
let mongoInitialized = false;

// Explicit initialization function to be called during server startup
async function initMongoDB() {
  if (!mongoInitialized) {
    try {
      // Configure MongoDB client with proper options
      mongoClient = new MongoClient(MONGODB_URI, {
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 10000,
        ssl: true
      });
      
      await mongoClient.connect();
      console.log("Connected to MongoDB");
      mongoInitialized = true;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      // Fall back to memory storage if MongoDB connection fails
      mongoClient = null;
      throw error; // Let the caller handle this error
    }
  }
  return mongoClient;
}

async function getMongoClient() {
  if (!mongoClient && !mongoInitialized) {
    try {
      await initMongoDB();
    } catch (error) {
      console.error("Failed to get MongoDB client:", error);
    }
  }
  return mongoClient;
}

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
  
  // MongoDB collections
  private async getUsersCollection() {
    try {
      const client = await getMongoClient();
      if (client) return client.db(DB_NAME).collection<User>('users');
      return null;
    } catch (error) {
      console.error("Failed to get users collection:", error);
      return null;
    }
  }
  
  private async getPostsCollection() {
    try {
      const client = await getMongoClient();
      if (client) return client.db(DB_NAME).collection<Post>('posts');
      return null;
    } catch (error) {
      console.error("Failed to get posts collection:", error);
      return null;
    }
  }
  
  private async getLikesCollection() {
    try {
      const client = await getMongoClient();
      if (client) return client.db(DB_NAME).collection<Like>('likes');
      return null;
    } catch (error) {
      console.error("Failed to get likes collection:", error);
      return null;
    }
  }

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
    if (!this.dietPlans.has(id)) {
      throw new Error('Diet plan not found');
    }
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

  async deleteWorkoutPlan(id: string): Promise<void> {
    if (!this.workoutPlans.has(id)) {
      throw new Error('Workout plan not found');
    }
    this.workoutPlans.delete(id);
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

    await this.deactivateAllWorkoutPlans(plan.userId);

    const activatedPlan = { ...plan, isActive: true };
    this.workoutPlans.set(id, activatedPlan);
    return activatedPlan;
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
      .sort((a, b) => {
        // First compare by date (newest first)
        const dateComparison = b.date.getTime() - a.date.getTime();
        // If dates are the same, use the ID (which is based on creation time)
        return dateComparison === 0 ? b.id.localeCompare(a.id) : dateComparison;
      });
  }

  async createPost(userId: string, post: Omit<Post, "id" | "userId" | "createdAt">): Promise<Post> {
    // Try to use MongoDB first, fallback to memory storage
    const postsCollection = await this.getPostsCollection();
    const id = this.generateId();
    const newPost = { id, userId, ...post, createdAt: new Date() };
    
    if (postsCollection) {
      try {
        await postsCollection.insertOne(newPost as any);
        return newPost;
      } catch (error) {
        console.error("MongoDB createPost error:", error);
        // Fall back to memory storage
      }
    }
    
    // Memory storage fallback
    this.posts.set(id, newPost);
    return newPost;
  }

  async getPosts(): Promise<Post[]> {
    // Try to use MongoDB first, fallback to memory storage
    try {
      const postsCollection = await this.getPostsCollection();
      
      if (postsCollection) {
        try {
          const posts = await postsCollection.find().sort({ createdAt: -1 }).toArray();
          return posts.map(post => ({ 
            ...post, 
            id: post.id || post._id.toString(),
            createdAt: new Date(post.createdAt)
          }));
        } catch (error) {
          console.error("MongoDB getPosts error:", error);
          // Fall back to memory storage
        }
      }
    } catch (error) {
      console.error("Failed to get posts collection:", error);
      // Continue to memory storage fallback
    }
    
    // Memory storage fallback
    console.log("Using memory storage for posts");
    return Array.from(this.posts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deletePost(id: string): Promise<void> {
    try {
      // Try to use MongoDB first, fallback to memory storage
      const postsCollection = await this.getPostsCollection();
      const likesCollection = await this.getLikesCollection();
      
      if (postsCollection) {
        try {
          const result = await postsCollection.deleteOne({ id });
          console.log(`MongoDB delete post result: ${result.deletedCount} document(s) deleted`);
          
          // Delete associated likes
          if (likesCollection) {
            const likeResult = await likesCollection.deleteMany({ postId: id });
            console.log(`MongoDB delete likes result: ${likeResult.deletedCount} document(s) deleted`);
          }
          
          return;
        } catch (error) {
          console.error("MongoDB deletePost error:", error);
          // Fall back to memory storage
        }
      }
    } catch (error) {
      console.error("Failed to get collections for delete:", error);
    }
    
    // Memory storage fallback
    console.log(`Deleting post ${id} from memory storage`);
    this.posts.delete(id);
    
    // Delete associated likes
    let deletedCount = 0;
    Array.from(this.likes.entries())
      .filter(([_, like]) => like.postId === id)
      .forEach(([likeId]) => {
        this.likes.delete(likeId);
        deletedCount++;
      });
    console.log(`Deleted ${deletedCount} likes from memory storage`);
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
    // First check if the user already liked this post
    const existingLikes = await this.getLikes(postId);
    if (existingLikes.some(like => like.userId === userId)) {
      throw new Error('User already liked this post');
    }
    
    // Try to use MongoDB first, fallback to memory storage
    const likesCollection = await this.getLikesCollection();
    const id = this.generateId();
    const like = { id, userId, postId, createdAt: new Date() };
    
    if (likesCollection) {
      try {
        await likesCollection.insertOne(like as any);
        return like;
      } catch (error) {
        console.error("MongoDB createLike error:", error);
        // Fall back to memory storage
      }
    }
    
    // Memory storage fallback
    this.likes.set(id, like);
    return like;
  }

  async deleteLike(userId: string, postId: string): Promise<void> {
    // Try to use MongoDB first, fallback to memory storage
    const likesCollection = await this.getLikesCollection();
    
    if (likesCollection) {
      try {
        await likesCollection.deleteOne({ userId, postId });
        return;
      } catch (error) {
        console.error("MongoDB deleteLike error:", error);
        // Fall back to memory storage
      }
    }
    
    // Memory storage fallback
    const likeToDelete = Array.from(this.likes.entries())
      .find(([_, like]) => like.userId === userId && like.postId === postId);
    if (likeToDelete) {
      this.likes.delete(likeToDelete[0]);
    }
  }

  async getLikes(postId: string): Promise<Like[]> {
    // Try to use MongoDB first, fallback to memory storage
    try {
      const likesCollection = await this.getLikesCollection();
      
      if (likesCollection) {
        try {
          const likes = await likesCollection.find({ postId }).toArray();
          return likes.map(like => ({
            ...like,
            id: like.id || like._id.toString(),
            createdAt: new Date(like.createdAt)
          }));
        } catch (error) {
          console.error("MongoDB getLikes error:", error);
          // Fall back to memory storage
        }
      }
    } catch (error) {
      console.error("Failed to get likes collection:", error);
      // Continue to memory storage fallback
    }
    
    // Memory storage fallback
    console.log("Using memory storage for likes");
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
export { initMongoDB };