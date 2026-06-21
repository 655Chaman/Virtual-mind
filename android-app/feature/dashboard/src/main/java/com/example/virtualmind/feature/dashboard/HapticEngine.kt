package com.example.virtualmind.feature.dashboard

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

object HapticEngine {
    /**
     * Light tick — for habit toggles, small increments
     */
    fun tick(context: Context) = vibrate(context, 8, 50)

    /**
     * Medium click — for button presses, prayer toggles
     */
    fun click(context: Context) = vibrate(context, 50, 120)

    /**
     * Heavy thud — for locking in the discipline score, completing a fitness session
     */
    fun thud(context: Context) = vibrate(context, 100, 255)

    /**
     * Success double-pulse — for Tasbih phase cycling, score secured
     */
    fun success(context: Context) {
        val vibrator = getVibrator(context) ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(
                VibrationEffect.createWaveform(
                    longArrayOf(0, 40, 80, 40),
                    intArrayOf(0, 180, 0, 120),
                    -1
                )
            )
        }
    }

    private fun vibrate(context: Context, durationMs: Long, amplitude: Int) {
        val vibrator = getVibrator(context) ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val clampedAmplitude = amplitude.coerceIn(1, 255)
            vibrator.vibrate(
                VibrationEffect.createOneShot(durationMs, clampedAmplitude)
            )
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(durationMs)
        }
    }

    private fun getVibrator(context: Context): Vibrator? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            manager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }
}
