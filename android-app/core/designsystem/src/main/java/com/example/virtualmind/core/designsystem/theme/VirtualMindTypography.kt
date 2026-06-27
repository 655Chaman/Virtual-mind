package com.example.virtualmind.core.designsystem.theme

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.virtualmind.core.designsystem.R

// Define robust, offline-bundled FontFamilies
val Cinzel = FontFamily(
    Font(R.font.cinzel, FontWeight.Normal),
    Font(R.font.cinzel, FontWeight.Bold) 
)

val ShareTechMono = FontFamily(
    Font(R.font.share_tech_mono, FontWeight.Normal)
)

val CormorantGaramond = FontFamily(
    Font(R.font.cormorant_garamond_regular, FontWeight.Normal)
)

// Define core typographic styles for reuse
object VirtualMindTypography {
    val h1 = TextStyle(
        fontFamily = Cinzel,
        fontWeight = FontWeight.Bold,
        fontSize = 48.sp
    )
    val body = TextStyle(
        fontFamily = ShareTechMono,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp
    )
}
