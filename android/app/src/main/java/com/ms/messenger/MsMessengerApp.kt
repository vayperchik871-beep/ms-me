package com.ms.messenger

import android.app.Application
import coil.ImageLoader
import coil.ImageLoaderFactory
import coil.disk.DiskCache
import coil.memory.MemoryCache
import coil.decode.VideoFrameDecoder
import com.ms.messenger.data.PrefsHolder
import com.ms.messenger.data.SessionStore
import com.ms.messenger.data.ApiClient

class MsMessengerApp : Application(), ImageLoaderFactory {
    override fun newImageLoader(): ImageLoader {
        return ImageLoader.Builder(this)
            .components {
                add(VideoFrameDecoder.Factory())
            }
            .crossfade(true)
            .memoryCache {
                MemoryCache.Builder(this)
                    .maxSizePercent(0.2)
                    .build()
            }
            .diskCache {
                DiskCache.Builder()
                    .directory(cacheDir.resolve("image_cache"))
                    .maxSizePercent(0.05)
                    .build()
            }
            .build()
    }

    override fun onCreate() {
        super.onCreate()
        val session = SessionStore(this)
        PrefsHolder.session = session
        session.loadThemeIntoManager()
        ApiClient.token = session.token
    }
}
