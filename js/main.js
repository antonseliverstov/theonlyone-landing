// Каталог, всплывающие окна, меню и форма записи.
(() => {
  "use strict";
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const FAV_KEY = "too-favorites";
  const PAGE = 12; // сколько товаров общего каталога видно до «Показать все»

  // ---------- аналитика: события уходят в dataLayer (Метрика / пиксель VK подключаются к нему) ----------
  window.dataLayer = window.dataLayer || [];
  const track = (event, params = {}) => window.dataLayer.push({ event, ...params });

  // ---------- избранное ----------
  const loadFav = () => { try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]")); } catch (e) { return new Set(); } };
  const favs = loadFav();
  const saveFav = () => { try { localStorage.setItem(FAV_KEY, JSON.stringify([...favs])); } catch (e) { /* хранилище недоступно */ } };
  function syncFavCount() {
    $$("[data-fav-count]").forEach(el => { el.textContent = favs.size; el.hidden = favs.size === 0; });
  }

  // ---------- карточки ----------
  function card(it) {
    const fav = favs.has(it.n);
    const disc = it.old ? Math.round((1 - it.price / it.old) * 100) : 0;
    return `<article class="card" data-n="${it.n}">
      <button class="card__media" type="button" data-open="${it.n}" aria-label="${it.name}, подробнее">
        <img src="${TOO.img(it)}" alt="${it.name}" loading="lazy">
        ${disc ? `<span class="card__badge">−${disc}%</span>` : ""}
      </button>
      <button class="card__fav" type="button" data-fav="${it.n}" aria-pressed="${fav}" aria-label="${fav ? "Убрать из избранного" : "В избранное"}"><svg aria-hidden="true"><use href="#i-heart"/></svg></button>
      <button class="card__title" type="button" data-open="${it.n}">${it.name}</button>
      <p class="card__descr">${it.sub}</p>
      <p class="card__price">${TOO.money(it.price)}${it.old ? `<span class="card__old">${TOO.money(it.old)}</span>` : ""}</p>
      <a class="btn btn--card card__buy" href="${TOO.vkUrl(it)}" target="_blank" rel="noopener" data-buy="${it.n}">Купить</a>
    </article>`;
  }
  const promo = `<div class="card card--promo">
      <p>Ещё больше моделей — в шоуруме</p>
      <span>Стилист подберёт вещи под ваш размер и задачу и соберёт из них образы.</span>
      <button class="btn btn--card" type="button" data-quiz>Подобрать образ</button>
    </div>`;

  // ---------- общий каталог ----------
  const state = { tab: "all", expanded: false };
  const catalogGrid = $('[data-grid="catalog"]');
  const moreBtn = $("[data-more]");
  function catalogItems() {
    if (state.tab === "new") return TOO.items.filter(it => it.isNew);
    if (state.tab === "sale") return TOO.items.filter(it => it.old);
    if (state.tab === "fav") return TOO.items.filter(it => favs.has(it.n));
    return TOO.items;
  }
  function renderCatalog() {
    const list = catalogItems();
    const visible = state.expanded || state.tab !== "all" ? list : list.slice(0, PAGE);
    catalogGrid.innerHTML = visible.length ? visible.map(card).join("")
      : `<p class="store__empty">${state.tab === "fav" ? "Нажмите на сердечко на карточке — вещь появится здесь." : "Здесь пока пусто."}</p>`;
    moreBtn.parentElement.hidden = visible.length >= list.length;
    moreBtn.textContent = `Показать все товары (${list.length})`;
    $$(".tab").forEach(t => t.setAttribute("aria-selected", String(t.dataset.tab === state.tab)));
  }
  function setTab(tab) {
    state.tab = tab;
    renderCatalog();
    track("catalog_filter", { tab });
  }

  // ---------- разделы ----------
  function renderSection(cat) {
    const grid = $(`[data-grid="${cat}"]`);
    const list = TOO.items.filter(it => it.cat === cat);
    grid.innerHTML = list.map(card).join("") + (list.length < 4 ? promo : "");
  }
  function renderAll() {
    renderCatalog();
    ["dresses", "outerwear", "tops"].forEach(renderSection);
    syncFavCount();
  }

  // ---------- всплывающие окна ----------
  let lastFocus = null;
  function openModal(el) {
    if (!el.hidden) return;
    lastFocus = document.activeElement;
    el.hidden = false;
    document.body.classList.add("is-locked");
    const f = el.querySelector("[data-autofocus], .modal__x");
    if (f) f.focus();
  }
  function closeModal(el) {
    if (el.hidden) return;
    el.hidden = true;
    if (!$$(".modal").some(m => !m.hidden)) document.body.classList.remove("is-locked");
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  function openProduct(n) {
    const it = TOO.byN[n];
    if (!it) return;
    $("#pm-img").src = TOO.img(it);
    $("#pm-img").alt = it.name;
    $("#pm-cat").textContent = it.sub;
    $("#pm-title").textContent = it.name;
    $("#pm-price").innerHTML = TOO.money(it.price) + (it.old ? ` <span class="card__old">${TOO.money(it.old)}</span>` : "");
    $("#pm-desc").textContent = it.desc || TOO.defaultDesc;
    $("#pm-buy").href = TOO.vkUrl(it);
    $("#pm-buy").dataset.buy = it.n;
    openModal($("#product-modal"));
    track("product_view", { item: it.n, name: it.name });
  }
  let toastTimer = null;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3800);
  }
  window.TOOUI = { openModal, closeModal, openProduct, toast, track };

  // ---------- меню ----------
  const burger = $(".hdr__burger");
  const mnav = $("#mnav");
  function setMenu(open) {
    mnav.hidden = !open;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    document.body.classList.toggle("is-locked", open);
  }
  burger.addEventListener("click", () => setMenu(mnav.hidden));
  $$(".hdr__droptgl").forEach(btn => btn.addEventListener("click", () => {
    const drop = btn.parentElement;
    const open = !drop.classList.contains("is-open");
    $$(".hdr__drop").forEach(d => { d.classList.remove("is-open"); d.querySelector(".hdr__droptgl").setAttribute("aria-expanded", "false"); });
    drop.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
  }));
  document.addEventListener("click", e => {
    if (!e.target.closest(".hdr__drop")) $$(".hdr__drop.is-open").forEach(d => { d.classList.remove("is-open"); d.querySelector(".hdr__droptgl").setAttribute("aria-expanded", "false"); });
  });
  const hdr = $(".hdr");
  const onScroll = () => hdr.classList.toggle("is-scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- общие клики ----------
  document.addEventListener("click", e => {
    const t = e.target;
    const quiz = t.closest("[data-quiz]");
    if (quiz) {
      e.preventDefault();
      if (!mnav.hidden) setMenu(false);
      closeModal($("#product-modal"));
      window.TOOQuiz && window.TOOQuiz.open(quiz.closest("section, header, footer, .modal")?.id || "page");
      return;
    }
    const tabLink = t.closest("[data-tab]");
    if (tabLink) {
      if (tabLink.classList.contains("tab")) { setTab(tabLink.dataset.tab); return; }
      setTab(tabLink.dataset.tab);
    }
    if (t.closest("[data-show-fav]")) {
      setTab("fav");
      $("#catalog").scrollIntoView({ behavior: "smooth" });
      return;
    }
    const fav = t.closest("[data-fav]");
    if (fav) {
      const n = Number(fav.dataset.fav);
      if (favs.has(n)) favs.delete(n); else { favs.add(n); track("favorite_add", { item: n }); }
      saveFav();
      $$(`[data-fav="${n}"]`).forEach(b => { b.setAttribute("aria-pressed", String(favs.has(n))); b.setAttribute("aria-label", favs.has(n) ? "Убрать из избранного" : "В избранное"); });
      syncFavCount();
      if (state.tab === "fav") renderCatalog();
      return;
    }
    const open = t.closest("[data-open]");
    if (open) { openProduct(Number(open.dataset.open)); return; }
    const buy = t.closest("[data-buy]");
    if (buy) track("buy_click", { item: Number(buy.dataset.buy) });
    if (t.closest("[data-more]")) { state.expanded = true; renderCatalog(); return; }
    const close = t.closest("[data-close]");
    if (close) {
      // ссылка на форму записи закрывает все окна, иначе форма останется под квизом
      if (close.getAttribute("href") === "#form") $$(".modal").forEach(closeModal);
      else closeModal(close.closest(".modal"));
      return;
    }
    if (t.classList.contains("modal") && t.id === "product-modal") closeModal(t);
    if (!mnav.hidden && t.closest("#mnav a")) setMenu(false);
  });
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const open = $$(".modal").filter(m => !m.hidden).pop();
    if (open) closeModal(open);
    else if (!mnav.hidden) setMenu(false);
  });

  // ---------- форма записи ----------
  const form = $("#lead-form");
  const phoneInput = $("#lead-phone");
  phoneInput.addEventListener("input", () => {
    const d = phoneInput.value.replace(/\D/g, "").replace(/^[78](?=\d{10})/, "").slice(0, 10);
    const p = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)];
    phoneInput.value = d.length > 3 ? `(${p[0]}) ${p[1]}${d.length > 6 ? "-" + p[2] : ""}${d.length > 8 ? "-" + p[3] : ""}` : d;
  });
  form.addEventListener("submit", e => {
    e.preventDefault();
    const err = $("#lead-err");
    const digits = phoneInput.value.replace(/\D/g, "");
    let msg = "";
    if (digits.length !== 10) msg = "Введите номер телефона полностью — 10 цифр после +7.";
    else if (!$("#lead-pd").checked) msg = "Отметьте согласие на обработку персональных данных.";
    err.textContent = msg;
    err.hidden = !msg;
    if (msg) return;
    const lead = { source: "site_form", name: $("#lead-name").value.trim(), phone: "+7" + digits, consent_ads: $("#lead-ads").checked };
    // Отправку в CRM или бот подключает разработчик: см. README, раздел «Что подключить».
    track("lead_form", { consent_ads: lead.consent_ads });
    if (typeof window.TOO_SEND_LEAD === "function") window.TOO_SEND_LEAD(lead);
    form.querySelectorAll("input, button").forEach(el => { el.disabled = true; });
    $("#lead-ok").hidden = false;
  });

  renderAll();
})();
