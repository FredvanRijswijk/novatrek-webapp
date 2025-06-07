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
    navMain: [
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
      // Show Expert Dashboard if user is an expert
      ...(isExpert ? [{
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
            title: "Earnings",
            url: "/dashboard/expert/earnings",
          },
          {
            title: "Reviews",
            url: "/dashboard/expert/reviews",
          },
        ],
      }] : []),
      // Show Admin section if user is an admin
      ...(isAdminUser ? [{
        title: "Admin",
        url: "/dashboard/admin/marketplace",
        icon: ShieldCheck,
        items: [
          {
            title: "Dashboard",
            url: "/dashboard/admin/marketplace",
          },
          {
            title: "Applications",
            url: "/dashboard/admin/marketplace/applications",
          },
          {
            title: "Experts",
            url: "/dashboard/admin/marketplace/experts",
          },
          {
            title: "Products",
            url: "/dashboard/admin/marketplace/products",
          },
        ],
      }] : []),
    ],
    projects: [
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
