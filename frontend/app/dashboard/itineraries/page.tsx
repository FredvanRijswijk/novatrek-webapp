"use client";

import { Calendar, Clock, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ItinerariesPage() {
  // Mock data for demonstration
  const itineraries = [
    {
      id: 1,
      title: "Tokyo Adventure - Day 1",
      date: "2024-03-15",
      activities: [
        { time: "09:00", title: "Visit Senso-ji Temple", location: "Asakusa" },
        {
          time: "12:00",
          title: "Lunch at Tsukiji Market",
          location: "Tsukiji",
        },
        {
          time: "15:00",
          title: "Explore Shibuya Crossing",
          location: "Shibuya",
        },
        { time: "18:00", title: "Dinner in Harajuku", location: "Harajuku" },
      ],
    },
    {
      id: 2,
      title: "Paris City Tour - Day 2",
      date: "2024-03-20",
      activities: [
        {
          time: "10:00",
          title: "Eiffel Tower Visit",
          location: "Champ de Mars",
        },
        {
          time: "14:00",
          title: "Louvre Museum",
          location: "1st Arrondissement",
        },
        { time: "17:00", title: "Seine River Cruise", location: "Seine River" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Itineraries</h1>
          <p className="text-muted-foreground mt-1">
            Manage your daily travel schedules and activities
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Itinerary
        </Button>
      </div>

      {itineraries.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-muted-foreground mb-4">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No itineraries yet</p>
              <p className="text-sm mt-2">Create your first daily schedule!</p>
            </div>
            <Button className="mt-4">Create Your First Itinerary</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {itineraries.map((itinerary) => (
            <Card
              key={itinerary.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {itinerary.title}
                    </CardTitle>
                    <CardDescription>
                      {new Date(itinerary.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {itinerary.activities.length} activities
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {itinerary.activities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium min-w-[60px]">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {activity.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
