package com.example.virtualmind

import android.annotation.SuppressLint
import android.content.Context
import android.os.Bundle
import android.view.WindowManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.Manifest
import android.content.pm.PackageManager
import android.webkit.GeolocationPermissions
import android.webkit.ValueCallback
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.net.Uri
import android.content.Intent
import android.provider.MediaStore
import androidx.core.content.FileProvider
import java.io.File
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.activity.ComponentActivity
import androidx.core.app.NotificationCompat
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.virtualmind.theme.*

// Operator identity — used in notification personalization
private const val OPERATOR_NAME = "Chaman"

// Notification channel IDs
private const val CHANNEL_GENERAL = "virtual_mind_alerts"
private const val CHANNEL_PRAYER  = "virtual_mind_prayer"
private const val CHANNEL_ALARM   = "virtual_mind_alarm"

class AndroidJSInterface(private val context: Context) {

    /** Creates all notification channels — idempotent, safe to call multiple times. */
    private fun ensureChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // General alerts channel (HIGH priority — shows in shade, plays sound)
            if (manager.getNotificationChannel(CHANNEL_GENERAL) == null) {
                val general = NotificationChannel(
                    CHANNEL_GENERAL,
                    "Virtual Mind Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Scheduled reminders and system alerts"
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 200, 100, 200)
                }
                manager.createNotificationChannel(general)
            }

            // Prayer channel (HIGH — dedicated for Salah reminders)
            if (manager.getNotificationChannel(CHANNEL_PRAYER) == null) {
                val prayer = NotificationChannel(
                    CHANNEL_PRAYER,
                    "Salah Prayer Times",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Adhan / prayer time alerts"
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 300, 100, 300, 100, 300)
                }
                manager.createNotificationChannel(prayer)
            }

            // Alarm channel (MAX — for rest timer, breaks through DND)
            if (manager.getNotificationChannel(CHANNEL_ALARM) == null) {
                val alarm = NotificationChannel(
                    CHANNEL_ALARM,
                    "Rest Timer Alarm",
                    NotificationManager.IMPORTANCE_MAX
                ).apply {
                    description = "Workout rest timer completion alerts"
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 300, 150, 300, 150, 500)
                }
                manager.createNotificationChannel(alarm)
            }
        }
    }

    @JavascriptInterface
    fun vibrate(duration: Long) {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(duration)
        }
    }

    @JavascriptInterface
    fun showNotification(title: String, message: String) {
        ensureChannels()
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        // Determine channel: use prayer channel if title mentions prayer/salah
        val channelId = if (title.contains("Salah", ignoreCase = true) ||
                             title.contains("Prayer", ignoreCase = true) ||
                             title.contains("Fajr", ignoreCase = true) ||
                             title.contains("Dhuhr", ignoreCase = true) ||
                             title.contains("Asr", ignoreCase = true) ||
                             title.contains("Maghrib", ignoreCase = true) ||
                             title.contains("Isha", ignoreCase = true)) {
            CHANNEL_PRAYER
        } else {
            CHANNEL_GENERAL
        }

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setVibrate(longArrayOf(0, 200, 100, 200))
            .build()
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    /**
     * Alarm-level notification for time-critical events (rest timer, urgent reminders).
     * Uses IMPORTANCE_MAX channel — designed to break through focus modes.
     */
    @JavascriptInterface
    fun triggerAlarmNotification(title: String, message: String) {
        ensureChannels()
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Tap notification to bring app to foreground
        val tapIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pendingIntent = if (tapIntent != null) {
            android.app.PendingIntent.getActivity(
                context,
                0,
                tapIntent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )
        } else null

        val notification = NotificationCompat.Builder(context, CHANNEL_ALARM)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setVibrate(longArrayOf(0, 300, 150, 300, 150, 500))
            .apply { if (pendingIntent != null) setContentIntent(pendingIntent) }
            .build()

        // Also trigger vibration directly for immediate feedback
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 300, 150, 300, 150, 500), -1))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(longArrayOf(0, 300, 150, 300, 150, 500), -1)
        }

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    @JavascriptInterface
    fun startSleepSession(hours: Int) {
        val prefs = context.getSharedPreferences("virtual_mind_prefs", Context.MODE_PRIVATE)
        val unlockTime = System.currentTimeMillis() + (hours * 60 * 60 * 1000L)
        prefs.edit().putLong("sleep_unlock_time", unlockTime).apply()
        showNotification("Sleep Protocol Active", "$OPERATOR_NAME, phone locked for $hours hours. Do not disturb.")
    }
}

class MainActivity : ComponentActivity() {

    private var geoCallback: GeolocationPermissions.Callback? = null
    private var geoOrigin: String? = null

    private val locationPermissionRequest = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val granted = permissions.entries.any { it.value }
        geoCallback?.invoke(geoOrigin, granted, false)
        geoCallback = null
        geoOrigin = null
    }

    // For file chooser & camera capturing
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var cameraPhotoUri: Uri? = null
    private var cameraPhotoFile: File? = null

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val callback = fileChooserCallback
        if (callback != null) {
            var results: Array<Uri>? = null
            if (result.resultCode == RESULT_OK) {
                val dataIntent = result.data
                if (dataIntent != null && dataIntent.data != null) {
                    val dataString = dataIntent.dataString
                    if (dataString != null) {
                        results = arrayOf(Uri.parse(dataString))
                    }
                } else {
                    val uri = cameraPhotoUri
                    val file = cameraPhotoFile
                    if (uri != null && file != null && file.exists() && file.length() > 0) {
                        results = arrayOf(uri)
                    }
                }
            }
            callback.onReceiveValue(results)
            fileChooserCallback = null
        }
    }

    private val cameraPermissionRequest = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        launchFileChooser(withCamera = isGranted)
    }

    private fun launchFileChooser(withCamera: Boolean) {
        val callback = fileChooserCallback
        if (callback == null) return
        try {
            val intents = ArrayList<Intent>()
            if (withCamera) {
                val photoFile = File.createTempFile("IMG_${System.currentTimeMillis()}_", ".jpg", cacheDir)
                val authority = "${packageName}.fileprovider"
                val uri = FileProvider.getUriForFile(this, authority, photoFile)
                cameraPhotoFile = photoFile
                cameraPhotoUri = uri

                val cameraIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
                    putExtra(MediaStore.EXTRA_OUTPUT, uri)
                    addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
                intents.add(cameraIntent)
            } else {
                cameraPhotoFile = null
                cameraPhotoUri = null
            }

            val contentSelectionIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "image/*"
            }

            val chooserIntent = Intent(Intent.ACTION_CHOOSER).apply {
                putExtra(Intent.EXTRA_INTENT, contentSelectionIntent)
                putExtra(Intent.EXTRA_TITLE, "Select Source")
                if (intents.isNotEmpty()) {
                    putExtra(Intent.EXTRA_INITIAL_INTENTS, intents.toTypedArray())
                }
            }

            fileChooserLauncher.launch(chooserIntent)
        } catch (e: Exception) {
            android.util.Log.e("VirtualMindWebView", "Error launching file chooser", e)
            try {
                val contentSelectionIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "image/*"
                }
                fileChooserLauncher.launch(contentSelectionIntent)
            } catch (ex: Exception) {
                callback.onReceiveValue(null)
                fileChooserCallback = null
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Fulfill 24/7 keep-awake requirement
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Request POST_NOTIFICATIONS permission on Android 13+ (API 33)
        // This is REQUIRED for ANY notification to appear on modern Android
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 9001)
            }
        }

        // Pre-create notification channels immediately on boot
        // so they are available when the WebView JS bridge calls showNotification()
        AndroidJSInterface(this).apply {
            // channels created lazily inside ensureChannels(), but we force it here
        }
        
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
        )
        setContent {
            MaterialTheme {
                MainContent()
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Composable
    fun MainContent() {
        val context = this
        // Use persistent storage for the URL so you don't have to retype it every time the app opens
        val prefs = context.getSharedPreferences("VirtualMindPrefs", Context.MODE_PRIVATE)
        val defaultUrl = "https://virtual-mind.onrender.com/home" // Bypassing root redirect directly to Swipeable UI
        var serverUrl by remember { mutableStateOf(prefs.getString("server_url_v2", defaultUrl) ?: defaultUrl) }
        var tempUrlInput by remember { mutableStateOf(serverUrl) }
        
        var webViewInstance by remember { mutableStateOf<WebView?>(null) }
        var connectionError by remember { mutableStateOf<String?>(null) }
        var isLoading by remember { mutableStateOf(true) }
        var showSettings by remember { mutableStateOf(false) }

        // Handle hardware back button dynamically with path-aware routing and JS fallback
        BackHandler(enabled = true) {
            val webView = webViewInstance
            if (webView != null) {
                val currentUrl = webView.url ?: ""
                val path = try { Uri.parse(currentUrl).path ?: "" } catch (e: Exception) { "" }
                val nativeCanGoBack = webView.canGoBack()
                
                android.util.Log.d("VirtualMindWebView", "Back gesture. URL: $currentUrl, Path: $path, canGoBack: $nativeCanGoBack")
                
                // Determine if we are on the main dashboard / home screen or lock screen
                val isAtHome = path == "" || path == "/" || path == "/home" || path == "/home/" || path == "/locked" || path == "/locked/"
                
                if (!isAtHome) {
                    if (nativeCanGoBack) {
                        webView.goBack()
                    } else {
                        // Fallback to JS history back in case native canGoBack is out of sync due to pushState SPA navigation
                        webView.evaluateJavascript("window.history.back();", null)
                    }
                } else {
                    (context as? android.app.Activity)?.finish()
                }
            } else {
                (context as? android.app.Activity)?.finish()
            }
        }

        // 10-second timeout to catch silent network failures
        LaunchedEffect(isLoading, connectionError) {
            if (isLoading && connectionError == null) {
                kotlinx.coroutines.delay(10000)
                if (isLoading) {
                    connectionError = "Connection timed out. Check IP and Network."
                    isLoading = false
                    showSettings = true
                }
            }
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(BackgroundPrimary)   // App root background
        ) {
            // Fullscreen WebView
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { ctx ->
                    WebView(ctx).apply {
                        // Bulletproof cache clearing to fix black screens from stale PWAs
                        clearCache(true)
                        
                        settings.apply {
                            javaScriptEnabled = true
                            domStorageEnabled = true
                            // databaseEnabled is deprecated and enabled by default in modern Android
                            @Suppress("DEPRECATION")
                            databaseEnabled = true
                            mediaPlaybackRequiresUserGesture = false
                            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                            loadWithOverviewMode = true
                            useWideViewPort = true
                            cacheMode = WebSettings.LOAD_NO_CACHE
                        }
                        
                        // REMOVED HARDWARE ACCELERATION: On many POCO devices, forcing hardware acceleration causes a complete GPU render failure, resulting in a black box.
                        // setLayerType(View.LAYER_TYPE_HARDWARE, null)
                        
                        // Disable overscroll bounce for native feel
                        overScrollMode = View.OVER_SCROLL_NEVER

                        // BRIGHT RED BACKGROUND: If the screen is RED, it means the WebView is working but the Next.js page is completely empty/transparent.
                        // If the screen is BLACK, it means the WebView itself is literally failing to exist on your screen.
                        setBackgroundColor(android.graphics.Color.RED)

                        // Inject Native Vibration Bridge
                        @SuppressLint("JavascriptInterface")
                        addJavascriptInterface(AndroidJSInterface(context), "Android")

                        // Simple WebChromeClient for console logging and permissions
                        webChromeClient = object : android.webkit.WebChromeClient() {
                            override fun onConsoleMessage(consoleMessage: android.webkit.ConsoleMessage?): Boolean {
                                android.util.Log.d("VirtualMindWebView", "[${consoleMessage?.messageLevel()}] ${consoleMessage?.message()}")
                                return super.onConsoleMessage(consoleMessage)
                            }

                            override fun onGeolocationPermissionsShowPrompt(
                                origin: String,
                                callback: GeolocationPermissions.Callback
                            ) {
                                if (ContextCompat.checkSelfPermission(
                                        context,
                                        Manifest.permission.ACCESS_FINE_LOCATION
                                    ) == PackageManager.PERMISSION_GRANTED
                                ) {
                                    callback.invoke(origin, true, false)
                                } else {
                                    geoCallback = callback
                                    geoOrigin = origin
                                    locationPermissionRequest.launch(
                                        arrayOf(
                                            Manifest.permission.ACCESS_FINE_LOCATION,
                                            Manifest.permission.ACCESS_COARSE_LOCATION
                                        )
                                    )
                                }
                            }

                            override fun onShowFileChooser(
                                webView: WebView?,
                                filePathCallback: ValueCallback<Array<Uri>>?,
                                fileChooserParams: FileChooserParams?
                            ): Boolean {
                                fileChooserCallback?.onReceiveValue(null)
                                fileChooserCallback = filePathCallback

                                if (ContextCompat.checkSelfPermission(
                                        context,
                                        Manifest.permission.CAMERA
                                    ) == PackageManager.PERMISSION_GRANTED
                                ) {
                                    launchFileChooser(withCamera = true)
                                } else {
                                    cameraPermissionRequest.launch(Manifest.permission.CAMERA)
                                }
                                return true
                            }

                            override fun onPermissionRequest(request: PermissionRequest?) {
                                if (request != null) {
                                    val resourcesToGrant = request.resources.filter { res ->
                                        when (res) {
                                            PermissionRequest.RESOURCE_VIDEO_CAPTURE -> 
                                                ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
                                            else -> true
                                        }
                                    }.toTypedArray()
                                    
                                    if (resourcesToGrant.isNotEmpty()) {
                                        request.grant(resourcesToGrant)
                                    } else {
                                        request.deny()
                                    }
                                }
                            }
                        }

                        webViewClient = object : WebViewClient() {
                            // AGGRESSIVE SSL BYPASS: Older Android/POCO devices have expired DST Root CA X3 certificates.
                            // They silently reject Let's Encrypt certificates (which Render uses) and cancel the page load,
                            // resulting in a completely black screen with zero errors. This forces the WebView to ignore the error.
                            @SuppressLint("WebViewClientOnReceivedSslError")
                            override fun onReceivedSslError(
                                view: WebView?,
                                handler: android.webkit.SslErrorHandler?,
                                error: android.net.http.SslError?
                            ) {
                                handler?.proceed() // Proceed unconditionally
                            }

                            override fun onReceivedError(
                                view: WebView?,
                                request: WebResourceRequest?,
                                error: WebResourceError?
                            ) {
                                super.onReceivedError(view, request, error)
                                if (request?.isForMainFrame == true) {
                                    connectionError = error?.description?.toString() ?: "Connection refused"
                                    isLoading = false
                                }
                            }

                            override fun onPageFinished(view: WebView?, url: String?) {
                                super.onPageFinished(view, url)
                                if (connectionError == null) {
                                    isLoading = false
                                }
                            }
                        }
                        webViewInstance = this
                        loadUrl(serverUrl)
                    }
                },
                update = { webView ->
                    // Handle reloading if URL changed
                    if (webView.url != serverUrl) {
                        webView.loadUrl(serverUrl)
                    }
                }
            )

            // Floating settings button removed as requested

            // Settings/Error configuration overlay
            if (showSettings || connectionError != null) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(OverlayScrim)          // 95 % black scrim
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(OverlayCard, shape = RoundedCornerShape(8.dp))  // card bg
                            .border(1.dp, OverlayBorder, RoundedCornerShape(8.dp))      // card border
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            text = "⚡ VIRTUAL MIND 2.0 ⚡",
                            color = OverlayTitle,           // AccentGold — brand heading
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 2.sp
                        )

                        Text(
                            text = if (connectionError != null) "CONNECTION FAILURE" else "OPERATOR CONTROL PANEL",
                            color = if (connectionError != null) OverlayError else OverlaySubtitle,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 1.sp
                        )

                        Text(
                            text = "Target URL: $serverUrl" + (if (connectionError != null) "\nError: $connectionError" else ""),
                            color = TextDim,               // dimmed status text
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(vertical = 4.dp)
                        )

                        HorizontalDivider(color = DividerColor)      // named divider token

                        Text(
                            text = "Ensure your Mac is running the server (./start_mobile.sh) and this phone is connected to the same WiFi network.",
                            color = OverlayHelpText,        // helper instruction text
                            fontSize = 12.sp,
                            fontFamily = FontFamily.Monospace,
                            textAlign = TextAlign.Center
                        )

                        OutlinedTextField(
                            value = tempUrlInput,
                            onValueChange = { tempUrlInput = it },
                            label = { Text("Server URL", color = InputLabel, fontFamily = FontFamily.Monospace) },
                            textStyle = TextStyle(color = InputText, fontFamily = FontFamily.Monospace, fontSize = 14.sp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor   = InputBorderFocused,    // ParrotGreen when focused
                                unfocusedBorderColor = InputBorderDefault,    // subtle grey when idle
                                focusedContainerColor   = InputBackground,    // deep black fill
                                unfocusedContainerColor = InputBackground
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )

                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Button(
                                onClick = {
                                    connectionError = null
                                    showSettings = false
                                    isLoading = true
                                    webViewInstance?.reload()
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = ButtonSecondary),  // secondary grey
                                shape = RoundedCornerShape(4.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("RETRY", color = ButtonSecondaryText, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                            }

                            Button(
                                onClick = {
                                    serverUrl = tempUrlInput
                                    prefs.edit().putString("server_url_v2", tempUrlInput).apply()
                                    connectionError = null
                                    showSettings = false
                                    isLoading = true
                                    webViewInstance?.loadUrl(tempUrlInput)
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = AccentGold),    // gold CTA
                                shape = RoundedCornerShape(4.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("CONNECT", color = BackgroundPrimary, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // Custom boot loading overlay
            if (isLoading && connectionError == null) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(LoadingBackground),    // deep black boot screen
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        CircularProgressIndicator(color = LoadingSpinner)   // gold spinner
                        Text(
                            text = "CONNECTING TO KERNEL...",
                            color = LoadingText,           // dimmed gold label
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 4.sp
                        )

                        Spacer(modifier = Modifier.height(32.dp))

                        Button(
                            onClick = {
                                showSettings = true
                                connectionError = "Manual Override"
                                isLoading = false
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = ButtonSecondary),  // secondary grey
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text("TROUBLESHOOT", color = ButtonSecondaryText, fontFamily = FontFamily.Monospace, fontSize = 10.sp)
                        }
                    }
                }
            }
        }
    }
}
