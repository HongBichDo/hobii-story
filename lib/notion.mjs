import { esc } from './util.mjs';

const API = 'https://api.notion.com/v1';
const VERSION = '2022-06-28';

async function nfetch(token, path, opts = {}, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(API + path, {
      ...opts,
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': VERSION,
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
    });
    if (res.status === 429) {
      const wait = Number(res.headers.get('retry-after') || 1) * 1000;
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Notion ${res.status} ${path}: ${body.slice(0, 300)}`);
    }
    return res.json();
  }
  throw new Error('Notion bận quá, thử lại sau: ' + path);
}

async function queryAll(token, dbId) {
  const out = [];
  let cursor;
  do {
    const data = await nfetch(token, `/databases/${dbId}/query`, {
      method: 'POST',
      body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
    });
    out.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return out;
}

async function getChildren(token, id) {
  const out = [];
  let cursor;
  do {
    const data = await nfetch(token, `/blocks/${id}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`);
    out.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  for (const b of out) {
    if (b.has_children && b.type !== 'child_page' && b.type !== 'child_database') {
      b.children = await getChildren(token, b.id);
    }
  }
  return out;
}

const plain = (arr = []) => arr.map((t) => t.plain_text).join('');
const titleOf = (p) => plain(p?.title || p?.rich_text);
const selectOf = (p) => p?.select?.name ?? p?.status?.name ?? '';
const dateOf = (p) => p?.date?.start ?? '';
const fileOf = (p) => {
  const f = p?.files?.[0];
  return f ? f.file?.url ?? f.external?.url ?? null : null;
};

function rt(arr = []) {
  return arr
    .map((t) => {
      let s = esc(t.plain_text).replace(/\n/g, '<br>');
      const a = t.annotations || {};
      if (a.code) s = `<code>${s}</code>`;
      if (a.bold) s = `<strong>${s}</strong>`;
      if (a.italic) s = `<em>${s}</em>`;
      if (a.strikethrough) s = `<s>${s}</s>`;
      if (a.underline) s = `<u>${s}</u>`;
      if (t.href) s = `<a href="${esc(t.href)}" target="_blank" rel="noopener">${s}</a>`;
      return s;
    })
    .join('');
}

function embedHtml(url) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) {
    return `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="Video" loading="lazy" allowfullscreen></iframe></div>`;
  }
  return `<p><a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a></p>`;
}

async function one(b, ctx) {
  const t = b.type;
  const x = b[t];
  const kids = b.children ? await blocksToHtml(b.children, ctx) : '';
  switch (t) {
    case 'paragraph': {
      const h = rt(x.rich_text);
      return h ? `<p>${h}</p>${kids}` : '';
    }
    case 'heading_1': return `<h2>${rt(x.rich_text)}</h2>`;
    case 'heading_2': return `<h3>${rt(x.rich_text)}</h3>`;
    case 'heading_3': return `<h4>${rt(x.rich_text)}</h4>`;
    case 'quote': return `<blockquote>${rt(x.rich_text)}${kids}</blockquote>`;
    case 'callout': return `<aside class="callout">${rt(x.rich_text)}${kids}</aside>`;
    case 'divider': return '<hr>';
    case 'toggle': return `<details><summary>${rt(x.rich_text)}</summary>${kids}</details>`;
    case 'column_list': return `<div class="cols">${kids}</div>`;
    case 'column': return `<div>${kids}</div>`;
    case 'image': {
      const src = x.type === 'file' ? x.file.url : x.external.url;
      const local = await ctx.saveImage(src, `${b.id}:${b.last_edited_time}`, 1400);
      const cap = rt(x.caption);
      return `<figure><img src="${esc(local || src)}" alt="${esc(plain(x.caption))}" loading="lazy">${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
    }
    case 'video':
    case 'embed':
    case 'bookmark': {
      const url = x.external?.url ?? x.url;
      return url ? embedHtml(url) : '';
    }
    default:
      return '';
  }
}

async function blocksToHtml(blocks, ctx) {
  let html = '';
  let i = 0;
  while (i < blocks.length) {
    const t = blocks[i].type;
    if (t === 'bulleted_list_item' || t === 'numbered_list_item') {
      const tag = t === 'bulleted_list_item' ? 'ul' : 'ol';
      let items = '';
      while (i < blocks.length && blocks[i].type === t) {
        const b = blocks[i];
        const kids = b.children ? await blocksToHtml(b.children, ctx) : '';
        items += `<li>${rt(b[t].rich_text)}${kids}</li>`;
        i++;
      }
      html += `<${tag}>${items}</${tag}>`;
      continue;
    }
    html += await one(blocks[i], ctx);
    i++;
  }
  return html;
}

export async function loadFromNotion({ token, booksDb, postsDb }, cfg, saveImage) {
  const n = cfg.notion;
  const ctx = { saveImage };
  const isPublished = (page, statusProp) => selectOf(page.properties[statusProp]) === n.publishedValue;
  const result = { books: [], posts: [] };

  if (booksDb) {
    const m = n.books;
    const pages = (await queryAll(token, booksDb)).filter((p) => isPublished(p, m.status));
    for (const p of pages) {
      const pr = p.properties;
      const blocks = await getChildren(token, p.id);
      const coverSrc = fileOf(pr[m.cover]);
      result.books.push({
        kind: 'book',
        id: p.id,
        title: titleOf(pr[m.title]) || 'Chưa có tên',
        author: titleOf(pr[m.author]),
        genre: selectOf(pr[m.genre]),
        rating: pr[m.rating]?.number ?? null,
        summary: titleOf(pr[m.summary]),
        date: dateOf(pr[m.date]) || p.created_time,
        ezlib: pr[m.ezlib]?.url ?? '',
        cover: coverSrc ? await saveImage(coverSrc, `${p.id}:${p.last_edited_time}:cover`, 700) : null,
        body: await blocksToHtml(blocks, ctx),
      });
    }
  }

  if (postsDb) {
    const m = n.posts;
    const pages = (await queryAll(token, postsDb)).filter((p) => isPublished(p, m.status));
    for (const p of pages) {
      const pr = p.properties;
      const blocks = await getChildren(token, p.id);
      const imgSrc = fileOf(pr[m.image]);
      result.posts.push({
        kind: 'post',
        id: p.id,
        title: titleOf(pr[m.title]) || 'Chưa có tiêu đề',
        section: selectOf(pr[m.section]) || 'Tâm sự',
        summary: titleOf(pr[m.summary]),
        date: dateOf(pr[m.date]) || p.created_time,
        cover: imgSrc ? await saveImage(imgSrc, `${p.id}:${p.last_edited_time}:cover`, 1000) : null,
        body: await blocksToHtml(blocks, ctx),
      });
    }
  }
  return result;
}
