"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, MessageCircle, MapPin, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SimpleDashboard() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Simple Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to NovaTrek!
          </h1>
          <p className="text-lg text-muted-foreground">
            Your AI-powered travel planning assistant
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push("/dashboard/chat")}
            className="gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            AI Assistant
          </Button>
          <Button
            size="lg"
            onClick={() => router.push("/dashboard/trips/new")}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4" />
            New Trip
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-400"
          onClick={() => router.push("/dashboard/trips/new")}
        >
          <CardHeader className="pb-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-2 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/40 transition-colors">
              <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-xl">Plan New Trip</CardTitle>
            <CardDescription className="text-base">
              Start planning your next adventure with our AI assistant
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-green-400"
          onClick={() => router.push("/dashboard/chat")}
        >
          <CardHeader className="pb-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-2 group-hover:bg-green-200 dark:group-hover:bg-green-900/40 transition-colors">
              <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xl">AI Travel Assistant</CardTitle>
            <CardDescription className="text-base">
              Get personalized recommendations and travel insights
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-purple-400"
          onClick={() => router.push("/dashboard/itineraries")}
        >
          <CardHeader className="pb-3">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-2 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/40 transition-colors">
              <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-xl">View Itineraries</CardTitle>
            <CardDescription className="text-base">
              Manage your trip schedules and daily activities
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-2 border-blue-200 dark:border-blue-800">
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Ready to start traveling?
          </h3>
          <p className="text-lg text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first trip to get started with personalized
            recommendations and AI-powered planning!
          </p>
          <Button
            size="lg"
            onClick={() => router.push("/dashboard/trips/new")}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3"
          >
            <Plus className="w-5 h-5" />
            Create Your First Trip
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
