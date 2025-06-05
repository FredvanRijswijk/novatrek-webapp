"use client";

import { useState } from "react";
import { Settings, User, Bell, Globe, Shield, Loader2, Check } from "lucide-react";
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
import { useFirebase } from "@/lib/firebase/context";
import { UserModel } from "@/lib/models/user";

export default function SettingsPage() {
  const { user } = useFirebase();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    currency: "USD"
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    tripReminders: true,
    travelDeals: false,
    aiSuggestions: true
  });

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    setSaved(false);
    
    try {
      // Update user profile
      await UserModel.update(user.uid, {
        displayName: `${profileData.firstName} ${profileData.lastName}`.trim() || user.displayName,
        preferences: {
          currency: profileData.currency
        }
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };
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
                <Input 
                  id="firstName" 
                  placeholder="Enter your first name"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  placeholder="Enter your last name"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Enter your email"
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Preferred Currency</Label>
              <Select 
                value={profileData.currency}
                onValueChange={(value) => setProfileData({...profileData, currency: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
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
              <Switch 
                checked={notifications.tripReminders}
                onCheckedChange={(checked) => setNotifications({...notifications, tripReminders: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Travel Deals</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about travel deals and offers
                </p>
              </div>
              <Switch 
                checked={notifications.travelDeals}
                onCheckedChange={(checked) => setNotifications({...notifications, travelDeals: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>AI Suggestions</Label>
                <p className="text-sm text-muted-foreground">
                  Get personalized travel suggestions from our AI assistant
                </p>
              </div>
              <Switch 
                checked={notifications.aiSuggestions}
                onCheckedChange={(checked) => setNotifications({...notifications, aiSuggestions: checked})}
              />
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
              Set your comprehensive travel profile for personalized recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create a detailed travel profile including your travel style, activity preferences, 
              dietary restrictions, budget ranges, and more. This helps us provide better 
              recommendations and makes group travel planning easier.
            </p>
            <Button asChild>
              <a href="/dashboard/settings/travel-preferences">
                Manage Travel Preferences
              </a>
            </Button>
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
