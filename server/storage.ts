import { MongoClient, ObjectId } from 'mongodb';
import { InsertUser, User, DietPlan, WorkoutPlan, WeightLog, Post, Comment, Like } from "@shared/schema";
import session from "express-session";
import MongoStore from 'connect-mongo';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const client = new MongoClient(process.env.MONGODB_URI);
const database = client.db('fitness-app');

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

  sessionStore: session.Store;
}

export class MongoStorage implements IStorage {
  private users;
  private dietPlans;
  private workoutPlans;
  private weightLogs;
  private posts;
  private comments;
  private likes;
  sessionStore: session.Store;

  constructor() {
    this.users = database.collection('users');
    this.dietPlans = database.collection('dietPlans');
    this.workoutPlans = database.collection('workoutPlans');
    this.weightLogs = database.collection('weightLogs');
    this.posts = database.collection('posts');
    this.comments = database.collection('comments');
    this.likes = database.collection('likes');

    this.sessionStore = MongoStore.create({
      client: client,
      dbName: 'fitness-app',
      ttl: 14 * 24 * 60 * 60 // 14 days
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const user = await this.users.findOne({ _id: new ObjectId(id) });
    return user ? this.transformUser(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await this.users.findOne({ username });
    return user ? this.transformUser(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await this.users.findOne({ email });
    return user ? this.transformUser(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.users.insertOne(insertUser);
    return this.transformUser({ _id: result.insertedId, ...insertUser });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const result = await this.users.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: data },
      { returnDocument: 'after' }
    );
    return this.transformUser(result.value);
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await this.users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { password: hashedPassword } }
    );
  }

  async saveResetToken(userId: string, token: string, expiry: Date): Promise<void> {
    await this.users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { resetToken: token, resetTokenExpiry: expiry } }
    );
  }

  async getResetToken(token: string): Promise<{ userId: string; expiry: Date } | undefined> {
    const user = await this.users.findOne({ resetToken: token });
    if (!user || !user.resetTokenExpiry) return undefined;
    return {
      userId: user._id.toString(),
      expiry: new Date(user.resetTokenExpiry)
    };
  }

  async deleteResetToken(token: string): Promise<void> {
    await this.users.updateOne(
      { resetToken: token },
      { $unset: { resetToken: 1, resetTokenExpiry: 1 } }
    );
  }

  private transformUser(dbUser: any): User {
    const { _id, ...rest } = dbUser;
    return { id: _id.toString(), ...rest };
  }

  async createDietPlan(userId: string, plan: Omit<DietPlan, "id" | "userId">): Promise<DietPlan> {
    const result = await this.dietPlans.insertOne({...plan, userId});
    return {...plan, userId, id: result.insertedId.toString()};
  }

  async getDietPlans(userId: string): Promise<DietPlan[]> {
    const plans = await this.dietPlans.find({userId}).toArray();
    return plans.map(p => ({...p, id: p._id.toString()}));
  }

  async updateDietPlan(id: string, data: Partial<DietPlan>): Promise<DietPlan> {
    const result = await this.dietPlans.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: data },
      { returnDocument: 'after' }
    );
    return {...result.value, id: result.value._id.toString()};
  }

  async deleteDietPlan(id: string): Promise<void> {
    await this.dietPlans.deleteOne({ _id: new ObjectId(id) });
  }


  async createWorkoutPlan(userId: string, plan: Omit<WorkoutPlan, "id" | "userId">): Promise<WorkoutPlan> {
    const result = await this.workoutPlans.insertOne({...plan, userId});
    return {...plan, userId, id: result.insertedId.toString()};
  }

  async getWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
    const plans = await this.workoutPlans.find({userId}).toArray();
    return plans.map(p => ({...p, id: p._id.toString()}));
  }

  async updateWorkoutPlan(id: string, data: Partial<WorkoutPlan>): Promise<WorkoutPlan> {
    const result = await this.workoutPlans.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: data },
      { returnDocument: 'after' }
    );
    return {...result.value, id: result.value._id.toString()};
  }

  async deleteWorkoutPlan(id: string): Promise<void> {
    await this.workoutPlans.deleteOne({ _id: new ObjectId(id) });
  }

  async createWeightLog(userId: string, log: Omit<WeightLog, "id" | "userId">): Promise<WeightLog> {
    const result = await this.weightLogs.insertOne({...log, userId});
    return {...log, userId, id: result.insertedId.toString()};
  }

  async getWeightLogs(userId: string): Promise<WeightLog[]> {
    const logs = await this.weightLogs.find({userId}).toArray();
    return logs.map(l => ({...l, id: l._id.toString()})).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createPost(userId: string, post: Omit<Post, "id" | "userId" | "createdAt">): Promise<Post> {
    const result = await this.posts.insertOne({...post, userId, createdAt: new Date()});
    return {...post, userId, id: result.insertedId.toString(), createdAt: new Date()};
  }

  async getPosts(): Promise<Post[]> {
    const posts = await this.posts.find({}).toArray();
    return posts.map(p => ({...p, id: p._id.toString()})).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deletePost(id: string): Promise<void> {
    await this.posts.deleteOne({ _id: new ObjectId(id) });
    await this.comments.deleteMany({ postId: id });
    await this.likes.deleteMany({ postId: id });
  }

  async createComment(userId: string, postId: string, comment: Omit<Comment, "id" | "userId" | "postId" | "createdAt">): Promise<Comment> {
    const result = await this.comments.insertOne({...comment, userId, postId, createdAt: new Date()});
    return {...comment, userId, postId, id: result.insertedId.toString(), createdAt: new Date()};
  }

  async getComments(postId: string): Promise<Comment[]> {
    const comments = await this.comments.find({postId}).toArray();
    return comments.map(c => ({...c, id: c._id.toString()})).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteComment(id: string): Promise<void> {
    await this.comments.deleteOne({ _id: new ObjectId(id) });
  }

  async createLike(userId: string, postId: string): Promise<Like> {
    const result = await this.likes.insertOne({userId, postId, createdAt: new Date()});
    return {userId, postId, id: result.insertedId.toString(), createdAt: new Date()};
  }

  async deleteLike(userId: string, postId: string): Promise<void> {
    await this.likes.deleteOne({ userId, postId });
  }

  async getLikes(postId: string): Promise<Like[]> {
    const likes = await this.likes.find({postId}).toArray();
    return likes.map(l => ({...l, id: l._id.toString()}));
  }
}

export const storage = new MongoStorage();