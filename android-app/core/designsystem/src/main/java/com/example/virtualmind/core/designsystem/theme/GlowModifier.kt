package com.example.virtualmind.core.designsystem.theme

import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Neon glow effect. Draws a colored shadow behind the composable.
 * Usage: Modifier.neonGlow(PillarDeen, radius = 24.dp)
 */
fun Modifier.neonGlow(
    color: Color,
    radius: Dp = 20.dp,
    alpha: Float = 0.6f
): Modifier = this.drawBehind {
    drawIntoCanvas { canvas ->
        val paint = Paint().apply {
            asFrameworkPaint().apply {
                isAntiAlias = true
                this.color = android.graphics.Color.TRANSPARENT
                setShadowLayer(
                    radius.toPx(),
                    0f,
                    0f,
                    color.copy(alpha = alpha).toArgb()
                )
            }
        }
        canvas.drawRect(
            left = 0f,
            top = 0f,
            right = size.width,
            bottom = size.height,
            paint = paint
        )
    }
}

/**
 * Circular neon glow — for use on circular elements (Tasbih button, Fitness ring)
 */
fun Modifier.neonCircleGlow(
    color: Color,
    radius: Dp = 24.dp,
    alpha: Float = 0.5f
): Modifier = this.drawBehind {
    drawIntoCanvas { canvas ->
        val paint = Paint().apply {
            asFrameworkPaint().apply {
                isAntiAlias = true
                this.color = android.graphics.Color.TRANSPARENT
                setShadowLayer(
                    radius.toPx(),
                    0f,
                    0f,
                    color.copy(alpha = alpha).toArgb()
                )
            }
        }
        val centerX = size.width / 2f
        val centerY = size.height / 2f
        canvas.drawCircle(
            center = androidx.compose.ui.geometry.Offset(centerX, centerY),
            radius = minOf(size.width, size.height) / 2f,
            paint = paint
        )
    }
}
