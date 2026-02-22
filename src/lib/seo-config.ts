/**
 * Centralized SEO configuration for Crownshift Logistics
 * Use this file to maintain consistent branding, keywords, and structured data across the site
 */

export const SEO_CONFIG = {
  siteName: 'Crownshift Logistics LTD',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://crownshift.com',
  description: 'Global logistics solutions for freight forwarding, cargo shipping, supply chain management, and international transport services.',
  twitter: '@CrownshiftLog',
  localBusiness: {
    name: 'Crownshift Logistics LTD',
    description: 'Professional logistics and freight forwarding services worldwide',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://crownshift.com',
    telephone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+1-XXX-XXX-XXXX', // Required for Vercel deployment
    sameAs: [
      'https://linkedin.com/company/crownshift',
      // Add other social profiles
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: process.env.NEXT_PUBLIC_BUSINESS_COUNTRY || 'US',
    },
  },
};

export const ROUTE_METADATA = {
  home: {
    title: 'Crownshift Logistics | Freight Forwarding & Cargo Shipping Solutions',
    description: 'Global logistics solutions including freight forwarding, international shipping, warehousing, and supply chain management services.',
    keywords: 'freight forwarding, cargo shipping, logistics, supply chain management, international shipping, transport services',
  },
  services: {
    title: 'Shipping Services | Express Delivery & Freight Solutions | Crownshift Logistics',
    description: 'Comprehensive logistics services: express delivery, freight forwarding, warehousing, customs brokerage, and supply chain solutions.',
    keywords: 'shipping services, freight forwarding, cargo transport, logistics solutions, express delivery, warehousing',
  },
  contact: {
    title: 'Contact Crownshift Logistics | Shipping Inquiries & Support',
    description: 'Get in touch with our logistics experts. Fast response times for shipment quotes and customer inquiries.',
    keywords: 'contact logistics, shipping quote, customer support, logistics support, freight inquiry',
  },
  reviews: {
    title: 'Customer Reviews & Testimonials | Crownshift Logistics',
    description: 'Read verified customer reviews and testimonials about our shipping and logistics services worldwide.',
    keywords: 'customer reviews, shipping reviews, logistics testimonials, customer feedback, service reviews',
  },
  faq: {
    title: 'FAQ & Shipping Guide | Crownshift Logistics',
    description: 'Answers to common questions about shipping, tracking, pricing, and our comprehensive logistics services.',
    keywords: 'shipping FAQ, logistics questions, shipping guide, tracking help, pricing information',
  },
  offers: {
    title: 'Special Offers & Deals | Crownshift Logistics',
    description: 'Check out our latest promotional offers and discounts on shipping and logistics services.',
    keywords: 'shipping deals, logistics offers, discount shipping, promotional offers',
  },
  testimonials: {
    title: 'Client Testimonials | Crownshift Logistics',
    description: 'Success stories and testimonials from our satisfied logistics and shipping clients.',
    keywords: 'client testimonials, success stories, customer success, logistics testimonials',
  },
  tracking: {
    title: 'Track Your Shipment | Crownshift Logistics',
    description: 'Real-time tracking for your shipments. Monitor your cargo delivery status anytime, anywhere.',
    keywords: 'shipment tracking, cargo tracking, delivery tracking, real-time tracking, logistics tracking',
  },
};
