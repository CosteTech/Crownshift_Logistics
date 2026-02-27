/**
 * Testimonials component - Display approved reviews/testimonials for public view
 * Part of always-render pattern: shows user testimonials, never empty page
 */

'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

interface Testimonial {
  id: string;
  rating: number;
  title: string;
  content: string;
  authorName: string;
  authorEmail?: string;
  createdAt: Date | string;
  isApproved: boolean;
}

interface TestimonialsProps {
  testimonials: Testimonial[];
  isLoading?: boolean;
  className?: string;
}

export function Testimonials({
  testimonials,
  isLoading = false,
  className = '',
}: TestimonialsProps) {
  // Filter only approved testimonials
  const approvedTestimonials = testimonials.filter((t) => t.isApproved);
  
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-lg h-32 animate-pulse"
          />
        ))}
      </div>
    );
  }
  
  if (approvedTestimonials.length === 0) {
    return (
      <EmptyState
        title="No reviews yet"
        description="Be the first to share your experience with Crownshift Logistics"
        action={{
          label: 'Submit a Review',
          href: '#',
        }}
      />
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {approvedTestimonials.map((testimonial) => (
        <div
          key={testimonial.id}
          className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Rating */}
          <div className="flex gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={
                  i < testimonial.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }
              />
            ))}
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-2">
            {testimonial.title}
          </h3>
          
          {/* Content */}
          <p className="text-gray-600 mb-4 leading-relaxed">
            {testimonial.content}
          </p>
          
          {/* Author */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">
              {testimonial.authorName}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(testimonial.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Testimonials;
