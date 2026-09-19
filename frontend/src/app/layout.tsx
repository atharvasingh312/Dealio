import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "Dealio — B2B CRM",
  description:
    "A modern B2B CRM with AI-powered lead insights. Track deals, manage pipelines, and close faster.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-gray-50 text-gray-900 min-h-screen flex flex-col">
        <TopNav />

        {/* ── Main content ── */}
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
