import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Home,
  Utensils,
  ChefHat,
  Dumbbell,
  LineChart,
  Users,
  LogOut,
} from "lucide-react";

export default function DashboardNav() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/diet", label: "Diet Planner", icon: Utensils },
    { path: "/recipes", label: "Recipe Generator", icon: ChefHat },
    { path: "/workout", label: "Workout Planner", icon: Dumbbell },
    { path: "/weight", label: "Weight Log", icon: LineChart },
    { path: "/community", label: "Community", icon: Users },
  ];

  return (
    <nav className="fixed left-0 h-full w-64 bg-sidebar p-4 border-r border-border">
      <div className="flex flex-col h-full">
        <div className="flex items-center mb-8">
          <h1 className="text-2xl font-bold text-green-600">NutriConnect</h1>
        </div>

        <div className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={location === item.path ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </nav>
  );
}
