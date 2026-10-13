const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withDangerousMod,
  withStringsXml,
  withXcodeProject,
  AndroidConfig,
} = require('expo/config-plugins');

/**
 * ホーム画面の「目立たない版」（名前「ルーレット」・「偏」の字なしのアイコン）を追加する。
 * 切り替えは modules/app-icon（設定画面から呼ぶ）。
 *
 * Android: MainActivity からランチャーの入口を外し、activity-alias を 2 つ置く。
 *   MainActivityDefault（有効・いつもの名前とアイコン）／MainActivityPlain（無効・目立たない版）
 *   名前は locales/*.json の android.app_name_plain（無い言語は既定の「ルーレット」）
 * iOS: アセットカタログに代替アイコン AppIconPlain を足す。名前は変えられない
 *
 * 画像は assets/icon-plain/generate.py で作る。
 */
const SRC = 'assets/icon-plain';
const IOS_ICON = 'AppIconPlain';
const DEFAULT_PLAIN_NAME = 'ルーレット';

// 108dp の前景（アダプティブ）と 48dp の旧形式
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

function withAndroidAliases(config) {
  return withAndroidManifest(config, (c) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(c.modResults);
    const main = app.activity.find((a) => a.$['android:name'] === '.MainActivity');
    if (!main) throw new Error('withAppIconVariants: .MainActivity が見つからない');

    const isLauncher = (f) =>
      (f.action ?? []).some((a) => a.$['android:name'] === 'android.intent.action.MAIN') &&
      (f.category ?? []).some((x) => x.$['android:name'] === 'android.intent.category.LAUNCHER');
    main['intent-filter'] = (main['intent-filter'] ?? []).filter((f) => !isLauncher(f));

    const launcher = () => [
      {
        action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
        category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
      },
    ];
    const alias = (name, enabled, label, icon) => ({
      $: {
        'android:name': name,
        'android:targetActivity': '.MainActivity',
        'android:enabled': String(enabled),
        'android:exported': 'true',
        'android:label': label,
        'android:icon': icon,
        'android:roundIcon': icon,
      },
      'intent-filter': launcher(),
    });
    app['activity-alias'] = [
      ...(app['activity-alias'] ?? []).filter((a) => !a.$['android:name'].startsWith('.MainActivity')),
      alias('.MainActivityDefault', true, '@string/app_name', '@mipmap/ic_launcher'),
      alias('.MainActivityPlain', false, '@string/app_name_plain', '@mipmap/ic_launcher_plain'),
    ];
    return c;
  });
}

function withPlainName(config) {
  return withStringsXml(config, (c) => {
    c.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: 'app_name_plain' }, _: DEFAULT_PLAIN_NAME }],
      c.modResults,
    );
    return c;
  });
}

function withAndroidIconFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (c) => {
      const root = c.modRequest.projectRoot;
      const res = path.join(c.modRequest.platformProjectRoot, 'app/src/main/res');
      const { generateImageAsync } = require('@expo/image-utils');
      for (const [dpi, scale] of Object.entries(DENSITIES)) {
        const dir = path.join(res, `mipmap-${dpi}`);
        fs.mkdirSync(dir, { recursive: true });
        const out = async (src, name, size, extra = {}) => {
          const { source } = await generateImageAsync(
            { projectRoot: root, cacheType: `app-icon-plain-${name}` },
            { src: path.join(root, SRC, src), width: size, height: size, resizeMode: 'cover', ...extra },
          );
          fs.writeFileSync(path.join(dir, `${name}.png`), source);
        };
        await out('android-foreground.png', 'ic_launcher_plain_foreground', 108 * scale);
        await out('android-monochrome.png', 'ic_launcher_plain_monochrome', 108 * scale);
        await out('icon.png', 'ic_launcher_plain', 48 * scale);
      }
      const anydpi = path.join(res, 'mipmap-anydpi-v26');
      fs.mkdirSync(anydpi, { recursive: true });
      fs.writeFileSync(
        path.join(anydpi, 'ic_launcher_plain.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@android:color/white"/>
    <foreground android:drawable="@mipmap/ic_launcher_plain_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_plain_monochrome"/>
</adaptive-icon>
`,
      );
      return c;
    },
  ]);
}

function withIosIconFiles(config) {
  return withDangerousMod(config, [
    'ios',
    async (c) => {
      const dir = path.join(
        c.modRequest.platformProjectRoot,
        c.modRequest.projectName,
        'Images.xcassets',
        `${IOS_ICON}.appiconset`,
      );
      fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(path.join(c.modRequest.projectRoot, SRC, 'icon.png'), path.join(dir, 'icon-1024.png'));
      fs.writeFileSync(
        path.join(dir, 'Contents.json'),
        JSON.stringify(
          {
            images: [{ filename: 'icon-1024.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }],
            info: { version: 1, author: 'expo' },
          },
          null,
          2,
        ),
      );
      return c;
    },
  ]);
}

function withIosBuildSetting(config) {
  return withXcodeProject(config, (c) => {
    const configs = c.modResults.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configs)) {
      const settings = configs[key].buildSettings;
      // アプリ本体のターゲットだけ（ASSETCATALOG_COMPILER_APPICON_NAME を持つもの）
      if (settings?.ASSETCATALOG_COMPILER_APPICON_NAME) {
        settings.ASSETCATALOG_COMPILER_ALTERNATE_APP_ICON_NAMES = IOS_ICON;
      }
    }
    return c;
  });
}

module.exports = function withAppIconVariants(config) {
  config = withAndroidAliases(config);
  config = withPlainName(config);
  config = withAndroidIconFiles(config);
  config = withIosIconFiles(config);
  config = withIosBuildSetting(config);
  return config;
};
