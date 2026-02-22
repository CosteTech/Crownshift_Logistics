import { Metadata } from 'next';
import { SEO_CONFIG } from './seo-config';

/**
 * Generate standardized metadata for any route
 * Ensures consistent Open Graph, Twitter, and canonical tags across the site
 */
export function generatePageMetadata(
  title: string,
  description: string,
  path: string,
  keywords?: string,
  imageUrl?: string
): Metadata {
  const url = `${SEO_CONFIG.siteUrl}${path}`;
  const image = imageUrl || `${SEO_CONFIG.siteUrl}/og-image.jpg`;

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(SEO_CONFIG.siteUrl),
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      siteName: SEO_CONFIG.siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: SEO_CONFIG.twitter,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
  };
}
