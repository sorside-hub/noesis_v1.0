# AI Lyric Brainstorming Companion di Studio Musik (Revisi 2)

Rencana peningkatan asisten kreatif penulisan lirik berbasis AI (**Lyric Brainstorming Studio Companion**) pada Song Studio Noesis. Revisi ini mengintegrasikan profil model cascade AI yang digunakan, fleksibilitas **Mode Gaya / Tone Lirik (Raw, Punk, Puitis, Realis, dll.)**, serta aturan instruksi prompt anti-klise agar output tidak melulu "puitis indah menye-menye".

### User Review & Critical Decisions

> [!IMPORTANT]
> Keputusan penting berdasarkan pertanyaan pengguna:
> - **Profil Cascade AI**: Menggunakan **`getGeminiFirstCascade()`**:
>   - *Tier 1*: `gemini-3.6-flash` (50/50 Key A/B) — Paling unggul dalam nalar nuansa emosi, sastra, rima bahasa Indonesia, dan pemahaman genre.
>   - *Tier 2*: `gemini-3.5-flash-lite` — Cadangan cepat anti-macet (503 high demand).
>   - *Tier 3 & 4*: `openai/gpt-oss-120b` & `20b` (Groq) — Rescue fallback berkecepatan kilat jika kuota Gemini habis.
> - **Pilihan Gaya Lirik (*Lyrical Tone / Vibe Selector*)**:
>   Disediakan tombol pemilih karakter bahasa agar musisi tidak terkunci pada gaya puitis lembut:
>   1. ⚡ **Raw, Punk & Tajam**: Lugas, tanpa basa-basi, sarkastik, kata-kata menusuk, latar kehidupan nyata yang berantakan, gesekan aspal, anti-romantisasi (misal: gaya Slank era awal, Feast, Navicula, Nirvana, Sex Pistols).
>   2. 📻 **Indie Folk & Realis Keseharian**: Membumi, detail personal konkret (nama jalan, puntung rokok, teh dingin, kaus oblong), reflektif tanpa berlebihan (misal: gaya Hindia, Fiersa Besari, Jason Ranti, Iwan Fals).
>   3. 🌿 **Puitis & Metaforis Halus**: Bahasa berbalut analogi, sastra estetik, multi-indera (misal: gaya Efek Rumah Kaca, Letto, Kunto Aji).
>   4. 🏙️ **Pop Modern & Santai**: Obrolan sehari-hari, *catchy*, lugas, tidak berbelit-belit, mudah diingat pendengar.
>   5. 🔥 **Hip-Hop & Rima Padat**: Rima ganda (*multisyllabic*), *punchline*, tempo lirik rapat, asonansi tajam.
> - **Instruksi Ketat Anti-Klise (*Anti-AI Slop Lyric Prompts*)**:
>   - DILARANG KERAS menggunakan kata klise yang sudah basi di musik Indonesia (seperti: "derai air mata", "rembulan malam", "terhempas badai", "lilin yang padam", "merasuk sukma").
>   - Jika musisi memilih mode *Raw/Punk*, AI DILARANG bersikap puitis menye-menye; wajib menggunakan diksi berani, tajam, dan realistis.

---

### 1. Contoh Skenario Penggunaan dengan Mode Gaya Berbeda

#### Skenario A: Menulis Lagu Rock / Punk / Kritik Sosial (Mode: ⚡ Raw & Tajam)
- **Topik Input**: "frustrasi cari kerja dan tagihan menumpuk"
- **Output Hasil AI**:
  - 💡 *Antre nomor registrasi seperti ternak di lorong sempit* `(Citraan Keras / Fisik)`
  - 💡 *Ijazah laminating cuma jadi alas kopi yang tumpah* `(Objek Nyata / Sinis)`
  - 💡 *Dompetku lebih tipis dari janji manis pejabat di baliho* `(Sarkasme Tajam)`
  - 💡 *Jam alarm pagi seperti sirine penjara yang memaksa bangun* `(Energi Punk)`

#### Skenario B: Menulis Lagu Indie Akustik (Mode: 📻 Indie Folk / Realis)
- **Topik Input**: "kesepian di kamar kos"
- **Output Hasil AI**:
  - 💡 *Kipas angin berdecit menghitung waktu yang terbuang* `(Suasana Kamar)`
  - 💡 *Lampu jalan di luar jendela berkedip kuning sendirian* `(Visual Realis)`
  - 💡 *Bungkus mie instan yang lupa kubuang dari kemarin malam* `(Detail Kejujuran)`

#### Skenario C: Menulis Lagu Balada Puitis (Mode: 🌿 Puitis & Metaforis)
- **Topik Input**: "perpisahan tanpa kata"
- **Output Hasil AI**:
  - 💡 *Koleksi senyum yang kusimpan rapi di saku mantel musim hujan* `(Citraan Lembut)`
  - 💡 *Seperti stasiun kereta yang kehilangan jadwal keberangkatan terakhir* `(Analogi Luas)`

---

### 2. Aturan Instruksi AI (System Prompt Blueprint)

Instruksi backend di `src/api-core/lyricBrainstormHandler.ts` dirancang dengan aturan musikal presisi:

```typescript
const LYRIC_SYSTEM_PROMPTS = {
  raw: `Kamu adalah lyricist rock/punk/grunge/alternative. 
TUGAS: Hasilkan diksi/metafor/variasi lirik yang MENTAH, TAJAM, LUGAS, dan BERANI.
ATURAN EMAS:
1. HINDARI bahasa puitis menye-menye, bunga-bunga, atau klise romantis.
2. Gunakan objek konkret dunia nyata (kaca retak, aspal basah, tagihan, puntung rokok, kebisingan kota).
3. Beri sentuhan sarkastik, frustrasi, atau kemarahan yang jujur.
4. Ritme suku kata harus tegas, menghentak, dan enak diteriakkan di mikrofon.`,

  indie_folk: `Kamu adalah songwriter indie-folk/folk-pop realis.
TUGAS: Hasilkan diksi/metafor lirik yang MEMBUMI, JUJUR, dan REFLEKTIF.
ATURAN EMAS:
1. HINDARI kata-kata klise metafor "senja, kopi, semesta" yang membosankan.
2. Angkat detail keseharian yang sangat spesifik (nama jam, perabot kamar, percakapan canggung).
3. Buat pendengar merasa: "ini kisah nyata yang sangat dekat denganku".`,

  poetic: `Kamu adalah sastrawan musik dan penulis lirik puitis kontemporer.
TUGAS: Hasilkan metafor segar dan diksi sastra yang ELEGAN namun TIDAK USANG.
ATURAN EMAS:
1. DILARANG menggunakan klise usang: air mata, rembulan, badai lara, lilin redup.
2. Gunakan citraan multi-indera (suhu udara, tekstur, gema, aroma).
3. Metafor harus terasa filosofis, ambigu, dan memiliki lapisan makna.`,

  pop_urban: `Kamu adalah songwriter pop kontemporer / R&B masa kini.
TUGAS: Hasilkan baris lirik yang CATCHY, NATURAL, dan BERGAYA OBROLAN.
ATURAN EMAS:
1. Gunakan bahasa percakapan sehari-hari yang luwes dan mudah dihafal.
2. Hindari kata-kata arkais/kuno yang terdengar kaku di radio atau streaming.
3. Ritme lirik harus mengalir mulus (*flow*) mengikuti ketukan lagu pop modern.`,
};
```

---

### 3. Arsitektur Data & Model AI

- **Model Engine**:
  - `getGeminiFirstCascade()` dari `src/lib/ai/cascadeProfiles.ts`.
  - Menggunakan `gemini-3.6-flash` untuk pemahaman bahasa sastra dan rima Indonesia yang kaya, dengan fallback instan ke `gemini-3.5-flash-lite` dan Groq (`gpt-oss-120b`).
- **Penyimpanan Database**:
  - **Dexie Lokal (Offline)**: Disimpan di tabel `studioLyricBrainstorms`.
  - **Supabase Cloud Sync**: Disinkronkan ke tabel `studio_lyric_brainstorms` dengan kolom:
    `id`, `song_id`, `version_id`, `mode`, `tone_style`, `keyword`, `suggestions` (JSONB), `created_at`.
- **Lingkup Riwayat Lintas Versi Lirik**:
  - Melekat pada lagu (`songId`), sehingga draf lirik mana pun di dalam lagu tersebut dapat mengakses bank ide yang pernah digenerate, dengan penanda versi asal `versionId`.

---

### 4. User Experience di Panel Pendamping (`LyricBrainstormCompanion.tsx`)

1. **Bilah Atas Selector**:
   - Pemilih Mode: *🌿 Metafor Segar*, *🎵 Diksi & Rima*, *✍️ Variasi Baris*, *👁️ Citraan Indera*.
   - **Pemilih Gaya Lirik (*Lyrical Tone*)**: Chips toggle praktis:
     `⚡ Raw/Punk` • `📻 Indie Realis` • `🌿 Puitis` • `🏙️ Pop Urban`.
2. **Input Kontekstual**:
   - Jika teks di editor sedang diblok, otomatis mengisi kolom input.
   - Jika tidak diblok, musisi bebas mengetik ide/kata kunci sendiri.
3. **Kartu Hasil & Aksi Cepat**:
   - Menampilkan 4–6 kartu ide ringkas.
   - Tombol **➕ Sisipkan ke Kursor**, **🔄 Ganti Teks**, dan **📋 Salin**.
   - Tab **Riwayat Ide** untuk menengok kembali hasil pencarian sebelumnya tanpa menggunakan kuota ulang.
