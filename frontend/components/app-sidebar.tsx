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
import { ThemeToggle } from "@/components/theme-toggle";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isAuthenticated } = useFirebase();

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
        url: "/dashboard/settings",
        icon: Settings,
        items: [
          {
            title: "Profile",
            url: "/dashboard/settings/profile",
          },
          {
            title: "Preferences",
            url: "/dashboard/settings/preferences",
          },
          {
            title: "Notifications",
            url: "/dashboard/settings/notifications",
          },
        ],
      },
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
        url: "/dashboard/profile",
        icon: User,
      },
    ],
  };

  if (!isAuthenticated) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <Plane className="h-6 w-6" />
              <span className="font-bold">NovaTrek</span>
            </div>
            <ThemeToggle />
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
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Plane className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-semibold">NovaTrek</span>
              <span className="text-xs text-muted-foreground">
                Travel Planner
              </span>
            </div>
          </div>
          <ThemeToggle />
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
