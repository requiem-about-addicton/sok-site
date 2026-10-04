(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = (v = '') => String(v).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const formatNumber = n => new Intl.NumberFormat('ru-RU').format(Number(n || 0));
  const labelForCategory = (labels, id) => labels?.[id] || id || '';
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

  function applyContent(data) {
    if (!data) return;
    if (data.site?.title) document.title = data.site.title;
    const meta = $('meta[name="description"]');
    if (meta && data.site?.description) meta.content = data.site.description;

    const colors = data.site?.colors || {};
    const root = document.documentElement.style;
    if (colors.forest) root.setProperty('--forest', colors.forest);
    if (colors.lime) root.setProperty('--lime', colors.lime);
    if (colors.cream) root.setProperty('--cream', colors.cream);
    if (colors.ink) root.setProperty('--ink', colors.ink);

    $$('.brand').forEach(el => {
      const brand = esc(data.site?.brand || 'СОК');
      el.innerHTML = `${brand}<span>.</span>`;
    });

    const hero = data.hero || {};
    if ($('#heroEyebrow')) $('#heroEyebrow').innerHTML = `<span class="pulse-dot"></span> ${esc(hero.eyebrow || '')}`;
    if ($('#heroTitle')) $('#heroTitle').innerHTML = `${esc(hero.line1 || '')}<br>${esc(hero.line2 || '')}<br><em>${esc(hero.line3 || '')}</em>`;
    if ($('#heroLead')) $('#heroLead').textContent = hero.lead || '';
    if ($('#heroMainImage') && hero.main_image) $('#heroMainImage').src = hero.main_image;
    if ($('#heroSmallImage') && hero.small_image) $('#heroSmallImage').src = hero.small_image;

    buildPortfolio(data.portfolio || [], data.category_labels || {});
    buildServices(data.services || []);
    buildProcess(data.process || []);
    buildPrices(data.prices || []);
    buildContacts(data.contacts || {});
  }

  function buildPortfolio(items, labels) {
    const toolbar = $('#portfolioToolbar');
    const grid = $('#portfolioGrid');
    if (!toolbar || !grid || !items.length) return;

    const order = ['event','wedding','business','portrait'];
    const used = new Set(items.map(x => x.category));
    const categories = order.filter(x => used.has(x)).concat([...used].filter(x => !order.includes(x)));
    toolbar.innerHTML = `<button class="filter-btn active" type="button" data-filter="all" role="tab" aria-selected="true">Все работы</button>` +
      categories.map(id => `<button class="filter-btn" type="button" data-filter="${esc(id)}" role="tab" aria-selected="false">${esc(labelForCategory(labels,id))}</button>`).join('');

    grid.innerHTML = items.map((item, i) => {
      const sizeClass = item.size === 'wide' ? ' project-wide' : item.size === 'tall' ? ' project-tall' : '';
      return `<article class="project${sizeClass} reveal" data-category="${esc(item.category)}" data-title="${esc(item.title)}" data-index="${i}">
        <button class="project-open" type="button" aria-label="Открыть работу ${esc(item.title)}">
          <img src="${esc(item.image)}" alt="${esc(item.alt || item.title)}" loading="lazy">
          <span class="project-overlay"></span>
          <span class="project-meta"><small>${esc(labelForCategory(labels,item.category).toUpperCase())}</small><strong>${esc(item.title)}</strong></span>
          <span class="project-arrow">↗</span>
        </button>
      </article>`;
    }).join('');
  }

  function buildServices(items) {
    const list = $('#serviceList');
    if (!list || !items.length) return;
    list.innerHTML = items.map((item, i) => `<article class="service-row reveal">
      <span class="service-num">${String(i + 1).padStart(2,'0')}</span>
      <div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p></div>
      <div class="service-tags">${(item.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
      <a href="#portfolio" data-service-filter="${esc(item.filter)}" aria-label="Показать ${esc(item.title)} в портфолио">↗</a>
    </article>`).join('');
  }

  function buildProcess(items) {
    const list = $('#processSteps');
    if (!list || !items.length) return;
    list.innerHTML = items.map((item, i) => `<li class="reveal"><span>${String(i+1).padStart(2,'0')}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.description)}</p></div></li>`).join('');
  }

  function buildPrices(items) {
    const cards = $('#priceCards');
    const switcher = $('#calcSwitch');
    if (!items.length) return;
    if (cards) cards.innerHTML = items.map((item, i) => `<article class="price-card${item.featured ? ' featured' : ''} reveal">
      <div class="price-card-top"><span>${String(i+1).padStart(2,'0')} / ${esc(item.label || item.title)}</span><span class="price-pill">${esc(item.pill || '')}</span></div>
      <h3>${esc(item.title)}</h3>
      <p>${esc(item.description)}</p>
      <div class="price-value">${formatNumber(item.rate)} <small>₽ / час</small></div>
      <a class="text-link" href="#contacts">${esc(item.cta || 'Обсудить')} <span>↗</span></a>
    </article>`).join('');
    if (switcher) switcher.innerHTML = items.map((item, i) => `<button class="calc-plan${i === 0 ? ' active' : ''}" type="button" data-rate="${Number(item.rate || 0)}" data-plan="${esc(item.title)}" aria-pressed="${i === 0 ? 'true' : 'false'}">${esc(item.title === 'Фото + видео' ? 'Combo' : item.title)}</button>`).join('');
  }

  function buildContacts(c) {
    if ($('#contactTitle')) $('#contactTitle').innerHTML = `${esc(c.line1 || '')}<br><em>${esc(c.line2 || '')}</em>`;
    if ($('#contactLead')) $('#contactLead').textContent = c.lead || '';
    const primary = $('#contactPrimary');
    if (primary) { primary.href = c.primary_href || '#'; primary.innerHTML = `${esc(c.primary_label || 'Написать')} ↗`; }
    const list = $('#contactList');
    if (list) {
      const rows = (c.items || []).map(item => `<a href="${esc(item.href || '#')}"><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong><i>↗</i></a>`).join('');
      const copy = c.copy_email ? `<button type="button" class="copy-mail" data-copy="${esc(c.copy_email)}"><span>Быстро</span><strong>Скопировать e-mail</strong><i>+</i></button>` : '';
      list.innerHTML = rows + copy;
    }
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

    const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries, obs) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); } }), { threshold:.08, rootMargin:'0px 0px -40px' }) : null;
    $$('.reveal').forEach(el => observer ? observer.observe(el) : el.classList.add('in-view'));

    let activeFilter = 'all';
    const applyFilter = filter => {
      activeFilter = filter;
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
      lightboxTitle.textContent = project.dataset.title || ''; lightboxCategory.textContent = project.dataset.category || '';
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

    let currentRate = Number(calcPlans[0]?.dataset.rate || 0);
    let currentPlan = calcPlans[0]?.dataset.plan || 'Съёмка';
    const hourWord = n => { const a=n%10,b=n%100; if(a===1&&b!==11)return'час'; if([2,3,4].includes(a)&&![12,13,14].includes(b))return'часа'; return'часов'; };
    const updateCalc = () => { const h=Number(hoursRange?.value||1), total=h*currentRate; if(hoursOutput)hoursOutput.textContent=`${h} ${hourWord(h)}`; if(calcTotal)calcTotal.textContent=`${formatNumber(total)} ₽`; if(calcCta)calcCta.dataset.summary=`${currentPlan}, ${h} ${hourWord(h)}, около ${formatNumber(total)} ₽`; };
    calcPlans.forEach(btn => btn.addEventListener('click', () => { currentRate=Number(btn.dataset.rate||0); currentPlan=btn.dataset.plan||'Съёмка'; calcPlans.forEach(o=>{const on=o===btn;o.classList.toggle('active',on);o.setAttribute('aria-pressed',String(on));}); updateCalc(); }));
    hoursRange?.addEventListener('input', updateCalc); updateCalc();

    const copyButton = $('.copy-mail');
    copyButton?.addEventListener('click', async () => { const value=copyButton.dataset.copy||''; try { await navigator.clipboard.writeText(value); const strong=$('strong',copyButton),old=strong.textContent; strong.textContent='E-mail скопирован ✓'; setTimeout(()=>strong.textContent=old,1700); } catch { window.location.href=`mailto:${value}`; } });

    const cursor = $('.cursor-glow');
    if (cursor && matchMedia('(pointer:fine)').matches) window.addEventListener('mousemove', e => { cursor.style.left=`${e.clientX}px`; cursor.style.top=`${e.clientY}px`; cursor.style.opacity='1'; }, {passive:true});

    const visual = $('.hero-visual');
    if (visual && matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const main=$('.hero-photo-main',visual), small=$('.hero-photo-small',visual);
      visual.addEventListener('mousemove', e => { const r=visual.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5; main.style.transform=`rotate(3.2deg) translate(${x*8}px, ${y*8}px)`; small.style.transform=`rotate(-7deg) translate(${x*-10}px, ${y*-10}px)`; });
      visual.addEventListener('mouseleave', () => { main.style.transform='rotate(3.2deg)'; small.style.transform='rotate(-7deg)'; });
    }
  }

  (async () => { await loadContent(); bindUI(); })();
})();
