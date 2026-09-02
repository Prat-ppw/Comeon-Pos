# BREW POS — Deploy Guide

## วิธีที่ 1: Netlify (ง่ายสุด, ฟรี, shared data ข้ามเครื่อง)

1. สมัคร https://netlify.com (ฟรี)
2. ลาก folder นี้ทั้งหมดไปวางที่ https://app.netlify.com/drop
3. ได้ URL เช่น `https://brew-pos-xxxx.netlify.app`
4. เปิด URL นั้นบนทุกเครื่องในร้าน → ข้อมูลเดียวกัน ✅

## วิธีที่ 2: GitHub Pages (ฟรี, ต้องมี Git)

```bash
npm install
npm run build
# push dist/ ขึ้น GitHub Pages branch
```

## วิธีที่ 3: เปิดไฟล์ brew-pos-webapp.html ตรงๆ

ไม่ต้องติดตั้ง — แต่ข้อมูลจะแยกกันแต่ละเครื่อง (localStorage)

## Shared Data

- เมนู, หมวดหมู่, ตัวเลือก, ออเดอร์ — sync ข้ามทุกเครื่องที่เปิด URL เดียวกัน
- ตะกร้า, บิลค้าง — เก็บเฉพาะเครื่อง (ไม่ sync)
- Sync อัตโนมัติทุก 8 วินาที
