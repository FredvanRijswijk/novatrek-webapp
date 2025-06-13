'use client';

import { useState } from 'react';
import { useFirebase } from '@/lib/firebase/context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, X, Star, CheckCircle } from 'lucide-react';
import { FeedbackCategory } from '@/lib/models/feedback-model';
import { cn } from '@/lib/utils';

export function FeedbackWidget() {
  const { user } = useFirebase();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    category: '' as FeedbackCategory | '',
    title: '',
    description: '',
    rating: 0,
  });

  // Don't show widget if user is not authenticated
  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.title || !formData.description) {
      return;
    }

    setLoading(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          rating: formData.rating || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitted(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setFormData({
          category: '',
          title: '',
          description: '',
          rating: 0,
        });
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions: { value: FeedbackCategory; label: string; description: string }[] = [
    { value: 'bug', label: 'Bug Report', description: 'Something isn\'t working' },
    { value: 'feature_request', label: 'Feature Request', description: 'Suggest a new feature' },
    { value: 'improvement', label: 'Improvement', description: 'Enhance existing features' },
    { value: 'ui_ux', label: 'UI/UX', description: 'Design and usability' },
    { value: 'performance', label: 'Performance', description: 'Speed and responsiveness' },
    { value: 'other', label: 'Other', description: 'General feedback' },
  ];

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
            <p className="text-center text-muted-foreground">
              Your feedback has been submitted successfully.
              We appreciate your input!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      {/* Floating Feedback Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Feedback
          </Button>
        </div>
      )}

      {/* Feedback Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              Help us improve NovaTrek. Your feedback is valuable to us!
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating */}
            <div className="space-y-2">
              <Label>How satisfied are you with NovaTrek?</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        'h-8 w-8',
                        formData.rating >= star
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as FeedbackCategory })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief summary of your feedback"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed feedback..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}