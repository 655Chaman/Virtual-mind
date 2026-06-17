package com.example.virtualmind

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.widget.Toast

class SleepEnforcerService : AccessibilityService() {

    // Whitelist approach: Only allow these packages during sleep
    private val allowedPackages = setOf(
        "com.example.virtualmind",
        "com.android.launcher",
        "com.android.systemui",
        "com.google.android.apps.nexuslauncher", // Default Android launchers
        "com.sec.android.app.launcher", // Samsung launcher
        "com.android.dialer", // Phone calls
        "com.samsung.android.dialer",
        "com.android.deskclock", // Alarms
        "com.sec.android.app.clockpackage",
        "com.google.android.deskclock"
    )

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            return
        }

        val packageName = event.packageName?.toString() ?: return

        // Check if sleep is active
        val prefs = getSharedPreferences("virtual_mind_prefs", Context.MODE_PRIVATE)
        val unlockTime = prefs.getLong("sleep_unlock_time", 0L)
        val currentTime = System.currentTimeMillis()

        if (currentTime < unlockTime) {
            // Sleep is ACTIVE!
            if (!allowedPackages.contains(packageName) && !packageName.contains("launcher")) {
                Log.d("SleepEnforcer", "Blocked app launch: $packageName")
                
                // Immediately kick back to Home Screen
                performGlobalAction(GLOBAL_ACTION_HOME)
                
                Toast.makeText(this, "REST Protocol Active. Go to sleep.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onInterrupt() {
        // Required method, nothing to do
    }
}
