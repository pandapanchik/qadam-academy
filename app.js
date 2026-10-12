(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The 3D scene marks the page ready mid-assembly; this is the fallback if WebGL or the CDN fails.
  setTimeout(() => root.classList.add('is-ready'), reduceMotion ? 0 : 3200);

  /* ---------- Courses ---------- */
  const courses = [
    {
      id: 'frontend', name: 'Frontend', title: 'Frontend dasturchi',
      length: '7 oy', format: 'Haftasiga 3 ta dars va 2 ta amaliyot', price: 'oyiga 1 290 000 so’m',
      modules: [
        ['HTML, CSS va moslashuvchan maket', '4 hafta', 'Telefonda ham, kompyuterda ham to’g’ri ko’rinadigan landing sahifa'],
        ['JavaScript va API bilan ishlash', '6 hafta', 'Ob-havo va valyuta kursini real API’dan oladigan ilova'],
        ['React', '6 hafta', 'Savatcha va filtrlari bor onlayn do’kon interfeysi'],
        ['TypeScript va Next.js', '5 hafta', 'Admin paneli bor, internetga joylangan blog-platforma'],
        ['Jamoaviy loyiha', '7 hafta', 'Real buyurtmachi uchun ilova: Git tarixi va code review bilan'],
      ],
    },
    {
      id: 'backend', name: 'Python Backend', title: 'Python backend dasturchi',
      length: '8 oy', format: 'Haftasiga 3 ta dars va 2 ta amaliyot', price: 'oyiga 1 390 000 so’m',
      modules: [
        ['Python asoslari', '5 hafta', 'Shaxsiy xarajatlarni hisoblaydigan konsol dastur'],
        ['SQL va ma’lumotlar bazasi', '5 hafta', 'O’quv markaz uchun ma’lumotlar bazasi va so’rovlar to’plami'],
        ['Django va REST API', '8 hafta', 'Mobil ilova uchun buyurtmalar API’si, hujjatlari bilan'],
        ['Docker va deploy', '5 hafta', 'Serverda to’xtovsiz ishlaydigan, avtomatik yangilanadigan servis'],
        ['Telegram bot va sun’iy intellekt', '9 hafta', 'LLM API orqali mijozlar savollariga javob beradigan Telegram bot'],
      ],
    },
    {
      id: 'design', name: 'UI/UX dizayn', title: 'UI/UX dizayner',
      length: '5 oy', format: 'Haftasiga 3 ta dars va 1 ta amaliyot', price: 'oyiga 1 190 000 so’m',
      modules: [
        ['Kompozitsiya, rang va tipografika', '4 hafta', 'Bitta brend uchun 3 ta poster va ijtimoiy tarmoq to’plami'],
        ['Figma', '4 hafta', 'Yetkazib berish ilovasining 12 ekranli maketi'],
        ['UX tadqiqot', '4 hafta', '5 ta foydalanuvchi intervyusi va topilmalar hisoboti'],
        ['Dizayn tizim', '4 hafta', 'Tugma, forma va kartochkalarning barcha holatlari bor komponentlar kutubxonasi'],
        ['Keys-stadi', '4 hafta', 'Behance’da 2 ta to’liq keysdan iborat portfolio'],
      ],
    },
    {
      id: 'data', name: 'AI va Data', title: 'Data analitik va AI muhandis',
      length: '9 oy', format: 'Haftasiga 3 ta dars va 2 ta amaliyot', price: 'oyiga 1 590 000 so’m',
      modules: [
        ['Python va Pandas', '6 hafta', 'Savdo ma’lumotlarini tozalab, tahlil qilingan hisobot'],
        ['Statistika va vizualizatsiya', '6 hafta', 'Kompaniya rahbariyati uchun interaktiv dashbord'],
        ['Machine learning', '9 hafta', 'Toshkentdagi kvartira narxini bashorat qiluvchi model'],
        ['LLM ilovalar', '7 hafta', 'Kompaniya hujjatlari bo’yicha savollarga javob beradigan AI-assistent'],
        ['Bitiruv loyihasi', '8 hafta', 'Hamkor kompaniyaning real ma’lumotlari ustida tadqiqot'],
      ],
    },
  ];

  const tablist = document.querySelector('.tabs');
  const panel = document.getElementById('course-panel');
  const select = document.getElementById('f-course');

  tablist.innerHTML = courses.map((c, i) =>
    `<button class="tab" type="button" role="tab" id="tab-${c.id}" aria-controls="course-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-id="${c.id}">${c.name}</button>`
  ).join('');

  select.innerHTML = '<option value="">Hali bilmayman, maslahat kerak</option>' +
    courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  function showCourse(id, animate) {
    const c = courses.find(x => x.id === id);
    tablist.querySelectorAll('.tab').forEach(t => {
      const on = t.dataset.id === id;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    panel.innerHTML = `
      <div class="course__meta">
        <h3>${c.title}</h3>
        <dl>
          <div><dt>Davomiyligi</dt><dd>${c.length}</dd></div>
          <div><dt>Format</dt><dd>${c.format}</dd></div>
          <div><dt>Narxi</dt><dd>${c.price}</dd></div>
        </dl>
        <a class="btn btn--primary" href="#ariza" data-course="${c.id}">Shu yo’nalishga yozilish</a>
      </div>
      <ol class="modules">
        ${c.modules.map(([name, weeks, out], i) => `
          <li style="--n:${i}">
            <span class="modules__n">${i + 1}</span>
            <div>
              <h4>${name}</h4>
              <p class="modules__weeks">${weeks}</p>
              <p class="modules__out">${out}</p>
            </div>
          </li>`).join('')}
      </ol>`;
    panel.classList.remove('is-switching');
    if (animate) { void panel.offsetWidth; panel.classList.add('is-switching'); }
  }

  tablist.addEventListener('click', e => {
    const tab = e.target.closest('.tab');
    if (tab) showCourse(tab.dataset.id, true);
  });
  tablist.addEventListener('keydown', e => {
    const tabs = [...tablist.querySelectorAll('.tab')];
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const tab = tabs[(next + tabs.length) % tabs.length];
    tab.focus();
    showCourse(tab.dataset.id, true);
  });
  document.addEventListener('click', e => {
    const link = e.target.closest('[data-course]');
    if (link) select.value = link.dataset.course;
  });
  showCourse(courses[0].id, false);

  /* ---------- Countdown ---------- */
  const START = new Date('2026-11-03T09:00:00+05:00');
  const countdown = document.querySelector('[data-countdown]');
  const units = Object.fromEntries([...countdown.querySelectorAll('[data-unit]')].map(el => [el.dataset.unit, el]));
  const pad = n => String(n).padStart(2, '0');
  let timer;
  function tick() {
    const ms = START - Date.now();
    if (ms <= 0) {
      clearInterval(timer);
      countdown.innerHTML = '<p class="countdown__done">Noyabr guruhi boshlandi. Keyingi guruhga hozirdan yoziling.</p>';
      return;
    }
    units.d.textContent = pad(Math.floor(ms / 864e5));
    units.h.textContent = pad(Math.floor(ms / 36e5) % 24);
    units.m.textContent = pad(Math.floor(ms / 6e4) % 60);
    units.s.textContent = pad(Math.floor(ms / 1e3) % 60);
  }
  tick();
  timer = setInterval(tick, 1000);

  /* ---------- Lead form ---------- */
  const form = document.getElementById('lead-form');
  const success = document.getElementById('lead-success');
  const phone = form.elements.phone;
  const digits = v => v.replace(/\D/g, '').replace(/^998(?=\d{9})/, '').slice(0, 9);
  const formatPhone = d => [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');

  phone.addEventListener('input', () => { phone.value = formatPhone(digits(phone.value)); });

  function setError(name, msg) {
    const input = form.elements[name];
    form.querySelector(`[data-error-for="${name}"]`).textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    const tel = digits(phone.value);
    const okName = setError('name', name.length >= 2 ? '' : 'Ismingizni yozing, shunda sizga murojaat qila olamiz.');
    const okPhone = setError('phone', tel.length === 9 ? '' : 'Raqam 9 ta raqamdan iborat bo’lishi kerak, masalan 90 123 45 67.');
    if (!okName) return form.elements.name.focus();
    if (!okPhone) return phone.focus();

    // Lead yuborish: backend yoki Telegram bot ulanganda shu yerda fetch() bilan yuboriladi.
    const lead = { name, phone: `+998${tel}`, course: form.elements.course.value };
    console.info('Yangi ariza', lead);

    form.hidden = true;
    success.hidden = false;
    success.querySelector('[data-success-text]').textContent =
      `Rahmat, ${name}! Ish vaqtida 15 daqiqa ichida +998 ${formatPhone(tel)} raqamiga qo’ng’iroq qilib, sinov darsi vaqtini kelishib olamiz.`;
    success.querySelector('h3').focus();
  });

  /* ---------- Header and mobile CTA ---------- */
  const head = document.querySelector('.site-head');
  const onScroll = () => head.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const bar = document.querySelector('.mobile-cta');
  const hero = document.getElementById('top');
  const offer = document.getElementById('ariza');
  const seen = new Map();
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => seen.set(en.target, en.isIntersecting));
    bar.classList.toggle('is-visible', !seen.get(hero) && !seen.get(offer));
  });
  io.observe(hero);
  io.observe(offer);
})();
