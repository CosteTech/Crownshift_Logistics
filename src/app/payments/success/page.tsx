import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Payment Success - Crownshift Logistics',
};

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params?.session_id;

  return (
    <section className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Payment Confirmed</CardTitle>
            <CardDescription>Your payment was received successfully.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessionId && (
              <p className="text-sm text-muted-foreground">
                Stripe session: <code>{sessionId}</code>
              </p>
            )}
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Back Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
