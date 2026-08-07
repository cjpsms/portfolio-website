# PORTFOLIO-website

https://pongnaruedol.github.io/PORTFOLIO-website/

สไตล์หน้าเว็บ Portfolio แบบหน้าเดียว (one-page) สำหรับแสดงข้อมูลส่วนตัวและผลงานทางด้านฮาร์ดแวร์และซอฟต์แวร์

คุณสมบัติหลัก
- หน้าเดียว (One-page) แบ่งเป็นส่วน: Hero, About, Skills, Featured, Projects, Roadmap, Contact
- โครงการเด่นที่แสดง: Server Linux, Ollama Open WebUI, Minecraft Server
- มีแผงควบคุม IoT จำลองเพื่อสาธิต UX และตรรกะการทำงาน

วิธีดู (Quick start)
1. เปิดไฟล์ `index.html` ในเบราว์เซอร์ด้วยการดับเบิลคลิก หรือรันเว็บเซิร์ฟเวอร์ท้องถิ่น เช่น:

```bash
# รันเซิร์ฟเวอร์แบบง่าย (Python 3)
python3 -m http.server 8000
# แล้วเปิด http://localhost:8000
```

วิธีแก้ไข
- แก้ข้อความและโครงสร้างหน้าในไฟล์ `index.html` (HTML + CSS อยู่ในไฟล์เดียว)
- ฟอนต์ใช้ Google Fonts ที่ดึงมาจาก header

การนำขึ้นใช้งาน (Deployment)
- โพสต์เป็น static site บน GitHub Pages หรือใช้บริการโฮสติ้ง static อื่น ๆ (Netlify, Vercel)

หมายเหตุทางเทคนิค
- เป็นเว็บไซต์ static ไม่มี back-end หรือฐานข้อมูลในรีโปนี้
- เหมาะสำหรับแสดงผลงานและทดสอบ UI/UX แบบง่าย

ผู้พัฒนา
- พงษ์นฤดล พูนจิรธนเรือง

ต้องการให้ผมเพิ่มคำแนะนำการ deploy แบบละเอียดหรือเทมเพลตไฟล์ `CNAME`/`.github/workflows` ไหม?
