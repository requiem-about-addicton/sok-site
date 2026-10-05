(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formatNumber = n => new Intl.NumberFormat('ru-RU').format(Number(n || 0));
  const labelForCategory = (labels, id) => labels?.[id] || id || '';
  const enabledItems = items => (items || []).filter(item => item?.enabled !== false);
  let siteData = null;

  async function loadContent() {
    try {
      const res = await fetch('content/site.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      siteData = await res.json();
      applyContent(siteData);
    } catch (err) {
      console.warn('CMS content was not loaded. Static fallback is used.', err);
    }
  }

  function setText(selector, value) {
    const el = typeof selector === 'string' ? $(selector) : selector;
    if (el && value !== undefined && value !== null) el.textContent = value;
  }

  function setVisible(selector, visible) {
    const el = typeof selector === 'string' ? $(selector) : selector;
    if (el) el.hidden = visible === false;
  }

  function setLink(selector, label, href, arrow = '') {
    const el = typeof selector === 'string' ? $(selector) : selector;
    if (!el) return;
    if (href !== undefined && href !== null) el.href = href || '#';
    if (label !== undefined && label !== null) el.innerHTML = `${esc(label)}${arrow ? ` <span>${esc(arrow)}</span>` : ''}`;
  }

  function safeCssUrl(url = '') {
    return String(url).replace(/["\\\n\r]/g, m => ({'"':'%22','\\':'%5C','\n':'','\r':''}[m] || ''));
  }

  function applyBackground(selector, background = {}) {
    const el = typeof selector === 'string' ? $(selector) : selector;
    if (!el) return;
    const color = background.color || '';
    const image = background.image || '';
    const overlay = Math.max(0, Math.min(0.95, Number(background.overlay ?? 0)));
    if (color) el.style.backgroundColor = color;
    if (image) {
      el.style.backgroundImage = overlay > 0
        ? `linear-gradient(rgba(0,0,0,${overlay}), rgba(0,0,0,${overlay})), url("${safeCssUrl(image)}")`
        : `url("${safeCssUrl(image)}")`;
      el.style.backgroundPosition = background.position || 'center center';
      el.style.backgroundSize = background.size || 'cover';
      el.style.backgroundRepeat = 'no-repeat';
    } else {
      el.style.backgroundImage = '';
    }
  }

  function applySectionTheme(selector, config = {}) {
    const el = typeof selector === 'string' ? $(selector) : selector;
    if (!el) return;
    applyBackground(el, config.background || {});
    if (config.text_color) el.style.setProperty('--section-text', config.text_color);
    if (config.muted_color) el.style.setProperty('--section-muted', config.muted_color);
  }

  function applySite(data) {
    const site = data.site || {};
    if (site.title) document.title = site.title;
    const meta = $('meta[name="description"]');
    if (meta && site.description !== undefined) meta.content = site.description || '';
    const theme = $('#themeColorMeta') || $('meta[name="theme-color"]');
    if (theme && site.theme_color) theme.content = site.theme_color;

    const root = document.documentElement.style;
    const colors = site.colors || {};
    const vars = {
      forest: '--forest', forest_2: '--forest-2', forest_3: '--forest-3', lime: '--lime',
      lime_soft: '--lime-soft', mint: '--mint', cream: '--cream', paper: '--paper', ink: '--ink', muted: '--muted'
    };
    Object.entries(vars).forEach(([key, cssVar]) => { if (colors[key]) root.setProperty(cssVar, colors[key]); });

    const layout = site.layout || {};
    if (layout.container_width) root.setProperty('--container-max', `${Number(layout.container_width)}px`);
    if (layout.section_padding !== undefined) root.setProperty('--section-space', `${Number(layout.section_padding)}px`);
    if (layout.radius !== undefined) root.setProperty('--radius', `${Number(layout.radius)}px`);
    if (layout.hero_title_max !== undefined) root.setProperty('--hero-title-max', `${Number(layout.hero_title_max)}px`);
    if (layout.section_title_max !== undefined) root.setProperty('--section-title-max', `${Number(layout.section_title_max)}px`);
    if (layout.body_size !== undefined) root.setProperty('--body-size', `${Number(layout.body_size)}px`);
    if (site.font_family) document.body.style.fontFamily = site.font_family;
    document.body.classList.toggle('no-animations', layout.animations === false);
    document.body.classList.toggle('no-cursor-glow', layout.cursor_glow === false);

    let icon = $('link[rel="icon"][data-cms-icon]');
    if (site.favicon) {
      if (!icon) {
        icon = document.createElement('link');
        icon.rel = 'icon';
        icon.dataset.cmsIcon = 'true';
        document.head.appendChild(icon);
      }
      icon.href = site.favicon;
    } else if (icon) icon.remove();

    $$('.brand').forEach(el => {
      const brand = site.brand || 'СОК';
      if (site.logo) {
        el.innerHTML = `<img class="brand-logo" src="${esc(site.logo)}" alt="${esc(site.logo_alt || brand)}">`;
        const img = $('.brand-logo', el);
        if (img && site.logo_width) img.style.width = `${Number(site.logo_width)}px`;
        el.setAttribute('aria-label', `${site.logo_alt || brand} — на главную`);
      } else {
        el.innerHTML = `${esc(brand)}<span>.</span>`;
        el.setAttribute('aria-label', `${brand} — на главную`);
      }
    });
  }

  function applyHeader(config = {}) {
    setVisible('#siteHeader', config.enabled !== false);
    const nav = config.nav || [];
    const desktop = $('#desktopNav');
    const mobile = $('#mobileNav');
    if (desktop) desktop.innerHTML = nav.map(item => `<a href="${esc(item.href || '#')}">${esc(item.label || '')}</a>`).join('');
    if (mobile) mobile.innerHTML = nav.map((item, i) => `<a href="${esc(item.href || '#')}"><span>${String(i + 1).padStart(2,'0')}</span>${esc(item.label || '')}</a>`).join('');
    setLink('#headerCta', config.cta_label || '', config.cta_href || '#', '↗︎');
    setText('#mobileFooterLeft', config.mobile_footer_left || '');
    setText('#mobileFooterRight', config.mobile_footer_right || '');
    if (config.background_scrolled) document.documentElement.style.setProperty('--header-scrolled', config.background_scrolled);
  }

  function applyHero(hero = {}) {
    setVisible('#top', hero.enabled !== false);
    if ($('#heroEyebrow')) $('#heroEyebrow').innerHTML = `<span class="pulse-dot"></span> ${esc(hero.eyebrow || '')}`;
    if ($('#heroTitle')) $('#heroTitle').innerHTML = `${esc(hero.line1 || '')}<br>${esc(hero.line2 || '')}<br><em>${esc(hero.line3 || '')}</em>`;
    setText('#heroLead', hero.lead || '');
    setLink('#heroPrimary', hero.primary_label || '', hero.primary_href || '#', '↓︎');
    setLink('#heroSecondary', hero.secondary_label || '', hero.secondary_href || '#');

    const main = $('#heroMainImage');
    if (main) {
      if (hero.main_image) main.src = hero.main_image;
      main.alt = hero.main_alt || '';
    }
    const small = $('#heroSmallImage');
    if (small) {
      if (hero.small_image) small.src = hero.small_image;
      small.alt = hero.small_alt || '';
    }

    const sticker = $('#heroSticker');
    if (sticker) sticker.innerHTML = `${esc(hero.sticker_line1 || '')}<br>${esc(hero.sticker_line2 || '')}`;
    const badges = $('#heroBadges');
    if (badges) badges.innerHTML = (hero.badges || []).map(x => `<span>${esc(x)}</span>`).join('');
    const tags = $('#heroTags');
    if (tags) tags.innerHTML = (hero.tags || []).map(x => `<a href="${esc(x.href || '#portfolio')}" data-hero-filter="${esc(x.filter || '')}">${esc(x.label || '')}</a>`).join('');

    const scroll = $('#heroScrollCue');
    if (scroll) scroll.href = hero.scroll_href || '#services';
    setText('#heroScrollLabel', hero.scroll_label || '');

    const bg = hero.background || {};
    applyBackground('#top', bg);
    const blobA = $('.hero-blob-a');
    const blobB = $('.hero-blob-b');
    const noise = $('.hero-noise');
    if (blobA && bg.blob_color) blobA.style.background = bg.blob_color;
    if (blobA) blobA.hidden = bg.show_blobs === false;
    if (blobB) blobB.hidden = bg.show_blobs === false;
    if (noise) noise.hidden = bg.show_noise === false;
  }

  function applyTicker(ticker = {}) {
    const section = $('.ticker');
    if (!section) return;
    section.hidden = ticker.enabled === false;
    if (ticker.background_color) section.style.background = ticker.background_color;
    if (ticker.text_color) section.style.color = ticker.text_color;
    const track = $('#tickerTrack');
    if (!track) return;
    const items = ticker.items || [];
    const sep = ticker.separator || '✦';
    const one = items.map(item => `<span>${esc(item)}</span><b>${esc(sep)}</b>`).join('');
    track.innerHTML = one + one;
    if (ticker.speed_seconds) track.style.animationDuration = `${Math.max(3, Number(ticker.speed_seconds))}s`;
  }

  function applySectionCopy(data) {
    const services = data.services_section || {};
    setVisible('#services', services.enabled !== false);
    if ($('#servicesEyebrow')) $('#servicesEyebrow').innerHTML = `<span class="pulse-dot"></span> ${esc(services.eyebrow || '')}`;
    if ($('#servicesTitle')) $('#servicesTitle').innerHTML = `${esc(services.heading_line1 || '')}<br><em>${esc(services.heading_line2 || '')}</em>`;
    setText('#servicesLead', services.lead || '');
    applySectionTheme('#services', services);

    const portfolio = data.portfolio_section || {};
    setVisible('#portfolio', portfolio.enabled !== false);
    if ($('#portfolioEyebrow')) $('#portfolioEyebrow').innerHTML = `<span class="pulse-dot"></span> ${esc(portfolio.eyebrow || '')}`;
    if ($('#portfolioTitle')) $('#portfolioTitle').innerHTML = `${esc(portfolio.heading_line1 || '')}<br>${esc(portfolio.heading_line2 || '')} <em>${esc(portfolio.heading_accent || '')}</em>`;
    setText('#portfolioLead', portfolio.lead || '');
    applySectionTheme('#portfolio', portfolio);

    const team = data.team_section || {};
    setVisible('#team', team.enabled !== false);
    if ($('#teamEyebrow')) $('#teamEyebrow').innerHTML = `<span class="pulse-dot"></span> ${esc(team.eyebrow || '')}`;
    if ($('#teamTitle')) $('#teamTitle').innerHTML = `${esc(team.heading_line1 || '')}<br><em>${esc(team.heading_line2 || '')}</em>`;
    setText('#teamLead', team.lead || '');
    if ($('#teamPrev')) $('#teamPrev').setAttribute('aria-label', team.prev_label || 'Предыдущие карточки');
    if ($('#teamNext')) $('#teamNext').setAttribute('aria-label', team.next_label || 'Следующие карточки');
    setText('#teamSwipeLeft', team.swipe_left || '');
    setText('#teamSwipeRight', team.swipe_right || '');
    applySectionTheme('#team', team);

    const process = data.process_section || {};
    setVisible('#process', process.enabled !== false);
    if ($('#processEyebrow')) $('#processEyebrow').innerHTML = `<span class="pulse-dot"></span> ${esc(process.eyebrow || '')}`;
    if ($('#processTitle')) $('#processTitle').innerHTML = `${esc(process.heading_line1 || '')}<br>${esc(process.heading_line2 || '')}<br><em>${esc(process.heading_accent || '')}</em>`;
    setText('#processLead', process.lead || '');
    applySectionTheme('#process', process);

    const prices = data.prices_section || {};
    setVisible('#prices', prices.enabled !== false);
    if ($('#pricesEyebrow')) $('#pricesEyebrow').innerHTML = `<span class="pulse-dot"></span> ${esc(prices.eyebrow || '')}`;
    if ($('#pricesTitle')) $('#pricesTitle').innerHTML = `${esc(prices.heading_line1 || '')}<br><em>${esc(prices.heading_line2 || '')}</em>`;
    setText('#pricesLead', prices.lead || '');
    applySectionTheme('#prices', prices);
  }

  function applyCalculator(config = {}) {
    const calc = $('.calculator');
    if (!calc) return;
    calc.hidden = config.enabled === false;
    setText('#calcHeadLabel', config.head_label || '');
    setText('#calcLiveLabel', config.live_label || '');
    setText('#calcTitle', config.title || '');
    setText('#calcDescription', config.description || '');
    setText('#calcDurationLabel', config.duration_label || '');
    setText('#calcTotalLabel', config.total_label || '');
    setText('#calcCta', config.cta_label || '');
    setText('#calcFootnote', config.footnote || '');
    if (config.background_color) calc.style.background = config.background_color;
    if (config.text_color) calc.style.setProperty('--calc-text', config.text_color);
    const range = $('#hoursRange');
    if (range) {
      range.min = Number(config.min_hours ?? 1);
      range.max = Number(config.max_hours ?? 10);
      range.value = Math.min(Number(range.max), Math.max(Number(range.min), Number(config.default_hours ?? 2)));
    }
    const labels = $$('.range-labels span');
    if (labels[0]) labels[0].textContent = String(config.min_hours ?? 1);
    if (labels[1]) labels[1].textContent = `${config.max_hours ?? 10} ${config.hours_short || 'ч'}`;
  }

  function buildPortfolio(items, labels, section = {}) {
    const toolbar = $('#portfolioToolbar');
    const grid = $('#portfolioGrid');
    items = enabledItems(items);
    if (!toolbar || !grid) return;
    if (!items.length) { toolbar.innerHTML = ''; grid.innerHTML = ''; return; }

    const order = ['event','wedding','business','portrait'];
    const used = new Set(items.map(x => x.category));
    const categories = order.filter(x => used.has(x)).concat([...used].filter(x => !order.includes(x)));
    toolbar.innerHTML = `<button class="filter-btn active" type="button" data-filter="all" role="tab" aria-selected="true">${esc(section.all_label || 'Все работы')}</button>` +
      categories.map(id => `<button class="filter-btn" type="button" data-filter="${esc(id)}" role="tab" aria-selected="false">${esc(labelForCategory(labels,id))}</button>`).join('');

    grid.innerHTML = items.map((item, i) => {
      const sizeClass = item.size === 'wide' ? ' project-wide' : item.size === 'tall' ? ' project-tall' : '';
      return `<article class="project${sizeClass} reveal" data-category="${esc(item.category)}" data-title="${esc(item.title)}" data-index="${i}">
        <button class="project-open" type="button" aria-label="Открыть работу ${esc(item.title)}">
          <img src="${esc(item.image)}" alt="${esc(item.alt || item.title)}" loading="lazy" style="object-position:${esc(item.object_position || 'center center')}">
          <span class="project-overlay"></span>
          <span class="project-meta"><small>${esc(labelForCategory(labels,item.category).toUpperCase())}</small><strong>${esc(item.title)}</strong></span>
          <span class="project-arrow">↗︎</span>
        </button>
      </article>`;
    }).join('');
  }

  function buildServices(items) {
    const list = $('#serviceList');
    if (!list) return;
    items = enabledItems(items);
    list.innerHTML = items.map((item, i) => `<article class="service-row reveal">
      <span class="service-num">${String(i + 1).padStart(2,'0')}</span>
      <div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p></div>
      <div class="service-tags">${(item.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
      <a href="#portfolio" data-service-filter="${esc(item.filter)}" aria-label="Показать ${esc(item.title)} в портфолио">${esc(item.link_label || '↗︎')}</a>
    </article>`).join('');
  }

  function buildProcess(items) {
    const list = $('#processSteps');
    if (!list) return;
    items = enabledItems(items);
    list.innerHTML = items.map((item, i) => `<li class="reveal"><span>${String(i+1).padStart(2,'0')}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.description)}</p></div></li>`).join('');
  }

  function buildPrices(items, section = {}) {
    const cards = $('#priceCards');
    const switcher = $('#calcSwitch');
    items = enabledItems(items);
    const currency = section.currency || '₽';
    const unit = section.unit || 'час';
    if (cards) cards.innerHTML = items.map((item, i) => `<article class="price-card${item.featured ? ' featured' : ''} reveal">
      <div class="price-card-top"><span>${String(i+1).padStart(2,'0')} / ${esc(item.label || item.title)}</span>${item.pill ? `<span class="price-pill">${esc(item.pill)}</span>` : ''}</div>
      <h3>${esc(item.title)}</h3>
      <p>${esc(item.description)}</p>
      <div class="price-value">${formatNumber(item.rate)} <small>${esc(currency)} / ${esc(unit)}</small></div>
      <a class="text-link" href="${esc(item.cta_href || '#contacts')}">${esc(item.cta || 'Обсудить')} <span>↗︎</span></a>
    </article>`).join('');
    if (switcher) switcher.innerHTML = items.map((item, i) => `<button class="calc-plan${i === 0 ? ' active' : ''}" type="button" data-rate="${Number(item.rate || 0)}" data-plan="${esc(item.title)}" aria-pressed="${i === 0 ? 'true' : 'false'}">${esc(item.calculator_label || item.title)}</button>`).join('');
  }

  function buildTeam(items) {
    const rail = $('#teamRail');
    if (!rail) return;
    items = enabledItems(items);
    rail.innerHTML = items.map((item, i) => `<article class="team-card" data-team-index="${i}">
      <figure><img src="${esc(item.image)}" alt="${esc(item.name)} — ${esc(item.role)}" loading="${i === 0 ? 'eager' : 'lazy'}" style="object-position:${esc(item.object_position || 'center center')}"><span>${esc(item.badge || 'CREW')}</span></figure>
      <div class="team-card-copy">
        <div><div><small>${String(i+1).padStart(2,'0')} / ${esc(item.role)}</small><h3>${esc(item.name)}</h3></div></div>
        <p>${esc(item.description || '')}</p>
        <div class="team-tags">${(item.tags || []).map(tag => `<span>#${esc(String(tag).replace(/^#/,''))}</span>`).join('')}</div>
      </div>
    </article>`).join('');
    const total = $('#teamTotal');
    const current = $('#teamCurrent');
    if (total) total.textContent = String(items.length).padStart(2,'0');
    if (current) current.textContent = items.length ? '01' : '00';
  }

  function buildContacts(c = {}) {
    setVisible('#contacts', c.enabled !== false);
    if ($('#contactsEyebrow')) $('#contactsEyebrow').innerHTML = `<span class="pulse-dot"></span> ${esc(c.eyebrow || '')}`;
    if ($('#contactTitle')) $('#contactTitle').innerHTML = `${esc(c.line1 || '')}<br><em>${esc(c.line2 || '')}</em>`;
    setText('#contactLead', c.lead || '');
    const primary = $('#contactPrimary');
    if (primary) { primary.href = c.primary_href || '#'; primary.innerHTML = `${esc(c.primary_label || '')} ↗︎`; }
    const list = $('#contactList');
    if (list) {
      const rows = (c.items || []).map(item => `<a href="${esc(item.href || '#')}"><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong><i>↗︎</i></a>`).join('');
      const copy = c.copy_email ? `<button type="button" class="copy-mail" data-copy="${esc(c.copy_email)}" data-success="${esc(c.copy_success_label || 'E-mail скопирован ✓')}"><span>${esc(c.copy_small_label || 'Быстро')}</span><strong>${esc(c.copy_label || 'Скопировать e-mail')}</strong><i>+</i></button>` : '';
      list.innerHTML = rows + copy;
    }
    setText('#contactFooterLeft', c.footer_left || '');
    setText('#contactFooterRight', c.footer_right || '');
    applySectionTheme('#contacts', c);
    const orb = $('.contact-orb');
    if (orb) {
      orb.hidden = c.background?.show_orb === false;
      if (c.background?.orb_color) orb.style.background = c.background.orb_color;
    }
  }

  function reorderSections(order = []) {
    const main = $('main');
    if (!main || !Array.isArray(order) || !order.length) return;
    const children = [...main.children];
    const used = new Set();
    order.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.parentElement === main) { main.appendChild(el); used.add(el); }
    });
    children.forEach(el => { if (!used.has(el)) main.appendChild(el); });
  }

  function applyContent(data) {
    if (!data) return;
    applySite(data);
    reorderSections(data.site?.layout?.section_order || []);
    applyHeader(data.header || {});
    applyHero(data.hero || {});
    applyTicker(data.ticker || {});
    applySectionCopy(data);
    buildServices(data.services || []);
    buildPortfolio(data.portfolio || [], data.category_labels || {}, data.portfolio_section || {});
    buildTeam(data.team || []);
    buildProcess(data.process || []);
    buildPrices(data.prices || [], data.prices_section || {});
    applyCalculator(data.calculator || {});
    buildContacts(data.contacts || {});
  }

  function bindUI() {
    const body = document.body;
    const header = $('#siteHeader');
    const menuToggle = $('.menu-toggle');
    const mobileMenu = $('#mobileMenu');
    let filterButtons = $$('.filter-btn');
    let projects = $$('.project');
    const lightbox = $('#lightbox');
    const lightboxImage = $('#lightboxImage');
    const lightboxTitle = $('#lightboxTitle');
    const lightboxCategory = $('#lightboxCategory');
    const prevButton = $('.lightbox-prev');
    const nextButton = $('.lightbox-next');
    const closeButton = $('.lightbox-close');
    let calcPlans = $$('.calc-plan');
    const hoursRange = $('#hoursRange');
    const hoursOutput = $('#hoursOutput');
    const calcTotal = $('#calcTotal');
    const calcCta = $('#calcCta');

    $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
    const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 24);
    onScroll(); window.addEventListener('scroll', onScroll, { passive:true });

    const setMenu = open => {
      if (!menuToggle || !mobileMenu) return;
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      mobileMenu.setAttribute('aria-hidden', String(!open));
      mobileMenu.classList.toggle('open', open);
      body.classList.toggle('menu-open', open);
    };
    menuToggle?.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
    mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

    const animationsEnabled = !body.classList.contains('no-animations');
    const observer = animationsEnabled && 'IntersectionObserver' in window ? new IntersectionObserver((entries, obs) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); } }), { threshold:.08, rootMargin:'0px 0px -40px' }) : null;
    $$('.reveal').forEach(el => observer ? observer.observe(el) : el.classList.add('in-view'));

    const applyFilter = filter => {
      filterButtons.forEach(btn => { const on = btn.dataset.filter === filter; btn.classList.toggle('active', on); btn.setAttribute('aria-selected', String(on)); });
      projects.forEach(p => p.classList.toggle('is-hidden', filter !== 'all' && p.dataset.category !== filter));
    };
    filterButtons.forEach(btn => btn.addEventListener('click', () => applyFilter(btn.dataset.filter)));
    $$('[data-hero-filter],[data-service-filter]').forEach(link => link.addEventListener('click', () => {
      const f = link.dataset.heroFilter || link.dataset.serviceFilter;
      setTimeout(() => applyFilter(f), 180);
    }));

    let currentProject = 0;
    const visibleProjects = () => projects.filter(p => !p.classList.contains('is-hidden'));
    const fillLightbox = project => {
      const img = $('img', project); if (!img) return;
      lightboxImage.src = img.currentSrc || img.src; lightboxImage.alt = img.alt || project.dataset.title || '';
      lightboxTitle.textContent = project.dataset.title || ''; lightboxCategory.textContent = labelForCategory(siteData?.category_labels || {}, project.dataset.category || '');
    };
    const showProject = project => {
      const list = visibleProjects(); currentProject = Math.max(0, list.indexOf(project)); fillLightbox(project);
      lightbox?.classList.add('open'); lightbox?.setAttribute('aria-hidden','false'); body.classList.add('lightbox-open'); closeButton?.focus({preventScroll:true});
    };
    const moveProject = delta => { const list = visibleProjects(); if (!list.length) return; currentProject = (currentProject + delta + list.length) % list.length; fillLightbox(list[currentProject]); };
    const closeLightbox = () => { lightbox?.classList.remove('open'); lightbox?.setAttribute('aria-hidden','true'); body.classList.remove('lightbox-open'); };
    projects.forEach(p => $('.project-open', p)?.addEventListener('click', () => showProject(p)));
    prevButton?.addEventListener('click', () => moveProject(-1)); nextButton?.addEventListener('click', () => moveProject(1)); closeButton?.addEventListener('click', closeLightbox);
    lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { if (lightbox?.classList.contains('open')) closeLightbox(); if (mobileMenu?.classList.contains('open')) setMenu(false); }
      if (lightbox?.classList.contains('open')) { if (e.key === 'ArrowLeft') moveProject(-1); if (e.key === 'ArrowRight') moveProject(1); }
    });

    const pricesSection = siteData?.prices_section || {};
    const calcConfig = siteData?.calculator || {};
    const currency = pricesSection.currency || '₽';
    let currentRate = Number(calcPlans[0]?.dataset.rate || 0);
    let currentPlan = calcPlans[0]?.dataset.plan || 'Съёмка';
    const hourWord = n => { const a=n%10,b=n%100; if(a===1&&b!==11)return calcConfig.hour_one || 'час'; if([2,3,4].includes(a)&&![12,13,14].includes(b))return calcConfig.hour_few || 'часа'; return calcConfig.hour_many || 'часов'; };
    const updateCalc = () => {
      const h=Number(hoursRange?.value||1), total=h*currentRate;
      if(hoursOutput)hoursOutput.textContent=`${h} ${hourWord(h)}`;
      if(calcTotal)calcTotal.textContent=`${formatNumber(total)} ${currency}`;
      if(calcCta)calcCta.dataset.summary=`${currentPlan}, ${h} ${hourWord(h)}, около ${formatNumber(total)} ${currency}`;
    };
    calcPlans.forEach(btn => btn.addEventListener('click', () => { currentRate=Number(btn.dataset.rate||0); currentPlan=btn.dataset.plan||'Съёмка'; calcPlans.forEach(o=>{const on=o===btn;o.classList.toggle('active',on);o.setAttribute('aria-pressed',String(on));}); updateCalc(); }));
    hoursRange?.addEventListener('input', updateCalc); updateCalc();

    const copyButton = $('.copy-mail');
    copyButton?.addEventListener('click', async () => {
      const value=copyButton.dataset.copy||'';
      try {
        await navigator.clipboard.writeText(value);
        const strong=$('strong',copyButton),old=strong.textContent;
        strong.textContent=copyButton.dataset.success || 'E-mail скопирован ✓';
        setTimeout(()=>strong.textContent=old,1700);
      } catch { window.location.href=`mailto:${value}`; }
    });

    const teamRail = $('#teamRail');
    const teamPrev = $('.team-prev');
    const teamNext = $('.team-next');
    const teamCurrent = $('#teamCurrent');
    if (teamRail) {
      let dragging = false, startX = 0, startScroll = 0;
      const cards = () => $$('.team-card', teamRail);
      const step = () => { const card = cards()[0]; return card ? card.getBoundingClientRect().width + 18 : 420; };
      const updateTeamCounter = () => {
        const list = cards(); if (!list.length || !teamCurrent) return;
        const railLeft = teamRail.getBoundingClientRect().left;
        let closest = 0, dist = Infinity;
        list.forEach((card, i) => { const d = Math.abs(card.getBoundingClientRect().left - railLeft); if (d < dist) { dist=d; closest=i; } });
        teamCurrent.textContent = String(closest + 1).padStart(2,'0');
      };
      teamPrev?.addEventListener('click', () => teamRail.scrollBy({ left:-step(), behavior:'smooth' }));
      teamNext?.addEventListener('click', () => teamRail.scrollBy({ left:step(), behavior:'smooth' }));
      teamRail.addEventListener('scroll', updateTeamCounter, { passive:true });
      teamRail.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; dragging=true; startX=e.clientX; startScroll=teamRail.scrollLeft; teamRail.classList.add('dragging'); teamRail.setPointerCapture?.(e.pointerId); });
      teamRail.addEventListener('pointermove', e => { if (!dragging) return; teamRail.scrollLeft = startScroll - (e.clientX - startX); });
      const stopDrag = e => { if (!dragging) return; dragging=false; teamRail.classList.remove('dragging'); try { teamRail.releasePointerCapture?.(e.pointerId); } catch {} };
      teamRail.addEventListener('pointerup', stopDrag); teamRail.addEventListener('pointercancel', stopDrag);
      teamRail.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { e.preventDefault(); teamRail.scrollBy({left:-step(),behavior:'smooth'}); } if (e.key === 'ArrowRight') { e.preventDefault(); teamRail.scrollBy({left:step(),behavior:'smooth'}); } });
      updateTeamCounter();
    }

    const cursor = $('.cursor-glow');
    if (cursor && !body.classList.contains('no-cursor-glow') && matchMedia('(pointer:fine)').matches) window.addEventListener('mousemove', e => { cursor.style.left=`${e.clientX}px`; cursor.style.top=`${e.clientY}px`; cursor.style.opacity='1'; }, {passive:true});

    const visual = $('.hero-visual');
    if (visual && animationsEnabled && matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const main=$('.hero-photo-main',visual), small=$('.hero-photo-small',visual);
      visual.addEventListener('mousemove', e => { const r=visual.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5; if(main)main.style.transform=`rotate(3.2deg) translate(${x*8}px, ${y*8}px)`; if(small)small.style.transform=`rotate(-7deg) translate(${x*-10}px, ${y*-10}px)`; });
      visual.addEventListener('mouseleave', () => { if(main)main.style.transform='rotate(3.2deg)'; if(small)small.style.transform='rotate(-7deg)'; });
    }
  }

  (async () => { await loadContent(); bindUI(); })();
})();
