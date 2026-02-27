import { Metadata } from 'next';
import ContactSection from "@/components/sections/contact";
import { generatePageMetadata } from '@/lib/seo-metadata';
import { ROUTE_METADATA } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata(
  ROUTE_METADATA.contact.title,
  ROUTE_METADATA.contact.description,
  '/contact',
  ROUTE_METADATA.contact.keywords
);

export default function ContactPage() {
  return <ContactSection />;
}
