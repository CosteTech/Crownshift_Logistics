'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getApprovedReviews } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { Testimonials } from '@/components/Testimonials';
import { ReviewModal } from '@/components/ReviewModal';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  serviceId: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: any;
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const result = await getApprovedReviews();
        if (result.success) {
          setReviews(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Calculate statistics
  const totalReviews = reviews.length;
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

  const ratingDistribution = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  return (
    <section className="py-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Customer Reviews</h1>
          <p className="text-lg text-muted-foreground">
            See what our customers have to say about our services
          </p>
          {user && (
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Share Your Review
            </button>
          )}
        </div>

        {/* Statistics Cards */}
        {!isLoading && reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Average Rating Card */}
            <Card>
              <CardHeader>
                <CardTitle>Average Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold">
                    {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i <
                            Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Based on {reviews.length} reviews
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Reviews Card */}
            <Card>
              <CardHeader>
                <CardTitle>Total Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold mb-4">{reviews.length}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reviews Display */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            description={
              user
                ? 'Be the first to share your experience with Crownshift Logistics!'
                : 'Log in to share your experience with Crownshift Logistics.'
            }
            action={
              user
                ? {
                    label: 'Submit a Review',
                    href: '#',
                  }
                : {
                    label: 'Log in to Review',
                    href: '/login',
                  }
            }
          />
        ) : (
          <Testimonials
            testimonials={reviews.map((r) => ({
              id: r.id,
              rating: r.rating,
              title: r.comment.split('\n')[0] || 'Great Service',
              content: r.comment,
              authorName: r.userName,
              createdAt: r.createdAt,
              isApproved: true,
            }))}
          />
        )}

        {/* Review Modal */}
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
        />
      </div>
    </section>
  );
}
