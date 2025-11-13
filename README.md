# 🎵 Music Player App

A modern, offline-capable **Music Player App** built with **Expo**, **React Native**, and **Zustand**.  
Enjoy your favorite songs with synced lyrics, manage playlists, and edit lyrics — all in one beautifully designed mobile experience.

---

## 🚀 Features

### 🎧 Core Player

- **Play, Pause, Skip, and Seek** between songs.
- **Queue system** — automatically manages upcoming and previous tracks.
- **Shuffle & Repeat modes** (`off`, `all`, `one`).
- **Volume Control** with smooth adjustments.
- **Persistent playback state** using `zustand/persist` and `AsyncStorage`.
- **Server player!** check out [Local Sever Player Branch](https://github.com/itsOwn3r/rn-music-player/local-server-player-rntp).

---

### 🎵 Library & Playlists

- Automatically loads your **local song library**.
- **Adds new songs** with metadata like artist, album, and year automatically.
- **Incremental play counts** — track your listening habits.
- **Favorites system** — mark songs you love.
- **Custom playlists** — create, edit, and remove playlists easily.

---

### 🖼️ Song Details & Metadata

- Edit **song info** (title, artist, album, year) right from the app.
- Each song supports custom **cover art** and **lyrics**.
- Shows tracks of **album**.

---

### ✍️ Lyrics & Synced Lyrics

- Fetches lyrics from [LRC-LIB](https://lrclib.net/) API.
- Add or edit lyrics and **synced lyrics**.
- Syncing plain lyrics to **synced lyrics**.
- Can show or hide Lyrics.
- Changes automatically persist across sessions.

---

### 💾 Download Manager

- **Download songs** with a system-native file picker via `Storage Access Framework`.
- Automatically saves to your **Downloads playlist**.
- Safely updates song paths and metadata after download.

---

### 🔁 Queue & Navigation

- Dynamic queue management — add, remove, and clear queued songs.
- Supports **context-based queues** (library, search results, or playlists).
- Smart logic for **next/previous** navigation depending on shuffle/repeat mode.

---

### 🧩 Additional Highlights

- Real-time position tracking with `TrackPlayer`.
- **Smart resume** when reopening the app — playback continues where you left off.
- Smooth transitions between songs.
- In-app toasts (via `sonner-native`) for instant feedback on user actions.

---

## 🏗️ Production Build (Release APK)

1. Run this command to generate the `android` folder:

   ```bash
    npx expo prebuild --clean
   ```

2. Generate a new signing key:
   ```bash
    keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```
3. copy the generated file to: `android/app/my-release-key.keystore`
4. edit `signingConfigs` and then `buildTypes` in `android\app\build.gradle`:

   ```bash
    signingConfigs {
            release {
                storeFile file('my-release-key.keystore')
                storePassword 'yourpassword'
                keyAlias 'my-key-alias'
                keyPassword 'yourpassword'
            }
    }
   ```

   ```bash
    buildTypes {
            release {
                signingConfig signingConfigs.release
                minifyEnabled false
                shrinkResources false
                proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
            }
    }
   ```

5. ```bash
    npx expo export --platform android
   ```
6. ```bash
    cd android
   ```
7.

```bash
    ./gradlew clean
```

8.

```bash
    ./gradlew assembleRelease
```

- after successfull build, the output APK will be at `android/app/build/outputs/apk/release/app-release.apk`

---

### 🔧 Development Build (Debug APK)

A **development build** lets you test features quickly with live logs and the React Native debug menu enabled.

#### Steps:

Use this command and the APK file will be generated at `android/app/build/outputs/apk/debug/app-debug.apk`

```bash
npm install
npx expo prebuild
cd android
./gradlew clean
./gradlew assembleDebug
```

---

## 🛠️ Tech Stack

| Category            | Libraries                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| Framework           | [Expo](https://expo.dev)                                                                                 |
| State Management    | [Zustand](https://github.com/pmndrs/zustand)                                                             |
| Audio Playback      | [react-native-track-player](https://github.com/doublesymmetry/react-native-track-player)                 |
| Storage             | [AsyncStorage](https://github.com/react-native-async-storage/async-storage)                              |
| File Access         | [Storage Access Framework (SAF)](https://developer.android.com/guide/topics/providers/document-provider) |
| Toast Notifications | [sonner-native](https://github.com/emilkowalski/sonner)                                                  |
