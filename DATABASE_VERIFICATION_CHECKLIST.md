# DATABASE_VERIFICATION_CHECKLIST.md
# Suttinee Teacher Workspace
## End-to-End Database & Storage Verification

> ห้ามเขียนใน README หรือ PROJECT_STATUS ว่า “Database Connected / Production Ready”
> จน checklist นี้ผ่าน

---

# 0. TEST INFORMATION

```text
Date:
Tester:
GitHub Pages URL:
Apps Script /exec URL:
Browser:
Device:
Test Academic Year:
Test Section:
```

Final Result:

```text
[ ] PASS
[ ] FAIL
```

---

# 1. PRECONDITION

- [ ] Frontend deploy บน GitHub Pages URL จริง
- [ ] DATA_MODE = live
- [ ] API_URL = production `/exec`
- [ ] Apps Script is versioned production deployment
- [ ] Spreadsheet exists
- [ ] Drive root exists
- [ ] Script Properties configured
- [ ] Initial year exists

---

# 2. HEALTH CHECK

เปิด:

```text
?action=health
```

Expected:

- [ ] HTTP/request succeeds
- [ ] JSON parse succeeds
- [ ] `ok=true`
- [ ] database=`connected`
- [ ] drive=`connected`
- [ ] no secret returned

Record:

```text
Result:
Response time:
Notes:
```

---

# 3. GITHUB PAGES → APPS SCRIPT TRANSPORT

จาก GitHub Pages จริง:

- [ ] GET request works
- [ ] response readable by JavaScript
- [ ] POST login works
- [ ] POST protected request works
- [ ] redirect handling works
- [ ] no CORS fatal error
- [ ] Chrome desktop pass
- [ ] Android Chrome pass
- [ ] Safari/iPhone pass ถ้ามี
- [ ] Incognito pass

ถ้าข้อใด fail:

```text
DATABASE CONNECTION = FAIL
```

ห้ามข้าม

---

# 4. PUBLIC BOOTSTRAP — HOME

เปิดหน้าแรก

Expected:

- [ ] loading bar starts
- [ ] settings loaded from Sheet
- [ ] years loaded from Sheet
- [ ] default year correct
- [ ] teacher name correct
- [ ] background setting loaded
- [ ] classroom cover loaded
- [ ] PA cover loaded
- [ ] no admin-only data in response

Network:

- [ ] primary bootstrap ใช้ request หลักเพียง 1 ครั้ง
- [ ] no duplicate fetch loop

---

# 5. YEAR SELECTION

ทดสอบอย่างน้อย 2 ปี

Example:

```text
2568
2569
```

- [ ] switch year changes URL/state
- [ ] Classroom changes data
- [ ] PA changes data
- [ ] archived year opens read-only
- [ ] refresh preserves selected year
- [ ] no record from wrong year leaks into selected year

---

# 6. GOOGLE SHEETS READ

ตรวจแต่ละ dataset:

- [ ] SETTINGS
- [ ] YEARS
- [ ] STUDENTS
- [ ] ATTENDANCE
- [ ] DAILY_ROUTINES
- [ ] HEALTH
- [ ] SDQ
- [ ] CLASSROOM_DOCUMENTS
- [ ] PA_SECTIONS
- [ ] PA_ITEMS

Check:

- [ ] headers map correctly
- [ ] blank cells handled
- [ ] boolean values handled
- [ ] number values handled
- [ ] dates serialize consistently
- [ ] Thai text not garbled

---

# 7. USER READ-ONLY SECURITY

โดยไม่ login:

- [ ] no edit UI
- [ ] no upload UI
- [ ] no create-year UI
- [ ] no appearance edit UI

เรียก write endpoint โดยไม่มี token:

- [ ] rejected
- [ ] no Sheet row changed
- [ ] no Drive file created
- [ ] error code is unauthorized/forbidden

**Critical: ถ้าเขียนได้โดยไม่มี token = FAIL**

---

# 8. ADMIN LOGIN

ทดสอบ wrong password:

- [ ] rejected
- [ ] no token
- [ ] clear Thai error
- [ ] password not logged in console

ทดสอบ correct password:

- [ ] login succeeds
- [ ] session token returned
- [ ] admin dashboard opens
- [ ] token not exposed in URL
- [ ] token cleared on logout

---

# 9. SESSION VALIDATION

- [ ] validate-session works
- [ ] protected write with valid token works
- [ ] protected write with fake token fails
- [ ] protected write after logout fails
- [ ] expired session displays login UI
- [ ] unsaved draft survives re-login if feature implemented

---

# 10. SETTINGS WRITE

Admin เปลี่ยน subtitle ทดสอบชั่วคราว

- [ ] Sheet SETTINGS updated
- [ ] API returns success
- [ ] cache invalidated
- [ ] public homepage sees new value after refresh/revalidate
- [ ] restore original value

---

# 11. BACKGROUND UPDATE

Upload test background

- [ ] upload progress visible
- [ ] file created in `_SYSTEM/branding/backgrounds`
- [ ] SETTINGS background_file_id updated
- [ ] public homepage loads new background
- [ ] fallback not used
- [ ] previous background not accidentally deleted unless intended
- [ ] restore production background

---

# 12. COVER UPDATE

Test Classroom cover:

- [ ] upload
- [ ] Drive file
- [ ] Sheet setting
- [ ] homepage updated

Test PA cover:

- [ ] upload
- [ ] Drive file
- [ ] Sheet setting
- [ ] homepage updated

---

# 13. CREATE YEAR TEST

ใช้ปีทดสอบที่ไม่ชนของจริง เช่น:

```text
2999
```

หรือใช้ TEST YEAR mechanism ถ้าระบบรองรับ

Admin Create Year:

- [ ] YEARS row created once
- [ ] root year folder created
- [ ] CLASSROOM folder created
- [ ] PA folder created
- [ ] required subfolders created
- [ ] PA sections seeded
- [ ] running create again does NOT duplicate

**Critical: idempotency must pass**

---

# 14. YEAR ISOLATION WRITE TEST

สร้าง test item ใน year 2999

- [ ] item visible in 2999
- [ ] item not visible in 2569
- [ ] item not visible in 2568
- [ ] query filter applies server-side

---

# 15. STUDENT CREATE / UPDATE

Admin:

1. create test student
2. edit
3. search

Expected:

- [ ] unique id created
- [ ] row inserted
- [ ] update modifies same row
- [ ] no duplicate created
- [ ] search finds updated value
- [ ] year preserved

---

# 16. STUDENT BULK IMPORT

Test small CSV/table:

```text
5–10 students
```

- [ ] preview
- [ ] validation
- [ ] batch insert
- [ ] no per-cell write pattern
- [ ] duplicate handling clear
- [ ] Thai names preserved

---

# 17. CLASSROOM WRITE

ทดสอบ:

- [ ] attendance
- [ ] milk
- [ ] toothbrush
- [ ] health
- [ ] SDQ

แต่ละรายการ:

- [ ] correct student_id
- [ ] correct year
- [ ] correct date
- [ ] update works
- [ ] no cross-year contamination

---

# 18. PA SECTION READ

- [ ] section 1.1–1.8 present
- [ ] 2.1–2.4 present
- [ ] 3.1–3.3 present
- [ ] challenge sections present
- [ ] sort order correct
- [ ] hidden section hidden from public

---

# 19. PA ITEM CREATE

สร้าง text/link item

- [ ] row created in PA_ITEMS
- [ ] section correct
- [ ] year correct
- [ ] published flag correct
- [ ] appears on public view when published
- [ ] does not appear when hidden

---

# 20. SMALL FILE UPLOAD

Upload:

```text
1 small JPG
1 small PDF
```

Expected:

- [ ] request succeeds
- [ ] Drive file created
- [ ] correct folder
- [ ] metadata row created
- [ ] file id saved
- [ ] type/mime correct
- [ ] title derived from filename
- [ ] public can open file according to policy

---

# 21. BULK UPLOAD

เลือกอย่างน้อย:

```text
10 files
```

mix:

- image
- pdf
- docx

Check:

- [ ] queue renders all files
- [ ] upload is sequential or max configured concurrency
- [ ] overall progress updates
- [ ] per-file status updates
- [ ] successful items saved
- [ ] UI remains responsive

---

# 22. FAILED UPLOAD RETRY

จำลอง fail 1 file

Expected:

- [ ] failed status
- [ ] other queue items continue
- [ ] Retry only failed works
- [ ] no duplicate success items
- [ ] retry creates one metadata row only

---

# 23. FILE + METADATA CONSISTENCY

สำหรับ uploaded file:

- [ ] Drive file exists
- [ ] Sheet metadata exists
- [ ] IDs match
- [ ] public link/view works
- [ ] archived metadata does not appear publicly

ถ้า file creation สำเร็จแต่ metadata write fail:

- [ ] system reports partial failure
- [ ] cleanup/recovery path documented
- [ ] no silent orphan creation

---

# 24. GOOGLE DRIVE ACCESS

Incognito / user account test:

- [ ] background visible
- [ ] cover visible
- [ ] PA image visible
- [ ] PDF opens
- [ ] document access follows chosen policy

ถ้า `PUBLIC_FILE_MODE=public`:

**Critical**

- [ ] no Google login required for public file

หาก Workspace policy block public sharing:

- [ ] architecture/policy updated intentionally
- [ ] not treated as app bug without investigation

---

# 25. REGISTER EXISTING DRIVE LINK

Add existing Drive file/link

- [ ] no re-upload
- [ ] metadata saved
- [ ] viewer opens
- [ ] correct year/section
- [ ] invalid link rejected or flagged

---

# 26. PUBLISH / HIDE

Test item:

- [ ] published=true → public visible
- [ ] published=false → public hidden
- [ ] admin still sees hidden item
- [ ] cache invalidated immediately

---

# 27. ARCHIVE

- [ ] archive sets archived=true
- [ ] public hides archived
- [ ] admin can filter archived
- [ ] Drive file not permanently deleted by default
- [ ] restore works if implemented

---

# 28. CACHE TEST

First load:

```text
network fetch
```

Second load:

- [ ] cached content renders quickly
- [ ] background refresh runs
- [ ] fresh data replaces stale if changed

After admin write:

- [ ] relevant server cache invalidated
- [ ] public receives new revision
- [ ] old cache does not remain permanently

---

# 29. LAZY LOAD TEST

PA page:

- [ ] initial page does not fetch all PA_ITEMS for all sections
- [ ] opening section triggers its data
- [ ] unopened large section does not download yet
- [ ] images use lazy loading where applicable

---

# 30. DRIVE SCAN TEST

Inspect Apps Script execution/log/code behavior

Public page load must NOT:

- [ ] traverse full Drive tree
- [ ] call `getFiles()` recursively across all folders
- [ ] search Drive for every card

Expected:

```text
Sheet = metadata index
Drive = file storage
```

---

# 31. SHEET PERFORMANCE CHECK

Backend should:

- [ ] use batch `getValues()`
- [ ] avoid getValue inside large row loops
- [ ] use batch `setValues()` for bulk writes where practical
- [ ] avoid API call per visible item

Record rough timing:

```text
Home bootstrap:
Classroom bootstrap:
PA bootstrap:
One PA section:
```

Do not set unrealistic hard threshold until real account/network baseline is known

---

# 32. LOADING UX

Throttle network in DevTools

Check:

- [ ] progress bar visible
- [ ] skeleton visible
- [ ] cached data when available
- [ ] no blank page
- [ ] progress reaches done
- [ ] fail state stops animation

---

# 33. ERROR TEST

Simulate wrong Spreadsheet ID:

- [ ] user-friendly error
- [ ] no secret exposed

Simulate wrong Drive ID:

- [ ] user-friendly error

Simulate Apps Script offline/bad URL:

- [ ] retry button
- [ ] cache fallback if available
- [ ] no infinite spinner

Restore config after test

---

# 34. SECURITY RESPONSE CHECK

Search API responses/network:

Must NOT contain:

- [ ] ADMIN_PASSWORD_HASH
- [ ] ADMIN_PASSWORD_SALT
- [ ] SESSION_SECRET
- [ ] Script Properties dump
- [ ] private system metadata not needed by UI

---

# 35. GITHUB REPOSITORY SECRET SCAN

Search repository:

```text
password
secret
ADMIN_PASSWORD
SESSION_SECRET
SPREADSHEET_ID
ROOT_DRIVE_FOLDER_ID
```

Review each result

- [ ] no secret value committed
- [ ] no accidental `.env`
- [ ] no copied Script Properties
- [ ] mock password clearly DEV-only and not accepted in live mode

---

# 36. MOBILE TEST

On real/simulated mobile:

- [ ] home
- [ ] year selector
- [ ] classroom
- [ ] PA
- [ ] viewer
- [ ] admin login
- [ ] upload selector
- [ ] upload queue
- [ ] modal with dynamic images
- [ ] keyboard does not trap form
- [ ] modal can scroll top → bottom

---

# 37. GITHUB PAGES SUBPATH TEST

Verify deployed repo path

All must work:

- [ ] CSS
- [ ] JS modules
- [ ] fallback images
- [ ] home links
- [ ] classroom link
- [ ] PA link
- [ ] admin link
- [ ] viewer link

No unexpected 404 due leading `/`

---

# 38. CLEANUP TEST DATA

After verification:

- [ ] remove/archive test student
- [ ] remove/archive test PA item
- [ ] remove test uploaded files
- [ ] remove test year 2999 if safe
- [ ] restore branding
- [ ] clear test cache
- [ ] verify real years unaffected

Do not delete production data during cleanup

---

# 39. FINAL REGRESSION

Public:

- [ ] home
- [ ] year
- [ ] classroom
- [ ] PA
- [ ] file

Admin:

- [ ] login
- [ ] save
- [ ] upload
- [ ] publish
- [ ] year
- [ ] appearance

---

# 40. FINAL DATABASE VERDICT

ทุก Critical item ต้องผ่าน

```text
Transport:             PASS / FAIL
Sheets Read:           PASS / FAIL
Sheets Write:          PASS / FAIL
Drive Read:            PASS / FAIL
Drive Upload:          PASS / FAIL
Admin Auth:            PASS / FAIL
User Read-only:        PASS / FAIL
Year Isolation:        PASS / FAIL
Bulk Upload:           PASS / FAIL
Cache Invalidation:    PASS / FAIL
Public File Access:    PASS / FAIL
GitHub Pages:          PASS / FAIL
Mobile:                PASS / FAIL
```

Final:

```text
DATABASE INTEGRATION VERIFIED: YES / NO
PRODUCTION READY: YES / NO
```

หากมี FAIL แม้แต่ Critical ข้อเดียว:

```text
PRODUCTION READY = NO
```

---

# 41. SIGN-OFF

```text
Verified by:
Date:
Git commit:
Apps Script deployment version:
Academic year:
Notes:
```
