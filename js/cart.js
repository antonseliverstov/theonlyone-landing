// Корзина без онлайн-оплаты: человек собирает вещи и отправляет заявку,
// а магазину уходит письмо со списком и фото. Отправку письма подключает разработчик: см. README.
(() => {
  "use strict";
  const KEY = "too-cart";
  const DEMO_KEY = "too-demo-order"; // только для демо: письмо для страницы email-preview.html
  const MAX_QTY = 10;
  const SIZES = ["Подскажите, пожалуйста", "42–44", "46–48", "50–52", "54–56", "58 и больше", "Верх и низ разных размеров"];
  const SHOP_PHONE = "+7 967 235-89-69";

  const ui = () => window.TOOUI;
  const track = (event, params) => ui() && ui().track(event, params);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const abs = path => new URL(path, document.baseURI).href;
  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }
  const things = n => `${n} ${plural(n, "вещь", "вещи", "вещей")}`;

  // ---------- состояние ----------
  function load() {
    try {
      const a = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(a) ? a.filter(l => l && TOO.byN[l.n] && l.qty > 0).map(l => ({ n: l.n, qty: Math.min(MAX_QTY, Math.floor(l.qty)) })) : [];
    } catch (e) { return []; }
  }
  let lines = load(); // [{ n, qty }]
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* хранилище недоступно: корзина живёт до перезагрузки */ } };
  const count = () => lines.reduce((s, l) => s + l.qty, 0);
  const total = () => lines.reduce((s, l) => s + TOO.byN[l.n].price * l.qty, 0);
  const has = n => lines.some(l => l.n === n);

  const modal = document.getElementById("cart");
  const box = document.getElementById("cart-box");
  let step = "list"; // list → form → done
  const form = { name: "", phone: "", size: SIZES[0], pickup: "showroom", comment: "", pd: false, ads: false };
  let err = "", sending = false, done = null;

  // ---------- шапка и кнопки «В корзину» ----------
  const button = (n, cls) => `<button class="${cls}${has(n) ? " is-in" : ""}" type="button" data-cart-add="${n}">${has(n) ? "В корзине" : "В корзину"}</button>`;
  function sync() {
    const c = count();
    document.querySelectorAll("[data-cart-count]").forEach(el => { el.textContent = c; el.hidden = c === 0; });
    document.querySelectorAll("[data-cart-open]").forEach(el => el.setAttribute("aria-label", c ? `Корзина: ${things(c)}` : "Корзина"));
    document.querySelectorAll("[data-cart-add]").forEach(b => {
      const on = has(Number(b.dataset.cartAdd));
      b.classList.toggle("is-in", on);
      b.textContent = on ? "В корзине" : "В корзину";
    });
  }

  // ---------- разметка ----------
  function vLine(l) {
    const it = TOO.byN[l.n];
    const sum = l.qty > 1 ? ` × ${l.qty} = ${TOO.money(it.price * l.qty)}` : "";
    return `<li class="ci">
      <img class="ci__img" src="${TOO.img(it)}" alt="">
      <div class="ci__info">
        <p class="ci__name">${esc(it.name)}</p>
        <p class="ci__sub">${esc(it.sub)}</p>
        <p class="ci__price">${TOO.money(it.price)}${it.old ? ` <s>${TOO.money(it.old)}</s>` : ""}${sum}</p>
        <div class="ci__row">
          <div class="qty" role="group" aria-label="Количество: ${esc(it.name)}">
            <button type="button" data-qty="-1" data-line="${it.n}" data-k="m${it.n}" aria-label="Уменьшить"${l.qty <= 1 ? " disabled" : ""}>−</button>
            <span>${l.qty}</span>
            <button type="button" data-qty="1" data-line="${it.n}" data-k="p${it.n}" aria-label="Увеличить"${l.qty >= MAX_QTY ? " disabled" : ""}>+</button>
          </div>
          <button class="ci__del" type="button" data-del="${it.n}" data-k="d${it.n}">Удалить</button>
        </div>
      </div>
    </li>`;
  }
  function vList() {
    if (!lines.length) return `<div class="cart__body cart__empty">
        <p class="cart__lead">В корзине пока пусто</p>
        <p>Добавляйте вещи кнопкой «В корзину» на карточках. Платить на сайте не нужно: мы подтвердим наличие и размер и договоримся о примерке.</p>
        <button class="btn" type="button" data-cart-catalog>Смотреть каталог</button>
        <button class="btn btn--line" type="button" data-quiz>Подобрать образ</button>
      </div>`;
    return `<div class="cart__body"><ul class="cart__list">${lines.map(vLine).join("")}</ul></div>
      <div class="cart__foot">
        <p class="cart__sum"><span>${things(count())}</span><b>${TOO.money(total())}</b></p>
        <p class="cart__note">Платить на сайте не нужно. Менеджер свяжется с вами, подтвердит наличие и размер и договорится о примерке в шоуруме или доставке.</p>
        <button class="btn" type="button" data-cart-step="form" data-k="go">Оформить заявку</button>
      </div>`;
  }
  function vForm() {
    const sizes = SIZES.map(s => `<option${s === form.size ? " selected" : ""}>${esc(s)}</option>`).join("");
    const radio = (v, label) => `<label class="chk"><input type="radio" name="pickup" value="${v}"${form.pickup === v ? " checked" : ""}><span>${label}</span></label>`;
    return `<div class="cart__body">
      <button class="cart__back" type="button" data-cart-step="list">← Вернуться к корзине</button>
      <p class="cart__brief">${things(count())} на ${TOO.money(total())}</p>
      <form class="cart__form" novalidate>
        <label class="fld"><span class="sr">Ваше имя</span><input id="cart-name" type="text" placeholder="Ваше имя" autocomplete="given-name" value="${esc(form.name)}"></label>
        <label class="fld"><span class="sr">Телефон</span><span class="fld__code" aria-hidden="true">+7</span><input id="cart-phone" type="tel" inputmode="tel" placeholder="(000) 000-00-00" autocomplete="tel-national" value="${esc(form.phone)}"></label>
        <label class="fld fld--select"><span class="fld__label">Ваш размер</span><select id="cart-size">${sizes}</select></label>
        <fieldset class="cart__pick"><legend>Как удобнее получить</legend>
          ${radio("showroom", "Примерю и заберу в шоуруме на Казакова, 29")}
          ${radio("delivery", "Нужна доставка — условия уточнит менеджер")}
        </fieldset>
        <label class="fld"><span class="sr">Комментарий</span><textarea id="cart-comment" rows="2" placeholder="Комментарий: удобное время звонка, адрес доставки">${esc(form.comment)}</textarea></label>
        <label class="chk"><input id="cart-pd" type="checkbox"${form.pd ? " checked" : ""}><span>Согласна на обработку персональных данных и с <a href="https://theonlyone1.ru/privacy" target="_blank" rel="noopener">политикой конфиденциальности</a></span></label>
        <label class="chk"><input id="cart-ads" type="checkbox"${form.ads ? " checked" : ""}><span>Хочу получать советы стилиста и предложения THE ONLY ONE</span></label>
        <p class="form-err" id="cart-err" role="alert"${err ? "" : " hidden"}>${esc(err)}</p>
        <button class="btn" type="submit" data-k="send"${sending ? " disabled" : ""}>${sending ? "Отправляем…" : "Отправить заявку"}</button>
        <p class="cart__note">Платить сейчас ничего не нужно. Менеджер свяжется с вами и подтвердит наличие и размер.</p>
      </form>
    </div>`;
  }
  function vDone() {
    const demo = typeof window.TOO_SEND_ORDER !== "function";
    return `<div class="cart__body cart__done">
      <p class="cart__lead">Спасибо${done.name ? ", " + esc(done.name) : ""}!</p>
      <p>Заявка <b>${esc(done.id)}</b> принята: ${things(done.count)} на ${TOO.money(done.total)}. Менеджер позвонит или напишет вам, подтвердит наличие и размер и договорится о ${done.pickup === "delivery" ? "доставке" : "примерке в шоуруме"}.</p>
      <p>Платить сейчас ничего не нужно.</p>
      ${demo ? `<p class="cart__demo">Демо-версия: письмо магазину пока не отправляется. <a href="email-preview.html">Посмотреть, как оно будет выглядеть</a></p>` : ""}
      <button class="btn" type="button" data-cart-catalog>Вернуться к каталогу</button>
    </div>`;
  }
  function render() {
    const active = document.activeElement;
    const keep = active && box.contains(active) ? active.dataset.k : null;
    const title = step === "form" ? "Оформление заявки" : step === "done" ? "Заявка отправлена" : "Корзина";
    box.innerHTML = `<div class="cart__head">
        <h2 class="cart__title" id="cart-title" tabindex="-1">${title}</h2>
        <button class="modal__x cart__x" type="button" data-close aria-label="Закрыть корзину" data-k="x">×</button>
      </div>
      ${step === "done" ? vDone() : step === "form" ? vForm() : vList()}`;
    // после перерисовки возвращаем фокус на ту же кнопку, а если её больше нет — на крестик
    if (keep) (box.querySelector(`[data-k="${keep}"]:not([disabled])`) || box.querySelector(".cart__x")).focus({ preventScroll: true });
  }

  // ---------- письмо магазину ----------
  function letter(o, now) {
    const money = TOO.money;
    const when = now.toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });
    const d = o.phone.slice(2);
    const phone = `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}`;
    const pickup = o.pickup === "delivery" ? "Нужна доставка" : "Примерит и заберёт в шоуруме";
    const subject = `Заявка ${o.id}: ${things(o.count)} на ${money(o.total)}`;
    const row = (k, v) => `<tr><td style="padding:4px 18px 4px 0;color:#7a6f66;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:4px 0;color:#3d3630">${v}</td></tr>`;
    const items = o.items.map(i => `<tr>
      <td style="width:96px;padding:14px 16px 14px 0;border-top:1px solid #ddd3c8;vertical-align:top"><a href="${esc(i.url)}"><img src="${esc(i.image)}" width="96" alt="${esc(i.name)}" style="display:block;width:96px;height:auto;border:0;border-radius:6px"></a></td>
      <td style="padding:14px 0;border-top:1px solid #ddd3c8;vertical-align:top">
        <div style="font-size:15px;color:#3d3630">${esc(i.name)}</div>
        <div style="margin-top:2px;font-size:12px;color:#7a6f66">${esc(i.category)} · <a href="${esc(i.url)}" style="color:#a85c3e">товар во ВКонтакте</a></div>
        <div style="margin-top:8px;font-size:14px;color:#3d3630">${money(i.price)} × ${i.qty} = <b>${money(i.sum)}</b></div>
      </td></tr>`).join("");
    const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:24px 12px;background:#f7f2ec;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff">
<tr><td style="padding:22px 28px;background:#3d3630;color:#f7f2ec;font-family:Georgia,serif;font-size:20px;letter-spacing:1px">THE ONLY ONE</td></tr>
<tr><td style="padding:28px">
  <div style="font-family:Georgia,serif;font-size:24px;color:#3d3630">Новая заявка из корзины</div>
  <div style="margin-top:4px;font-size:13px;color:#7a6f66">${esc(o.id)} · ${esc(when)} (МСК)</div>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;font-size:14px;line-height:1.45">
    ${row("Имя", esc(o.name || "не указано"))}
    ${row("Телефон", `<a href="tel:${esc(o.phone)}" style="color:#a85c3e">${phone}</a>`)}
    ${row("Размер", esc(o.size))}
    ${row("Получение", pickup)}
    ${o.comment ? row("Комментарий", esc(o.comment).replace(/\n/g, "<br>")) : ""}
    ${row("Рассылка", o.consent_ads ? "согласна получать советы и предложения" : "без рассылки")}
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">${items}
    <tr><td colspan="2" style="padding:16px 0 0;border-top:2px solid #3d3630;font-size:16px;color:#3d3630;text-align:right">Итого: <b>${money(o.total)}</b></td></tr>
  </table>
  <p style="margin:24px 0 0;padding:14px 16px;background:#faf7f2;font-size:13px;line-height:1.5;color:#3d3630">Оплата на сайте не принималась. Свяжитесь с клиенткой, чтобы подтвердить наличие, размер и способ получения.</p>
</td></tr></table></body></html>`;
    const text = [
      `Новая заявка из корзины THE ONLY ONE — ${o.id}, ${when} (МСК)`,
      `Имя: ${o.name || "не указано"}`, `Телефон: ${phone}`, `Размер: ${o.size}`, `Получение: ${pickup}`,
      o.comment ? `Комментарий: ${o.comment}` : "", `Рассылка: ${o.consent_ads ? "да" : "нет"}`, "",
      ...o.items.map((i, k) => `${k + 1}. ${i.name} (${i.category}) — ${money(i.price)} × ${i.qty} = ${money(i.sum)}\n   Фото: ${i.image}\n   ВКонтакте: ${i.url}`),
      "", `Итого: ${money(o.total)}`, "Оплата на сайте не принималась."
    ].filter((s, k, a) => s !== "" || a[k - 1] !== "").join("\n");
    return { subject, html, text };
  }
  function buildOrder(digits) {
    const now = new Date();
    const p2 = x => String(x).padStart(2, "0");
    const id = `TOO-${p2(now.getFullYear() % 100)}${p2(now.getMonth() + 1)}${p2(now.getDate())}-${Math.floor(Math.random() * 9000) + 1000}`;
    const items = lines.map(l => {
      const it = TOO.byN[l.n];
      return { n: it.n, vk_id: it.id, name: it.name, category: it.sub, price: it.price, old_price: it.old || null, qty: l.qty, sum: it.price * l.qty, image: abs(TOO.img(it)), url: TOO.vkUrl(it) };
    });
    const order = {
      source: "cart", id, created_at: now.toISOString(),
      name: form.name.trim(), phone: "+7" + digits, size: form.size, pickup: form.pickup, comment: form.comment.trim(), consent_ads: form.ads,
      items, count: count(), total: total(), page: location.origin + location.pathname
    };
    order.email = letter(order, now);
    return order;
  }

  // ---------- действия ----------
  function open() {
    if (step === "done" || !lines.length) step = "list";
    err = "";
    ui().closeMenu();
    document.getElementById("toast").hidden = true; // иначе уведомление закрывает кнопку «Оформить заявку»
    document.querySelectorAll(".modal").forEach(m => { if (m !== modal) ui().closeModal(m); });
    render();
    ui().openModal(modal);
    track("cart_open", { items: count(), total: total() });
  }
  function addItem(n) {
    const it = TOO.byN[n];
    if (!it) return;
    lines.push({ n, qty: 1 });
    save();
    sync();
    track("cart_add", { item: n, name: it.name, price: it.price });
    ui().toast(`«${it.name}» в корзине`, { label: "Открыть корзину", run: open });
  }
  function setQty(n, delta) {
    const l = lines.find(x => x.n === n);
    if (!l) return;
    l.qty = Math.max(1, Math.min(MAX_QTY, l.qty + delta));
    save(); sync(); render();
  }
  function remove(n) {
    lines = lines.filter(l => l.n !== n);
    save(); sync(); render();
    track("cart_remove", { item: n });
  }
  function go(to) {
    step = to;
    err = "";
    if (to === "form") track("cart_checkout", { items: count(), total: total() });
    render();
    box.querySelector(".cart__title").focus({ preventScroll: true });
  }
  function showErr(msg, field) {
    err = msg;
    const el = box.querySelector("#cart-err");
    el.textContent = msg;
    el.hidden = !msg;
    if (field) box.querySelector(field).focus();
  }
  async function submit() {
    if (sending) return;
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length !== 10) return showErr("Введите номер телефона полностью — 10 цифр после +7.", "#cart-phone");
    if (!form.pd) return showErr("Отметьте согласие на обработку персональных данных.", "#cart-pd");
    const order = buildOrder(digits);
    sending = true;
    err = "";
    render();
    try {
      // TOO_SEND_ORDER может вернуть Promise: пока он не выполнится, кнопка показывает «Отправляем…»
      if (typeof window.TOO_SEND_ORDER === "function") await window.TOO_SEND_ORDER(order);
      else { try { sessionStorage.setItem(DEMO_KEY, JSON.stringify({ subject: order.email.subject, html: order.email.html })); } catch (e) { /* хранилище недоступно */ } }
    } catch (e) {
      sending = false;
      err = `Не получилось отправить заявку. Попробуйте ещё раз или позвоните нам: ${SHOP_PHONE}.`;
      render();
      return;
    }
    track("order_submit", { order: order.id, items: order.count, total: order.total, consent_ads: order.consent_ads });
    done = order;
    sending = false;
    lines = [];
    save();
    sync();
    Object.assign(form, { comment: "", pd: false, ads: false });
    step = "done";
    render();
    box.querySelector(".cart__title").focus({ preventScroll: true });
  }

  box.addEventListener("click", e => {
    const t = e.target;
    const q = t.closest("[data-qty]");
    if (q) { setQty(Number(q.dataset.line), Number(q.dataset.qty)); return; }
    const del = t.closest("[data-del]");
    if (del) { remove(Number(del.dataset.del)); return; }
    const st = t.closest("[data-cart-step]");
    if (st) { go(st.dataset.cartStep); return; }
    if (t.closest("[data-cart-catalog]")) {
      ui().closeModal(modal);
      document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
    }
  });
  box.addEventListener("input", e => {
    const t = e.target;
    if (t.id === "cart-phone") { ui().maskPhone(t); form.phone = t.value; }
    else if (t.id === "cart-name") form.name = t.value;
    else if (t.id === "cart-comment") form.comment = t.value;
  });
  box.addEventListener("change", e => {
    const t = e.target;
    if (t.id === "cart-size") form.size = t.value;
    else if (t.name === "pickup") form.pickup = t.value;
    else if (t.id === "cart-pd") { form.pd = t.checked; if (t.checked && err) showErr(""); }
    else if (t.id === "cart-ads") form.ads = t.checked;
  });
  box.addEventListener("submit", e => { e.preventDefault(); submit(); });

  // кнопки «В корзину» на карточках и в окне товара, иконка корзины в шапке
  document.addEventListener("click", e => {
    const add = e.target.closest("[data-cart-add]");
    if (add) {
      const n = Number(add.dataset.cartAdd);
      if (has(n)) open(); else addItem(n);
      return;
    }
    if (e.target.closest("[data-cart-open]")) open();
  });

  window.TOOCart = { has, button, sync, open };
  sync();
})();
