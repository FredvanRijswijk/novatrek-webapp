"use client";

import * as React from "react";
import {
  Plane,
  MapPin,
  Calendar,
  MessageCircle,
  Settings,
  User,
  Home,
  PlusCircle,
  Inbox,
  Briefcase,
  Store,
  ShieldCheck,
  Shield,
  HelpCircle,
  Sparkles,
  Users,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useFirebase } from "@/lib/firebase";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isAuthenticated } = useFirebase();
  const [isExpert, setIsExpert] = React.useState(false);
  const [isAdminUser, setIsAdminUser] = React.useState(false);

  // Check if user is an expert or admin
  React.useEffect(() => {
    async function checkUserStatus() {
      if (!user) return;
      
      // Check admin status using AdminModel
      try {
        const { AdminModel } = await import('@/lib/models/admin');
        const isAdmin = await AdminModel.isAdmin(user.uid);
        setIsAdminUser(isAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
      
      // Check expert status
      try {
        const { MarketplaceModel } = await import('@/lib/models/marketplace');
        const expert = await MarketplaceModel.getExpertByUserId(user.uid);
        setIsExpert(!!expert && expert.onboardingComplete);
      } catch (error) {
        console.error('Error checking expert status:', error);
      }
    }
    checkUserStatus();
  }, [user]);

  // NovaTrek navigation data
  const data = {
    user: {
      name: user?.displayName || "Traveler",
      email: user?.email || "",
      avatar: user?.photoURL || "/avatars/default.png",
    },
    navMain: isAdminUser ? [
      // Admin-only navigation
      {
        title: "Admin Dashboard",
        url: "/dashboard/admin/marketplace",
        icon: ShieldCheck,
      },
      {
        title: "Users",
        url: "/dashboard/admin/users",
        icon: Users,
      },
      {
        title: "Applications",
        url: "/dashboard/admin/marketplace/applications",
        icon: Sparkles,
      },
      {
        title: "Experts",
        url: "/dashboard/admin/marketplace/experts",
        icon: Briefcase,
      },
      {
        title: "Products",
        url: "/dashboard/admin/marketplace/products",
        icon: Store,
      },
      {
        title: "Recommendations",
        url: "/dashboard/admin/recommendations",
        icon: MapPin,
      },
      {
        title: "Analytics",
        url: "/dashboard/admin/marketplace/analytics",
        icon: Shield,
      },
      {
        title: "System Logs",
        url: "/dashboard/admin/logs",
        icon: MessageCircle,
      },
      {
        title: "Help Articles",
        url: "/dashboard/admin/help",
        icon: HelpCircle,
      },
      {
        title: "Settings",
        url: "/dashboard/settings/profile",
        icon: Settings,
      },
    ] : [
      // Regular user navigation
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
      },
      {
        title: "My Trips",
        url: "/dashboard/trips",
        icon: MapPin,
        items: [
          {
            title: "All Trips",
            url: "/dashboard/trips",
          },
          {
            title: "New Trip",
            url: "/dashboard/trips/new",
          },
        ],
      },
      {
        title: "Travel Inbox",
        url: "/dashboard/captures",
        icon: Inbox,
      },
      {
        title: "Marketplace",
        url: "/marketplace",
        icon: Store,
        badge: "New",
        badgeVariant: "default",
        items: [
          {
            title: "Browse Experts",
            url: "/experts",
          },
          {
            title: "Products",
            url: "/marketplace",
          },
        ],
      },
      {
        title: "AI Assistant",
        url: "/dashboard/chat",
        icon: MessageCircle,
        items: [
          {
            title: "Travel Chat",
            url: "/dashboard/chat",
          },
          {
            title: "Trip Planning",
            url: "/dashboard/chat/planning",
          },
          {
            title: "Enhanced Chat (Test)",
            url: "/dashboard/test-enhanced-chat",
          },
        ],
      },
      {
        title: "Itineraries",
        url: "/dashboard/itineraries",
        icon: Calendar,
        items: [
          {
            title: "Day Planner",
            url: "/dashboard/itineraries",
          },
          {
            title: "Activities",
            url: "/dashboard/itineraries/activities",
          },
        ],
      },
      {
        title: "Settings",
        url: "/dashboard/settings/profile",
        icon: Settings,
      },
      {
        title: "Help Center",
        url: "/help",
        icon: HelpCircle,
        items: [
          {
            title: "Browse Articles",
            url: "/help",
          },
          {
            title: "Contact Support",
            url: "/contact",
          },
        ],
      },
      // Show Expert Dashboard if user is an expert
      ...(isExpert && !isAdminUser ? [{
        title: "Expert Dashboard",
        url: "/dashboard/expert",
        icon: Briefcase,
        items: [
          {
            title: "Overview",
            url: "/dashboard/expert",
          },
          {
            title: "Products",
            url: "/dashboard/expert/products",
          },
          {
            title: "Recommendations",
            url: "/dashboard/expert/recommendations",
          },
          {
            title: "Earnings",
            url: "/dashboard/expert/earnings",
          },
          {
            title: "Reviews",
            url: "/dashboard/expert/reviews",
          },
        ],
      }] : []),
      // Show Test section only in development or for admin users
      ...((process.env.NODE_ENV === 'development' || isAdminUser) ? [{
        title: "Testing",
        url: "/dashboard/test-subscription",
        icon: Shield,
        items: [
          {
            title: "Subscription Test",
            url: "/dashboard/test-subscription",
          },
          {
            title: "Expert Flow Test",
            url: "/dashboard/test-expert-flow",
          },
          {
            title: "Logging Test",
            url: "/dashboard/test-logging",
          },
        ],
      }] : []),
    ],
    projects: isAdminUser ? [
      // Admin quick actions
      {
        name: "Review Applications",
        url: "/dashboard/admin/marketplace/applications",
        icon: Sparkles,
      },
      {
        name: "Manage Experts",
        url: "/dashboard/admin/marketplace/experts",
        icon: Briefcase,
      },
      {
        name: "View Analytics",
        url: "/dashboard/admin/marketplace/analytics",
        icon: Shield,
      },
    ] : [
      // Regular user quick actions
      {
        name: "Plan New Trip",
        url: "/dashboard/trips/new",
        icon: PlusCircle,
      },
      {
        name: "Saved Places",
        url: "/dashboard/saved",
        icon: MapPin,
      },
      {
        name: "Travel Profile",
        url: "/dashboard/settings/travel-preferences",
        icon: User,
      },
      // Only show "Become an Expert" if user is not already an expert
      ...(!isExpert ? [{
        name: "Become an Expert",
        url: "/dashboard/become-expert",
        icon: Briefcase,
      }] : []),
    ],
  };

  if (!isAuthenticated) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Plane className="size-4" />
              </div>
              <span className="font-bold group-data-[collapsible=icon]:hidden">NovaTrek</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="p-4 text-center text-sm text-muted-foreground">
            Please sign in to access your travel dashboard
          </div>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Plane className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
              <span className="font-semibold">NovaTrek</span>
              <span className="text-xs text-muted-foreground">
                Travel Planner
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
