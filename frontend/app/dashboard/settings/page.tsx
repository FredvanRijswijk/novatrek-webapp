"use client";

import { Settings, User, Bell, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Update your personal information and travel preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="Enter your first name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Enter your last name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Preferred Currency</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD - US Dollar</SelectItem>
                  <SelectItem value="eur">EUR - Euro</SelectItem>
                  <SelectItem value="gbp">GBP - British Pound</SelectItem>
                  <SelectItem value="jpy">JPY - Japanese Yen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>Save Profile</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Choose what notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Trip Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about upcoming trips and important dates
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Travel Deals</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about travel deals and offers
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>AI Suggestions</Label>
                <p className="text-sm text-muted-foreground">
                  Get personalized travel suggestions from our AI assistant
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Travel Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Travel Preferences
            </CardTitle>
            <CardDescription>
              Set your default travel preferences and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="travelStyle">Travel Style</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select travel style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Budget Traveler</SelectItem>
                    <SelectItem value="comfort">Comfort Seeker</SelectItem>
                    <SelectItem value="luxury">Luxury Traveler</SelectItem>
                    <SelectItem value="adventure">Adventure Seeker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accommodation">Accommodation Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select accommodation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotel">Hotels</SelectItem>
                    <SelectItem value="hostel">Hostels</SelectItem>
                    <SelectItem value="airbnb">Airbnb</SelectItem>
                    <SelectItem value="resort">Resorts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dietary Restrictions</Label>
                <p className="text-sm text-muted-foreground">
                  Consider dietary preferences in recommendations
                </p>
              </div>
              <Switch />
            </div>
            <Button>Save Preferences</Button>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>
              Manage your privacy settings and account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Profile Visibility</Label>
                <p className="text-sm text-muted-foreground">
                  Make your travel profile visible to other users
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Data Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Allow us to use your data to improve our services
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="space-y-2">
              <Button variant="outline">Change Password</Button>
              <Button variant="outline">Download My Data</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
