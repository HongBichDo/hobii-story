import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { makeTemplates } from './lib/templates.mjs';
import { loadFromNotion } from './lib/notion.mjs';
import { slugify } from './lib/util.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const CACHE = path.join(ROOT, '.cache', 'img');

// đọc tệp .env nếu có (chứa chìa Notion)
try {
  const env = await fs.readFile(path.join(ROOT, '.env'), 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const cfg = JSON.parse(await fs.readFile(path.join(ROOT, 'site.config.json'), 'utf8'));
// khi chạy trên GitHub, website nằm trong thư mục con (ví dụ /hobii-story)
if (process.env.SITE_BASE !== undefined) cfg.base = process.env.SITE_BASE.replace(/\/$/, '');
let sharp = null;
try { sharp = (await import('sharp')).default; } catch {}

await fs.rm(DIST, { recursive: true, force: true });
await fs.mkdir(path.join(DIST, 'img'), { recursive: true });
await fs.mkdir(CACHE, { recursive: true });

// tải ảnh về, thu nhỏ, lưu cùng website (link ảnh của Notion hết hạn nên không dùng trực tiếp)
const done = new Map();
async function saveImage(src, key, width = 1400) {
  if (!src) return null;
  // ảnh trên máy: thêm ngày sửa và dung lượng vào mã, để đổi ảnh là tự nhận ra
  let stamp = '';
  if (!/^https?:/.test(src)) {
    try { const st = await fs.stat(src); stamp = `:${st.mtimeMs}:${st.size}`; } catch {}
  }
  const id = crypto.createHash('md5').update(`${key}:${width}${stamp}`).digest('hex').slice(0, 14);
  if (done.has(id)) return done.get(id);
  const ext = sharp ? 'webp' : (path.extname(new URL(src, 'http://x').pathname) || '.jpg').slice(1);
  const name = `${id}.${ext}`;
  const cached = path.join(CACHE, name);
  try {
    try {
      await fs.access(cached);
    } catch {
      let buf;
      if (/^https?:/.test(src)) {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        buf = Buffer.from(await res.arrayBuffer());
      } else {
        buf = await fs.readFile(src);
      }
      // ảnh iPhone (HEIC) thì đổi sang JPG trước, vì sharp không đọc được
      const brand = buf.subarray(4, 12).toString('latin1');
      if (/^ftyp(heic|heix|hevc|hevx|mif1|msf1)/.test(brand)) {
        const heicConvert = (await import('heic-convert')).default;
        buf = Buffer.from(await heicConvert({ buffer: buf, format: 'JPEG', quality: 0.92 }));
      }
      if (sharp) buf = await sharp(buf).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 86 }).toBuffer();
      await fs.writeFile(cached, buf);
    }
    await fs.copyFile(cached, path.join(DIST, 'img', name));
    const out = `/img/${name}`;
    done.set(id, out);
    return out;
  } catch (e) {
    console.warn(`  ! Không tải được ảnh (${e.message})`);
    return null;
  }
}

// ảnh nền do HoBii thêm vào assets/photos/ (hero, quote, about)
const photos = {};
for (const name of ['hero', 'quote', 'about', 'sach', 'viet', 'thuvien']) {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const p = path.join(ROOT, 'assets', 'photos', `${name}.${ext}`);
    try {
      await fs.access(p);
      photos[name] = await saveImage(p, `photo-${name}`, name === 'hero' ? 3200 : ['about', 'sach', 'viet', 'thuvien'].includes(name) ? 1000 : 1800);
      break;
    } catch {}
  }
}

// lấy nội dung: Notion nếu có chìa, không thì dùng bài mẫu
const token = process.env.NOTION_TOKEN;
let data;
if (token && (process.env.NOTION_BOOKS_DB || process.env.NOTION_POSTS_DB)) {
  console.log('Đang lấy nội dung từ Notion...');
  data = await loadFromNotion(
    { token, booksDb: process.env.NOTION_BOOKS_DB, postsDb: process.env.NOTION_POSTS_DB },
    cfg,
    saveImage
  );
} else {
  console.log('Chưa có chìa Notion, dùng nội dung mẫu.');
  const s = JSON.parse(await fs.readFile(path.join(ROOT, 'content', 'sample.json'), 'utf8'));
  data = {
    books: s.books.map((b) => ({ ...b, kind: 'book', cover: null })),
    posts: s.posts.map((p) => ({ ...p, kind: 'post', cover: null })),
  };
}

function prepare(list) {
  list.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const used = new Set();
  for (const it of list) {
    let s = slugify(it.title);
    let n = 2;
    while (used.has(s)) s = `${slugify(it.title)}-${n++}`;
    used.add(s);
    it.slug = s;
  }
}
prepare(data.books);
prepare(data.posts);
// ảnh nằm trong nội dung bài cũng cần đường dẫn gốc
if (cfg.base) for (const it of [...data.books, ...data.posts]) {
  if (it.body) it.body = it.body.replaceAll('src="/img/', `src="${cfg.base}/img/`);
}

// dấu phiên bản cho style.css và site.js: đổi tệp là trình duyệt tự tải bản mới
cfg.assetVer = crypto.createHash('md5')
  .update(await fs.readFile(path.join(ROOT, 'assets', 'style.css')))
  .update(await fs.readFile(path.join(ROOT, 'assets', 'site.js')))
  .digest('hex').slice(0, 8);
const T = makeTemplates(cfg, photos);
async function write(rel, html) {
  const file = path.join(DIST, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, html);
}

const latest = [...data.books, ...data.posts]
  .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  .slice(0, 3);

await write('index.html', T.home({ latest }));
await write('sach/index.html', T.booksIndex(data.books));
data.books.forEach((b, i) => write(`sach/${b.slug}/index.html`, T.bookPage(b, i)));
await write('viet/index.html', T.postsIndex(data.posts));
data.posts.forEach((p, i) => write(`viet/${p.slug}/index.html`, T.postPage(p, i)));
await write('thu-vien/index.html', T.libraryPage());
await write('ve-hobii/index.html', T.aboutPage());
await write('404.html', T.notFound());

await fs.cp(path.join(ROOT, 'assets'), path.join(DIST, 'assets'), {
  recursive: true,
  filter: (src) => !src.includes(`${path.sep}photos`),
});

console.log(`Xong: ${data.books.length} sách, ${data.posts.length} bài viết → thư mục dist/`);
