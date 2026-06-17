import re

with open("android-app/app/src/main/java/com/example/virtualmind/MainActivity.kt", "r") as f:
    content = f.read()

# We need to replace everything from `class MainActivity : ComponentActivity() {` down to the end of the file.
# The new implementation will just be a standard Activity.

new_main_activity = """class MainActivity : ComponentActivity() {

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
        val defaultUrl = "https://virtual-mind.onrender.com/home"
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

        setContentView(webView)
        webView.loadUrl(serverUrl)
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
"""

# Replace everything starting from "class MainActivity : ComponentActivity() {"
pattern = r"class MainActivity : ComponentActivity\(\) \{.*"
new_content = re.sub(pattern, new_main_activity, content, flags=re.DOTALL)

with open("android-app/app/src/main/java/com/example/virtualmind/MainActivity.kt", "w") as f:
    f.write(new_content)

print("Rewrote MainActivity.kt successfully!")
