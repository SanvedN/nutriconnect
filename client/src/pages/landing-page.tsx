import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import {
  Brain,
  Utensils,
  Dumbbell,
  Users,
  ArrowRight,
  LineChart,
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  if (user) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-600">NutriConnect</h1>
        <Button asChild>
          <Link href="/auth">Get Started</Link>
        </Button>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl font-bold mb-6">
            Your AI-Powered Health & Fitness Companion
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your health journey with personalized nutrition and workout
            plans powered by artificial intelligence.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth">
              Join NutriConnect
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">
          Why Choose NutriConnect?
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Brain,
              title: "AI-Powered Planning",
              description:
                "Get personalized diet and workout plans tailored to your goals",
            },
            {
              icon: Utensils,
              title: "Smart Recipe Generator",
              description:
                "Discover new recipes based on your preferences and available ingredients",
            },
            {
              icon: Dumbbell,
              title: "Workout Customization",
              description:
                "Generate workout plans that match your equipment and fitness level",
            },
            {
              icon: LineChart,
              title: "Progress Tracking",
              description:
                "Track your weight and fitness progress with visual insights",
            },
            {
              icon: Users,
              title: "Community Support",
              description:
                "Connect with others, share achievements, and stay motivated",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
            >
              <feature.icon className="h-12 w-12 text-green-600 mb-4" />
              <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6">
            Ready to Start Your Health Journey?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who have transformed their lives with
            NutriConnect
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-green-600 hover:bg-gray-100"
            asChild
          >
            <Link href="/auth">Get Started Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>© 2024 NutriConnect. All rights reserved.</p>
      </footer>
    </div>
  );
}
