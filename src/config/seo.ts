export const SEO_CONFIG = {
  defaultTitle: "Crownshift Logistics - Global Logistics Solutions",
  defaultDescription:
    "Crownshift Logistics provides reliable international shipping, air freight, customs clearance, and warehousing solutions. Fast, safe, and cost-effective logistics services worldwide.",
  defaultKeywords: [
    "International Shipping",
    "Air Freight",
    "Customs Clearance",
    "Warehousing Solutions",
    "Logistics Services",
    "Global Shipping",
  ],
  openGraph: {
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.crownshift.com",
    siteName: "Crownshift Logistics",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Crownshift Logistics Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@CrownshiftLTD",
    creator: "@CrownshiftLTD",
  },
};
