# Rencana Implementasi: Home Screen Quick Shortcuts & Dedicated Launch Pages

Sesuai preferensi kamu, kita **menghilangkan floating widget** di dalam aplikasi dan sepenuhnya berfokus pada **Shortcut Layar Utama (Home Screen)** yang langsung bisa ditempatkan di layar ponsel.

---

## 1. Konfigurasi PWA App Shortcuts (`public/manifest.json`)
Menambahkan spesifikasi resmi W3C `shortcuts` pada Web App Manifest Noesis.
- **Daftar Shortcut Utama** (mengambil fitur dari *Empty State Vault* & karya musik):
  1. 📝 **Catatan Baru** (`/?action=new-note`): Langsung membuka editor catatan kosong.
  2. ⚡ **Tulis Cepat / Quick Capture** (`/?action=quick-capture`): Membuka modal input ide kilat.
  3. 🎙️ **AI Voice Transcript** (`/?action=voice-transcript`): Membuka panel transkrip suara AI.
  4. 🎵 **Voice Memo** (`/?action=voice-memo`): Memulai rekaman memo suara.
  5. 🎼 **Bar Baru** (`/?action=new-bar`): Berpindah ke komposer dan membuat Bar musik baru.
  6. 💿 **Single Baru** (`/?action=new-single`): Membuka pembuatan single / rilisan baru.
- **Fitur Bawaan Android/PWA**: Di perangkat Android modern, pengguna cukup **menekan lama (long-press)** ikon Noesis di home screen, lalu men-drag salah satu pintasan di atas langsung ke layar utama sebagai **ikon widget mandiri (1-tap shortcut)**.

---

## 2. Dedicated Quick Action Launch Pages (`/quick/:action`)
Membuat rute khusus agar pengguna (termasuk iOS Safari & Android Chrome) bisa menambahkan shortcut spesifik ke home screen:
- Rute mandiri:
  - `/quick/note`
  - `/quick/capture`
  - `/quick/transcript`
  - `/quick/memo`
  - `/quick/bar`
  - `/quick/single`
- Masing-masing halaman memiliki metadata judul yang rapi sehingga saat pengguna memilih opsi *"Add to Home Screen"* di browser ponsel, ikon tersebut akan bernama spesifik (misal: "Noesis - Tulis Cepat" atau "Noesis - Voice Memo").
- Saat dibuka dari home screen, halaman ini langsung mengeksekusi aksi yang dituju secara instan tanpa loading berbelit.

---

## 3. Global Action Handler (`useQuickAction.ts` & integrasi `App.tsx`)
- Mendeteksi parameter URL `?action=...` saat aplikasi diluncurkan dari home screen.
- Secara otomatis memicu fungsi yang sesuai di context/state Noesis:
  - `new-note` $\rightarrow$ memanggil fungsi pembuatan catatan di Vault.
  - `quick-capture` $\rightarrow$ membuka modal Quick Capture.
  - `voice-transcript` $\rightarrow$ membuka modal Voice Transcript.
  - `voice-memo` $\rightarrow$ mengarahkan ke pembuatan memo audio.
  - `new-bar` $\rightarrow$ mengarahkan ke tab Music/Bar dan membuka form bar baru.
  - `new-single` $\rightarrow$ membuka form pembuatan Single/Lagu baru.
- Membersihkan URL setelah aksi dipicu agar tidak berulang saat refresh.

---

## 4. Panduan & Asisten "Pasang ke Layar Utama" (Home Screen Hub)
- Menghadirkan modal panduan visual ringkas di dalam aplikasi (bisa diakses dari menu Settings atau ikon di Vault) yang mengajari pengguna:
  - **Di Android**: Cara menekan lama ikon Noesis lalu menarik shortcut favorit ke home screen.
  - **Di iOS**: Cara menekan tombol Share $\rightarrow$ "Add to Home Screen" dari halaman dedicated quick action.

---

## Kriteria Selesai (Verification Plan)
1. Periksa `manifest.json` agar valid dengan ikon dan URL shortcuts.
2. Uji alur pembukaan URL `/?action=new-note`, `/?action=quick-capture`, `/?action=voice-transcript`, `/?action=voice-memo`, `/?action=new-bar`, dan `/?action=new-single`.
3. Pastikan tidak ada widget melayang di UI aplikasi.
4. Verifikasi kompilasi dan linting kode berjalan sukses tanpa error.
