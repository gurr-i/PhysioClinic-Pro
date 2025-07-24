import { useState } from "react";
import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  Package, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  DollarSign,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Reports", href: "/reports", icon: FileText },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className="w-64 glass-effect border-r border-border/50 flex flex-col">
      {/* Logo Section */}
      <div className="flex items-center justify-center h-16 border-b border-border/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--medical-blue)] to-[var(--accent-purple)] flex items-center justify-center">
            <DollarSign className="text-white text-lg w-5 h-5" />
          </div>
          <div className="text-xl font-bold text-[var(--dark-slate)]">PhysioClinic Pro</div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "nav-item flex items-center px-4 py-3 text-sm font-medium cursor-pointer",
                isActive ? "active text-white" : "text-[var(--dark-slate)]"
              )}>
                <Icon className="mr-3 w-5 h-5" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="w-full justify-center glass-effect hover:bg-primary/10"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}