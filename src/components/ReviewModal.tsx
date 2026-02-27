/**
 * ReviewModal component - Modal for authenticated users to submit reviews
 * Part of the always-render pattern: show to logged-in users, hidden otherwise
 */

'use client';

import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (review: ReviewSubmission) => Promise<void>;
  isLoading?: boolean;
}

interface ReviewSubmission {
  rating: number;
  title: string;
  content: string;
  authorName: string;
  authorEmail: string;
}

export function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: ReviewModalProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<ReviewSubmission>({
    rating: 5,
    title: '',
    content: '',
    authorName: user?.displayName || '',
    authorEmail: user?.email || '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (field: keyof ReviewSubmission, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to submit a review.',
        variant: 'destructive',
      });
      onClose();
      return;
    }
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      
      toast({
        title: 'Review Submitted',
        description: 'Thank you! Your review will be displayed after approval.',
      });
      
      // Reset form
      setFormData({
        rating: 5,
        title: '',
        content: '',
        authorName: user?.displayName || '',
        authorEmail: user?.email || '',
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Submit a Review</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Auth Message */}
          {authLoading ? (
            <div className="text-center py-4 text-gray-500">Loading...</div>
          ) : !user ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              Please log in to submit a review.
            </div>
          ) : (
            <>
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleChange('rating', star)}
                      className="focus:outline-none"
                    >
                      <Star
                        size={28}
                        className={`${
                          star <= formData.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        } cursor-pointer hover:text-yellow-400 transition-colors`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., Excellent service"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  placeholder="Share your experience with our services..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              {/* Author Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.authorName}
                  onChange={(e) => handleChange('authorName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full bg-orange-500 text-white font-medium py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default ReviewModal;
