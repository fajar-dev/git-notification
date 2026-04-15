# Feature: Commit Log ke Google Sheet

## Latar Belakang

Project ini menerima webhook push dari GitHub dan Bitbucket lalu meneruskannya ke Google Chat.
Fitur baru ini menambahkan pencatatan log commit ke Google Sheets setiap kali ada event push masuk.

---

## Tujuan

Setiap event push dari GitHub atau Bitbucket akan menyimpan data commit ke Google Sheet.
Setiap repo dipetakan ke satu sheet tersendiri di dalam satu spreadsheet.

---

## Skema Data

Setiap baris di sheet merepresentasikan satu commit, dengan kolom:

| Kolom          | Keterangan                        |
|----------------|-----------------------------------|
| Commit ID      | Hash/ID commit (full)             |
| Timestamp      | Waktu commit                      |
| Message        | Pesan commit                      |
| Author         | Nama author commit                |
| Branch         | Nama branch                       |
| URL            | Link ke commit                    |
| Files Added    | Jumlah file yang ditambahkan      |
| Files Removed  | Jumlah file yang dihapus          |
| Files Modified | Jumlah file yang dimodifikasi     |

---

## Aturan Bisnis

- Satu repo = satu sheet (nama sheet = nama repo, misal `org/repo-name`)
- Jika sheet untuk repo belum ada, buat sheet baru secara otomatis
- Jika commit ID sudah ada di sheet yang sama → **skip**, tidak disimpan lagi (deduplikasi)
- Satu event push bisa mengandung banyak commit → simpan **semua commit** sebagai baris terpisah
- Proses penyimpanan ke sheet dilakukan **setelah** notifikasi Google Chat dikirim (non-blocking jika memungkinkan)

---

## Perubahan yang Dibutuhkan

### 1. Update `Spreadsheet` class (`src/sheet.ts`)

- Tambahkan method untuk mendapatkan atau membuat sheet berdasarkan nama repo
- Tambahkan method untuk mengecek apakah commit ID sudah ada di sheet tersebut
- Tambahkan method untuk menyimpan satu atau beberapa baris commit sekaligus

### 2. Buat helper ekstrak data commit (`src/hooks.ts` atau file baru)

- **GitHub**: Ekstrak semua commit dari `payload.commits[]`, ambil field yang dibutuhkan. Info file changes tersedia di tiap commit object (`added`, `removed`, `modified`).
- **Bitbucket**: Bitbucket push event hanya menyediakan target commit terbaru, bukan list semua commit. Cukup ambil data dari `push.changes[].new.target`. Untuk file changes, gunakan nilai 0 jika tidak tersedia di payload.

### 3. Integrasi di webhook handler (`src/index.ts`)

- Setelah memanggil `sendGitHubNotification` atau `sendBitBucketNotification`, panggil fungsi untuk menyimpan log commit ke sheet
- Gunakan nama repo (`repository.full_name`) sebagai nama sheet

---

## Catatan Teknis

- Library `google-spreadsheet` sudah dipakai, manfaatkan `sheetsByTitle` untuk lookup sheet by nama
- Untuk deduplikasi, baca kolom Commit ID dari sheet lalu bandingkan sebelum insert
- Pastikan header kolom di-set saat pertama kali sheet dibuat
- Handling error saat write ke sheet tidak boleh menggagalkan response webhook (gunakan try/catch, log error saja)
