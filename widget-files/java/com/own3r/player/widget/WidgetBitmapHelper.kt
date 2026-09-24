package com.own3r.player.widget

import android.content.Context
import android.graphics.*
import android.net.Uri
import java.io.File
import java.io.InputStream
import kotlin.math.min

object WidgetBitmapHelper {
    /**
     * Loads, crops to square, scales down to prevent Binder transaction limits,
     * and rounds the left corners to seamlessly fit the JetAudio widget styling.
     */
    fun loadRoundedCoverArt(
        context: Context,
        coverArtUriStr: String?,
        targetSizeDp: Int = 72,
        cornerRadiusDp: Float = 16f
    ): Bitmap? {
        if (coverArtUriStr.isNullOrBlank()) return null

        try {
            val density = context.resources.displayMetrics.density
            val targetPx = (targetSizeDp * density).toInt().coerceAtLeast(100)
            val cornerRadiusPx = cornerRadiusDp * density

            val stream: InputStream = (when {
                coverArtUriStr.startsWith("content://") || coverArtUriStr.startsWith("file://") -> {
                    context.contentResolver.openInputStream(Uri.parse(coverArtUriStr))
                }
                else -> {
                    val file = File(coverArtUriStr)
                    if (file.exists()) file.inputStream() else null
                }
            }) ?: return null

            val bytes = stream.use { it.readBytes() }
            if (bytes.isEmpty()) return null

            val options = BitmapFactory.Options().apply {
                inJustDecodeBounds = true
            }
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options)

            if (options.outWidth <= 0 || options.outHeight <= 0) return null

            options.inSampleSize = calculateInSampleSize(options, targetPx, targetPx)
            options.inJustDecodeBounds = false
            options.inPreferredConfig = Bitmap.Config.ARGB_8888

            val rawBitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options) ?: return null

            // Crop to 1:1 square
            val size = min(rawBitmap.width, rawBitmap.height)
            val x = (rawBitmap.width - size) / 2
            val y = (rawBitmap.height - size) / 2
            val squareBitmap = if (rawBitmap.width == rawBitmap.height) {
                rawBitmap
            } else {
                Bitmap.createBitmap(rawBitmap, x, y, size, size)
            }

            // Scale to targetPx
            val scaledBitmap = if (squareBitmap.width != targetPx || squareBitmap.height != targetPx) {
                Bitmap.createScaledBitmap(squareBitmap, targetPx, targetPx, true)
            } else {
                squareBitmap
            }

            // Output bitmap with rounded top-left and bottom-left corners
            val output = Bitmap.createBitmap(targetPx, targetPx, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(output)
            val paint = Paint(Paint.ANTI_ALIAS_FLAG)
            val shader = BitmapShader(scaledBitmap, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
            paint.shader = shader

            val rect = RectF(0f, 0f, targetPx.toFloat(), targetPx.toFloat())
            val path = Path()
            val radii = floatArrayOf(
                cornerRadiusPx, cornerRadiusPx, // Top-left
                0f, 0f,                         // Top-right
                0f, 0f,                         // Bottom-right
                cornerRadiusPx, cornerRadiusPx  // Bottom-left
            )
            path.addRoundRect(rect, radii, Path.Direction.CW)
            canvas.drawPath(path, paint)

            return output
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }

    private fun calculateInSampleSize(options: BitmapFactory.Options, reqWidth: Int, reqHeight: Int): Int {
        val (height: Int, width: Int) = options.run { outHeight to outWidth }
        var inSampleSize = 1

        if (height > reqHeight || width > reqWidth) {
            val halfHeight: Int = height / 2
            val halfWidth: Int = width / 2

            while (halfHeight / inSampleSize >= reqHeight && halfWidth / inSampleSize >= reqWidth) {
                inSampleSize *= 2
            }
        }
        return inSampleSize
    }
}
