import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { cn } from "@/lib/utils";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import Header from "@/components/header";
import Footer from "@/components/footer";
import PromoBanner from "@/components/PromoBanner";
import { SEO_CONFIG } from "@/config/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SEO_CONFIG.openGraph.url || "http://localhost:3000"),
  title: SEO_CONFIG.defaultTitle,
  description: SEO_CONFIG.defaultDescription,
  keywords: SEO_CONFIG.defaultKeywords,
  openGraph: {
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription,
    type: SEO_CONFIG.openGraph.type as any,
    url: SEO_CONFIG.openGraph.url,
    siteName: SEO_CONFIG.openGraph.siteName,
    images: SEO_CONFIG.openGraph.images,
  },
  twitter: {
    card: SEO_CONFIG.twitter.card as any,
    site: SEO_CONFIG.twitter.site,
    creator: SEO_CONFIG.twitter.creator,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark", "!scroll-smooth")}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-background text-foreground antialiased">
        <FirebaseClientProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <PromoBanner promos={[]} />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <Toaster />
          </div>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
