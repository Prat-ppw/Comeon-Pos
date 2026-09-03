# BREW POS ☕

ระบบ POS ร้านกาแฟ — รันบน Sunmi D2s Plus และเข้าได้จากทุกเครื่องผ่าน GitHub Pages

---

## ขั้นตอนตั้งค่าครั้งแรก (5 นาที)

### 1. สร้าง Repository

1. ไป [github.com/new](https://github.com/new)
2. ชื่อ repo: `brew-pos`
3. เลือก **Public** (GitHub Pages ฟรีต้องเป็น Public)
4. กด **Create repository**

---

### 2. เปิด GitHub Pages

1. ไปที่ repo → **Settings** → **Pages**
2. Source: เลือก **GitHub Actions**
3. กด Save

---

### 3. Push โค้ดขึ้น GitHub

เปิด Terminal / Git Bash บนเครื่อง:

```bash
# clone หรือสร้าง folder ใหม่
cd brew-pos

git init
git add .
git commit -m "Initial: BREW POS"
git branch -M main
git remote add origin https://github.com/USERNAME/brew-pos.git
git push -u origin main
```

---

### 4. รอ Actions ทำงาน (~15 นาที)

- ไปที่แท็บ **Actions** ใน GitHub
- จะเห็น 2 jobs รัน:
  - ✅ `deploy-pages` — deploy เว็บ (~1 นาที)
  - ✅ `build-apk` — สร้าง APK (~12 นาที)

---

### 5. ผลลัพธ์

**เว็บ (GitHub Pages):**
```
https://USERNAME.github.io/brew-pos/
```
เปิดบน browser ได้ทุกเครื่อง รองรับ offline

**APK (Sunmi D2s Plus):**
- ไปที่ Actions → เลือก run ล่าสุด → **Artifacts** → ดาวน์โหลด `brew-pos-sunmi-d2s-debug`

---

## ติดตั้ง APK บน Sunmi D2s Plus

1. แตก zip → ได้ไฟล์ `app-debug.apk`
2. Copy ไปที่ Sunmi (USB drive หรือ Google Drive)
3. เปิด **File Manager** บน Sunmi → กดไฟล์ APK
4. ถ้าถามเรื่อง Unknown Sources → Settings → Security → เปิด Install unknown apps
5. กด **Install** ✅

---

## อัปเดต App

แก้ไข `index.html` แล้ว:
```bash
git add index.html
git commit -m "update: แก้ไข..."
git push
```
GitHub Actions จะ deploy เว็บและ build APK ใหม่อัตโนมัติ

---

## โครงสร้างไฟล์

```
brew-pos/
├── index.html          ← app ทั้งหมด (แก้ไขที่นี่)
├── manifest.json       ← PWA config
├── sw.js               ← Service Worker (offline)
├── icons/              ← app icons
└── .github/
    └── workflows/
        └── deploy.yml  ← GitHub Actions (deploy + build APK)
```
