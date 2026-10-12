# Penyesuaian 3 Shortcut Utama Home Screen & Pembersihan UI Vault

Rencana penyesuaian untuk mengoptimalkan menu tekan-lama (*long-press*) ponsel Android/MIUI agar pas menampilkan 3 aksi paling produktif, serta membersihkan antarmuka Empty State Vault dan menghapus modal panduan yang tidak diperlukan.

### User Review & Critical Decisions

> [!IMPORTANT]
> Ringkasan keputusan berdasarkan jawaban klarifikasi pengguna:
> - **Komposisi 3 Shortcut Terpilih**: ⚡ **Tulis Cepat** (`/?action=quick-capture`), 🎙️ **AI Voice Transcript** (`/?action=voice-transcript`), dan 🎵 **Bar Baru** (`/?action=new-bar`). Membuang pintasan "Catatan Baru" standar dan "Voice Memo" agar pas dengan batas 4 slot peluncur sistem Android (3 shortcut aplikasi + 1 menu bawaan "Setelan situs").
> - **Pembersihan Empty State Vault**: Menghapus tombol/kartu panduan shortcut dari `EmptyState.tsx`, mengembalikan tampilan Vault yang bersih dan fokus pada 4 kartu aksi utama.
> - **Pembersihan Panduan**: Menghapus total modal instruksi/panduan shortcut dari aplikasi (`HomeScreenShortcutModal`) dan tombol terkait di `SettingsView`, namun tetap mempertahankan engine routing URL/action handler di `useHomeScreenShortcuts` sehingga eksekusi aksi dari home screen berjalan instan dan mulus.

---

### 1. Overview & Core Concept

- **Problem Statement**:
  Pada Android launcher (seperti MIUI Launcher, Pixel Launcher, One UI), menu pop-up saat menekan lama ikon aplikasi dibatasi maksimal 4 slot. Karena sistem Android dan browser Chrome secara wajib menambahkan slot "Setelan situs", hanya 3 shortcut teratas dari Web App Manifest yang dapat muncul. Konfigurasi sebelumnya yang memiliki 5 shortcut menyebabkan 2 shortcut terbawah terpotong. Selain itu, penambahan tombol panduan shortcut di tampilan kosong (Empty State) Vault dirasa mengganggu estetika minimalis.
- **Solusi**:
  1. Merampingkan daftar `shortcuts` di `public/manifest.json` menjadi tepat 3 item prioritas tinggi yang disetujui: Tulis Cepat, Transkrip Suara, dan Bar Baru.
  2. Mengembalikan tampilan `EmptyState.tsx` ke bentuk aslinya tanpa tombol atau banner shortcut.
  3. Menghapus modal panduan shortcut dari aplikasi (`App.tsx` dan `SettingsView.tsx`), menyisakan fungsionalitas murni yang bekerja di balik layar.

---

### 2. User Experience & Visual Design

- **Alur Pengguna di Ponsel (Android & iOS)**:
  1. Pengguna melakukan *long-press* pada ikon Noesis di layar utama ponsel.
  2. Menu pintasan langsung menampilkan 3 opsi yang tepat dan relevan:
     - ⚡ **Tulis Cepat**: Membuka Noesis dan langsung membuat catatan baru di `00-Inbox` dengan fokus kursor siap ketik.
     - 🎙️ **AI Voice Transcript**: Membuka Noesis dan langsung mengaktifkan modal perekaman suara berteknologi AI.
     - 🎵 **Bar Baru**: Membuka Noesis dan langsung membuat lembar birama musik baru di Music Studio Hub.
     - ⚙️ *Setelan situs* (item sistem bawaan Android).
  3. Pengguna juga dapat menyeret (*drag-and-drop*) masing-masing dari 3 ikon ini menjadi tombol terpisah di layar utama jika peluncur ponsel mendukungnya.

- **Antarmuka Vault (Empty State)**:
  - Tampilan kembali bersih, tenang, dan berorientasi pada konten.
  - Hanya menampilkan 4 kartu aksi primer Vault:
    - ➕ Buat Catatan
    - ⚡ Tulis Cepat
    - 🎙️ Transkrip Suara
    - 🔴 Voice Memo

---

### 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Membatasi Tepat 3 Item di `manifest.json`**:
  - *Pendekatan*: Menghapus `new-note` dan `voice-memo` dari manifest shortcuts; menempatkan `quick-capture`, `voice-transcript`, dan `new-bar` di posisi 1, 2, dan 3.
  - *Alasan*: Menjamin ketiga aksi ini selalu muncul 100% tanpa risiko terpotong oleh limitasi OS Android (4 slot limit).
  - *Trade-Off*: Catatan biasa dan Voice Memo tidak lagi ada di menu long-press home screen, namun keduanya tetap tersedia langsung di dalam antarmuka Vault.

- **Keputusan 2: Penghapusan Total Komponen Panduan Shortcut**:
  - *Pendekatan*: Menghapus `HomeScreenShortcutModal`, tombol pemicu di `SettingsView`, dan tombol di `EmptyState`.
  - *Alasan*: Menghindari bloatware antarmuka dan teks tutorial yang tidak diinginkan pengguna.
  - *Trade-Off*: Pengguna tidak lagi memiliki dialog panduan di dalam aplikasi, namun pengguna sudah memahami cara kerja shortcut di ponselnya.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Android / iOS OS                     │
│  [Long-press Noesis Icon] ──► 1. Tulis Cepat           │
│                                2. AI Voice Transcript   │
│                                3. Bar Musik Baru        │
│                                4. Setelan situs         │
└───────────────────────────┬────────────────────────────┘
                            │ ?action=quick-capture
                            │ ?action=voice-transcript
                            │ ?action=new-bar
                            ▼
┌────────────────────────────────────────────────────────┐
│              Browser / PWA Router (SPA)                │
│             useHomeScreenShortcuts Hook                │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
              ▼                           ▼
   [Vault / Editor Actions]     [Music Studio Storage]
   - quick-capture ──► Inbox     - new-bar ──► Dexie save
   - voice-transcript ──► Modal  - navigateToMusicBar
```

- **Komponen & File yang Disesuaikan**:
  - `public/manifest.json`: Mengatur 3 pintasan definitif.
  - `src/features/workspace/components/EmptyState.tsx`: Menghapus tombol smartphone/panduan shortcut.
  - `src/features/settings/components/SettingsView.tsx`: Menghapus kartu panduan shortcut.
  - `src/App.tsx`: Menghapus render modal `HomeScreenShortcutModal` sembari mempertahankan eksekusi `useHomeScreenShortcuts`.
  - `src/components/navigation/HomeScreenShortcutModal.tsx`: Dihapus dari codebase.
