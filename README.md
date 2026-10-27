# PORTFOLIO-website

Portfolio ของ cj (พงษ์นฤดล พูนจิรธนเรือง) — เน้นโปรเจกต์บน GitHub ([cjpsms](https://github.com/cjpsms)), ส่วน CEDT อยู่ท้ายหน้า

## รัน

ต้องมี Node.js 18 ขึ้นไป ไม่ต้อง `npm install` (ใช้แค่ไลบรารีมาตรฐาน)

```bash
node server.js
# เปิด http://127.0.0.1:3265
```

ตั้งค่าผ่าน env ได้: `PORT`, `HOST` (ค่าเริ่มต้น 127.0.0.1), `GH_USER` (ค่าเริ่มต้น cjpsms), `GITHUB_TOKEN` (ไม่บังคับ)

## โครงสร้าง

```
server.js            เสิร์ฟไฟล์ใน public/, /api/repos และ /api/readme/<ชื่อ repo>
data/projects.json   คำอธิบายภาษาไทย + หมวดของแต่ละโปรเจกต์
public/index.html    หน้าเว็บ
public/css/style.css
public/js/particles.js  จุดบน canvas (โดมหน้าแรก, วงที่กลายเป็นชื่อโปรเจกต์, การ์ดติดต่อ)
public/js/main.js       เลื่อนแบบลื่น + แอนิเมชันตามการเลื่อน, การ์ดโปรเจกต์, หน้ารายละเอียด
public/vendor/          GSAP + ScrollTrigger, Lenis, marked, DOMPurify (เก็บไว้ในเครื่อง ไม่โหลดจาก CDN)
```

`/api/repos` ดึงรายการ repo สาธารณะของ `GH_USER` จาก GitHub API (แคช 10 นาที) แล้วรวมกับ `data/projects.json`
repo ที่ไม่มีใน projects.json จะขึ้นด้วยคำอธิบายจาก GitHub ถ้าต่อ GitHub ไม่ได้จะใช้รายการใน projects.json แทน

`/api/readme/<ชื่อ>` ส่ง README ของ repo นั้นเป็น markdown (แคช 6 ชั่วโมง) ให้เฉพาะ repo ที่อยู่ในรายการ
กดการ์ดโปรเจกต์แล้วหน้าเว็บจะแสดง README นี้

เพิ่ม/แก้คำอธิบายโปรเจกต์: แก้ `data/projects.json` แล้วรีสตาร์ตเซิร์ฟเวอร์

ถ้าเครื่องตั้งค่า "ลดการเคลื่อนไหว" ไว้ หน้าเว็บจะไม่เล่นแอนิเมชัน แถวการ์ดจะเลื่อนด้วยนิ้ว/ทัชแพดแทน
