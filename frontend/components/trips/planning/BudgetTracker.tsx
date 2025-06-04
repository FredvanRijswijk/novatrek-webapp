'use client';

import { useState } from 'react';
import { Plus, DollarSign, TrendingUp, PieChart, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Trip, Budget } from '@/types/travel';
import { TripModel } from '@/lib/models/trip';
import { cn } from '@/lib/utils';

interface BudgetTrackerProps {
  trip: Trip;
  onUpdate: (trip: Trip) => void;
}

interface Expense {
  id: string;
  category: keyof Budget['breakdown'];
  amount: number;
  description: string;
  date: Date;
}

const categoryIcons: Record<keyof Budget['breakdown'], string> = {
  accommodation: '🏨',
  transportation: '🚗',
  food: '🍽️',
  activities: '🎯',
  miscellaneous: '📦'
};

const categoryColors: Record<keyof Budget['breakdown'], string> = {
  accommodation: 'bg-blue-500',
  transportation: 'bg-purple-500',
  food: 'bg-orange-500',
  activities: 'bg-green-500',
  miscellaneous: 'bg-gray-500'
};

export function BudgetTracker({ trip, onUpdate }: BudgetTrackerProps) {
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'food' as keyof Budget['breakdown'],
    amount: 0,
    description: ''
  });

  // Calculate total spent from activities in itinerary
  const calculateSpent = () => {
    let totalSpent = 0;
    const categorySpent: Budget['breakdown'] = {
      accommodation: 0,
      transportation: 0,
      food: 0,
      activities: 0,
      miscellaneous: 0
    };

    // Sum up costs from itinerary activities
    trip.itinerary?.forEach(day => {
      day.activities?.forEach(activity => {
        if (activity.cost) {
          const amount = activity.cost.amount * (activity.cost.perPerson ? trip.travelers.length : 1);
          totalSpent += amount;
          
          // Categorize based on activity type
          switch (activity.type) {
            case 'accommodation':
              categorySpent.accommodation += amount;
              break;
            case 'transport':
              categorySpent.transportation += amount;
              break;
            case 'dining':
              categorySpent.food += amount;
              break;
            case 'activity':
            case 'sightseeing':
            case 'entertainment':
            case 'cultural':
            case 'outdoor':
              categorySpent.activities += amount;
              break;
            default:
              categorySpent.miscellaneous += amount;
          }
        }
      });
    });

    return { totalSpent, categorySpent };
  };

  const { totalSpent, categorySpent } = calculateSpent();
  const budget = trip.budget || { total: 0, currency: 'USD', breakdown: categorySpent };
  const percentageUsed = budget.total > 0 ? (totalSpent / budget.total) * 100 : 0;

  const handleAddExpense = async () => {
    // In a real app, this would add a manual expense entry
    // For now, we'll just show the dialog
    setIsAddingExpense(false);
    setNewExpense({ category: 'food', amount: 0, description: '' });
  };

  const getBudgetStatus = () => {
    if (percentageUsed >= 100) return { color: 'text-red-600', label: 'Over Budget' };
    if (percentageUsed >= 80) return { color: 'text-orange-600', label: 'Near Limit' };
    if (percentageUsed >= 50) return { color: 'text-yellow-600', label: 'On Track' };
    return { color: 'text-green-600', label: 'Under Budget' };
  };

  const status = getBudgetStatus();

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Budget Overview</CardTitle>
              <CardDescription>
                Track your trip expenses against your budget
              </CardDescription>
            </div>
            <Badge className={cn(status.color, 'bg-transparent border')}>
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Budget Progress */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-2xl font-bold">
                  {budget.currency} {totalSpent.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  of {budget.currency} {budget.total.toLocaleString()} total budget
                </p>
              </div>
              <p className="text-lg font-medium">{Math.round(percentageUsed)}%</p>
            </div>
            <Progress value={percentageUsed} className="h-3" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Remaining</p>
                </div>
                <p className="text-xl font-bold mt-1">
                  {budget.currency} {Math.max(0, budget.total - totalSpent).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Daily Avg</p>
                </div>
                <p className="text-xl font-bold mt-1">
                  {budget.currency} {Math.round(totalSpent / (trip.itinerary?.length || 1))}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Per Person</p>
                </div>
                <p className="text-xl font-bold mt-1">
                  {budget.currency} {Math.round(totalSpent / trip.travelers.length)}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Spending by Category</CardTitle>
            <Button size="sm" onClick={() => setIsAddingExpense(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(budget.breakdown).map(([category, allocated]) => {
              const spent = categorySpent[category as keyof Budget['breakdown']];
              const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
              
              return (
                <div key={category}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {categoryIcons[category as keyof Budget['breakdown']]}
                      </span>
                      <span className="font-medium capitalize">{category}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {budget.currency} {spent} / {allocated}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(percentage)}% used
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <Progress value={Math.min(100, percentage)} className="h-2" />
                    <div 
                      className={cn(
                        "absolute top-0 left-0 h-2 rounded-full",
                        categoryColors[category as keyof Budget['breakdown']]
                      )}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manual Expense</DialogTitle>
            <DialogDescription>
              Add an expense that's not tied to a specific activity
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={newExpense.category}
                onValueChange={(value) => setNewExpense({ ...newExpense, category: value as keyof Budget['breakdown'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryIcons).map(([key, icon]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span>{icon}</span>
                        <span className="capitalize">{key}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount ({budget.currency})</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={newExpense.amount || ''}
                onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="What was this expense for?"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingExpense(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddExpense}>Add Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}