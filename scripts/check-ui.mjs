#!/usr/bin/env node
/**
 * Cổng kiểm tra UI/i18n mà `tsc` KHÔNG bắt được.
 *
 * Cả 5 lỗi dưới đây đều đã thực sự xảy ra trong đợt refactor: tsc xanh, eslint
 * xanh, build xanh — nhưng giao diện vẫn sai. Chạy `npm run check:ui` trong CI.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const MSG = join(ROOT, "messages");

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(p)) files.push(p);
  }
})(SRC);

const read = (p) => readFileSync(p, "utf8");
const rel = (p) => relative(ROOT, p).replace(/\\/g, "/");
const problems = [];
const fail = (gate, file, line, msg) =>
  problems.push(`[${gate}] ${rel(file)}:${line}  ${msg}`);

const VN = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
const lineOf = (s, i) => s.slice(0, i).split("\n").length;

// ── Gate 1: t() bị chèn vào giữa một câu (làm vỡ nghĩa) ─────────────────────
// Ví dụ thật: `Chấn thương/{t("common.actions.save")} ý` — "Lưu" bị thay vào
// giữa từ "Lưu ý".
for (const f of files) {
  const s = read(f);
  for (const m of s.matchAll(/[\wÀ-ỹ]\s*\{t\("/g)) {
    const ctx = s.slice(Math.max(0, m.index - 40), m.index + 60);
    const lineText = s.split("\n")[lineOf(s, m.index) - 1] ?? "";
    if (/^\s*(\/\/|\*|\{\/\*)/.test(lineText)) continue; // comment
    if (VN.test(ctx)) fail("mảnh-câu", f, lineOf(s, m.index), ctx.replace(/\s+/g, " ").trim());
  }
}

// ── Gate 2: t() bị chèn vào comment (làm hỏng JSDoc) ────────────────────────
for (const f of files) {
  const s = read(f);
  s.split("\n").forEach((l, i) => {
    if (/^\s*\/\/.*\{t\("/.test(l)) fail("comment", f, i + 1, l.trim());
  });
}

// ── Gate 3: thuộc tính JSX không bọc ngoặc: `label=t(...)` -> TS1145 ─────────
for (const f of files) {
  const s = read(f);
  for (const m of s.matchAll(/\s\w+=t\(/g)) fail("attr-thiếu-ngoặc", f, lineOf(s, m.index), m[0].trim());
}

// ── Gate 4: class Tailwind có 2 modifier opacity -> không sinh style nào ─────
// Ví dụ thật: `bg-muted/40/50`.
for (const f of files) {
  const s = read(f);
  for (const m of s.matchAll(/\b(?:bg|text|border|ring|from|via|to)-[a-z-]+\/\d+\/\d+/g))
    fail("class-sai", f, lineOf(s, m.index), m[0]);
}

// ── Gate 4b: cú pháp biến CSS của Tailwind v3 còn sót lại ───────────────────
// `max-h-[--foo]` là cú pháp v3. Tailwind v4 dịch nó thành `max-height: --foo`
// (ident trần) — CSS sai, trình duyệt vứt bỏ, utility im lặng biến mất.
// Ví dụ thật: SelectContent mất max-height nên dropdown 42 ngân hàng tràn khỏi
// màn hình và không scroll được. Dùng `[var(--foo)]` hoặc `(--foo)`.
for (const f of files) {
  const s = read(f);
  const lines = s.split("\n");
  for (const m of s.matchAll(/[\w-]+-\[--[a-zA-Z][\w-]*\]/g)) {
    const line = lineOf(s, m.index);
    // Comment được phép nhắc tới cú pháp sai để giải thích (xem select.tsx).
    if (/^\s*(\/\/|\*|\{\/\*)/.test(lines[line - 1] ?? "")) continue;
    fail("tw-v3-var", f, line, `${m[0]} → dùng [var(--…)] hoặc (--…)`);
  }
}

// ── Gate 5: locale bị hardcode trong Intl / toLocale* ───────────────────────
// Ngày phải theo ngôn ngữ đang chọn -> dùng useFormatters().
for (const f of files) {
  if (/use-formatters|format\.util/.test(rel(f))) continue;
  const s = read(f);
  for (const m of s.matchAll(/(?:Intl\.(?:DateTimeFormat|NumberFormat)|toLocale(?:String|DateString|TimeString))\(\s*["'](?:vi|en)[-A-Z]*["']/g))
    fail("locale-hardcode", f, lineOf(s, m.index), m[0]);
}

// ── Gate 6: key i18n dùng trong code nhưng thiếu trong catalog ──────────────
const flat = (o, p = "", out = new Set()) => {
  for (const [k, v] of Object.entries(o)) {
    const n = p ? `${p}.${k}` : k;
    if (v && typeof v === "object") flat(v, n, out);
    else out.add(n);
  }
  return out;
};
const vi = flat(JSON.parse(read(join(MSG, "vi.json"))));
const en = flat(JSON.parse(read(join(MSG, "en.json"))));

for (const k of vi) if (!en.has(k)) problems.push(`[parity] thiếu trong en.json: ${k}`);
for (const k of en) if (!vi.has(k)) problems.push(`[parity] thiếu trong vi.json: ${k}`);

for (const f of files) {
  if (/i18n\//.test(rel(f))) continue;
  const s = read(f);
  for (const m of s.matchAll(/\bt\(\s*"([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)+)"/g)) {
    if (!vi.has(m[1])) fail("key-thiếu", f, lineOf(s, m.index), m[1]);
  }
}

// ── Kết quả ────────────────────────────────────────────────────────────────
if (problems.length) {
  console.error(`\n✗ check:ui phát hiện ${problems.length} vấn đề:\n`);
  for (const p of problems) console.error("  " + p);
  console.error("");
  process.exit(1);
}
console.log(`✓ check:ui sạch (${files.length} file, ${vi.size} key i18n)`);
