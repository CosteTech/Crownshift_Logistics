import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold mb-4">404 — Page not found</h1>
        <p className="text-muted-foreground mb-6">We couldn't find the page you're looking for.</p>
        <Link href="/" className="btn">Go home</Link>
      </div>
    </div>
  );
}
