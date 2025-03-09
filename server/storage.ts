import mongoose from "mongoose";
import {
  InsertUser,
  User,
  DietPlan,
  WorkoutPlan,
  WeightLog,
  Post,
  Like,
  Recipe,
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);
const DB_NAME = "nutriconnect";

const db = mongoose.connection;
db.on("error", console.error.bind(console, "❌ MongoDB connection error:"));
db.once("open", () => console.log("✅ MongoDB connected successfully"));

const userSchema = new mongoose.Schema<User>(
  { username: String, email: String, password: String },
  { collection: "users" }
);
const dietPlanSchema = new mongoose.Schema<DietPlan>(
  { userId: String, name: String, plan: Object, isActive: Boolean },
  { collection: "diet_plans" }
);
const workoutPlanSchema = new mongoose.Schema<WorkoutPlan>(
  { userId: String, name: String, plan: Object, isActive: Boolean },
  { collection: "workout_plans" }
);
const weightLogSchema = new mongoose.Schema<WeightLog>(
  { userId: String, weight: Number, date: Date },
  { collection: "weight_logs" }
);
const postSchema = new mongoose.Schema<Post>(
  { userId: String, content: String, createdAt: Date },
  { collection: "posts" }
);
const likeSchema = new mongoose.Schema<Like>(
  { postId: String, userId: String, createdAt: Date },
  { collection: "likes" }
);
const recipeSchema = new mongoose.Schema<Recipe>(
  {
    userId: String,
    name: String,
    ingredients: [String],
    instructions: [String],
    nutrition: Object,
  },
  { collection: "recipes" }
);

const UserModel = mongoose.model<User>("User", userSchema);
const DietPlanModel = mongoose.model<DietPlan>("DietPlan", dietPlanSchema);
const WorkoutPlanModel = mongoose.model<WorkoutPlan>(
  "WorkoutPlan",
  workoutPlanSchema
);
const WeightLogModel = mongoose.model<WeightLog>("WeightLog", weightLogSchema);
const PostModel = mongoose.model<Post>("Post", postSchema);
const LikeModel = mongoose.model<Like>("Like", likeSchema);
const RecipeModel = mongoose.model<Recipe>("Recipe", recipeSchema);

export class MongoStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  /*** 🔥 User Functions ***/
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id).lean();
    return user ? { ...user, id: user._id.toString() } : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username }).lean();
    return user ? { ...user, id: user._id.toString() } : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email }).lean();
    return user ? { ...user, id: user._id.toString() } : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser = new UserModel(user);
    await newUser.save();
    return { ...newUser.toObject(), id: newUser._id.toString() };
  }

  /*** 🔥 Diet Plan Functions ***/
  async getDietPlans(userId: string): Promise<DietPlan[]> {
    return await DietPlanModel.find({ userId }).lean();
  }

  async createDietPlan(
    userId: string,
    plan: Omit<DietPlan, "id" | "userId">
  ): Promise<DietPlan> {
    const newPlan = new DietPlanModel({ userId, ...plan });
    await newPlan.save();
    return newPlan.toObject();
  }

  async deleteDietPlan(id: string): Promise<void> {
    console.log("🔍 Attempting to delete diet plan with ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("❌ Invalid ObjectId format for Diet Plan");
    }

    const deletedPlan = await DietPlanModel.findByIdAndDelete(id);
    if (!deletedPlan) {
      throw new Error("❌ Diet Plan not found");
    }

    console.log("✅ Successfully deleted diet plan:", deletedPlan);
  }

  /*** 🔥 Workout Plan Functions ***/
  async getWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
    return await WorkoutPlanModel.find({ userId }).lean();
  }

  async createWorkoutPlan(
    userId: string,
    plan: Omit<WorkoutPlan, "id" | "userId">
  ): Promise<WorkoutPlan> {
    const newPlan = new WorkoutPlanModel({ userId, ...plan });
    await newPlan.save();
    return newPlan.toObject();
  }

  async deleteWorkoutPlan(id: string): Promise<void> {
    console.log("🔍 Attempting to delete workout plan with ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("❌ Invalid ObjectId format for Workout Plan");
    }

    const deletedPlan = await WorkoutPlanModel.findByIdAndDelete(id);
    if (!deletedPlan) {
      throw new Error("❌ Workout Plan not found");
    }

    console.log("✅ Successfully deleted workout plan:", deletedPlan);
  }

  /*** 🔥 Weight Log Functions ***/
  async createWeightLog(
    userId: string,
    weightLog: WeightLog
  ): Promise<WeightLog> {
    const newLog = new WeightLogModel({ userId, ...weightLog });
    await newLog.save();
    return newLog.toObject();
  }

  async getWeightLogs(userId: string): Promise<WeightLog[]> {
    return await WeightLogModel.find({ userId }).sort({ date: -1 }).lean();
  }

  /*** 🔥 Post & Like Functions ***/
  async createPost(
    userId: string,
    post: Omit<Post, "id" | "userId" | "createdAt">
  ): Promise<Post> {
    const newPost = new PostModel({ userId, ...post, createdAt: new Date() });
    await newPost.save();
    return { ...newPost.toObject(), postId: newPost._id.toString() };
  }

  async getPosts(): Promise<Post[]> {
    return await PostModel.find().sort({ createdAt: -1 }).lean();
  }

  async deletePost(postId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw new Error("❌ Invalid ObjectId format for Post");
    }

    const deletedPost = await PostModel.findByIdAndDelete(postId);
    if (!deletedPost) {
      throw new Error("❌ Post not found");
    }

    await LikeModel.deleteMany({ postId });
    console.log("✅ Successfully deleted post:", deletedPost);
  }

  async createLike(userId: string, postId: string): Promise<Like> {
    const newLike = new LikeModel({ userId, postId, createdAt: new Date() });
    await newLike.save();
    return newLike.toObject();
  }

  async getLikes(postId: string): Promise<Like[]> {
    return await LikeModel.find({ postId }).lean();
  }

  /*** 🔥 Recipe Functions ***/
  async getRecipes(userId: string): Promise<Recipe[]> {
    return await RecipeModel.find({ userId }).lean();
  }

  async createRecipe(
    userId: string,
    recipe: Omit<Recipe, "id" | "userId">
  ): Promise<Recipe> {
    const newRecipe = new RecipeModel({ userId, ...recipe });
    await newRecipe.save();
    return newRecipe.toObject();
  }
}

export const storage = new MongoStorage();
