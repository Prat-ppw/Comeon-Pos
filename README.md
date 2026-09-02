# 📱 BREW POS — Android APK via GitHub Actions

สร้าง APK อัตโนมัติผ่าน GitHub ทุกครั้งที่ push code — ไม่ต้องติดตั้ง Android Studio บนเครื่องตัวเอง

---

## 📋 สิ่งที่ต้องมี

| สิ่งที่ต้องการ | รายละเอียด |
|---|---|
| GitHub account | สมัครฟรีที่ github.com |
| Git (บนเครื่อง) | https://git-scm.com |
| Node.js ≥ 18 | https://nodejs.org (สำหรับ setup ครั้งแรกเท่านั้น) |

> ✅ **ไม่ต้องติดตั้ง** Android Studio, Java, Android SDK บนเครื่องตัวเอง — GitHub Actions จัดการให้ทั้งหมด

---

## 🚀 ขั้นตอนทั้งหมด

### ขั้นตอนที่ 1 — สร้าง Repository บน GitHub

1. ไป [github.com/new](https://github.com/new)
2. ตั้งชื่อ: `brew-pos`
3. เลือก **Private** (ไม่ให้คนอื่นเห็นโค้ด)
4. กด **Create repository**

---

### ขั้นตอนที่ 2 — Setup Capacitor (ครั้งแรกครั้งเดียว)

เปิด Terminal บนเครื่องของคุณ:

```bash
# 1. เข้าไปที่ folder โปรเจ็ค
cd brew-pos

# 2. ติดตั้ง dependencies
npm install

# 3. Build web app ก่อน
npm run build

# 4. เพิ่ม Android platform (สร้าง folder android/)
npx cap add android

# 5. Copy web build เข้า Android
npx cap sync android
```

---

### ขั้นตอนที่ 3 — แก้ไข AndroidManifest สำหรับ Sunmi T2s

```bash
# เปิดไฟล์นี้ด้วย text editor
code android/app/src/main/AndroidManifest.xml
```

แทนที่เนื้อหาทั้งหมดด้วยไฟล์ `android-config/AndroidManifest-patch.xml`

จากนั้นแก้ไข `android/app/src/main/res/values/styles.xml`:
แทนที่ด้วยไฟล์ `android-config/styles-patch.xml`

---

### ขั้นตอนที่ 4 — Push ขึ้น GitHub

```bash
# Init git
git init
git add .
git commit -m "Initial commit: BREW POS v2"

# เชื่อมกับ GitHub repo (แทนที่ USERNAME ด้วยชื่อ GitHub ของคุณ)
git remote add origin https://github.com/USERNAME/brew-pos.git
git branch -M main
git push -u origin main
```

---

### ขั้นตอนที่ 5 — ดู GitHub Actions Build

1. ไปที่ `github.com/USERNAME/brew-pos`
2. กดแท็บ **Actions**
3. เห็น workflow "Build BREW POS APK" กำลัง run (ใช้เวลา ~8-12 นาที)
4. เมื่อ ✅ เสร็จ → กดเข้าไป → หัวข้อ **Artifacts** → ดาวน์โหลด `brew-pos-debug-apk`

---

### ขั้นตอนที่ 6 — ติดตั้ง APK บน Sunmi T2s

**วิธีที่ A: USB (เร็วที่สุด)**
```bash
# เปิด Developer Options บน Sunmi ก่อน
# Settings → About → กด Build number 7 ครั้ง
adb install app-debug.apk
```

**วิธีที่ B: Copy ไฟล์**
1. Copy `app-debug.apk` ใส่ USB drive
2. เสียบ USB บน Sunmi T2s
3. เปิด **File Manager** → หา APK → กด Install
4. Settings → Security → เปิด "Install from Unknown Sources" ถ้าถาม

---

## 🔐 Build APK แบบ Release (สำหรับใช้งานจริง)

Debug APK ใช้ได้แต่จะมีข้อความ "debug" — สำหรับ production ต้อง sign APK

### สร้าง Keystore (ทำครั้งเดียว)

```bash
# ต้องมี Java บนเครื่อง
keytool -genkey -v \
  -keystore brew-pos.keystore \
  -alias brewpos \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=BREW POS, OU=Coffee, O=YourShop, L=Bangkok, S=Bangkok, C=TH"

# แปลงเป็น base64 สำหรับ GitHub Secret
base64 -i brew-pos.keystore | tr -d '\n'
```

### เพิ่ม GitHub Secrets

1. ไปที่ `github.com/USERNAME/brew-pos/settings/secrets/actions`
2. กด **New repository secret** แล้วเพิ่ม 4 อัน:

| Secret Name | ค่า |
|---|---|
| `KEYSTORE_BASE64` | ค่าที่ได้จาก base64 command ด้านบน |
| `KEYSTORE_PASSWORD` | YOUR_STORE_PASSWORD |
| `KEY_ALIAS` | brewpos |
| `KEY_PASSWORD` | YOUR_KEY_PASSWORD |

### Trigger Release Build

```bash
# สร้าง tag เพื่อ trigger release build
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions จะ build APK แบบ signed และสร้าง GitHub Release อัตโนมัติ

---

## 🔄 การอัปเดต App

ทุกครั้งที่แก้ไขโค้ด:

```bash
# แก้ไข src/App.tsx ตามต้องการ แล้ว:
git add .
git commit -m "feat: เพิ่มฟีเจอร์ X"
git push origin main

# GitHub Actions จะ build APK ใหม่อัตโนมัติ
# ดาวน์โหลด APK ใหม่จาก Actions → Artifacts
```

---

## 📺 Sunmi T2s — จอที่ 2 (Customer Display)

Sunmi T2s มี 2 จอ: จอหลัก (cashier) และจอลูกค้า 

BREW POS รองรับทั้ง:
1. **Presentation API** — Chrome detect จอที่ 2 อัตโนมัติ กด "เปิดจอลูกค้า"
2. **window.open()** — fallback เปิดใน popup

สำหรับ APK บน Sunmi:
- จอลูกค้าจะทำงานผ่าน Presentation API โดยอัตโนมัติถ้า Sunmi expose secondary display
- ถ้าไม่ได้ → ใช้ Sunmi Customer Display SDK (ต้องเพิ่ม native plugin)

---

## 🛠 แก้ปัญหาที่พบบ่อย

| ปัญหา | วิธีแก้ |
|---|---|
| Build failed: Gradle error | ตรวจ Java version ใน workflow — ต้องเป็น 17 |
| APK ติดตั้งไม่ได้บน Sunmi | เปิด Unknown Sources ใน Settings → Security |
| App crash ทันทีที่เปิด | ดู Logcat: `adb logcat \| grep -i "brewpos"` |
| WebView ไม่แสดงอะไร | ตรวจ `android:usesCleartextTraffic="true"` ใน Manifest |
| Actions ใช้เวลานานมาก | ปกติ 8-15 นาที — Gradle ต้อง download dependencies ครั้งแรก |

---

## 📁 โครงสร้างไฟล์

```
brew-pos/
├── .github/
│   └── workflows/
│       └── build-apk.yml       ← GitHub Actions workflow
├── android-config/
│   ├── AndroidManifest-patch.xml  ← copy ไปแทนที่ใน android/
│   └── styles-patch.xml           ← copy ไปแทนที่ใน android/
├── src/
│   ├── App.tsx                 ← React app ทั้งหมด
│   └── main.tsx                ← entry point
├── index.html
├── vite.config.ts
├── capacitor.config.ts
├── tsconfig.json
└── package.json
```

---

## ⚡ Quick Reference Commands

```bash
# Dev mode (browser)
npm run dev

# Build + sync Android (ก่อน commit)
npm run build && npx cap sync android

# Build APK บนเครื่องตัวเอง (ต้องมี Android Studio)
npm run android:debug

# Push + trigger CI build
git add . && git commit -m "update" && git push
```
