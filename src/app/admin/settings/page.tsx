import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Admin Settings - Crownshift Logistics',
};

export default function AdminSettingsPage() {
  return (
    <section className="py-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Configuration and account preferences for administrators.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Settings controls are being finalized. This route now exists to prevent 404 errors.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
