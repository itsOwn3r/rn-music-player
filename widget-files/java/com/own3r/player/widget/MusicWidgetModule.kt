package com.own3r.player.widget

import android.content.Context
import com.facebook.react.bridge.*

class MusicWidgetModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "MusicWidgetModule"

    @ReactMethod
    fun updateWidget(data: ReadableMap) {
        val title = if (data.hasKey("title") && !data.isNull("title")) data.getString("title") else null
        val artist = if (data.hasKey("artist") && !data.isNull("artist")) data.getString("artist") else null
        val coverArt = if (data.hasKey("coverArt") && !data.isNull("coverArt")) data.getString("coverArt") else null
        val isPlaying = if (data.hasKey("isPlaying")) data.getBoolean("isPlaying") else false

        MusicWidgetProvider.updateAllWidgets(reactContext, title, artist, coverArt, isPlaying)
    }

    @ReactMethod
    fun getWidgetState(promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences(MusicWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
            val map = Arguments.createMap().apply {
                putString("title", prefs.getString(MusicWidgetProvider.KEY_TITLE, null))
                putString("artist", prefs.getString(MusicWidgetProvider.KEY_ARTIST, null))
                putString("coverArt", prefs.getString(MusicWidgetProvider.KEY_COVER_ART, null))
                putBoolean("isPlaying", prefs.getBoolean(MusicWidgetProvider.KEY_IS_PLAYING, false))
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("GET_WIDGET_STATE_ERROR", e.message, e)
        }
    }
}
