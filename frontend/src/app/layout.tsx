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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.onerror = function(msg, url, line, col, error) {
                var overlay = document.createElement('div');
                overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:red;color:white;z-index:9999999;padding:20px;box-sizing:border-box;overflow:auto;font-family:monospace;';
                overlay.innerHTML = '<h1>FATAL JS ERROR</h1>' +
                                    '<p><b>Msg:</b> ' + msg + '</p>' +
                                    '<p><b>Line:</b> ' + line + ':' + col + '</p>' +
                                    '<p><b>URL:</b> ' + url + '</p>' +
                                    '<p><b>UserAgent:</b> ' + navigator.userAgent + '</p>' +
                                    '<hr><pre>' + (error && error.stack ? error.stack : 'No stack') + '</pre>';
                document.documentElement.appendChild(overlay);
                return false;
              };
              window.addEventListener('unhandledrejection', function(event) {
                var overlay = document.createElement('div');
                overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#b30000;color:white;z-index:9999999;padding:20px;box-sizing:border-box;overflow:auto;font-family:monospace;';
                overlay.innerHTML = '<h1>UNHANDLED PROMISE REJECTION</h1>' +
                                    '<p><b>Reason:</b> ' + (event.reason ? event.reason.toString() : 'Unknown') + '</p>' +
                                    '<p><b>UserAgent:</b> ' + navigator.userAgent + '</p>' +
                                    '<hr><pre>' + (event.reason && event.reason.stack ? event.reason.stack : 'No stack') + '</pre>';
                document.documentElement.appendChild(overlay);
              });
            `,
          }}
        />
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
