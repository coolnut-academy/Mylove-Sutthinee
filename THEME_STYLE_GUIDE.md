# THEME_STYLE_GUIDE.md
# Suttinee Teacher Workspace
## Visual Theme & Interaction Design System
### Pastel Purple · Cozy · Feminine · Academic

> เอกสารนี้เป็น Theme / UI Style Guide สำหรับใช้ร่วมกับ  
> `blueprint_suttinee_teacher_workspace.md` และ `IMPLEMENTATION_PLAN.md`
>
> เป้าหมายคือทำให้เว็บไซต์มีบุคลิก **นุ่มนวล อบอุ่น เป็นผู้หญิง ดูน่ารักเล็กน้อย แต่ยังคงความเป็นทางการและเหมาะกับบริบทวิชาการ**
>
> ทุก Effect ต้องถูกออกแบบภายใต้หลัก:
>
> **Cute but Professional / Cozy but Clean / Animated but Fast**

---

# 1. Theme Identity

## ชื่อธีม

**Lavender Cozy Academic**

## Mood Keywords

- Pastel Purple
- Lavender
- Lilac
- Soft White
- Cozy
- Warm
- Feminine
- Elegant
- Academic
- Friendly
- Calm
- Clean
- Premium
- Playful in moderation

---

# 2. Core Visual Direction

เว็บไซต์ต้องให้ความรู้สึกประมาณ:

> “พื้นที่ทำงานส่วนตัวของครูผู้หญิง ที่เรียบร้อย อบอุ่น เป็นมิตร ดูสบายตา แต่มีความเป็นมืออาชีพและเหมาะกับงานราชการ/วิชาการ”

ไม่ควรไปทาง:

- หวานจัด
- ชมพูจัด
- การ์ตูนเด็กมากเกินไป
- คิวท์แบบ social app
- glassmorphism หนัก
- gradient ทุกจุด
- animation ทุก element
- effect แสงวิบวับ
- emoji จำนวนมาก
- bubble UI จนเสียความเป็นวิชาการ

---

# 3. Color Palette

## 3.1 Primary Purple

ใช้เป็นสีหลักของระบบ

```css
--purple-50:  #F8F5FF;
--purple-100: #F2ECFF;
--purple-200: #E7DCFF;
--purple-300: #D6C3F8;
--purple-400: #C2A4EF;
--purple-500: #A986DE;
--purple-600: #8C6CC4;
--purple-700: #7054A4;
--purple-800: #57407F;
--purple-900: #40305F;
```

### Primary UI Color

```css
--color-primary: #A986DE;
```

### Primary Strong

```css
--color-primary-strong: #8C6CC4;
```

### Primary Soft

```css
--color-primary-soft: #F2ECFF;
```

---

# 4. Supporting Colors

## Warm Cream / Paper

ช่วยให้เว็บไม่ดูม่วงไปทั้งหน้า

```css
--cream-50:  #FFFDFC;
--cream-100: #FFF9F5;
--cream-200: #F8F1EC;
```

---

## Soft Rose Accent

ใช้เล็กน้อย เช่น badge หรือ detail

```css
--rose-soft: #F7DDE8;
--rose-mid:  #EAB8CC;
```

ห้ามใช้ rose เป็นสีหลัก

---

## Soft Sage Accent

ใช้สำหรับ Success / positive status

```css
--sage-soft: #EAF5EE;
--sage-mid:  #9BC7AA;
--sage-deep: #5C9470;
```

---

## Soft Gold Accent

ใช้เฉพาะ decorative detail / premium touch

```css
--gold-soft: #F8EED9;
--gold-mid:  #D6B980;
```

ห้ามใช้ metallic gradient หนัก

---

# 5. Neutral Colors

```css
--bg-main:       #FBF9FD;
--bg-surface:    #FFFFFF;
--bg-muted:      #F6F3F8;

--text-primary:  #3D3545;
--text-secondary:#6E6575;
--text-muted:    #918798;

--border-soft:   #E9E2ED;
--border-strong: #D8CEDF;
```

ห้ามใช้:

```css
#000000
```

เป็น text หลัก

เพราะ contrast แข็งเกินธีม

---

# 6. Semantic Colors

```css
--success-bg:   #EAF5EE;
--success-text: #4B805F;

--warning-bg:   #FFF4DE;
--warning-text: #9B7435;

--danger-bg:    #FCEBEC;
--danger-text:  #A95860;

--info-bg:      #EEF2FF;
--info-text:    #6170A8;
```

สีสถานะต้อง muted ไม่ fluorescent

---

# 7. Background Strategy

## Main App Background

ใช้:

```css
background:
  linear-gradient(
    180deg,
    #FBF9FD 0%,
    #F8F5FB 100%
  );
```

หรือ solid:

```css
background: #FBF9FD;
```

---

## Homepage Background Image

Admin สามารถเปลี่ยนภาพได้

ต้องใส่ overlay เพื่อให้ข้อความอ่านง่าย:

```css
.home-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      135deg,
      rgba(255,255,255,.72),
      rgba(242,236,255,.64)
    );
}
```

Overlay ต้องไม่ทึบจนภาพหาย
และไม่บางจนข้อความอ่านยาก

---

# 8. Decorative Background Effects

อนุญาตให้มี shape เบา ๆ เช่น:

- lavender blurred circle
- lilac blob
- soft cream glow

แต่ต้องเป็น decorative layer เท่านั้น

ตัวอย่าง:

```css
.decorative-orb {
  position: absolute;
  width: 280px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: rgba(198, 166, 239, .20);
  filter: blur(55px);
  pointer-events: none;
}
```

## Performance Rule

จำนวน blur element:

```text
Desktop ≤ 3
Mobile ≤ 2
```

ห้าม animate blur/filter ต่อเนื่อง

---

# 9. Typography

เป้าหมาย:

- อ่านง่าย
- Thai friendly
- contemporary
- academic

## Recommended

ใช้ system font เป็น default:

```css
font-family:
  system-ui,
  -apple-system,
  "Segoe UI",
  "Noto Sans Thai",
  Tahoma,
  sans-serif;
```

หากใช้ Google Font:

อนุญาตเพียง 1 family

แนะนำ:

```text
Noto Sans Thai
หรือ
Prompt
```

ไม่โหลด weight มากเกิน:

```text
400
500
600
700
```

---

# 10. Typography Scale

```css
--text-xs:   .75rem;
--text-sm:   .875rem;
--text-base: 1rem;
--text-lg:   1.125rem;
--text-xl:   1.25rem;
--text-2xl:  1.5rem;
--text-3xl:  1.875rem;
--text-4xl:  2.25rem;
```

Homepage title:

```text
600–700 weight
```

Body:

```text
400–500 weight
```

ห้ามใช้ font weight 700 ทุกหัวข้อ

---

# 11. Border Radius

ธีมต้องนุ่ม แต่ไม่ bubble เกินไป

```css
--radius-sm: 10px;
--radius-md: 14px;
--radius-lg: 18px;
--radius-xl: 24px;
--radius-pill: 999px;
```

ใช้:

- buttons → 12–14px
- cards → 18–24px
- input → 12px
- badges → pill

---

# 12. Shadows

ใช้ soft shadow

```css
--shadow-sm:
  0 2px 10px rgba(73, 52, 92, .06);

--shadow-md:
  0 8px 24px rgba(73, 52, 92, .09);

--shadow-lg:
  0 16px 38px rgba(73, 52, 92, .12);
```

ห้ามใช้:

```text
black shadow opacity สูง
```

---

# 13. Card Style

Default card:

```css
.card {
  background: rgba(255,255,255,.90);
  border: 1px solid rgba(216,206,223,.70);
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
}
```

Hover:

```css
.card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}
```

Transition:

```css
transition:
  transform 180ms ease,
  box-shadow 180ms ease,
  border-color 180ms ease;
```

---

# 14. Homepage Main Cards

หน้าแรกมี 2 card หลัก:

1. ธุรการในชั้นเรียน
2. รายงานผลการพัฒนางานตามข้อตกลง (PA)

Card ต้อง:

- cover image เด่น
- text อ่านง่าย
- rounded
- soft purple overlay
- มี hover lift
- มี CTA button
- ดูหรูและน่ารักเล็กน้อย

---

# 15. Button System

## 15.1 Primary Button

```css
.btn-primary {
  color: #fff;
  background: linear-gradient(
    135deg,
    #B69BE7,
    #9C7DD2
  );
  border: 1px solid rgba(112,84,164,.18);
  border-radius: 14px;
  box-shadow:
    0 6px 18px rgba(140,108,196,.20);
}
```

Hover:

```css
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow:
    0 9px 22px rgba(140,108,196,.26);
}
```

Pressed:

```css
.btn-primary:active {
  transform: translateY(0) scale(.98);
}
```

---

# 16. Secondary Button

```css
.btn-secondary {
  color: #7054A4;
  background: #F4EEFF;
  border: 1px solid #DED1F3;
}
```

Hover:

```css
background: #ECE1FA;
```

---

# 17. Ghost Button

```css
.btn-ghost {
  background: transparent;
  color: #7054A4;
}
```

Hover:

```css
background: rgba(169,134,222,.09);
```

---

# 18. Danger Button

Danger ต้องไม่แดงสด

```css
.btn-danger {
  background: #FCEBEC;
  color: #A95860;
  border-color: #F3CDD0;
}
```

---

# 19. Cute Bounce Button

อนุญาตให้ปุ่มสำคัญบางชนิดมี **subtle bounce**

เหมาะกับ:

- CTA หน้าแรก
- Add
- Upload
- Save success
- Floating quick action

ห้ามใช้กับทุกปุ่ม

---

# 20. Bounce Interaction

## Hover Bounce

```css
@keyframes softBounce {
  0%   { transform: translateY(0); }
  45%  { transform: translateY(-4px); }
  70%  { transform: translateY(-1px); }
  100% { transform: translateY(-2px); }
}

.btn-bouncy:hover {
  animation: softBounce 360ms ease-out both;
}
```

---

# 21. Click Bounce

```css
.btn-bouncy:active {
  transform: scale(.965);
}
```

ใช้ `transform` เท่านั้น

ห้าม animate:

- width
- height
- margin
- top/left
- border-width

เพราะทำให้ layout/reflow

---

# 22. Attention Bounce

อนุญาตให้ CTA สำคัญ “ขยับเบา ๆ” หลังหน้าโหลดแล้ว 1 ครั้ง

เช่น:

```css
@keyframes attentionBounce {
  0%, 100% { transform: translateY(0); }
  35%      { transform: translateY(-5px); }
  65%      { transform: translateY(-2px); }
}
```

Rule:

```text
เล่นสูงสุด 1–2 ครั้ง
ห้าม infinite
```

ตัวอย่าง:

```css
animation:
  attentionBounce 650ms ease-out 700ms 1 both;
```

---

# 23. Cute Floating Button

Admin Quick Add สามารถเป็น FAB

รูปทรง:

```text
rounded square / soft circle
```

ไม่ต้องกลมแบบ social app มากเกินไป

ตัวอย่าง:

```css
.quick-add {
  border-radius: 18px;
  background: linear-gradient(135deg,#B99DE8,#9B7ACE);
}
```

Hover:

```css
transform:
  translateY(-3px)
  rotate(-1deg);
```

Rotation ห้ามเกิน:

```text
1–2deg
```

---

# 24. Icon Motion

Icon ใน button:

Hover:

```css
transform: translateX(2px);
```

Upload icon:

```css
transform: translateY(-2px);
```

Arrow:

```css
transform: translateX(3px);
```

ห้าม loop animation

---

# 25. Page Entrance Animation

เมื่อ page render:

```css
@keyframes pageFadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Duration:

```text
240–320ms
```

ใช้กับ main content wrapper เท่านั้น

ห้าม animate children ทุกตัวพร้อมกัน 50 element

---

# 26. Card Entrance

ถ้าต้องการ stagger:

อนุญาตเฉพาะ card หลักไม่เกิน:

```text
6 cards
```

Delay:

```text
0
40ms
80ms
120ms
...
```

ห้าม stagger list หลายสิบรายการ

---

# 27. Hover Lift

ใช้ได้ทั่วไป:

```css
.interactive-card:hover {
  transform: translateY(-3px);
}
```

Maximum:

```text
-4px
```

ไม่ควรใช้:

```text
-10px
```

เพราะดู playful เกินงานวิชาการ

---

# 28. Gentle Glow

Primary element อาจมี glow เล็กน้อย

```css
box-shadow:
  0 8px 24px rgba(169,134,222,.22);
```

ห้ามใช้:

- neon
- animated glow loop
- multiple glow layers

---

# 29. Glass Effect

ใช้ soft glass เฉพาะ:

- Homepage header
- hero text panel
- floating toolbar
- modal

ตัวอย่าง:

```css
.glass-panel {
  background: rgba(255,255,255,.72);
  border: 1px solid rgba(255,255,255,.60);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

## Performance Rule

มือถือ:

หาก performance ต่ำ ให้ fallback:

```css
background: rgba(255,255,255,.94);
backdrop-filter: none;
```

ห้าม glass ทุก card

---

# 30. Input Style

```css
input,
select,
textarea {
  background: #FFFFFF;
  border: 1px solid #DDD4E3;
  border-radius: 12px;
  color: #3D3545;
}
```

Focus:

```css
border-color: #B294E2;
box-shadow:
  0 0 0 4px rgba(169,134,222,.12);
```

---

# 31. Form Labels

```text
font-weight: 600
color: text-primary
```

Required star:

ใช้ muted rose

ไม่ใช้แดงสด

---

# 32. Selection / Checkbox / Radio

Accent:

```css
accent-color: #9C7DD2;
```

---

# 33. Year Selector

Year selector หน้าแรกควรเป็น pill-style

ตัวอย่าง:

```text
ปีการศึกษา  [ 2569 ▾ ]
```

Style:

- soft white
- purple border
- subtle shadow
- cozy rounded

ไม่ต้องมี animation นอกจาก hover/focus

---

# 34. Navigation

Navigation ต้อง:

- clean
- uncluttered
- icon น้อย
- active item ชัด

Active:

```css
background: #F2ECFF;
color: #7054A4;
```

มี indicator เล็ก เช่น:

```text
left accent line
```

หรือ:

```text
soft pill
```

---

# 35. Admin Sidebar

พื้น:

```css
background:
  linear-gradient(
    180deg,
    #F8F4FC,
    #FFFFFF
  );
```

Active nav:

```css
background: #EEE5FA;
```

ไม่ใช้ sidebar ม่วงเข้มเต็มแถบ
เพราะจะทำให้เว็บหนัก

---

# 36. Badge Design

Badge example:

```css
.badge {
  padding: .32rem .65rem;
  border-radius: 999px;
  font-size: .78rem;
  font-weight: 600;
}
```

Year badge:

```css
background: #F2ECFF;
color: #7054A4;
```

Published:

```css
background: #EAF5EE;
color: #5C9470;
```

Archived:

```css
background: #F0EDF2;
color: #7F7585;
```

---

# 37. Table Style

Table ต้องดู academic

Header:

```css
background: #F7F3FA;
color: #574A5E;
```

Rows:

- white
- subtle divider

Hover:

```css
background: #FCFAFD;
```

ห้ามใช้ zebra stripe สีม่วงเข้ม

---

# 38. Student Card Mobile

Mobile table fallback:

Card:

- white
- soft border
- 14–16px radius
- student name prominent
- metadata muted

ไม่ใช้ huge illustration

---

# 39. Empty State

Empty State ควรอบอุ่น

ใช้:

- simple line SVG
- small lavender icon
- short message

ตัวอย่าง:

```text
ยังไม่มีข้อมูลในปีการศึกษานี้
เมื่อเพิ่มข้อมูลแล้ว รายการจะแสดงที่นี่
```

ไม่ต้องมี mascot การ์ตูนใหญ่

---

# 40. Loading Skeleton

Skeleton:

```css
background:
  linear-gradient(
    90deg,
    #F1EDF4 25%,
    #F8F5FA 50%,
    #F1EDF4 75%
  );
```

Animation:

```text
1.2–1.6s
```

ใช้ background-position

ห้าม skeleton หลายสิบ elementพร้อมกันถ้าไม่จำเป็น

---

# 41. Loading Progress Bar

สี:

```css
background:
  linear-gradient(
    90deg,
    #C8AEEF,
    #9C7DD2
  );
```

Height:

```text
3px
```

เพิ่ม soft shadow:

```css
box-shadow:
  0 1px 6px rgba(156,125,210,.25);
```

---

# 42. Toast

Toast:

- rounded 14px
- white surface
- subtle border
- icon muted color
- slide/fade

Entrance:

```css
transform: translateY(8px);
opacity: 0;
```

Exit:

```css
opacity: 0;
```

Duration:

```text
180–240ms
```

---

# 43. Modal

Modal:

```css
background: #FFFFFF;
border: 1px solid #E5DCE9;
border-radius: 22px;
box-shadow: 0 22px 60px rgba(58,43,70,.16);
```

Backdrop:

```css
background: rgba(54,44,61,.30);
```

Blur backdrop:

ใช้ได้เล็กน้อย

```css
backdrop-filter: blur(3px);
```

หาก mobile performance ต่ำ:

ปิด blur

---

# 44. Modal Entrance

```css
@keyframes modalPop {
  from {
    opacity: 0;
    transform: translateY(8px) scale(.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

Duration:

```text
180–220ms
```

ห้าม spring physics library

---

# 45. Image Hover

Thumbnail:

```css
transform: scale(1);
```

Hover:

```css
transform: scale(1.015);
```

ห้าม zoom:

```text
> 1.04
```

เพราะดู gallery มากเกินไป

---

# 46. Cover Image

Cover image card:

```css
aspect-ratio: 16 / 10;
object-fit: cover;
```

Overlay:

```css
linear-gradient(
  180deg,
  transparent 35%,
  rgba(51,40,61,.56) 100%
);
```

Title บน cover:

white

---

# 47. Homepage Feminine Detail

อนุญาต:

- small flower-like abstract shape
- rounded organic line
- tiny lavender dots
- soft sparkle shape แบบ static 1–3 จุด

ห้าม:

- animated glitter
- hearts everywhere
- floating flowers loop
- particle system
- confetti

---

# 48. Icon Style

ใช้:

- line icon
- rounded stroke
- consistent 1.75–2px

ลักษณะ:

```text
soft / modern / clean
```

ไม่ผสมหลาย icon family

---

# 49. Suggested Icons

Homepage:

```text
Classroom → clipboard / users / book
PA → document-check / folder-check / award
```

Admin:

```text
Dashboard
Calendar/Year
Users
Folder
Palette
Upload
```

---

# 50. Academic Balance Rule

ทุก screen ต้องผ่านคำถามนี้:

> หากนำเว็บนี้เปิดต่อหน้าผู้บริหารหรือคณะกรรมการประเมิน PA  
> จะยังดูสุภาพและเป็นมืออาชีพหรือไม่?

ถ้าคำตอบคือ “ดูน่ารักเกินไป”

ให้ลด:

- bounce
- gradient
- decorative shape
- radius
- icon animation

---

# 51. Animation Budget

เพื่อ performance

ต่อ page:

```text
Continuous animations = 0
```

ยกเว้น:

```text
loading indicator
```

Entrance animation:

```text
≤ 6 primary elements
```

Hover:

ไม่จำกัดมาก เพราะเกิดตาม interaction
แต่ใช้ `transform / opacity`

---

# 52. Animation Property Rule

## Preferred

ใช้:

```text
transform
opacity
```

## Acceptable in moderation

```text
background-color
border-color
box-shadow
```

## Avoid animation

```text
width
height
top
left
margin
padding
filter blur
backdrop-filter
```

---

# 53. Reduced Motion

ต้องรองรับ:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

# 54. Mobile Performance Rule

บน viewport เล็ก:

- ลด blurred decorative orb
- ปิด unnecessary backdrop blur
- ไม่ stagger animation หลาย card
- no hover-only dependency
- button touch target ≥ 44px

---

# 55. Button Touch Rule

ขั้นต่ำ:

```text
height: 44px
```

Primary CTA:

```text
48–52px
```

---

# 56. Primary CTA Example

```css
.cta-primary {
  min-height: 48px;
  padding: 0 1.2rem;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .55rem;

  color: white;

  background:
    linear-gradient(
      135deg,
      #B99EE8,
      #9876CE
    );

  border:
    1px solid rgba(112,84,164,.14);

  border-radius: 14px;

  box-shadow:
    0 7px 18px rgba(140,108,196,.20);

  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}
```

---

# 57. Button Hover Example

```css
.cta-primary:hover {
  transform: translateY(-2px);

  box-shadow:
    0 10px 24px rgba(140,108,196,.26);
}
```

---

# 58. Button Press Example

```css
.cta-primary:active {
  transform:
    translateY(0)
    scale(.975);
}
```

---

# 59. Button Focus

```css
.cta-primary:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 4px rgba(169,134,222,.20),
    0 7px 18px rgba(140,108,196,.20);
}
```

---

# 60. Bouncy CTA Example

HTML:

```html
<button class="cta-primary btn-bouncy">
  เข้าสู่ธุรการในชั้นเรียน
</button>
```

ไม่ต้องเพิ่ม JS

---

# 61. Theme Tokens — Recommended Final CSS

```css
:root {
  --purple-50: #F8F5FF;
  --purple-100:#F2ECFF;
  --purple-200:#E7DCFF;
  --purple-300:#D6C3F8;
  --purple-400:#C2A4EF;
  --purple-500:#A986DE;
  --purple-600:#8C6CC4;
  --purple-700:#7054A4;
  --purple-800:#57407F;
  --purple-900:#40305F;

  --cream-50:#FFFDFC;
  --cream-100:#FFF9F5;

  --rose-soft:#F7DDE8;
  --sage-soft:#EAF5EE;

  --bg-main:#FBF9FD;
  --bg-surface:#FFFFFF;
  --bg-muted:#F6F3F8;

  --text-primary:#3D3545;
  --text-secondary:#6E6575;
  --text-muted:#918798;

  --border-soft:#E9E2ED;
  --border-strong:#D8CEDF;

  --color-primary:#A986DE;
  --color-primary-strong:#8C6CC4;
  --color-primary-soft:#F2ECFF;

  --radius-sm:10px;
  --radius-md:14px;
  --radius-lg:18px;
  --radius-xl:24px;

  --shadow-sm:
    0 2px 10px rgba(73,52,92,.06);

  --shadow-md:
    0 8px 24px rgba(73,52,92,.09);

  --shadow-lg:
    0 16px 38px rgba(73,52,92,.12);

  --duration-fast:140ms;
  --duration-normal:200ms;
  --duration-slow:300ms;

  --ease-standard:
    cubic-bezier(.2,.7,.2,1);
}
```

---

# 62. Page-Specific Theme

## Homepage

Mood:

```text
Warmest / most feminine / most visual
```

Allow:

- background image
- lavender glow
- cover cards
- subtle bounce
- gentle decorative elements

---

## Classroom

Mood:

```text
Clean / functional / calm
```

ลด decorative element ลง

เน้น:

- information hierarchy
- quick navigation
- readable table
- status badge

---

## PA

Mood:

```text
Professional / elegant / academic
```

ใช้:

- lavender accent
- white surface
- section cards
- document-first layout

ลด bounce ลงมากกว่า Homepage

---

## Admin

Mood:

```text
Practical / organized / clean
```

effect เท่าที่จำเป็น

เป้าหมาย:

```text
ทำงานเร็วที่สุด
```

---

# 63. Effect Levels by Page

| Page | Visual | Bounce | Glass | Decorative |
|---|---:|---:|---:|---:|
| Homepage | High | Medium | Medium | Medium |
| Classroom | Medium | Low | Low | Low |
| PA | Medium | Very Low | Low | Very Low |
| Viewer | Low | None | None | None |
| Admin | Low-Medium | Low | Low | None |

---

# 64. Homepage Card Motion

Desktop hover:

```text
translateY(-3px)
scale(1.005)
```

Transition:

```text
200ms
```

Image:

```text
scale(1.015)
```

ห้ามหมุนทั้ง card

---

# 65. Upload Dropzone

Default:

```css
background: #FBF9FD;
border: 1.5px dashed #CDBBE4;
```

Dragging:

```css
background: #F3ECFC;
border-color: #A986DE;
transform: scale(1.004);
```

มี icon upload ขยับขึ้น:

```text
translateY(-2px)
```

---

# 66. Upload Success

เมื่อไฟล์ upload สำเร็จ:

icon check สามารถ:

```text
scale 0.8 → 1
```

Duration:

```text
180ms
```

ห้าม confetti

---

# 67. Save Success Microinteraction

Save button success:

```text
บันทึก → ✓ บันทึกแล้ว
```

button สามารถ soft pulse 1 ครั้ง

```css
@keyframes successPulse {
  50% { transform: scale(1.025); }
}
```

Duration:

```text
260ms
```

---

# 68. Warning / Delete Interaction

ห้ามใช้ cute bounce กับ:

- Delete
- Permanent delete
- destructive confirm
- error action

เพื่อไม่ลด seriousness

---

# 69. Cursor / Interaction

Interactive elements:

```css
cursor: pointer;
```

Disabled:

```css
cursor: not-allowed;
opacity: .55;
```

---

# 70. Focus Accessibility

ทุก interactive element ต้องมี:

```text
:focus-visible
```

สี focus:

```text
lavender ring
```

ห้ามลบ outline โดยไม่มี replacement

---

# 71. Contrast

แม้เป็น Pastel Theme

Body text ต้องเข้มพอ

ห้ามใช้:

```text
purple-300
```

เป็น body text บน white

ใช้:

```text
text-primary
text-secondary
purple-700+
```

---

# 72. Image Treatment

ภาพบุคคลหรือกิจกรรม:

- natural color
- no heavy purple overlay
- rounded 14–20px
- subtle border

หลีกเลี่ยง filter สีม่วงที่ทำให้หลักฐาน PA ดูผิดจากภาพจริง

---

# 73. File Card

File card:

```text
[icon]
ชื่อไฟล์
ประเภท / วันที่
```

สีตามประเภทได้แบบ muted

PDF:

```text
soft rose
```

Document:

```text
soft blue/lavender
```

Image:

```text
soft purple
```

ไม่ใช้ icon สีสดจัด

---

# 74. Section Header

PA section header:

ใช้:

- small eyebrow label
- section number
- clear title
- thin lavender accent line

ตัวอย่าง:

```text
ด้านที่ 1
การจัดการเรียนรู้

1.1 การสร้างและหรือพัฒนาหลักสูตร
```

---

# 75. Divider

```css
border-color: #ECE5F0;
```

หรือ gradient subtle:

```css
background:
  linear-gradient(
    90deg,
    transparent,
    #DED0EA,
    transparent
  );
```

ใช้เฉพาะ hero/section break

---

# 76. Cozy Spacing

Theme นี้ต้องไม่แน่น

ใช้ spacing:

```css
--space-1: .25rem;
--space-2: .5rem;
--space-3: .75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-10: 2.5rem;
--space-12: 3rem;
```

Card padding:

```text
18–24px
```

---

# 77. Content Width

Main readable content:

```css
max-width: 1200px;
margin-inline: auto;
```

Long text:

```css
max-width: 760px;
```

เพื่อ readability

---

# 78. Homepage Layout

Desktop:

```text
2 cards
```

Tablet:

```text
2 cards ถ้าพอ
```

Mobile:

```text
1 card ต่อแถว
```

Card ไม่ควรเตี้ยเกิน

---

# 79. Hero Copy

Hero text ต้องเรียบ

ตัวอย่าง:

```text
Suttinee Teacher Workspace
พัฒนาวิชาชีพและธุรการชั้นเรียน
นางสาวศุทธินี ถาวร
```

ไม่ต้องใส่ slogan ยาว

---

# 80. Decorative Typography

อนุญาต:

- uppercase small English eyebrow
- letter spacing เล็กน้อย

ตัวอย่าง:

```text
TEACHER WORKSPACE
```

แต่ Thai title ต้องเป็นตัวหลัก

---

# 81. No Overdesign Rule

หาก component มีพร้อมกัน:

- gradient
- glass
- shadow
- border
- glow
- animation

ให้ลดออกอย่างน้อย 2 อย่าง

หนึ่ง component ไม่ควรมี visual treatment ทุกแบบพร้อมกัน

---

# 82. Academic UI Priority

หน้า PA:

ความสำคัญ:

```text
Content
> Navigation
> Readability
> Visual decoration
```

หน้า Admin:

```text
Speed
> Clarity
> Visual decoration
```

หน้า Homepage:

```text
Clarity
≈ Beauty
> Decoration
```

---

# 83. Performance Non-Negotiable

ห้ามเพิ่ม library animation เช่น:

- GSAP
- Anime.js
- Framer Motion
- Lottie

สำหรับ effect เล็กน้อยนี้

ใช้:

```text
CSS transitions
CSS keyframes
```

เพียงพอ

---

# 84. GPU-Friendly Effects

เหมาะ:

```text
transform
opacity
```

ระวัง:

```text
box-shadow ขนาดใหญ่
blur
backdrop-filter
```

ใช้เฉพาะจุด

---

# 85. Scroll Effects

ไม่ต้องมี:

- parallax
- scroll-linked animation
- scroll hijacking
- smooth-scroll library

อนุญาต native:

```css
scroll-behavior: smooth;
```

และปิดใน reduced motion

---

# 86. Homepage Background Performance

Background จาก Google Drive:

หลังโหลด:

1. แสดง CSS fallback ก่อน
2. โหลดภาพ async
3. เมื่อพร้อมค่อย fade-in
4. ไม่ทำให้ layout shift

Fade:

```text
opacity
250ms
```

---

# 87. Image Lazy Loading

ทุก image ด้านล่าง fold:

```html
loading="lazy"
decoding="async"
```

Hero / first cover:

พิจารณา eager เฉพาะที่จำเป็น

---

# 88. Button Text

ภาษาไทยควรตรงและกระชับ

ใช้:

```text
เข้าสู่ระบบ
เปิดดู
เพิ่มข้อมูล
อัปโหลดไฟล์
บันทึก
ยกเลิก
สร้างปีใหม่
```

หลีกเลี่ยง copy playful มากเกิน เช่น:

```text
ไปกันเลย!
ลุยเลย!
เย้ สำเร็จ!
```

เพราะเป็นเว็บวิชาการ

---

# 89. Cute Tone Through Motion, Not Copy

ความน่ารักควรมาจาก:

- สี
- radius
- motion
- icon
- spacing

ไม่ใช่จากข้อความที่ไม่เป็นทางการ

---

# 90. Desktop Hover Rule

Hover effect ต้อง:

```text
subtle
< 300ms
```

Mobile:

ต้องใช้งานได้แม้ไม่มี hover

---

# 91. Theme QA Checklist

ก่อน release:

## Color

- [ ] Purple pastel เป็นสีหลัก
- [ ] ไม่มีสีม่วงเข้มครอบทั้งหน้า
- [ ] background สบายตา
- [ ] body text contrast ดี
- [ ] status color muted

## Feminine

- [ ] ดูนุ่มนวล
- [ ] ดูอบอุ่น
- [ ] มีความ feminine
- [ ] ไม่หวาน/เด็กเกินไป

## Academic

- [ ] เปิดต่อผู้บริหารได้
- [ ] PA อ่านง่าย
- [ ] ตารางอ่านง่าย
- [ ] ไม่มี animation distracting

## Performance

- [ ] no continuous decorative animation
- [ ] no animation library
- [ ] transform/opacity เป็นหลัก
- [ ] mobile blur ลดลง
- [ ] images lazy-load
- [ ] no major layout shift

## Buttons

- [ ] hover lift
- [ ] press feedback
- [ ] CTA บางตัวมี soft bounce
- [ ] bounce ไม่ infinite
- [ ] destructive button ไม่ bounce

## Accessibility

- [ ] focus-visible
- [ ] reduced-motion
- [ ] 44px touch target
- [ ] color contrast
- [ ] keyboard usable

---

# 92. Final Visual Formula

ให้ Coding AI ใช้สูตรนี้ตัดสินใจ:

```text
60% Clean Academic
25% Cozy Pastel
15% Cute Feminine
```

ไม่ใช่:

```text
60% Cute
25% Animated
15% Academic
```

---

# 93. Final Theme Direction

เว็บไซต์ควรให้ความรู้สึกว่า:

> **เป็นแฟ้มงานดิจิทัลและพื้นที่ทำงานของครูผู้หญิงที่ทันสมัย  
> ดูเรียบร้อย นุ่มนวล เป็นมิตร มีเอกลักษณ์สีม่วงพาสเทล  
> มี micro-interaction น่ารักพอดี แต่ยังคงความน่าเชื่อถือในบริบทการศึกษาและการประเมินวิชาชีพ**

---

# 94. Final Command to Coding AI

> ใช้ `THEME_STYLE_GUIDE.md` เป็น source of truth ด้าน Visual Design และ Interaction  
> ใช้สีม่วงพาสเทล / lavender เป็นสีหลัก โดยรักษาความสบายตาและความเป็นทางการ  
> ให้ความน่ารักมาจาก micro-interaction, soft radius, spacing และ subtle bounce ไม่ใช่ animation หนัก  
> ห้ามใช้ animation library สำหรับ effect ทั่วไป  
> ทุก motion ต้องใช้ `transform` และ `opacity` เป็นหลัก  
> ห้าม continuous decorative animation  
> ต้องรองรับ `prefers-reduced-motion`  
> Homepage สามารถมีความ feminine/cozy มากที่สุด แต่หน้า PA และ Admin ต้องลด effect เพื่อรักษาความเป็นวิชาการ  
> หากต้องเลือกระหว่าง “สวยขึ้น” กับ “เร็วขึ้น” ให้เลือก performance ก่อนเสมอ
