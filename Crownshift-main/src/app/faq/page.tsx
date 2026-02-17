import { getFAQs } from '@/app/actions';
import { generatePageMetadata } from '@/lib/seo-metadata';

export const metadata = generatePageMetadata('FAQ', 'Frequently asked questions', '/faq');

export default async function FAQServerPage() {
  try {
    const res = await getFAQs();
    if (!res.success) throw new Error(res.error || 'Failed to fetch FAQs');
    const faqs = res.data || [];

    return (
      <section className="py-16 container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
        <div className="space-y-4">
          {faqs.map((f: any) => (
            <details key={f.id} className="p-4 border rounded">
              <summary className="font-semibold">{f.question}</summary>
              <div className="mt-2 text-muted-foreground">{f.answer}</div>
            </details>
          ))}
        </div>
      </section>
    );
  } catch (err) {
    console.error('FAQ server error:', err);
    return (
      <section className="py-16 container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4">FAQ</h1>
        <p className="text-muted-foreground">FAQs are unavailable right now. Please try again later.</p>
      </section>
    );
  }
}
