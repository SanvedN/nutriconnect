import { InsertUser, User, DietPlan, WorkoutPlan, WeightLog, Post, Comment, Like } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  
  // Diet plan operations
  createDietPlan(userId: number, plan: Omit<DietPlan, "id" | "userId">): Promise<DietPlan>;
  getDietPlans(userId: number): Promise<DietPlan[]>;
  updateDietPlan(id: number, data: Partial<DietPlan>): Promise<DietPlan>;
  deleteDietPlan(id: number): Promise<void>;

  // Workout plan operations  
  createWorkoutPlan(userId: number, plan: Omit<WorkoutPlan, "id" | "userId">): Promise<WorkoutPlan>;
  getWorkoutPlans(userId: number): Promise<WorkoutPlan[]>;
  updateWorkoutPlan(id: number, data: Partial<WorkoutPlan>): Promise<WorkoutPlan>;
  deleteWorkoutPlan(id: number): Promise<void>;

  // Weight log operations
  createWeightLog(userId: number, log: Omit<WeightLog, "id" | "userId">): Promise<WeightLog>;
  getWeightLogs(userId: number): Promise<WeightLog[]>;

  // Community operations
  createPost(userId: number, post: Omit<Post, "id" | "userId" | "createdAt">): Promise<Post>;
  getPosts(): Promise<Post[]>;
  deletePost(id: number): Promise<void>;
  
  createComment(userId: number, postId: number, comment: Omit<Comment, "id" | "userId" | "postId" | "createdAt">): Promise<Comment>;
  getComments(postId: number): Promise<Comment[]>;
  deleteComment(id: number): Promise<void>;

  createLike(userId: number, postId: number): Promise<Like>;
  deleteLike(userId: number, postId: number): Promise<void>;
  getLikes(postId: number): Promise<Like[]>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private dietPlans: Map<number, DietPlan>;
  private workoutPlans: Map<number, WorkoutPlan>;
  private weightLogs: Map<number, WeightLog>;
  private posts: Map<number, Post>;
  private comments: Map<number, Comment>;
  private likes: Map<number, Like>;
  sessionStore: session.Store;
  
  private userId: number = 1;
  private dietPlanId: number = 1;
  private workoutPlanId: number = 1;
  private weightLogId: number = 1;
  private postId: number = 1;
  private commentId: number = 1;
  private likeId: number = 1;

  constructor() {
    this.users = new Map();
    this.dietPlans = new Map();
    this.workoutPlans = new Map();
    this.weightLogs = new Map();
    this.posts = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async createDietPlan(userId: number, plan: Omit<DietPlan, "id" | "userId">): Promise<DietPlan> {
    const id = this.dietPlanId++;
    const dietPlan = { ...plan, id, userId };
    this.dietPlans.set(id, dietPlan);
    return dietPlan;
  }

  async getDietPlans(userId: number): Promise<DietPlan[]> {
    return Array.from(this.dietPlans.values()).filter(plan => plan.userId === userId);
  }

  async updateDietPlan(id: number, data: Partial<DietPlan>): Promise<DietPlan> {
    const plan = this.dietPlans.get(id);
    if (!plan) throw new Error("Diet plan not found");
    const updated = { ...plan, ...data };
    this.dietPlans.set(id, updated);
    return updated;
  }

  async deleteDietPlan(id: number): Promise<void> {
    this.dietPlans.delete(id);
  }

  async createWorkoutPlan(userId: number, plan: Omit<WorkoutPlan, "id" | "userId">): Promise<WorkoutPlan> {
    const id = this.workoutPlanId++;
    const workoutPlan = { ...plan, id, userId };
    this.workoutPlans.set(id, workoutPlan);
    return workoutPlan;
  }

  async getWorkoutPlans(userId: number): Promise<WorkoutPlan[]> {
    return Array.from(this.workoutPlans.values()).filter(plan => plan.userId === userId);
  }

  async updateWorkoutPlan(id: number, data: Partial<WorkoutPlan>): Promise<WorkoutPlan> {
    const plan = this.workoutPlans.get(id);
    if (!plan) throw new Error("Workout plan not found");
    const updated = { ...plan, ...data };
    this.workoutPlans.set(id, updated);
    return updated;
  }

  async deleteWorkoutPlan(id: number): Promise<void> {
    this.workoutPlans.delete(id);
  }

  async createWeightLog(userId: number, log: Omit<WeightLog, "id" | "userId">): Promise<WeightLog> {
    const id = this.weightLogId++;
    const weightLog = { ...log, id, userId };
    this.weightLogs.set(id, weightLog);
    return weightLog;
  }

  async getWeightLogs(userId: number): Promise<WeightLog[]> {
    return Array.from(this.weightLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createPost(userId: number, post: Omit<Post, "id" | "userId" | "createdAt">): Promise<Post> {
    const id = this.postId++;
    const newPost = { ...post, id, userId, createdAt: new Date() };
    this.posts.set(id, newPost);
    return newPost;
  }

  async getPosts(): Promise<Post[]> {
    return Array.from(this.posts.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deletePost(id: number): Promise<void> {
    this.posts.delete(id);
    // Delete associated comments and likes
    Array.from(this.comments.entries())
      .filter(([_, comment]) => comment.postId === id)
      .forEach(([commentId]) => this.comments.delete(commentId));
    
    Array.from(this.likes.entries())
      .filter(([_, like]) => like.postId === id)
      .forEach(([likeId]) => this.likes.delete(likeId));
  }

  async createComment(userId: number, postId: number, comment: Omit<Comment, "id" | "userId" | "postId" | "createdAt">): Promise<Comment> {
    const id = this.commentId++;
    const newComment = { ...comment, id, userId, postId, createdAt: new Date() };
    this.comments.set(id, newComment);
    return newComment;
  }

  async getComments(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteComment(id: number): Promise<void> {
    this.comments.delete(id);
  }

  async createLike(userId: number, postId: number): Promise<Like> {
    const id = this.likeId++;
    const like = { id, userId, postId, createdAt: new Date() };
    this.likes.set(id, like);
    return like;
  }

  async deleteLike(userId: number, postId: number): Promise<void> {
    const like = Array.from(this.likes.values()).find(
      like => like.userId === userId && like.postId === postId
    );
    if (like) {
      this.likes.delete(like.id);
    }
  }

  async getLikes(postId: number): Promise<Like[]> {
    return Array.from(this.likes.values()).filter(like => like.postId === postId);
  }
}

export const storage = new MemStorage();
