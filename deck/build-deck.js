// Membangun deck A3 sebagai .pptx native (teks, tabel, bentuk, dan catatan pembicara asli).
// Jalankan: NODE_PATH=<folder dengan node_modules pptxgenjs> node deck/build-deck.js
// Aturan gaya mengikuti skill building-decks: judul label, takeaway di bawah garis, nav bawah, badge nomor.
const path = require("path");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require(process.env.APPLY_THEME || "./apply_theme.js");

const HERE = __dirname;
const IMG = (n) => path.join(HERE, "img", n);
const OUT = path.join(HERE, "kilatmart-a3-deck.pptx");

const F = "Segoe UI";
const MONO = "Consolas";
const BLUE = "072AC8", BLUE_DK = "041C8A", BLUE_MD = "3955D3", PILL = "A2D6F9";
const BLUE_LT = "CDE9FB", BLUE_XLT = "E8F4FD", INK = "16182B", GRAY = "6B7280";
const LINE = "A9D3F2", ORANGE = "F7941E", PEACH = "FBE0CC", RED = "9B1C1C", MUTED = "8C97A8";

const THEME = {
  name: "KilatMart A3",
  headFontFace: F,
  bodyFontFace: F,
  colors: {
    dk1: INK, lt1: "FFFFFF", dk2: BLUE_DK, lt2: BLUE_XLT,
    accent1: BLUE, accent2: ORANGE, accent3: BLUE_MD, accent4: PILL, accent5: RED, accent6: GRAY,
    hlink: BLUE, folHlink: BLUE_DK,
  },
};

const NAV = ["Konteks", "Pipeline", "Hasil", "Percobaan", "Penutup"];
const TERMS = /(full load|incremental|schema drift|scheduler|orchestrator|coupling|staging|pull-based|streaming|batch ELT|merge)/gi;

// Teks biasa dengan istilah Inggris dimiringkan (konvensi deck bahasa Indonesia).
function runs(text, o = {}) {
  return text.split(TERMS).filter((s) => s !== "").map((s) => {
    const isTerm = new RegExp("^" + TERMS.source + "$", "i").test(s);
    return { text: s, options: { ...o, italic: isTerm || o.italic } };
  });
}
function paras(list, o = {}) {
  const out = [];
  list.forEach((p, i) => {
    const r = typeof p === "string" ? runs(p, o) : p;
    r[r.length - 1] = { ...r[r.length - 1], options: { ...r[r.length - 1].options, breakLine: i < list.length - 1 } };
    out.push(...r);
  });
  return out;
}

// Pewarnaan sintaks sederhana untuk panel kode.
const CODE_TOKENS = /(--.*$|#.*$)|("[^"]*"|'[^']*')|\b(def|yield|for|in|from|import|return|SELECT|FROM|WHERE|FILTER|GROUP|BY|ORDER|CREATE|OR|REPLACE|TABLE|AS|CAST|COUNT|SUM|COALESCE|IN)\b/g;
function codeRuns(lines) {
  const out = [];
  lines.forEach((line, li) => {
    let last = 0;
    const push = (text, color, italic) => text && out.push({ text, options: { fontFace: MONO, fontSize: 12, color, italic: !!italic } });
    line.replace(CODE_TOKENS, (m, com, str, kw, idx) => {
      push(line.slice(last, idx), "E6EDF3");
      push(m, com ? "6C7C8C" : str ? "9CD8A0" : "7FB2F0", !!com);
      last = idx + m.length;
      return m;
    });
    push(line.slice(last), "E6EDF3");
    if (line === "") push(" ", "E6EDF3");
    if (li < lines.length - 1) out[out.length - 1].options.breakLine = true;
  });
  return out;
}

const shadow = () => ({ type: "outer", color: "0A2878", opacity: 0.14, blur: 8, offset: 3, angle: 45 });

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
pres.title = "Pipeline ELT KilatMart";
pres.author = "Kelompok KomLay A3";

pres.defineSlideMaster({
  title: "COVER",
  background: { color: "FFFFFF" },
  objects: [{ image: { x: 0, y: 0, w: 0.3, h: 7.5, path: IMG("grad-v.png") } }],
});

pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: "FFFFFF" },
  objects: [
    { image: { x: 0, y: 0.38, w: 0.3, h: 0.6, path: IMG("grad-v.png") } },
    { line: { x: 0.5, y: 1.08, w: 12.33, h: 0, line: { color: BLUE, width: 1.5 } } },
    { image: { x: 0.44, y: 1.02, w: 0.12, h: 0.12, path: IMG("dot.png") } },
    { rect: { x: 12.28, y: 0.4, w: 0.55, h: 0.55, fill: { color: BLUE } } },
    { line: { x: 0.5, y: 6.92, w: 12.33, h: 0, line: { color: LINE, width: 0.75 } } },
    {
      placeholder: {
        options: { name: "title", type: "title", x: 0.5, y: 0.38, w: 11.5, h: 0.62, fontFace: F, fontSize: 28, bold: true, color: BLUE, align: "left", valign: "middle", margin: 0 },
        text: "",
      },
    },
  ],
  slideNumber: { x: 12.28, y: 0.4, w: 0.55, h: 0.55, fontFace: F, fontSize: 16, bold: true, color: "FFFFFF", align: "center", valign: "middle" },
});

// ---------- komponen ----------
function nav(slide, active) {
  const w = 12.33 / NAV.length;
  NAV.forEach((n, i) => {
    const on = i === active;
    slide.addText(n, {
      x: 0.5 + i * w + 0.1, y: 7.0, w: w - 0.2, h: 0.32, align: "center", valign: "middle", margin: 0, isTextBox: true,
      fontFace: F, fontSize: 12, bold: on, color: on ? "FFFFFF" : MUTED,
      shape: pres.ShapeType.roundRect, rectRadius: 0.16, fill: on ? { color: BLUE } : undefined, objectName: "nav-" + n,
    });
  });
}
function takeaway(slide, text) {
  slide.addText(runs(text), {
    x: 0.5, y: 1.18, w: 12.33, h: 0.68, fontFace: F, fontSize: 17, bold: true, color: BLUE_DK,
    valign: "top", margin: 0, isTextBox: true, objectName: "takeaway",
  });
}
function content(title, navIdx, take, notes) {
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText(title, { placeholder: "title" });
  takeaway(s, take);
  nav(s, navIdx);
  s.addNotes(notes);
  return s;
}
// kartu: variasi shadow, dashed, header, hairline
function cardShadow(s, x, y, w, h, body, o = {}) {
  s.addText(body, { x, y, w, h, margin: 10, valign: "middle", isTextBox: true, shape: pres.ShapeType.roundRect, rectRadius: 0.1,
    fill: { color: "FFFFFF" }, line: { color: "E8F0F8", width: 0.75 }, shadow: shadow(), fontFace: F, fontSize: 14, color: INK, ...o });
}
function cardDash(s, x, y, w, h, body, o = {}) {
  s.addText(body, { x, y, w, h, margin: 10, valign: "middle", isTextBox: true, shape: pres.ShapeType.roundRect, rectRadius: 0.1,
    fill: { color: "FFFFFF" }, line: { color: LINE, width: 1.5, dashType: "dash" }, fontFace: F, fontSize: 14, color: INK, ...o });
}
function cardPlain(s, x, y, w, h, body, o = {}) {
  s.addText(body, { x, y, w, h, margin: 10, valign: "middle", isTextBox: true, shape: pres.ShapeType.roundRect, rectRadius: 0.1,
    fill: { color: "FFFFFF" }, line: { color: LINE, width: 1.5 }, fontFace: F, fontSize: 14, color: INK, ...o });
}
function cardHead(s, x, y, w, h, head, body, o = {}) {
  const barH = 0.42;
  s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 } });
  s.addText(head, { x, y, w, h: barH, align: "center", valign: "middle", margin: 0, isTextBox: true, shape: pres.ShapeType.rect,
    fill: { color: o.acc ? ORANGE : BLUE }, fontFace: F, fontSize: 14, bold: true, color: "FFFFFF" });
  s.addText(body, { x: x + 0.05, y: y + barH, w: w - 0.1, h: h - barH, margin: 10, valign: "middle", isTextBox: true,
    fontFace: F, fontSize: 14, color: INK, paraSpaceAfter: 6 });
}
function codePanel(s, x, y, w, h, lines) {
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: "111A26" }, line: { color: "111A26", width: 0.5 }, rectRadius: 0.1 });
  s.addText(codeRuns(lines), { x: x + 0.1, y, w: w - 0.2, h, margin: 12, valign: "middle", isTextBox: true, paraSpaceAfter: 2, objectName: "kode" });
}

// ---------- slide 1: sampul ----------
pres.addSection({ title: "Konteks" });
{
  const s = pres.addSlide({ masterName: "COVER", sectionTitle: "Konteks" });
  s.addImage({ path: IMG("logo-itb.png"), x: 11.2, y: 0.5, w: 1.6, h: 1.6, altText: "Logo ITB" });
  s.addText("Pipeline ELT KilatMart", { x: 1.0, y: 2.3, w: 10.5, h: 1.2, fontFace: F, fontSize: 48, bold: true, italic: true, color: BLUE, valign: "middle", margin: 0, isTextBox: true });
  s.addShape(pres.ShapeType.rect, { x: 1.0, y: 3.65, w: 0.8, h: 0.07, fill: { color: ORANGE }, line: { color: ORANGE, width: 0 } });
  s.addText("dlt, PostgreSQL, dan DuckDB", { x: 1.0, y: 3.9, w: 10, h: 0.5, fontFace: F, fontSize: 22, color: GRAY, valign: "middle", margin: 0, isTextBox: true });
  s.addText("[Nama kelompok dan anggota]", { x: 1.0, y: 5.6, w: 10, h: 0.5, fontFace: F, fontSize: 18, color: INK, valign: "middle", margin: 0, isTextBox: true });
  s.addNotes("Pembuka. Tugas kami menyambungkan dua sumber data milik KilatMart ke satu tempat analisis. Orders ada di PostgreSQL milik sendiri, sedangkan shipments ada di sistem partner KirimCepat. Dari pilihan tugas, kami mengambil opsi A3, yaitu pipeline ELT dengan dlt dan DuckDB.");
}

// ---------- slide 2: masalah dan arsitektur ----------
{
  const s = content("Masalah dan Arsitektur", 0,
    "Awalnya analytics membuka database produksi atau menunggu export CSV, sementara data pengiriman ada di partner dengan format lain.",
    "Masalahnya, pada kondisi awal tim analytics harus membuka database produksi langsung atau menunggu export CSV, dan data pengiriman ada di sistem partner dengan field yang berbeda. Karena itu kami membuat satu pipeline. Dua sumber, yaitu PostgreSQL dan mock KirimCepat, ditarik oleh dlt lalu disimpan di DuckDB pada dataset raw. Di akhir setiap load, transform.sql membuat tabel sales_per_day. Semuanya dinyalakan dengan satu perintah docker compose up.");
  const top = 2.2, ch = 3.85;
  const cont = (x, w, tab) => {
    s.addShape(pres.ShapeType.roundRect, { x, y: top, w, h: ch, fill: { color: "FFFFFF" }, line: { color: INK, width: 1.25, dashType: "dash" }, rectRadius: 0.12 });
    s.addText(tab, { x: x + 0.15, y: top - 0.17, w: 1.9, h: 0.34, align: "center", valign: "middle", margin: 0, isTextBox: true,
      fontFace: F, fontSize: 13, bold: true, color: "FFFFFF", shape: pres.ShapeType.rect, fill: { color: "000000" } });
  };
  cont(0.5, 3.6, "Sumber");
  cont(4.75, 3.3, "dlt pipeline");
  cont(8.5, 4.33, "DuckDB");
  // sumber
  const src = (y, a, b) => cardPlain(s, 0.7, y, 3.2, 1.4, [
    { text: a, options: { bold: true, fontSize: 15, breakLine: true } },
    { text: b, options: { fontFace: MONO, fontSize: 12, color: GRAY } }]);
  src(2.6, "PostgreSQL", "orders, db:5432");
  src(4.3, "Mock KirimCepat", "GET /shipments, X-API-Key");
  // merge bus: dua sumber ke satu panah
  const busX = 4.35, aY = 2.6 + 0.7, bY = 4.3 + 0.7, mid = (aY + bY) / 2;
  const ln = (x, y, w, h, arrow) => s.addShape(pres.ShapeType.line, { x, y, w, h, line: { color: BLUE, width: 1.75, endArrowType: arrow ? "triangle" : undefined } });
  ln(3.9, aY, busX - 3.9, 0); ln(3.9, bY, busX - 3.9, 0);
  ln(busX, aY, 0, bY - aY);
  ln(busX, mid, 4.7 - busX, 0, true);
  s.addImage({ path: IMG("dot.png"), x: busX - 0.06, y: mid - 0.06, w: 0.12, h: 0.12, altText: "" });
  // dlt (komponen yang dipelajari: oranye)
  s.addText([
    { text: "Extract, normalize, load", options: { bold: true, fontSize: 15, breakLine: true } },
    { text: "orders: merge, incremental pada updated_at", options: { fontSize: 13, breakLine: true } },
    { text: "shipments: merge, primary key shipment_id", options: { fontSize: 13, breakLine: true } },
    { text: "transform.sql dijalankan di akhir load", options: { fontSize: 13 } }],
    { x: 4.95, y: 2.6, w: 2.9, h: 3.1, margin: 10, valign: "middle", isTextBox: true, shape: pres.ShapeType.roundRect, rectRadius: 0.1,
      fill: { color: PEACH }, line: { color: ORANGE, width: 1.5 }, fontFace: F, color: INK, paraSpaceAfter: 6 });
  ln(8.05, mid, 8.45 - 8.05, 0, true);
  // duckdb
  const tbl = (y, h, a, b, fill) => cardPlain(s, 8.7, y, 3.93, h, [
    { text: a, options: { bold: true, fontFace: MONO, fontSize: 14, breakLine: true } },
    { text: b, options: { fontSize: 12, color: GRAY } }], fill ? { fill: { color: BLUE_LT } } : {});
  tbl(2.6, 0.9, "raw.orders", "5 baris setelah full load");
  tbl(3.65, 0.9, "raw.shipments", "3 baris");
  tbl(4.7, 1.0, "raw.sales_per_day", "dari transform.sql, 3 baris tanggal", true);
  s.addText("Gambar 1: Semua service jalan lewat docker compose up. Data disimpan di data/analytics.duckdb.", {
    x: 0.5, y: 6.3, w: 12.33, h: 0.35, fontFace: F, fontSize: 12, italic: true, color: GRAY, margin: 0, isTextBox: true });
}

// ---------- slide 3: konfigurasi dlt ----------
pres.addSection({ title: "Pipeline" });
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Pipeline" });
  s.addText("Konfigurasi dlt", { placeholder: "title" });
  takeaway(s, "Dua sumber yang bentuknya berbeda masuk lewat satu pipeline bernama kilatmart, tujuannya DuckDB dataset raw.");
  nav(s, 1);
  s.addNotes("Konfigurasinya ada di pipeline.py. Orders ditarik dengan sql_table dan memakai mode merge dengan primary key id, yaitu baris yang id-nya sudah ada diperbarui, bukan ditambah ulang. Untuk menarik hanya yang baru, kami memakai incremental pada kolom updated_at. Shipments datang dari REST dengan header X-API-Key, dan juga memakai merge dengan primary key shipment_id. Field partner sengaja berbeda dari tabel orders supaya terlihat bahwa kedua sumber punya bentuk sendiri.");
  codePanel(s, 0.5, 2.0, 7.4, 4.1, [
    "orders = sql_table(",
    "    credentials=DATABASE_URL,",
    "    schema=\"public\", table=\"orders\",",
    "    incremental=dlt.sources.incremental(\"updated_at\"),",
    ")",
    "orders.apply_hints(write_disposition=\"merge\",",
    "                   primary_key=\"id\")",
    "",
    "@dlt.resource(name=\"shipments\",",
    "              write_disposition=\"merge\",",
    "              primary_key=\"shipment_id\")",
    "def shipments_resource():",
    "    client = RESTClient(base_url=KIRIMCEPAT_URL,",
    "        auth=APIKeyAuth(name=\"X-API-Key\", ...))",
    "    yield from client.paginate(\"/shipments\")",
  ]);
  s.addText("Disederhanakan dari pipeline/pipeline.py", { x: 0.5, y: 6.2, w: 7.4, h: 0.3, fontFace: F, fontSize: 11, italic: true, color: GRAY, margin: 0, isTextBox: true });
  cardHead(s, 8.2, 2.0, 4.63, 2.0, "Orders, PostgreSQL",
    paras(["sql_table dari db:5432", "merge, primary key id", "incremental pada updated_at"]));
  cardHead(s, 8.2, 4.2, 4.63, 2.0, "Shipments, mock KirimCepat",
    paras(["RESTClient ke mock-kirimecepat:8000", "header X-API-Key", "merge, primary key shipment_id"]));
}

// ---------- slide 4: full load dan incremental ----------
pres.addSection({ title: "Hasil" });
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Hasil" });
  s.addText("Full Load dan Incremental", { placeholder: "title" });
  takeaway(s, "Run kedua hanya menarik 1 order baru, dan run ulang tanpa perubahan tidak menarik order sama sekali.");
  nav(s, 2);
  s.addNotes("Pada full load, kelima order ditarik dan tiga shipments masuk. Saat pipeline dijalankan lagi tanpa perubahan, tidak ada order yang ditarik. Lalu kami menambah satu order di PostgreSQL dan menjalankan pipeline sekali lagi, sehingga yang ditarik hanya satu order dan totalnya menjadi enam. Shipments ditarik penuh di setiap run karena mock tidak punya cursor, tetapi totalnya tetap tiga karena memakai merge.");
  const stat = (x, fig, qual) => {
    s.addShape(pres.ShapeType.roundRect, { x, y: 2.0, w: 3.9, h: 1.85, fill: { color: BLUE_LT }, line: { color: BLUE_LT, width: 0.5 }, rectRadius: 0.1 });
    s.addText(fig, { x: x + 0.3, y: 2.05, w: 1.0, h: 1.75, fontFace: F, fontSize: 60, bold: true, color: BLUE_DK, valign: "middle", margin: 0, isTextBox: true });
    s.addText(runs(qual), { x: x + 1.4, y: 2.05, w: 2.35, h: 1.75, fontFace: F, fontSize: 16, color: INK, valign: "middle", margin: 0, isTextBox: true });
  };
  stat(0.5, "5", "order ditarik saat full load");
  stat(4.72, "0", "order ditarik saat run ulang tanpa perubahan");
  stat(8.93, "1", "order ditarik setelah satu order baru");
  const hd = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: BLUE }, fontSize: 13 } });
  const cell = (t, alt, b) => ({ text: t, options: { fill: { color: alt ? BLUE_XLT : "FFFFFF" }, fontSize: 14, color: INK, bold: !!b } });
  s.addTable([
    [hd("Langkah"), hd("orders ditarik"), hd("Total raw.orders"), hd("Total raw.shipments")],
    [cell("Full load (docker compose up)"), cell("5"), cell("5"), cell("3")],
    [cell("Run ulang tanpa perubahan", true), cell("0", true), cell("5", true), cell("3", true)],
    [cell("Insert 1 order lalu run"), cell("1", false, true), cell("6"), cell("3")],
  ], { x: 0.5, y: 4.1, w: 12.33, colW: [4.9, 2.4, 2.5, 2.53], rowH: 0.45, fontFace: F, border: { type: "solid", color: LINE, pt: 0.75 }, valign: "middle", margin: [0, 0.12, 0, 0.12] });
  s.addText("shipments ditarik penuh (3 baris) di setiap run karena mock tidak punya cursor, totalnya tetap 3 karena merge. Sumber: bukti/01, 03, dan 04, run 24 November 2026.", {
    x: 0.5, y: 6.1, w: 12.33, h: 0.6, fontFace: F, fontSize: 12, color: GRAY, margin: 0, valign: "top", isTextBox: true });
}

// ---------- slide 5: transform ----------
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Hasil" });
  s.addText("Transform SQL", { placeholder: "title" });
  takeaway(s, "Satu perintah SQL mengubah raw.orders menjadi tabel per tanggal, dijalankan otomatis di akhir setiap load.");
  nav(s, 2);
  s.addNotes("transform.sql membaca raw.orders dan membuat sales_per_day dengan CREATE OR REPLACE, jadi tabel dibuat ulang di setiap load. Order selain cancelled dihitung di order_count, sedangkan revenue hanya dari order berstatus paid dan shipped. Angkanya kami cocokkan dengan hitungan manual dari data seed, dan setelah incremental muncul satu baris tanggal baru.");
  codePanel(s, 0.5, 2.0, 6.4, 4.2, [
    "CREATE OR REPLACE TABLE raw.sales_per_day AS",
    "SELECT",
    "  CAST(timezone('UTC', created_at) AS DATE) AS sale_date,",
    "  COUNT(*) FILTER (WHERE status <> 'cancelled')",
    "    AS order_count,",
    "  COALESCE(SUM(price * qty) FILTER (",
    "    WHERE status IN ('paid', 'shipped')), 0)",
    "    AS gross_revenue,",
    "  COUNT(*) FILTER (",
    "    WHERE status IN ('paid', 'shipped'))",
    "    AS paid_order_count",
    "FROM raw.orders",
    "GROUP BY 1",
    "ORDER BY 1;",
  ]);
  const hd = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: BLUE }, fontFace: MONO, fontSize: 11 } });
  const c = (t, fill) => ({ text: t, options: { fill: { color: fill }, fontFace: MONO, fontSize: 12, color: INK } });
  const row = (a, b, cc, d, fill) => [c(a, fill), c(b, fill), c(cc, fill), c(d, fill)];
  s.addTable([
    [hd("sale_date"), hd("order_count"), hd("gross_revenue"), hd("paid_order_count")],
    row("2026-11-20", "2", "130000", "2", "FFFFFF"),
    row("2026-11-21", "1", "0", "0", BLUE_XLT),
    row("2026-11-22", "1", "90000", "1", "FFFFFF"),
    row("2026-11-24", "1", "100000", "1", BLUE_LT),
  ], { x: 7.1, y: 2.0, w: 5.73, colW: [1.35, 1.3, 1.45, 1.63], rowH: 0.5, fontFace: F, border: { type: "solid", color: LINE, pt: 0.75 }, valign: "middle", margin: [0, 0.1, 0, 0.1] });
  s.addText("Baris terakhir muncul setelah incremental (order Budi, 24 November 2026).", { x: 7.1, y: 4.6, w: 5.73, h: 0.5, fontFace: F, fontSize: 12, italic: true, color: GRAY, margin: 0, valign: "top", isTextBox: true });
  s.addText("Tiga baris pertama cocok dengan hitungan manual di komentar seed/orders.sql.", {
    x: 7.1, y: 5.25, w: 5.73, h: 0.95, align: "center", valign: "middle", margin: 9, isTextBox: true, shape: pres.ShapeType.roundRect, rectRadius: 0.08,
    fill: { color: BLUE }, fontFace: F, fontSize: 15, color: "FFFFFF" });
}

// ---------- slide 6: failure experiment ----------
pres.addSection({ title: "Percobaan" });
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Percobaan" });
  s.addText("Failure Experiment", { placeholder: "title" });
  takeaway(s, "Prediksi benar di tiga poin dan meleset di satu: kolom baru belum muncul setelah ALTER saja.");
  nav(s, 3);
  s.addNotes("Percobaannya menambah kolom promo_code di tabel orders, dan prediksi kami tulis sebelum run. Tiga poin benar: baris lama berisi null, pipeline tidak gagal, dan incremental tetap hanya menarik order baru. Satu poin meleset. Kami memperkirakan kolom langsung muncul, padahal setelah ALTER saja kolom belum ada di DuckDB. Penyebabnya, kolom dibuat saat dlt memuat baris dari tabel itu, dan pada tahap itu tidak ada order yang lolos filter updated_at. Kolom baru muncul saat ada order baru.");
  const hd = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: BLUE }, fontSize: 14 } });
  const c = (t, alt) => ({ text: t, options: { fill: { color: alt ? BLUE_XLT : "FFFFFF" }, fontSize: 14, color: INK } });
  const st = (ok) => ({ text: ok ? "Benar" : "Meleset", options: { fill: { color: ok ? BLUE_LT : RED }, color: ok ? BLUE_DK : "FFFFFF", bold: true, fontSize: 14, align: "center" } });
  s.addTable([
    [hd("Prediksi"), hd("Hasil"), hd("Status")],
    [c("Kolom promo_code muncul di DuckDB"), c("Tidak muncul setelah ALTER (0 order ditarik), muncul setelah order baru"), st(false)],
    [c("Baris lama berisi null", true), c("6 baris lama null, order baru berisi HEMAT10", true), st(true)],
    [c("Pipeline tidak gagal"), c("Kedua run selesai tanpa error"), st(true)],
    [c("Incremental hanya menarik order baru", true), c("0 order di tahap ALTER, 1 order di tahap insert", true), st(true)],
  ], { x: 0.5, y: 2.0, w: 12.33, colW: [4.4, 5.9, 2.03], rowH: [0.45, 0.72, 0.62, 0.62, 0.62], fontFace: F, border: { type: "solid", color: LINE, pt: 0.75 }, valign: "middle", margin: [0, 0.12, 0, 0.12] });
  cardDash(s, 0.5, 5.3, 12.33, 1.3, paras([
    [{ text: "Penyebab: ", options: { bold: true, color: BLUE_DK } },
     { text: "kolom di DuckDB dibuat saat dlt memuat baris dari tabel itu. Tanpa baris yang lolos filter updated_at, skema tidak berubah, dan baris lama tidak diisi ulang.", options: {} }],
  ]));
}

// ---------- slide 7: link ke konsep ----------
pres.addSection({ title: "Penutup" });
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Penutup" });
  s.addText("Link ke Konsep", { placeholder: "title" });
  takeaway(s, "Pipeline ini adalah batch ELT yang menggantikan akses langsung ke database produksi.");
  nav(s, 4);
  s.addNotes("Kalau dihubungkan ke konsep, ini batch ELT yang pull-based dan berjalan per batch, berbeda dari CDC yang mengalir terus. Coupling yang hilang adalah analytics tidak lagi membuka database produksi atau menunggu export CSV. Pekerjaan ETL klasik seperti ekstraksi, staging, pemetaan schema, dan load sekarang dipegang dlt dan DuckDB. Batasnya, dlt tidak punya scheduler sendiri dan schema drift ditangani diam-diam, seperti yang terlihat di percobaan tadi.");
  const W = 6.0, H = 2.1;
  const t = (head, body) => [{ text: head, options: { bold: true, color: BLUE_DK, fontSize: 15, breakLine: true } }, ...runs(body)];
  cardShadow(s, 0.5, 2.0, W, H, t("Integration style",
    "Batch ELT bersifat pull-based: pipeline yang menarik data, satu batch per run. CDC (streaming) mengalir terus dan menangkap perubahan dari log, bukan dari cursor updated_at."));
  cardHead(s, 6.83, 2.0, W, H, "Coupling yang hilang",
    paras(["Analytics tidak lagi membuka database produksi langsung atau menunggu export CSV."]));
  cardPlain(s, 0.5, 4.4, W, H, t("Pekerjaan ETL klasik",
    "Ekstraksi, staging, pemetaan schema, dan load dipegang dlt dan DuckDB. Penjadwalan belum: pipeline dijalankan manual lewat docker compose."));
  cardDash(s, 6.83, 4.4, W, H, t("Batas dlt",
    "Tidak punya scheduler sendiri. Schema drift ditangani implisit: kolom baru muncul tertunda dan baris lama berisi null."));
}

// ---------- slide 8: reproducibility ----------
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Penutup" });
  s.addText("Reproducibility", { placeholder: "title" });
  takeaway(s, "Satu perintah menyalakan semuanya dari clone bersih, dan setiap baris konfigurasi bisa dijelaskan anggota.");
  nav(s, 4);
  s.addNotes("Untuk mengulang, cukup clone repo, jalankan docker compose up dengan build, lalu baca log pipeline. Versi image dipin, jadi hasilnya sama di laptop lain. Kami sudah mencoba dari clone bersih dan hasilnya sama: lima order, tiga shipments, tiga baris sales_per_day. Untuk AI, kami memakai Claude Code untuk konfigurasi dan debugging, dan semua keluarannya kami jalankan serta bisa kami jelaskan baris per baris.");
  const mono = (t, o = {}) => ({ text: t, options: { fontFace: MONO, fontSize: 16, ...o } });
  cardHead(s, 0.5, 2.0, 7.3, 3.0, "Menjalankan", [
    { text: "1  ", options: { bold: true, color: BLUE, fontSize: 16 } }, mono("git clone <link repo>", { breakLine: true }),
    { text: "2  ", options: { bold: true, color: BLUE, fontSize: 16 } }, mono("docker compose up -d --build", { breakLine: true }),
    { text: "3  ", options: { bold: true, color: BLUE, fontSize: 16 } }, mono("docker compose logs pipeline", { breakLine: true }),
    { text: "Image dipin: postgres:16, python:3.12-slim, dlt 1.32.0.", options: { fontSize: 14, color: GRAY } },
  ], {});
  cardShadow(s, 8.1, 2.0, 4.73, 3.0, [
    { text: "AI disclosure", options: { bold: true, color: BLUE_DK, fontSize: 15, breakLine: true } },
    { text: "Claude Code (Anthropic) dipakai untuk konfigurasi compose, pipeline dlt, mock, seed, dan debugging. Semua keluarannya dijalankan dan bisa dijelaskan baris per baris.", options: { fontSize: 15 } }]);
  s.addText([
    { text: "Repo: ", options: { bold: true } },
    { text: "[isi link repo]", options: { fontFace: MONO } },
    { text: "     Clone bersih: 5 orders, 3 shipments, 3 baris sales_per_day", options: {} }],
    { x: 0.5, y: 5.3, w: 12.33, h: 1.2, align: "center", valign: "middle", margin: 14, isTextBox: true, shape: pres.ShapeType.roundRect, rectRadius: 0.08,
      fill: { color: BLUE }, fontFace: F, fontSize: 18, color: "FFFFFF" });
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("ok", OUT);
})();
