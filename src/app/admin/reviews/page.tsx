import ReviewsApprovalForm from '@/components/admin/reviews-approval-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Admin Reviews - Crownshift Logistics',
};

export default function AdminReviewsPage() {
  return (
    <section className="py-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Review Approvals</CardTitle>
            <CardDescription>Approve or reject customer reviews before publishing.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReviewsApprovalForm />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
