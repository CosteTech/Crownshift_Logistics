'use client';

import { useState } from 'react';

// Define the interface for a review document
interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Props accepted by the component
interface Props {
  onSuccess?: () => Promise<void> | (() => void);
}

// Simulated data for development purposes (replace with actual fetch)
const initialPendingReviews: Review[] = [
  { id: '1', userName: 'John D.', rating: 5, comment: 'Great service! Highly recommend.', status: 'pending' },
  { id: '2', userName: 'Jane S.', rating: 3, comment: 'Quick response, minor hiccup with delivery time.', status: 'pending' },
];

const ReviewsApprovalForm = ({ onSuccess }: Props) => {
  const [pendingReviews, setPendingReviews] = useState<Review[]>(initialPendingReviews);
  const [loading, setLoading] = useState(false);

  // This function simulates calling a Next.js Server Action (or Route Handler)
  const handleAction = async (reviewId: string, action: 'approve' | 'reject') => {
    setLoading(true);

    // --- START OF SERVER ACTION CALL (Real implementation) ---
    // You would replace the simulation below with:
    // try {
    //   const result = await serverApproveReview(reviewId, action);
    //   // handle result...
    // } catch (error) {
    //   // handle error...
    // }
    // --- END OF SERVER ACTION CALL ---

    // Temporary Simulation: Wait 500ms and update state
    await new Promise(resolve => setTimeout(resolve, 500));
    setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
    console.log(`Review ${reviewId} successfully ${action}d.`);
    setLoading(false);

    // Call optional onSuccess callback (e.g., to refresh stats)
    try {
      if (onSuccess) await onSuccess();
    } catch (err) {
      console.error('onSuccess callback failed:', err);
    }
  };

  if (pendingReviews.length === 0) {
    return <p className="p-4 text-gray-500">No pending reviews require approval.</p>;
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="mb-4 text-xl font-semibold text-gray-800">Pending Reviews ({pendingReviews.length})</h3>
      <div className="space-y-4">
        {pendingReviews.map((review) => (
          <div key={review.id} className="p-4 border border-gray-200 rounded-md">
            <p className="font-semibold text-lg">{review.userName}</p>
            <div className="text-yellow-500 mb-1">
              Rating: {review.rating}/5 
            </div>
            <p className="mt-1 text-gray-700 italic">"{review.comment}"</p>
            
            <div className="mt-3 space-x-2">
              <button
                onClick={() => handleAction(review.id, 'approve')}
                disabled={loading}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition duration-150"
              >
                Approve
              </button>
              <button
                onClick={() => handleAction(review.id, 'reject')}
                disabled={loading}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition duration-150"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsApprovalForm;
