# PORTFOLIO-website

https://pongnaruedol.github.io/PORTFOLIO-website/

พอร์ตโฟลิโอส่วนตัวแบบหน้าเดียว (one-page) สำหรับแสดงข้อมูลและผลงานด้านฮาร์ดแวร์และซอฟต์แวร์

## คุณสมบัติหลัก

หน้าเดียว แบ่งเป็นส่วน Hero, About, Skills, Featured, Projects, Roadmap, Contact

โครงการเด่นที่แสดง: Server Linux, Ollama Open WebUI, Minecraft Server

มีแผงควบคุม IoT จำลองไว้สาธิต UX และตรรกะการทำงาน

## วิธีดู

เปิดไฟล์ `index.html` ในเบราว์เซอร์ได้เลย หรือรันเซิร์ฟเวอร์ท้องถิ่น:

```bash
python3 -m http.server 8000
# แล้วเปิด http://localhost:8000
```

## วิธีแก้ไข

แก้ข้อความและโครงสร้างหน้าในไฟล์ `index.html` (HTML + CSS อยู่ในไฟล์เดียว)

ฟอนต์ใช้ Google Fonts ดึงมาจาก header

## การนำขึ้นใช้งาน

โพสต์เป็น static site บน GitHub Pages หรือใช้ Netlify, Vercel ก็ได้

## หมายเหตุทางเทคนิค

เป็นเว็บไซต์ static ไม่มี back-end หรือฐานข้อมูลในรีโปนี้ เหมาะสำหรับแสดงผลงานและทดสอบ UI/UX แบบง่าย

## ผู้พัฒนา

https://github.com/pongnaruedol