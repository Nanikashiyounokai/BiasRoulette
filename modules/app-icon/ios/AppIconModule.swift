import ExpoModulesCore
import UIKit

/// ホーム画面のアイコンを切り替える。iOS はアプリ名を変えられず、切り替えるたびに OS の通知が出る。
/// 代替アイコン AppIconPlain は plugins/withAppIconVariants.js がアセットカタログに追加する。
public class AppIconModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppIcon")

    AsyncFunction("getVariant") { () -> String in
      UIApplication.shared.alternateIconName == "AppIconPlain" ? "plain" : "default"
    }.runOnQueue(.main)

    AsyncFunction("setVariant") { (variant: String, promise: Promise) in
      guard UIApplication.shared.supportsAlternateIcons else {
        promise.reject("ERR_UNSUPPORTED", "Alternate icons are not supported")
        return
      }
      let name: String? = variant == "plain" ? "AppIconPlain" : nil
      if UIApplication.shared.alternateIconName == name {
        promise.resolve(nil)
        return
      }
      UIApplication.shared.setAlternateIconName(name) { error in
        if let error {
          promise.reject("ERR_SET_ICON", error.localizedDescription)
        } else {
          promise.resolve(nil)
        }
      }
    }.runOnQueue(.main)
  }
}
