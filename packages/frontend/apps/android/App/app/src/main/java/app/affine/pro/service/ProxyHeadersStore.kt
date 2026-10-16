package app.affine.pro.service

import android.content.Context
import app.affine.pro.utils.dataStore
import app.affine.pro.utils.get
import app.affine.pro.utils.set
import okhttp3.Request
import org.json.JSONArray
import timber.log.Timber

/**
 * Holds the user-configured proxy headers and applies them to native (OkHttp)
 * requests. The native [AuthPlugin] signs in / refreshes / signs out through
 * OkHttp, so it bypasses the WebView network patches; keeping a native copy of
 * the headers lets those requests behave the same as WebView traffic.
 *
 * The list is kept in memory for the synchronous OkHttp interceptors and is
 * mirrored to the shared `affine` DataStore so it survives process restarts.
 */
object ProxyHeadersStore {
    private const val STORAGE_KEY = "affine-proxy-headers"

    @Volatile
    private var headers: List<Pair<String, String>> = emptyList()

    fun apply(builder: Request.Builder) {
        if (headers.isEmpty()) return
        Timber.d("[proxy-headers] applying %s", headers.joinToString(", ") { it.first })
        for ((name, value) in headers) {
            try {
                builder.addHeader(name, value)
            } catch (_: Exception) {
                // invalid header name/value, skip
            }
        }
    }

    suspend fun load(context: Context) {
        headers = parse(context.dataStore.get(STORAGE_KEY))
    }

    suspend fun save(context: Context, raw: String) {
        val parsed = parse(raw)
        headers = parsed
        context.dataStore.set(STORAGE_KEY, raw)
    }

    fun snapshot(): String = JSONArray().apply {
        for ((name, value) in headers) {
            put(org.json.JSONObject().put("name", name).put("value", value))
        }
    }.toString()

    private fun parse(raw: String): List<Pair<String, String>> {
        if (raw.isBlank()) return emptyList()
        return runCatching {
            val array = JSONArray(raw)
            (0 until array.length()).mapNotNull { index ->
                val item = array.optJSONObject(index) ?: return@mapNotNull null
                val name = item.optString("name").trim()
                if (name.isEmpty()) null else name to item.optString("value")
            }
        }.getOrDefault(emptyList())
    }
}
