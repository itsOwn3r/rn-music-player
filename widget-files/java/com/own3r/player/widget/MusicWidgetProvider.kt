package com.own3r.player.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.view.KeyEvent
import android.widget.RemoteViews
import com.facebook.react.ReactApplication
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.own3r.player.MainActivity
import com.own3r.player.R

class MusicWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val title = prefs.getString(KEY_TITLE, null)
        val artist = prefs.getString(KEY_ARTIST, null)
        val coverArt = prefs.getString(KEY_COVER_ART, null)
        val isPlaying = prefs.getBoolean(KEY_IS_PLAYING, false)

        for (appWidgetId in appWidgetIds) {
            updateWidgetViews(context, appWidgetManager, appWidgetId, title, artist, coverArt, isPlaying)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        when (intent.action) {
            ACTION_WIDGET_PLAY_PAUSE -> {
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val currentIsPlaying = prefs.getBoolean(KEY_IS_PLAYING, false)
                val newIsPlaying = !currentIsPlaying

                // Optimistically update widget UI immediately
                prefs.edit().putBoolean(KEY_IS_PLAYING, newIsPlaying).apply()
                val title = prefs.getString(KEY_TITLE, null)
                val artist = prefs.getString(KEY_ARTIST, null)
                val coverArt = prefs.getString(KEY_COVER_ART, null)
                updateAllWidgets(context, title, artist, coverArt, newIsPlaying)

                val event = if (currentIsPlaying) "remote-pause" else "remote-play"
                val keyCode = if (currentIsPlaying) KeyEvent.KEYCODE_MEDIA_PAUSE else KeyEvent.KEYCODE_MEDIA_PLAY

                val sentToJs = sendEventToReactNative(context, event)
                if (!sentToJs) {
                    dispatchMediaKeyEvent(context, keyCode)
                }
            }

            ACTION_WIDGET_NEXT -> {
                val sentToJs = sendEventToReactNative(context, "remote-next")
                if (!sentToJs) {
                    dispatchMediaKeyEvent(context, KeyEvent.KEYCODE_MEDIA_NEXT)
                }
            }

            ACTION_WIDGET_PREV -> {
                val sentToJs = sendEventToReactNative(context, "remote-previous")
                if (!sentToJs) {
                    dispatchMediaKeyEvent(context, KeyEvent.KEYCODE_MEDIA_PREVIOUS)
                }
            }
        }
    }

    companion object {
        const val PREFS_NAME = "MusicWidgetPrefs"
        const val KEY_TITLE = "title"
        const val KEY_ARTIST = "artist"
        const val KEY_COVER_ART = "coverArt"
        const val KEY_IS_PLAYING = "isPlaying"

        const val ACTION_WIDGET_PREV = "com.own3r.player.ACTION_WIDGET_PREV"
        const val ACTION_WIDGET_PLAY_PAUSE = "com.own3r.player.ACTION_WIDGET_PLAY_PAUSE"
        const val ACTION_WIDGET_NEXT = "com.own3r.player.ACTION_WIDGET_NEXT"

        fun updateAllWidgets(
            context: Context,
            title: String?,
            artist: String?,
            coverArtUri: String?,
            isPlaying: Boolean
        ) {
            // Persist to SharedPreferences so widgets survive launcher restarts
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().apply {
                putString(KEY_TITLE, title)
                putString(KEY_ARTIST, artist)
                putString(KEY_COVER_ART, coverArtUri)
                putBoolean(KEY_IS_PLAYING, isPlaying)
                apply()
            }

            val appWidgetManager = AppWidgetManager.getInstance(context) ?: return
            val componentName = ComponentName(context, MusicWidgetProvider::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName) ?: return

            for (appWidgetId in appWidgetIds) {
                updateWidgetViews(context, appWidgetManager, appWidgetId, title, artist, coverArtUri, isPlaying)
            }
        }

        private fun updateWidgetViews(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int,
            title: String?,
            artist: String?,
            coverArtUri: String?,
            isPlaying: Boolean
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_music_player)

            // 1. Song Title
            views.setTextViewText(
                R.id.widget_song_title,
                if (!title.isNullOrBlank()) title else context.getString(R.string.widget_no_song)
            )

            // 2. Artist Name
            views.setTextViewText(
                R.id.widget_song_artist,
                if (!artist.isNullOrBlank()) artist else context.getString(R.string.widget_default_artist)
            )

            // 3. Play / Pause Button Icon
            views.setImageViewResource(
                R.id.widget_btn_play_pause,
                if (isPlaying) R.drawable.ic_widget_pause else R.drawable.ic_widget_play
            )

            // 4. Cover Art (Left, Full Height, Rounded Left Corners)
            val bitmap = WidgetBitmapHelper.loadRoundedCoverArt(context, coverArtUri, targetSizeDp = 72, cornerRadiusDp = 16f)
            if (bitmap != null) {
                views.setImageViewBitmap(R.id.widget_cover_art, bitmap)
            } else {
                views.setImageViewResource(R.id.widget_cover_art, R.drawable.ic_widget_placeholder)
            }

            // 5. Click actions
            // Open App when tapping cover art or song details
            val openAppIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            val openAppPendingIntent = PendingIntent.getActivity(
                context,
                0,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_cover_art, openAppPendingIntent)
            views.setOnClickPendingIntent(R.id.widget_info_container, openAppPendingIntent)

            // Prev Button
            val prevIntent = Intent(context, MusicWidgetProvider::class.java).apply {
                action = ACTION_WIDGET_PREV
            }
            val prevPendingIntent = PendingIntent.getBroadcast(
                context,
                1,
                prevIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_btn_prev, prevPendingIntent)

            // Play/Pause Button
            val playPauseIntent = Intent(context, MusicWidgetProvider::class.java).apply {
                action = ACTION_WIDGET_PLAY_PAUSE
            }
            val playPausePendingIntent = PendingIntent.getBroadcast(
                context,
                2,
                playPauseIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_btn_play_pause, playPausePendingIntent)

            // Next Button
            val nextIntent = Intent(context, MusicWidgetProvider::class.java).apply {
                action = ACTION_WIDGET_NEXT
            }
            val nextPendingIntent = PendingIntent.getBroadcast(
                context,
                3,
                nextIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_btn_next, nextPendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun sendEventToReactNative(context: Context, eventName: String): Boolean {
            return try {
                val app = context.applicationContext as? ReactApplication ?: return false
                val reactContext = app.reactNativeHost.reactInstanceManager.currentReactContext
                if (reactContext != null && reactContext.hasActiveReactInstance()) {
                    reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit(eventName, null)
                    true
                } else {
                    false
                }
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }

        private fun dispatchMediaKeyEvent(context: Context, keyCode: Int) {
            try {
                val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
                audioManager.dispatchMediaKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, keyCode))
                audioManager.dispatchMediaKeyEvent(KeyEvent(KeyEvent.ACTION_UP, keyCode))
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
