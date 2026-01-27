import TrackingSection from "@/components/sections/tracking";
import AuthGuard from '@/components/AuthGuard';

export default function TrackingPage() {
  return (
    <AuthGuard>
      <TrackingSection />
    </AuthGuard>
  );
}
