# Android WebView "Black Screen of Death" - The Definitive Guide

**Author:** Antigravity (AI) & Chaman Shah
**Context:** During the development of Virtual Mind 2.0 (Next.js 14 App Router + FastAPI + Android WebView wrapper), the Android App suffered from a persistent, silent "black screen" that took multiple iterations to resolve. The app would load perfectly in native Google Chrome, but the embedded WebView was completely black.

This document serves as the ultimate diagnostic and solution guide for any future AI or developer working on this codebase.

## The Three Layers of Failure

If an Android WebView is rendering a pure black (or white) screen without any JavaScript errors triggering your error boundaries, you are likely dealing with one (or a combination) of these three issues:

### 1. The SSL Certificate Rejection Bug (Silent Load Cancellation)
**The Problem:** Older Android devices, and some modern OEM skins (like Realme UI or POCO's MIUI/HyperOS), have aggressive or outdated root certificate stores. Render uses Let's Encrypt certificates. The native WebView engine will frequently reject these certificates and silently cancel the page load via `SslErrorHandler.cancel()`. It does not throw a traditional HTTP error; it just stops loading, leaving a blank canvas.
**The Fix:** You must aggressively bypass SSL errors in the `WebViewClient` for internal or trusted domains.
```kotlin
webView.webViewClient = object : WebViewClient() {
    @SuppressLint("WebViewClientOnReceivedSslError")
    override fun onReceivedSslError(
        view: WebView?,
        handler: android.webkit.SslErrorHandler?,
        error: android.net.http.SslError?
    ) {
        // Proceed unconditionally to bypass OEM certificate rejections
        handler?.proceed() 
    }
}
```

### 2. The Next.js CSS `100vh` Collapse Bug
**The Problem:** In many embedded WebViews, the `vh` (viewport height) CSS unit evaluates to `0px` on initial boot before the user interacts with the screen. If your Next.js `globals.css` uses `height: 100vh; overflow: hidden;` on the `html` and `body` tags, the entire application will be clipped down to 0 pixels tall. The background color will render, but the DOM content will vanish.
**The Fix:** Always use `100%` instead of `100vh` for the root document in WebView wrappers, and avoid strict `overflow: hidden` on the body if possible.
```css
/* CORRECT - globals.css */
html, body {
  width: 100%;
  height: 100%;
  min-height: 100%;
  margin: 0;
  padding: 0;
}
```

### 3. The Jetpack Compose `AndroidView` Render Pipeline Crash
**The Problem:** Jetpack Compose uses an `AndroidView` block to bridge traditional XML/View components (like `WebView`) into the Compose graphics pipeline. On specific devices with heavy OEM modifications (like the Realme Narzo 70 running Realme UI 5.0), embedding a hardware-accelerated WebView inside a Compose hierarchy causes a complete graphics measurement collapse. The WebView draws its background color (e.g., flashing red), but fails to mount the actual hardware-accelerated web content, resulting in a black box.
**The Fix:** The Nuclear Option. Rip Jetpack Compose out completely. Do not use `setContent { ... }` or `AndroidView`. Instead, fall back to pure, raw, bare-metal Android rendering by making the WebView the literal root of the Activity.
```kotlin
// In MainActivity.kt onCreate():
val webView = WebView(this)
// ... configure settings ...
setContentView(webView) // <-- The ultimate fix
webView.loadUrl(serverUrl)
```

## Summary
If the web app works in Google Chrome but fails in the Android App:
1. It is **not** a Next.js bug.
2. Check `setContentView(webView)` vs Compose.
3. Check `onReceivedSslError` bypass.
4. Check `globals.css` for `100vh` or `overflow: hidden`.
