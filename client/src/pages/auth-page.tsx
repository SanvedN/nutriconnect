import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();

  if (user) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left Column - Forms */}
      <div className="flex items-center justify-center p-8 bg-white">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Welcome to NutriConnect
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <AuthForm
                  mode="login"
                  isLoading={loginMutation.isPending}
                  onSubmit={(data) => loginMutation.mutate(data as LoginFormData)}
                />
              </TabsContent>

              <TabsContent value="register">
                <AuthForm
                  mode="register"
                  isLoading={registerMutation.isPending}
                  onSubmit={(data) => registerMutation.mutate(data as RegisterFormData)}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Hero */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hidden md:flex flex-col justify-center p-8 bg-gradient-to-br from-green-500 to-green-600 text-white"
      >
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-6">
            Transform Your Health Journey
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Join NutriConnect and get personalized AI-powered nutrition and workout
            plans tailored just for you.
          </p>
          <ul className="space-y-4">
            {[
              "Personalized diet plans",
              "AI recipe suggestions",
              "Custom workout routines",
              "Progress tracking",
              "Supportive community",
            ].map((feature, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center"
              >
                <svg
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {feature}
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

function AuthForm({
  mode,
  isLoading,
  onSubmit,
}: {
  mode: "login" | "register";
  isLoading: boolean;
  onSubmit: (data: LoginFormData | RegisterFormData) => void;
}) {
  const schema = mode === "login" ? loginSchema : registerSchema;
  const defaultValues = mode === "login" 
    ? { username: "", password: "" }
    : { username: "", email: "", password: "" };

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {mode === "register" && (
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "login" ? "Login" : "Register"}
        </Button>
      </form>
    </Form>
  );
}