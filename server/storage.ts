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
    try {
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

      console.log('MongoDB collections initialized successfully');
    } catch (error) {
      console.error('Error initializing MongoDB collections:', error);
      throw error;
    }
  }

  private transformUser(dbUser: any): User {
    try {
      if (!dbUser) {
        console.error('transformUser received null/undefined user');
        return null;
      }
      const { _id, ...rest } = dbUser;
      return { id: _id.toString(), ...rest };
    } catch (error) {
      console.error('Error transforming user:', error);
      throw error;
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      console.log('Attempting to find user by id:', id);
      const user = await this.users.findOne({ _id: new ObjectId(id) });
      console.log('Found user:', user ? 'yes' : 'no');
      return user ? this.transformUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log('Attempting to find user by username:', username);
      const user = await this.users.findOne({ username });
      console.log('Found user:', user ? 'yes' : 'no');
      return user ? this.transformUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      console.log('Attempting to find user by email:', email);
      const user = await this.users.findOne({ email });
      console.log('Found user:', user ? 'yes' : 'no');
      return user ? this.transformUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      console.log('Attempting to create user with data:', { ...insertUser, password: '[REDACTED]' });
      const result = await this.users.insertOne(insertUser);
      console.log('User created with _id:', result.insertedId);
      return this.transformUser({ _id: result.insertedId, ...insertUser });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    try {
      const result = await this.users.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: data },
        { returnDocument: 'after' }
      );
      return this.transformUser(result.value);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    try {
      await this.users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { password: hashedPassword } }
      );
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  }

  async saveResetToken(userId: string, token: string, expiry: Date): Promise<void> {
    try {
      await this.users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { resetToken: token, resetTokenExpiry: expiry } }
      );
    } catch (error) {
      console.error('Error saving reset token:', error);
      throw error;
    }
  }

  async getResetToken(token: string): Promise<{ userId: string; expiry: Date } | undefined> {
    try {
      const user = await this.users.findOne({ resetToken: token });
      if (!user || !user.resetTokenExpiry) return undefined;
      return {
        userId: user._id.toString(),
        expiry: new Date(user.resetTokenExpiry)
      };
    } catch (error) {
      console.error('Error getting reset token:', error);
      throw error;
    }
  }

  async deleteResetToken(token: string): Promise<void> {
    try {
      await this.users.updateOne(
        { resetToken: token },
        { $unset: { resetToken: 1, resetTokenExpiry: 1 } }
      );
    } catch (error) {
      console.error('Error deleting reset token:', error);
      throw error;
    }
  }


  async createDietPlan(userId: string, plan: Omit<DietPlan, "id" | "userId">): Promise<DietPlan> {
    try {
      const result = await this.dietPlans.insertOne({...plan, userId});
      return {...plan, userId, id: result.insertedId.toString()};
    } catch (error) {
      console.error('Error creating diet plan:', error);
      throw error;
    }
  }

  async getDietPlans(userId: string): Promise<DietPlan[]> {
    try {
      const plans = await this.dietPlans.find({userId}).toArray();
      return plans.map(p => ({...p, id: p._id.toString()}));
    } catch (error) {
      console.error('Error getting diet plans:', error);
      throw error;
    }
  }

  async updateDietPlan(id: string, data: Partial<DietPlan>): Promise<DietPlan> {
    try {
      const result = await this.dietPlans.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: data },
        { returnDocument: 'after' }
      );
      return {...result.value, id: result.value._id.toString()};
    } catch (error) {
      console.error('Error updating diet plan:', error);
      throw error;
    }
  }

  async deleteDietPlan(id: string): Promise<void> {
    try {
      await this.dietPlans.deleteOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error('Error deleting diet plan:', error);
      throw error;
    }
  }

  async createWorkoutPlan(userId: string, plan: Omit<WorkoutPlan, "id" | "userId">): Promise<WorkoutPlan> {
    try {
      const result = await this.workoutPlans.insertOne({...plan, userId});
      return {...plan, userId, id: result.insertedId.toString()};
    } catch (error) {
      console.error('Error creating workout plan:', error);
      throw error;
    }
  }

  async getWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
    try {
      const plans = await this.workoutPlans.find({userId}).toArray();
      return plans.map(p => ({...p, id: p._id.toString()}));
    } catch (error) {
      console.error('Error getting workout plans:', error);
      throw error;
    }
  }

  async updateWorkoutPlan(id: string, data: Partial<WorkoutPlan>): Promise<WorkoutPlan> {
    try {
      const result = await this.workoutPlans.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: data },
        { returnDocument: 'after' }
      );
      return {...result.value, id: result.value._id.toString()};
    } catch (error) {
      console.error('Error updating workout plan:', error);
      throw error;
    }
  }

  async deleteWorkoutPlan(id: string): Promise<void> {
    try {
      await this.workoutPlans.deleteOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error('Error deleting workout plan:', error);
      throw error;
    }
  }

  async createWeightLog(userId: string, log: Omit<WeightLog, "id" | "userId">): Promise<WeightLog> {
    try {
      const result = await this.weightLogs.insertOne({...log, userId});
      return {...log, userId, id: result.insertedId.toString()};
    } catch (error) {
      console.error('Error creating weight log:', error);
      throw error;
    }
  }

  async getWeightLogs(userId: string): Promise<WeightLog[]> {
    try {
      const logs = await this.weightLogs.find({userId}).toArray();
      return logs.map(l => ({...l, id: l._id.toString()})).sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error getting weight logs:', error);
      throw error;
    }
  }

  async createPost(userId: string, post: Omit<Post, "id" | "userId" | "createdAt">): Promise<Post> {
    try {
      const result = await this.posts.insertOne({...post, userId, createdAt: new Date()});
      return {...post, userId, id: result.insertedId.toString(), createdAt: new Date()};
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async getPosts(): Promise<Post[]> {
    try {
      const posts = await this.posts.find({}).toArray();
      return posts.map(p => ({...p, id: p._id.toString()})).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting posts:', error);
      throw error;
    }
  }

  async deletePost(id: string): Promise<void> {
    try {
      await this.posts.deleteOne({ _id: new ObjectId(id) });
      await this.comments.deleteMany({ postId: id });
      await this.likes.deleteMany({ postId: id });
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  async createComment(userId: string, postId: string, comment: Omit<Comment, "id" | "userId" | "postId" | "createdAt">): Promise<Comment> {
    try {
      const result = await this.comments.insertOne({...comment, userId, postId, createdAt: new Date()});
      return {...comment, userId, postId, id: result.insertedId.toString(), createdAt: new Date()};
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  async getComments(postId: string): Promise<Comment[]> {
    try {
      const comments = await this.comments.find({postId}).toArray();
      return comments.map(c => ({...c, id: c._id.toString()})).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  async deleteComment(id: string): Promise<void> {
    try {
      await this.comments.deleteOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  async createLike(userId: string, postId: string): Promise<Like> {
    try {
      const result = await this.likes.insertOne({userId, postId, createdAt: new Date()});
      return {userId, postId, id: result.insertedId.toString(), createdAt: new Date()};
    } catch (error) {
      console.error('Error creating like:', error);
      throw error;
    }
  }

  async deleteLike(userId: string, postId: string): Promise<void> {
    try {
      await this.likes.deleteOne({ userId, postId });
    } catch (error) {
      console.error('Error deleting like:', error);
      throw error;
    }
  }

  async getLikes(postId: string): Promise<Like[]> {
    try {
      const likes = await this.likes.find({postId}).toArray();
      return likes.map(l => ({...l, id: l._id.toString()}));
    } catch (error) {
      console.error('Error getting likes:', error);
      throw error;
    }
  }
}

export const storage = new MongoStorage();