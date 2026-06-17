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
      className={`dark ${cinzel.variable} ${shareTechMono.variable} ${garamond.variable} h-full antialiased`}
      style={{ colorScheme: 'dark', height: '100%' }}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#c9a84c" />
        <style dangerouslySetInnerHTML={{ __html: `
          /* Failsafe: hard background regardless of CSS loading */
          html, body {
            background-color: #060606 !important;
            color: #ededed !important;
            min-height: 100vh !important;
            width: 100% !important;
            margin: 0;
            padding: 0;
          }

          /*
           * TAILWIND v4 WEBVIEW POLYFILL
           * Tailwind v4 injects its CSS custom-property defaults inside:
           *   @layer properties { @supports (...) { * { --tw-translate-x: 0; ... } } }
           * Older Android WebViews (pre-Chrome 105) silently ignore the @supports
           * selector, so every Tailwind utility that depends on these properties
           * (flex, transform, overflow, snap, etc.) renders as if unstyled.
           * This block sets them unconditionally so all Tailwind classes work.
           */
          *, ::before, ::after, ::backdrop {
            --tw-translate-x: 0;
            --tw-translate-y: 0;
            --tw-translate-z: 0;
            --tw-rotate-x: 0;
            --tw-rotate-y: 0;
            --tw-rotate-z: 0;
            --tw-skew-x: 0;
            --tw-skew-y: 0;
            --tw-scale-x: 1;
            --tw-scale-y: 1;
            --tw-scale-z: 1;
            --tw-scroll-snap-strictness: proximity;
            --tw-border-style: solid;
            --tw-gradient-position: initial;
            --tw-gradient-from: #0000;
            --tw-gradient-via: #0000;
            --tw-gradient-to: #0000;
            --tw-gradient-stops: initial;
            --tw-gradient-via-stops: initial;
            --tw-gradient-from-position: 0%;
            --tw-gradient-via-position: 50%;
            --tw-gradient-to-position: 100%;
            --tw-ring-color: rgb(59 130 246 / 0.5);
            --tw-ring-shadow: 0 0 #0000;
            --tw-inset-ring-shadow: 0 0 #0000;
            --tw-ring-inset: ;
            --tw-ring-offset-width: 0px;
            --tw-ring-offset-color: #fff;
            --tw-ring-offset-shadow: 0 0 #0000;
            --tw-shadow: 0 0 #0000;
            --tw-shadow-color: initial;
            --tw-shadow-alpha: 100%;
            --tw-inset-shadow: 0 0 #0000;
            --tw-inset-shadow-color: initial;
            --tw-inset-shadow-alpha: 100%;
            --tw-blur: ;
            --tw-brightness: ;
            --tw-contrast: ;
            --tw-grayscale: ;
            --tw-hue-rotate: ;
            --tw-invert: ;
            --tw-opacity: ;
            --tw-saturate: ;
            --tw-sepia: ;
            --tw-drop-shadow: ;
            --tw-drop-shadow-color: initial;
            --tw-drop-shadow-alpha: 100%;
            --tw-drop-shadow-size: ;
            --tw-backdrop-blur: ;
            --tw-backdrop-brightness: ;
            --tw-backdrop-contrast: ;
            --tw-backdrop-grayscale: ;
            --tw-backdrop-hue-rotate: ;
            --tw-backdrop-invert: ;
            --tw-backdrop-opacity: ;
            --tw-backdrop-saturate: ;
            --tw-backdrop-sepia: ;
            --tw-contain-size: ;
            --tw-contain-layout: ;
            --tw-contain-paint: ;
            --tw-contain-style: ;
            --tw-space-y-reverse: 0;
            --tw-space-x-reverse: 0;
            --tw-divide-y-reverse: 0;
          }
        `}} />
        {/* CRITICAL: Force dark class immediately before any React hydration.
            next-themes adds the class after hydration, causing a white→black
            flash or stuck black screen in Android WebView. This script runs
            synchronously in <head> and sets dark mode instantly. */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              document.documentElement.classList.add('dark');
              document.documentElement.style.backgroundColor = '#060606';
              document.body && (document.body.style.backgroundColor = '#060606');
            } catch(e) {}
          })();
        ` }} />
        <script dangerouslySetInnerHTML={{ __html: `
          const apiBase = window.location.protocol + '//' + window.location.hostname + ':8001';
          function remoteLog(level, msg) {
            fetch(apiBase + '/api/debug/log', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ level: level, message: String(msg) })
            }).catch(() => {});
          }

          // Safe console.error override to catch React internal crashes
          const _err = console.error;
          console.error = function(...args) {
            _err.apply(console, args);
            const msg = args.join(' ');
            if (msg.indexOf('debug/log') === -1 && msg.indexOf('8001') === -1) {
              remoteLog('react_error', msg);
            }
          };

          window.onerror = function(msg, url, line, col, error) {
            var d = document.createElement('div');
            d.style.position = 'fixed'; d.style.top = '0'; d.style.left = '0'; d.style.width = '100vw'; d.style.height = '100vh';
            d.style.backgroundColor = 'yellow'; d.style.color = 'black'; d.style.zIndex = '9999999'; d.style.fontSize = '20px';
            d.innerHTML = '<b>JS ERROR:</b> ' + msg + '<br>Line: ' + line;
            document.documentElement.appendChild(d);
          };
          window.onunhandledrejection = function(event) {
            const errStr = 'Unhandled Promise Rejection: ' + (event.reason ? event.reason.message || event.reason : 'Unknown') + '\\n' + (event.reason && event.reason.stack ? event.reason.stack : '');
            remoteLog('error_rejection', errStr);
            var div = document.createElement('div');
            div.style.position = 'fixed';
            div.style.top = '0';
            div.style.left = '0';
            div.style.width = '100vw';
            div.style.height = '100vh';
            div.style.backgroundColor = 'black';
            div.style.color = 'red';
            div.style.padding = '20px';
            div.style.zIndex = '99999';
            div.style.overflow = 'scroll';
            div.style.fontFamily = 'monospace';
            div.style.fontSize = '12px';
            div.innerHTML = '<h1>Client-side Unhandled Promise Rejection</h1>' +
              '<p><b>Reason:</b> ' + (event.reason ? event.reason.message || event.reason : 'Unknown') + '</p>' +
              '<pre>' + (event.reason && event.reason.stack ? event.reason.stack : 'No stack trace') + '</pre>';
            document.body.appendChild(div);
          };
        ` }} />
      </head>
      <body 
        className="h-full flex flex-col relative bg-background text-foreground transition-colors duration-200"
        style={{ backgroundColor: '#060606', color: '#ededed', minHeight: '100vh' }}
      >
        <div className="h-full flex flex-col">
          <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
            <LockProvider>
              {children}
            </LockProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
