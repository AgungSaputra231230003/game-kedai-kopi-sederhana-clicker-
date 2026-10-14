# Kedai Kopi Digital

Kedai Kopi Digital adalah game idle clicker berbasis web yang mengajak pemain mengelola kedai kopi dari skala rumahan sampai berkembang menjadi bisnis yang besar. Pemain akan mengklik kopi untuk menghasilkan poin, membeli upgrade, mengelola bahan baku, membuka resep baru, dan mengembangkan cabang di berbagai kota.

## Fitur

- Klik kopi untuk mendapatkan PK (Poin Kopi)
- Upgrade klik dan otomatisasi
- Bahan baku dan inventori
- Resep kopi dengan bahan yang dibutuhkan
- Sistem misi harian
- Cabang usaha baru dengan multiplier pendapatan
- Prestige untuk bonus permanen
- Auto-save ke localStorage
- Tampilan responsif untuk desktop

## Teknologi

- React
- Vite
- Tailwind CSS
- Lucide React

## Struktur Proyek

```bash
PROJEK-GAME-WEB/
├── index.html
├── package.json
├── vite.config.js
├── postcss.config.js
├── tailwind.config.js
├── src/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── README.md
└── prd_kedai_kopi_digital.md
```

## Persyaratan

Pastikan sistem Anda sudah memiliki:

- Node.js 18+
- npm atau pnpm

## Instalasi

1. Clone atau masuk ke folder proyek
2. Jalankan perintah berikut:

```bash
npm install
```

## Menjalankan Aplikasi

Untuk menjalankan game di mode pengembangan:

```bash
npm run dev -- --host 0.0.0.0
```

Setelah itu, buka:

```bash
http://localhost:5173/
```

## Membangun untuk Produksi

```bash
npm run build
```

Build hasil produksi akan dibuat di folder `dist/`.

## Catatan Gameplay

- PK adalah mata uang utama dalam game.
- KpK (Kopi per Klik) ditingkatkan melalui upgrade klik.
- KpD (Kopi per Detik) didapat dari otomasi dan bisnis.
- Resep baru akan terbuka saat total pendapatan cukup besar.
- Prestige bisa dilakukan saat total pendapatan mencapai ambang tertentu.

## Pengembangan Lanjutan

Beberapa ide pengembangan berikutnya yang bisa ditambahkan:

- sound effect dan musik latar
- animasi kopi yang lebih realistis
- sistem pelanggan dan rating
- dekorasi kedai dan branding visual
- event musiman dan promo
- leaderboard lokal / online

## Lisensi

Proyek ini dibuat untuk kebutuhan belajar dan pengembangan game web idle berbasis browser.
