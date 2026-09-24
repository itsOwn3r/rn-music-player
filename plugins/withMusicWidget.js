const {
  withAndroidManifest,
  withDangerousMod,
  withStringsXml,
  AndroidConfig,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const withWidgetFiles = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidRoot = path.join(projectRoot, "android");

      const widgetSrc = path.join(projectRoot, "widget-files");
      const appRes = path.join(androidRoot, "app", "src", "main", "res");
      const appJava = path.join(
        androidRoot,
        "app",
        "src",
        "main",
        "java",
        "com",
        "own3r",
        "player",
        "widget"
      );

      // Copy layout, xml, drawables
      copyDirRecursive(path.join(widgetSrc, "res"), appRes);

      // Copy java/kotlin widget classes
      copyDirRecursive(
        path.join(widgetSrc, "java", "com", "own3r", "player", "widget"),
        appJava
      );

      // Ensure MainApplication registers MusicWidgetPackage
      const mainApplicationPath = path.join(
        androidRoot,
        "app",
        "src",
        "main",
        "java",
        "com",
        "own3r",
        "player",
        "MainApplication.kt"
      );

      if (fs.existsSync(mainApplicationPath)) {
        let content = fs.readFileSync(mainApplicationPath, "utf8");
        const importStatement = "import com.own3r.player.widget.MusicWidgetPackage";
        if (!content.includes(importStatement)) {
          content = content.replace(
            "package com.own3r.player\n",
            `package com.own3r.player\n\n${importStatement}\n`
          );
        }
        const packageCall = "packages.add(MusicWidgetPackage())";
        if (!content.includes(packageCall)) {
          content = content.replace(
            "val packages = PackageList(this).packages",
            `val packages = PackageList(this).packages\n            ${packageCall}`
          );
        }
        fs.writeFileSync(mainApplicationPath, content, "utf8");
      }

      return config;
    },
  ]);
};

const withWidgetManifest = (config) => {
  return withAndroidManifest(config, async (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults
    );

    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }

    const hasReceiver = mainApplication.receiver.some(
      (r) =>
        r.$ &&
        (r.$["android:name"] === ".widget.MusicWidgetProvider" ||
          r.$["android:name"] === "com.own3r.player.widget.MusicWidgetProvider")
    );

    if (!hasReceiver) {
      mainApplication.receiver.push({
        $: {
          "android:name": ".widget.MusicWidgetProvider",
          "android:exported": "true",
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name": "android.appwidget.action.APPWIDGET_UPDATE",
                },
              },
              {
                $: {
                  "android:name": "com.own3r.player.ACTION_WIDGET_PREV",
                },
              },
              {
                $: {
                  "android:name": "com.own3r.player.ACTION_WIDGET_PLAY_PAUSE",
                },
              },
              {
                $: {
                  "android:name": "com.own3r.player.ACTION_WIDGET_NEXT",
                },
              },
            ],
          },
        ],
        "meta-data": [
          {
            $: {
              "android:name": "android.appwidget.provider",
              "android:resource": "@xml/music_widget_info",
            },
          },
        ],
      });
    }

    return config;
  });
};

const withWidgetStrings = (config) => {
  return withStringsXml(config, (config) => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [
        {
          $: { name: "widget_description" },
          _: "Control music playback from your home screen",
        },
        {
          $: { name: "widget_no_song" },
          _: "No song playing",
        },
        {
          $: { name: "widget_default_artist" },
          _: "Lori Music",
        },
      ],
      config.modResults
    );
    return config;
  });
};

module.exports = function withMusicWidget(config) {
  return withWidgetFiles(withWidgetManifest(withWidgetStrings(config)));
};
