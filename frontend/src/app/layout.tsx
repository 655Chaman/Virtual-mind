import type { Metadata, Viewport } from "next";
import { Cinzel, Share_Tech_Mono, Cormorant_Garamond } from "next/font/google";
import { LockProvider } from "@/components/LockProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  variable: "--font-share-tech-mono",
  subsets: ["latin"],
});

const garamond = Cormorant_Garamond({
  weight: ["400", "600"],
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#c9a84c",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Virtual Mind 2.0",
  description: "Command Center for Elesium — Personal OS for Chaman Shah",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Virtual Mind",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "application-name": "Virtual Mind 2.0",
    "msapplication-TileColor": "#060606",
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
      suppressHydrationWarning
      className={`${cinzel.variable} ${shareTechMono.variable} ${garamond.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#c9a84c" />
      </head>
      <body 
        className="min-h-full flex flex-col relative bg-background text-foreground transition-colors duration-200"
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <div className="flex-1 flex flex-col">
            <LockProvider>
              {children}
            </LockProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
