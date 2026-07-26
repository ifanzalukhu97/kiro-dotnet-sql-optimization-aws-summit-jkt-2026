# DB Optimization Log — WideWorldImporters

**Application:** WideWorldImporters Web API (ASP.NET Core 5, EF Core 5)
**Database:** SQL Server 2022 (Amazon RDS for SQL Server)
**Purpose:** Demo optimasi query untuk AWS Summit Jakarta 2026

---

## Dokumen (urut kronologis)

| Tanggal | File | Ringkasan |
|---|---|---|
| | | |

<!-- 
Naming convention: YYYY-MM-DD_deskripsi_singkat.md
Contoh:
| 2026-07-28 | [2026-07-28_query_optimization_plan.md](./2026-07-28_query_optimization_plan.md) | Analisis awal: 3 query >1s dari Top SQL. Desain IX_Demo_Orders_CustomerID. Dashboard 3362ms → 180ms. |
| 2026-07-29 | [2026-07-29_post_optimization_review.md](./2026-07-29_post_optimization_review.md) | Post-review: semua endpoint <500ms. Fragmentation ditemukan 45%. |
-->

## Status Terkini

> Belum ada optimization session. Jalankan demo flow untuk memulai.

### ✅ Solved

_(belum ada)_

### 🔴 Masalah Aktif

_(belum ada — akan terisi setelah analisis Performance Insights)_

---

## Hasil Optimization

| Endpoint | Before (ms) | After (ms) | Improvement | Index/Fix Applied |
|---|---|---|---|---|
| | | | | |

---

## Workflow

**User:**
1. **Capture Top SQL** — Buka RDS Performance Insights → Top SQL, paste hasilnya ke `scripts/audit/results/top-sql.md`
2. **Audit** — Jalankan scripts di `scripts/audit/`, paste hasil ke `scripts/audit/results/01-04`

**Kiro AI (otomatis setelah user paste data):**
3. **Analyze + Recommend ** — Kiro membaca data dari `scripts/audit/results/`, lalu menulis **1 file dated** di folder ini: `YYYY-MM-DD_deskripsi_singkat.md`

Setiap file dated berisi satu siklus lengkap:
- Analisis (kenapa lambat, root cause)
- Rekomendasi index/query fix
- Perubahan yang diterapkan (CREATE INDEX statement, query changes)
- Hasil before/after (response time, logical reads)
- Next actions

## Conventions

- **File naming:** `YYYY-MM-DD_deskripsi_singkat.md` (lowercase, underscore separator)
- **Satu file = satu siklus:** identify → analyze → fix → verify, semua di 1 dokumen
- **Top SQL raw data:** simpan di `scripts/audit/results/top-sql.md` (bukan di sini)
- **Audit results raw data:** simpan di `scripts/audit/results/01-04` (bukan di sini)
- **Index naming:** `IX_Demo_*` atau `IX_Optimization_*` (agar bisa di-drop oleh reset script)
- **Reset:** `scripts/reset/demo-reset.sql` — drops all demo indexes, clears cache

## Next Actions

| Prioritas | Action | Detail |
|---|---|---|
| 🔴 P0 | Capture Top SQL | Performance Insights → Top SQL → paste ke `scripts/audit/results/top-sql.md` |
| 🟡 P1 | Jalankan audit scripts | `scripts/audit/01-04`, paste hasil ke `scripts/audit/results/` |
| 🟡 P1 | Buat file optimization dated | Analisis + rekomendasi + apply + verify dalam 1 file |
| 🟢 P2 | Update readme ini | Isi tabel kronologis + status terkini setelah selesai |
