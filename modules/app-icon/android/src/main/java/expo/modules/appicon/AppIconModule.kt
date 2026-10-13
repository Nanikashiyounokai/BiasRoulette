package expo.modules.appicon

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * ホーム画面のアプリ名とアイコンを切り替える。
 * AndroidManifest の activity-alias（MainActivityDefault / MainActivityPlain）のどちらを有効にするかで切り替える。
 * alias は plugins/withAppIconVariants.js が追加する。
 */
class AppIconModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private fun alias(variant: String) =
    ComponentName(context.packageName, "${context.packageName}.MainActivity${variant.replaceFirstChar { it.uppercase() }}")

  override fun definition() = ModuleDefinition {
    Name("AppIcon")

    AsyncFunction("getVariant") {
      val state = context.packageManager.getComponentEnabledSetting(alias("plain"))
      if (state == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) "plain" else "default"
    }

    AsyncFunction("setVariant") { variant: String ->
      val pm = context.packageManager
      val next = if (variant == "plain") "plain" else "default"
      val prev = if (next == "plain") "default" else "plain"
      // 先に新しい方を有効にする。逆順だとランチャーからアプリが一瞬消える
      pm.setComponentEnabledSetting(alias(next), PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP)
      pm.setComponentEnabledSetting(alias(prev), PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP)
    }
  }
}
