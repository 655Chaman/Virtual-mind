package com.example.virtualmind

import android.annotation.SuppressLint
import android.content.Context
import dagger.hilt.android.AndroidEntryPoint
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
import androidx.compose.foundation.clickable
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
import com.airbnb.lottie.compose.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.navigation.NavType

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

    @JavascriptInterface
    fun updatePrayerTimes(prayerTimesJson: String) {
        android.util.Log.d("VirtualMindWebView", "Received updated prayer times from JS")
        PrayerAlarmScheduler.saveAndScheduleAlarms(context, prayerTimesJson)
    }
    @JavascriptInterface
    fun playSuccessAnimation() {
        (context as? MainActivity)?.triggerSuccessAnimation()
    }
}

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    var showSuccessAnimation = mutableStateOf(false)

    fun triggerSuccessAnimation() {
        showSuccessAnimation.value = true
    }

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

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled", "JavascriptInterface")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 9001)
            }
        }

        AndroidJSInterface(this)

        val prefs = getSharedPreferences("VirtualMindPrefs", Context.MODE_PRIVATE)
        // Default to the root page so the new Welcome Screen is shown
        val defaultUrl = "https://virtual-mind.onrender.com/"
        val serverUrl = prefs.getString("server_url_v2", defaultUrl) ?: defaultUrl

        webView = WebView(this)
        webView.layoutParams = android.view.ViewGroup.LayoutParams(
            android.view.ViewGroup.LayoutParams.MATCH_PARENT,
            android.view.ViewGroup.LayoutParams.MATCH_PARENT
        )
        
        webView.clearCache(true)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            @Suppress("DEPRECATION")
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            loadWithOverviewMode = true
            useWideViewPort = true
            cacheMode = WebSettings.LOAD_NO_CACHE
        }
        
        webView.overScrollMode = View.OVER_SCROLL_NEVER
        webView.setBackgroundColor(android.graphics.Color.parseColor("#060606"))

        webView.addJavascriptInterface(AndroidJSInterface(this), "Android")

        webView.webChromeClient = object : android.webkit.WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: android.webkit.ConsoleMessage?): Boolean {
                android.util.Log.d("VirtualMindWebView", "[${consoleMessage?.messageLevel()}] ${consoleMessage?.message()}")
                return super.onConsoleMessage(consoleMessage)
            }

            override fun onGeolocationPermissionsShowPrompt(
                origin: String,
                callback: GeolocationPermissions.Callback
            ) {
                if (ContextCompat.checkSelfPermission(
                        this@MainActivity,
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
                        this@MainActivity,
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
                                ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
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

        webView.webViewClient = object : WebViewClient() {
            @SuppressLint("WebViewClientOnReceivedSslError")
            override fun onReceivedSslError(
                view: WebView?,
                handler: android.webkit.SslErrorHandler?,
                error: android.net.http.SslError?
            ) {
                handler?.proceed()
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
            }
        }

        setContent {
            com.example.virtualmind.core.designsystem.theme.VirtualMindTheme {
                val navController = rememberNavController()
                NavHost(navController = navController, startDestination = "welcome") {
                    composable("welcome") {
                        com.example.virtualmind.feature.dashboard.WelcomeScreen(
                            onNavigateToDashboard = {
                                navController.navigate("dashboard") {
                                    popUpTo("welcome") { inclusive = true }
                                }
                            }
                        )
                    }
                    composable("dashboard") {
                        @OptIn(androidx.compose.foundation.ExperimentalFoundationApi::class)
                        com.example.virtualmind.feature.dashboard.DashboardSwipeScreen(
                            onNavigateToPillar = { route ->
                                if (route == "terminal_route") {
                                    navController.navigate("native_terminal")
                                } else if (route == "oracle_route") {
                                    navController.navigate("native_oracle")
                                } else if (route == "elesium_route") {
                                    navController.navigate("native_elesium")
                                } else if (route == "fitness_route") {
                                    navController.navigate("native_fitness")
                                } else if (route == "deen_route") {
                                    navController.navigate("native_deen")
                                } else if (route == "self_route") {
                                    navController.navigate("native_self")
                                } else if (route == "wellness_route") {
                                    navController.navigate("native_wellness")
                                } else {
                                    // Map native route to web route for now to preserve anti-fragile legacy structure
                                    val webRoute = when (route) {
                                        "global_command" -> "command"
                                        else -> ""
                                    }
                                    navController.navigate("webview?path=$webRoute")
                                }
                            }
                        )
                    }
                    composable("native_terminal") {
                        com.example.virtualmind.feature.dashboard.TerminalScreen(
                            onNavigateBack = {
                                navController.popBackStack()
                            }
                        )
                    }
                    composable("native_oracle") {
                        com.example.virtualmind.feature.dashboard.OracleScreen(
                            onNavigateBack = {
                                navController.popBackStack()
                            }
                        )
                    }
                    composable("native_elesium") {
                        com.example.virtualmind.feature.dashboard.ElesiumScreen(
                            onNavigateBack = {
                                navController.popBackStack()
                            }
                        )
                    }
                    composable("native_fitness") {
                        com.example.virtualmind.feature.dashboard.FitnessScreen(
                            onNavigateBack = {
                                navController.popBackStack()
                            }
                        )
                    }
                    composable("native_deen") {
                        com.example.virtualmind.feature.dashboard.DeenScreen(
                            onNavigateBack = {
                                navController.popBackStack()
                            }
                        )
                    }
                    composable("native_self") {
                        com.example.virtualmind.feature.dashboard.SelfScreen(
                            onNavigateBack = {
                                navController.popBackStack()
                            }
                        )
                    }
                    composable("native_wellness") {
                        Box(modifier = Modifier.fillMaxSize().background(Color(0xFF020813)), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("RECOVERY (WELLNESS)", color = com.example.virtualmind.core.designsystem.theme.PillarWellness, fontFamily = com.example.virtualmind.core.designsystem.theme.ShareTechMono, fontWeight = FontWeight.Bold, fontSize = 24.sp)
                                Spacer(modifier = Modifier.height(16.dp))
                                Text("COMING IN PHASE 11", color = Color.Gray, fontFamily = com.example.virtualmind.core.designsystem.theme.ShareTechMono, fontSize = 14.sp)
                                Spacer(modifier = Modifier.height(32.dp))
                                Text("[ GO BACK ]", color = Color.White, fontFamily = com.example.virtualmind.core.designsystem.theme.ShareTechMono, modifier = Modifier.clickable { navController.popBackStack() })
                            }
                        }
                    }
                    composable(
                        route = "webview?path={path}",
                        arguments = listOf(navArgument("path") { 
                            type = NavType.StringType 
                            defaultValue = ""
                        })
                    ) { backStackEntry ->
                        val path = backStackEntry.arguments?.getString("path") ?: ""
                        val targetUrl = if (path.isEmpty()) serverUrl else "$serverUrl$path"

                        Box(modifier = Modifier.fillMaxSize()) {
                            AndroidView(
                                factory = { webView.apply { loadUrl(targetUrl) } },
                                modifier = Modifier.fillMaxSize(),
                                update = { view -> 
                                    if (view.url != targetUrl && view.url?.endsWith(targetUrl) != true) {
                                        view.loadUrl(targetUrl)
                                    }
                                }
                            )

                            if (showSuccessAnimation.value) {
                                val composition by rememberLottieComposition(LottieCompositionSpec.Url("https://assets3.lottiefiles.com/packages/lf20_U10842.json"))
                                val progress by animateLottieCompositionAsState(
                                    composition,
                                    isPlaying = true,
                                    iterations = 1
                                )
                                
                                LaunchedEffect(progress) {
                                    if (progress == 1f) {
                                        showSuccessAnimation.value = false
                                    }
                                }

                                LottieAnimation(
                                    composition = composition,
                                    progress = { progress },
                                    modifier = Modifier
                                        .align(Alignment.Center)
                                        .size(250.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            val currentUrl = webView.url ?: ""
            val path = try { Uri.parse(currentUrl).path ?: "" } catch (e: Exception) { "" }
            val isAtHome = path == "" || path == "/" || path == "/home" || path == "/home/" || path == "/locked" || path == "/locked/"
            if (!isAtHome) {
                webView.goBack()
                return
            }
        }
        super.onBackPressed()
    }
}
