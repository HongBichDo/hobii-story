import { esc, formatDate } from './util.mjs';

export function makeTemplates(cfg, photos) {
  const base = cfg.base || '';
  const u = (p) => base + p;
  const nav = [
    ['/sach/', 'Sách và review'],
    ['/viet/', 'Góc viết'],
    ['/thu-vien/', 'Thư viện'],
    ['/ve-hobii/', 'Về HoBii'],
  ];

  function layout({ title, desc, body, active = '', home = false, heroDark = false }) {
    const fullTitle = title ? `${title} · ${cfg.name}` : `${cfg.name} · ${cfg.tagline}`;
    const links = nav
      .map(([href, label]) => `<a href="${u(href)}"${active === href ? ' class="on" aria-current="page"' : ''}>${label}</a>`)
      .join('');
    return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc || cfg.description)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc || cfg.description)}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500&family=Lora:ital,wght@0,400;0,500;1,400&family=Nunito:wght@400;500;600&display=swap">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css">
<link rel="stylesheet" href="${u('/assets/style.css')}">
<script>document.documentElement.classList.add('js')</script>
</head>
<body${home ? ` class="home${heroDark ? ' hero-dark' : ''}"` : ''}>
<header class="top">
  <div class="wrap top-in">
    <a class="logo" href="${u('/')}">${esc(cfg.name)} <i class="ti ti-leaf" aria-hidden="true"></i></a>
    <button class="burger" aria-label="Mở menu" aria-expanded="false"><i class="ti ti-menu-2" aria-hidden="true"></i></button>
    <nav class="nav" id="nav">${links}<a class="pill-link" href="${esc(cfg.links.fanpage)}" target="_blank" rel="noopener">Fanpage</a></nav>
  </div>
</header>
<main>
${body}
</main>
<footer class="foot">
  <div class="wrap foot-in">
    <div><div class="logo small">${esc(cfg.name)}</div><div class="muted">${esc(cfg.tagline)}</div></div>
    <div class="social">
      <a href="${esc(cfg.links.fanpage)}" target="_blank" rel="noopener" aria-label="Fanpage"><i class="ti ti-brand-facebook" aria-hidden="true"></i></a>
      <a href="${esc(cfg.links.ezlib)}" target="_blank" rel="noopener" aria-label="Thư viện trên ezlib"><i class="ti ti-books" aria-hidden="true"></i></a>
    </div>
    <div class="muted">© ${new Date().getFullYear()} ${esc(cfg.name)}</div>
  </div>
</footer>
<script src="${u('/assets/site.js')}"></script>
</body>
</html>`;
  }

  // vị trí lấy nét của ảnh nền, HoBii chỉnh trong site.config.json (mục focus)
  const fx = (name) => (cfg.focus && cfg.focus[name] ? ` style="object-position:${esc(cfg.focus[name])}"` : '');
  const tone = (i) => (i % 2 === 0 ? 'g' : 'p');
  const icon = { book: 'ti-book-2', post: 'ti-pencil' };

  function thumb(item, i, cls = '') {
    if (item.cover) return `<div class="thumb ${cls}"><img src="${esc(u(item.cover))}" alt="" loading="lazy"></div>`;
    return `<div class="thumb ${cls} ph ${tone(i)}"><i class="ti ${icon[item.kind]}" aria-hidden="true"></i></div>`;
  }

  const hrefOf = (item) => u(item.kind === 'book' ? `/sach/${item.slug}/` : `/viet/${item.slug}/`);

  function card(item, i) {
    const tag = item.kind === 'book' ? 'Review sách' : item.section;
    return `<a class="card" href="${hrefOf(item)}">
  ${thumb(item, i)}
  <span class="tag ${tone(i)}">${esc(tag)}</span>
  <h3>${esc(item.title)}</h3>
  <p>${esc(item.summary || '')}</p>
</a>`;
  }

  function stars(n) {
    if (n == null) return '';
    const v = Math.max(0, Math.min(5, Math.round(Number(n) * 2) / 2));
    const txt = String(v).replace('.', ',');
    return `<span class="stars" aria-label="${txt} trên 5 sao"><span class="st"><span class="st-bg">★★★★★</span><span class="st-fg" style="width:${v * 20}%">★★★★★</span></span><b class="st-n">${txt}</b></span>`;
  }

  function tcard(item, i) {
    const tag = item.kind === 'book' ? 'Review sách' : item.section;
    const media = item.cover
      ? `<div class="media"><img src="${esc(u(item.cover))}" alt="" loading="lazy"></div>`
      : `<div class="media ${tone(i)}"><i class="ti ${icon[item.kind]}" aria-hidden="true"></i></div>`;
    return `<a class="tcard reveal" href="${hrefOf(item)}">
  ${media}
  <span class="tcard-in"><span class="tag">${esc(tag)}</span>
  <h3>${esc(item.title)}</h3>
  ${item.date ? `<div class="when">${formatDate(item.date)}</div>` : ''}</span>
</a>`;
  }

  function panel(cls, href, ic, title, text, img, name) {
    return `<a class="panel ${cls}${img ? ' has-img' : ''} reveal" href="${href}">
  ${img ? `<img src="${esc(u(img))}" alt="" loading="lazy"${fx(name)}>` : ''}
  <i class="ti ${ic} deco" aria-hidden="true"></i>
  <span class="p-in"><h3>${title}</h3><p>${text}</p><span class="go">Vào xem <i class="ti ti-arrow-right" aria-hidden="true"></i></span></span>
</a>`;
  }

  function home({ latest }) {
    const h = cfg.hero;
    const heroImg = photos.hero ? u(photos.hero) : u('/assets/scene.svg');
    const words = h.greeting.trim().split(' ');
    const last = words.pop();
    const greeting = `${esc(words.join(' '))} <em>${esc(last)}</em>`;
    const dark = h.tone === 'dark' && !!photos.hero;
    const quoteBg = photos.quote ? `<div class="quote-img"><img src="${esc(u(photos.quote))}" alt=""${fx('quote')}></div>` : '';
    const body = `
<section class="hero${dark ? ' tone-dark' : ''}">
  <div class="hero-bg${photos.hero ? '' : ' scene'}"><img src="${esc(heroImg)}" alt=""${photos.hero ? fx('hero') : ''}></div>
  <div class="wrap hero-in">
    <div class="kicker">${esc(cfg.tagline)}</div>
    <h1>${greeting}</h1>
    <div class="btns"><a class="btn light" href="${u('/viet/')}">Đọc bài mới <i class="ti ti-arrow-right" aria-hidden="true"></i></a><a class="btn ghost" href="${u('/sach/')}">Xem sách</a></div>
  </div>
</section>

<div class="sheet">
<section class="wrap statement">
  <span class="label reveal">Đọc. Viết. Sống chậm.</span>
  <p class="big">${h.lines.map((l, i) => `<span class="ln reveal${i === 1 ? ' it' : ''}">${esc(l)}</span>`).join(' ')}</p>
</section>

<section class="wrap start">
  <div class="sec-top reveal"><div><span class="label">khám phá</span><h2>Bạn muốn bắt đầu <i>từ đâu?</i></h2></div></div>
  <div class="panels">
    ${panel('g', u('/sach/'), 'ti-book-2', 'Sách và review', 'Cảm nhận chân thật về những cuốn sách.', photos.sach, 'sach')}
    ${panel('p', u('/viet/'), 'ti-pencil', 'Góc viết', 'Những điều HoBii muốn viết và chia sẻ.', photos.viet, 'viet')}
    ${panel('m', u('/thu-vien/'), 'ti-books', 'Thư viện', 'Thư viện sách miễn phí, mượn online tại ezlib.', photos.thuvien, 'thuvien')}
  </div>
</section>
</div>

<section class="meet">
  <div class="wrap meet-in">
    <div class="meet-photo reveal">
      ${photos.about ? `<div class="oval"><img src="${esc(u(photos.about))}" alt="Ảnh HoBii" loading="lazy"${fx('about')}></div>` : '<div class="oval ph g"><i class="ti ti-camera" aria-hidden="true"></i></div>'}
      ${photos.sach ? `<div class="dot"><img src="${esc(u(photos.sach))}" alt="" loading="lazy"></div>` : ''}
    </div>
    <div class="meet-text">
      <span class="label reveal">về HoBii</span>
      <h2 class="reveal">Chào bạn, <i>mình là HoBii</i></h2>
      ${cfg.about.paragraphs.slice(0, 2).map((p) => `<p class="reveal">${esc(p)}</p>`).join('')}
      <a class="btn light reveal" href="${u('/ve-hobii/')}">Làm quen với HoBii <i class="ti ti-arrow-right" aria-hidden="true"></i></a>
    </div>
  </div>
</section>

${latest.length ? `<section class="wrap latest">
  <div class="sec-top reveal"><div><span class="label">mới nhất</span><h2>Mới <i>đăng</i></h2></div><a class="more" href="${u('/viet/')}">Xem tất cả <i class="ti ti-arrow-right" aria-hidden="true"></i></a></div>
  <div class="tcards n${latest.length}">${latest.map(tcard).join('')}</div>
</section>` : ''}

<section class="quote${photos.quote ? ' has-img' : ''}">
  ${quoteBg}
  <div class="quote-in reveal">
    <div class="qmark">“</div>
    <p>${esc(cfg.quote.text)}</p>
    <div class="by">${esc(cfg.quote.by)}</div>
  </div>
</section>`;
    return layout({ title: '', body, home: true, heroDark: dark });
  }

  function chips(list, attr) {
    return `<div class="chips" data-filter-group>
  <button class="chip on" data-f="*">Tất cả</button>
  ${list.map((x) => `<button class="chip" data-f="${esc(x)}">${esc(x)}</button>`).join('')}
</div>`;
  }

  // chữ cuối của tiêu đề viết nghiêng, như trang chủ
  const accent = (s) => {
    const w = String(s).trim().split(' ');
    if (w.length < 2) return esc(s);
    const last = w.pop();
    return `${esc(w.join(' '))} <i>${esc(last)}</i>`;
  };

  function pageHead(label, title, intro) {
    return `<section class="phead"><div class="wrap">
  <span class="label reveal">${esc(label)}</span>
  <h1 class="reveal">${accent(title)}</h1>
  ${intro ? `<p class="reveal">${esc(intro)}</p>` : ''}
</div></section>`;
  }

  function booksIndex(books) {
    const genres = [...new Set(books.map((b) => b.genre).filter(Boolean))];
    const body = `
${pageHead('sách đã đọc', 'Sách và review', 'Những cuốn sách HoBii đã đọc, kèm cảm nhận.')}
<section class="wrap lib">
  ${genres.length ? chips(genres) : ''}
  ${books.length ? `<div class="books">${books
      .map((b, i) => `<a class="book reveal" href="${hrefOf(b)}" data-cat="${esc(b.genre)}">
    ${thumb(b, i, 'tall')}
    <div class="book-meta">
      ${b.genre ? `<span class="tag ${tone(i)}">${esc(b.genre)}</span>` : ''}
      <h3>${esc(b.title)}</h3>
      <div class="muted">${esc(b.author)}</div>
      ${stars(b.rating)}
    </div>
  </a>`).join('')}</div>` : '<p class="empty center">Chưa có sách nào được đăng. HoBii sẽ sớm thêm vào nhé.</p>'}
</section>`;
    return layout({ title: 'Sách và review', desc: 'Những cuốn sách HoBii đã đọc, kèm cảm nhận.', body, active: '/sach/' });
  }

  function bookPage(b, i) {
    const ez = b.ezlib || cfg.links.ezlib;
    const body = `
<article class="article">
  <div class="wrap">
    <a class="back reveal" href="${u('/sach/')}"><i class="ti ti-arrow-left" aria-hidden="true"></i> Tất cả sách</a>
    <div class="book-head">
      <div class="cover-wrap reveal">${thumb(b, i, 'tall big')}</div>
      <div class="book-info reveal">
        ${b.genre ? `<span class="tag ${tone(i)}">${esc(b.genre)}</span>` : ''}
        <h1>${esc(b.title)}</h1>
        <div class="by-line">${esc(b.author)}</div>
        ${stars(b.rating)}
        ${b.date ? `<div class="muted date">${formatDate(b.date)}</div>` : ''}
        <a class="btn solid" href="${esc(ez)}" target="_blank" rel="noopener">Mượn tại ezlib <i class="ti ti-arrow-up-right" aria-hidden="true"></i></a>
      </div>
    </div>
    <div class="prose reveal">${b.body || '<p>Bài review đang được viết.</p>'}</div>
  </div>
</article>`;
    return layout({ title: b.title, desc: b.summary || `Review sách ${b.title}`, body, active: '/sach/' });
  }

  function postsIndex(posts) {
    const sections = [...new Set(posts.map((p) => p.section).filter(Boolean))];
    const body = `
${pageHead('những điều muốn kể', 'Góc viết', 'Tâm sự, ghi nhanh và những chuyện HoBii muốn kể.')}
<section class="wrap lib">
  ${sections.length ? chips(sections) : ''}
  ${posts.length ? `<div class="posts">${posts
      .map((p, i) => `<a class="post reveal" href="${hrefOf(p)}" data-cat="${esc(p.section)}">
    ${thumb(p, i, 'wide')}
    <div class="post-meta"><span class="tag ${tone(i)}">${esc(p.section)}</span><span class="muted">${formatDate(p.date)}</span></div>
    <h3>${esc(p.title)}</h3>
    <p>${esc(p.summary || '')}</p>
    <span class="go">Đọc tiếp <i class="ti ti-arrow-right" aria-hidden="true"></i></span>
  </a>`).join('')}</div>` : '<p class="empty center">Chưa có bài nào được đăng. HoBii sẽ sớm viết nhé.</p>'}
</section>`;
    return layout({ title: 'Góc viết', desc: 'Tâm sự, ghi nhanh và những chuyện HoBii muốn kể.', body, active: '/viet/' });
  }

  function postPage(p, i) {
    const body = `
<article class="article">
  <header class="wrap narrow post-head">
    <a class="back reveal" href="${u('/viet/')}"><i class="ti ti-arrow-left" aria-hidden="true"></i> Góc viết</a>
    <div class="reveal"><span class="tag ${tone(i)}">${esc(p.section)}</span></div>
    <h1 class="reveal">${esc(p.title)}</h1>
    <div class="muted date reveal">${formatDate(p.date)}</div>
  </header>
  ${p.cover ? `<figure class="lead reveal"><img src="${esc(u(p.cover))}" alt=""></figure>` : ''}
  <div class="wrap narrow"><div class="prose reveal">${p.body}</div></div>
</article>`;
    return layout({ title: p.title, desc: p.summary, body, active: '/viet/' });
  }

  function libraryPage() {
    const L = cfg.library;
    const body = `
${pageHead('thư viện nhỏ', L.title, L.intro)}
<section class="wrap">
  <ol class="steps3">${L.steps.map((s, i) => `<li class="reveal"><span class="n">${i + 1}</span><p>${esc(s)}</p></li>`).join('')}</ol>
  <div class="cta-box reveal">
    <div><span class="label">mượn sách online</span><h2>Ghé thư viện <i>trên ezlib</i></h2><p>${esc(L.note)}</p></div>
    <a class="btn light" href="${esc(cfg.links.ezlib)}" target="_blank" rel="noopener">Sang thư viện trên ezlib <i class="ti ti-arrow-up-right" aria-hidden="true"></i></a>
  </div>
</section>`;
    return layout({ title: 'Thư viện', desc: L.intro, body, active: '/thu-vien/' });
  }

  function aboutPage() {
    const A = cfg.about;
    const body = `
<section class="wrap about2">
  <div class="meet-photo reveal">
    ${photos.about ? `<div class="oval"><img src="${esc(u(photos.about))}" alt="Ảnh HoBii"${fx('about')}></div>` : '<div class="oval ph g"><i class="ti ti-camera" aria-hidden="true"></i></div>'}
    ${photos.thuvien ? `<div class="dot"><img src="${esc(u(photos.thuvien))}" alt="" loading="lazy"></div>` : ''}
  </div>
  <div class="about-text">
    <span class="label reveal">làm quen</span>
    <h1 class="reveal">${accent(A.title)}</h1>
    <div class="prose reveal">${A.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    <div class="btns reveal">
      <a class="btn solid" href="${esc(cfg.links.fanpage)}" target="_blank" rel="noopener">Ghé fanpage <i class="ti ti-arrow-up-right" aria-hidden="true"></i></a>
      <a class="btn ghost-dark" href="${u('/thu-vien/')}">Thư viện của HoBii</a>
    </div>
  </div>
</section>`;
    return layout({ title: A.title, desc: A.paragraphs[0], body, active: '/ve-hobii/' });
  }

  function notFound() {
    const body = `<section class="wrap page-head center"><h1>Không tìm thấy trang này</h1><p>Có thể bài đã được đổi chỗ. Mình về trang chủ nhé.</p><a class="btn solid" href="${u('/')}">Về trang chủ</a></section>`;
    return layout({ title: 'Không tìm thấy', body });
  }

  return { home, booksIndex, bookPage, postsIndex, postPage, libraryPage, aboutPage, notFound };
}
