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
server.js            เสิร์ฟไฟล์ใน public/ และ /api/repos
data/projects.json   คำอธิบายภาษาไทย + หมวดของแต่ละโปรเจกต์
public/index.html    หน้าเว็บ
public/css/style.css
public/js/main.js    พิมพ์หัวเรื่อง, การ์ดโชว์โปรเจกต์, วงไอคอน, รายการโปรเจกต์
public/js/vortex.js  วงจุดหมุนในการ์ดดำ
```

`/api/repos` ดึงรายการ repo สาธารณะของ `GH_USER` จาก GitHub API (แคช 10 นาที) แล้วรวมกับ `data/projects.json`
repo ที่ไม่มีใน projects.json จะขึ้นด้วยคำอธิบายจาก GitHub ถ้าต่อ GitHub ไม่ได้จะใช้รายการใน projects.json แทน

เพิ่ม/แก้คำอธิบายโปรเจกต์: แก้ `data/projects.json` แล้วรีสตาร์ตเซิร์ฟเวอร์
