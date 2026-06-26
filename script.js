const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');

menuButton?.addEventListener('click', () => {
  const open = header.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});

document.querySelectorAll('.site-header a').forEach((link) => {
  link.addEventListener('click', () => {
    header.classList.remove('menu-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

const leadEndpoint = String(window.SHAHNMOVE_LEADS_ENDPOINT || '').trim();
const leadStorageKey = 'shahnmove-v1-2-pilot-requests';

const saveLeadBackup = (lead) => {
  const leads = JSON.parse(localStorage.getItem(leadStorageKey) || '[]');
  leads.push(lead);
  localStorage.setItem(leadStorageKey, JSON.stringify(leads));
};

const buildLeadPayload = (form, data) => {
  const params = new URLSearchParams(window.location.search);

  return {
    email: data.email,
    formId: form.id,
    page: window.location.href,
    referrer: document.referrer || '',
    userAgent: navigator.userAgent,
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
    createdAt: new Date().toISOString()
  };
};

document.querySelectorAll('.lead-form').forEach((form) => {
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const lead = buildLeadPayload(form, data);

    saveLeadBackup(lead);
    button.disabled = true;
    button.textContent = 'Sending...';
    status.textContent = 'Sending your request...';

    try {
      if (!leadEndpoint) {
        throw new Error('Lead endpoint is not configured.');
      }

      await fetch(leadEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(lead),
        keepalive: true
      });

      status.textContent = 'Thank you. A manager will be in touch shortly about your free audit.';
      form.reset();
    } catch (error) {
      status.textContent = 'Thank you. Your request was saved locally, but lead capture is not configured yet.';
    } finally {
      button.disabled = false;
      button.textContent = 'Request free audit';
    }
  });
});

document.querySelector('#year').textContent = new Date().getFullYear();

(function () {
  const root = document.documentElement;
  const nodes = document.querySelectorAll('[data-ar]');
  nodes.forEach((n) => { n.dataset.en = n.textContent; });
  const phs = document.querySelectorAll('[data-ar-ph]');
  phs.forEach((n) => { n.dataset.enPh = n.getAttribute('placeholder') || ''; });

  function apply(lang) {
    const ar = lang === 'ar';
    root.lang = ar ? 'ar' : 'en';
    root.classList.toggle('lang-ar', ar);
    nodes.forEach((n) => { n.textContent = ar ? n.dataset.ar : n.dataset.en; });
    phs.forEach((n) => { n.setAttribute('placeholder', ar ? n.dataset.arPh : n.dataset.enPh); });
    document.querySelectorAll('[data-lang-toggle]').forEach((b) => {
      b.textContent = ar ? 'English' : 'العربية';
    });
    try { localStorage.setItem('shahnmove-lang', lang); } catch (e) {}
  }

  let lang = 'en';
  try { lang = localStorage.getItem('shahnmove-lang') || 'en'; } catch (e) {}

  document.querySelectorAll('[data-lang-toggle]').forEach((b) => {
    b.addEventListener('click', () => {
      apply(root.classList.contains('lang-ar') ? 'en' : 'ar');
    });
  });

  apply(lang);
})();
