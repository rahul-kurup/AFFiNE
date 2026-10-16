package app.affine.pro.plugin

import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import app.affine.pro.service.ProxyHeadersStore
import kotlinx.coroutines.Dispatchers

@CapacitorPlugin(name = "ProxyHeaders")
class ProxyHeadersPlugin : Plugin() {

    override fun load() {
        val ctx = context.applicationContext
        launch(Dispatchers.IO) {
            runCatching { ProxyHeadersStore.load(ctx) }
        }
    }

    @PluginMethod
    fun get(call: PluginCall) {
        call.resolve(JSObject().put("headers", JSArray(ProxyHeadersStore.snapshot())))
    }

    @PluginMethod
    fun set(call: PluginCall) {
        val raw = call.getArray("headers")?.toString() ?: "[]"
        val ctx = context.applicationContext
        launch(Dispatchers.IO) {
            try {
                ProxyHeadersStore.save(ctx, raw)
                call.resolve()
            } catch (error: Exception) {
                call.reject("Failed to save proxy headers", error)
            }
        }
    }
}
