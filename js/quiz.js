// Квиз «Ваш стилевой тип» по ТЗ из стратегии: 8 вопросов, подсчёт типа, результат с закрытым гидом.
// Открывается всеми кнопками «Подобрать образ» (атрибут data-quiz).
(() => {
  "use strict";

  // ---------- что настроить перед запуском (см. README) ----------
  const CONFIG = {
    // Диалог с сообществом VK; ref и ref_source видны в сообщениях сообщества и в Senler/боте.
    vkDialog: type => `https://vk.me/${TOO.vkScreenName}?ref=quiz_${type}&ref_source=site`,
    // Имя Telegram-бота без @. Пока бота нет — кнопка Telegram не показывается.
    telegramBot: null,
    // Последний размер в наличии, например "54–56". Пока не задан, ветка «размера нет» выключена.
    maxSizeInStock: null
  };
  const MIX_MIN = 4; // второй тип должен набрать не меньше 4 баллов, чтобы результат стал смешанным

  const ORDER = ["leader", "esthete", "muse", "traveler", "rebel", "creator"];
  const OCC = { work: "На работу", weekend: "На выходной", evening: "На выход" };
  const OCC_ORDER = ["work", "weekend", "evening"];

  // Шесть типов: тексты, палитры и образы из каталога (номера товаров из js/data.js).
  const T = {
    leader: {
      name: "Лидер", gen: "Лидера", dat: "Лидеру", tag: "Современная классика",
      about: "Вам идёт структура: чёткое плечо, прямые линии, плотные ткани. Вы выглядите собранно и при этом не строго, если заменить офисный чёрный глубокими цветами.",
      word: "Собранная и уверенная", line: "Вам важно выглядеть собранной и уверенной",
      week: "Офис и переговоры", weekLine: "офис и переговоры", occ: "work",
      q1: 34, coat: 4, q1cap: "Чёрный тренч, широкие джинсы и блуза с розовым бантом", coatCap: "Длинное тёмно-серое пальто прямого кроя", looks: { work: 12, weekend: 34, evening: 3 },
      warm: [["кэмел", "#C19A6B"], ["шоколад", "#5C3A21"], ["молочный", "#F1E9DC"], ["бордо", "#7A1F2B"]],
      cool: [["тёмно-синий", "#1F2A44"], ["графит", "#3B3F45"], ["белый", "#FFFFFF"], ["изумруд", "#1F6B54"]],
      base: [["тёмно-синий", "#1F2A44"], ["графит", "#3B3F45"], ["молочный", "#F1E9DC"], ["кэмел", "#C19A6B"]],
      black: "Вместо чёрного: тёмно-синий или шоколад.",
      avoid: ["Костюм на размер больше, «чтобы не обтягивал»", "Чёрное с головы до ног", "Жёсткие плечи из 90-х", "Блузы с рюшами и крупными бантами", "Бесформенные трикотажные платья-мешки"]
    },
    esthete: {
      name: "Эстет", gen: "Эстета", dat: "Эстету", tag: "Тихая роскошь",
      about: "Вам идут спокойные цвета, мягкие ткани и образы в одной гамме. Роскошь для вас — это качество ткани и точная посадка.",
      word: "Утончённая, со вкусом", line: "Вам важно, чтобы образ говорил о вкусе",
      week: "Деловые встречи и мероприятия, где важно впечатление", weekLine: "деловые встречи и мероприятия", occ: "work",
      q1: 16, coat: 21, q1cap: "Бежевое трикотажное платье и твидовый жакет в тон", coatCap: "Короткая шубка песочного цвета", looks: { work: 13, weekend: 21, evening: 16 },
      warm: [["молочный", "#F1E9DC"], ["песочный", "#D8C3A5"], ["карамель", "#B5835A"], ["какао", "#6B4F3F"]],
      cool: [["серо-бежевый", "#A39B8F"], ["светло-серый", "#CFCFCF"], ["пыльно-голубой", "#9DB4C0"], ["графит", "#3B3F45"]],
      base: [["молочный", "#F1E9DC"], ["серо-бежевый", "#A39B8F"], ["какао", "#6B4F3F"], ["графит", "#3B3F45"]],
      black: "Вместо чёрного: какао или графит.",
      avoid: ["Крупные логотипы и стразы", "Больше трёх цветов в одном образе", "Блестящая синтетика", "Крупные пёстрые принты", "Заметная дешёвая фурнитура"]
    },
    muse: {
      name: "Муза", gen: "Музы", dat: "Музе", tag: "Мягкая женственность",
      about: "Вам идут плавные линии, подчёркнутая талия и ткани, которые двигаются вместе с вами. Женственность без рюш и «кукольности».",
      word: "Женственная и мягкая", line: "Вам важно чувствовать себя женственной и мягкой",
      week: "Театр, ужины, встречи с подругами", weekLine: "театр, ужины и встречи с подругами", occ: "evening",
      q1: 6, coat: 5, q1cap: "Розовый джемпер и коричневая юбка с поясом", coatCap: "Короткое пальто с запахом и поясом", looks: { work: 14, weekend: 6, evening: 18 },
      warm: [["персиковый", "#F2B8A0"], ["пыльный коралл", "#D98476"], ["молочный", "#F1E9DC"], ["мокко", "#7B5B4C"]],
      cool: [["пудровый", "#E8C5C8"], ["лавандовый", "#B9A7C9"], ["серо-голубой", "#9FB1C1"], ["ягодный", "#8E2F4F"]],
      base: [["молочный", "#F1E9DC"], ["мокко", "#7B5B4C"], ["пудровый", "#E8C5C8"], ["серо-голубой", "#9FB1C1"]],
      black: "Вместо чёрного: мокко или ягодный.",
      avoid: ["Бесформенный кардиган до колена", "Жёсткие ткани, которые стоят коробом", "Рюши и банты в каждом образе", "Мешковатые брюки без линии талии", "Строгие костюмы без мягкой детали"]
    },
    traveler: {
      name: "Путешественница", gen: "Путешественницы", dat: "Путешественнице", tag: "Натуральный шик",
      about: "Вам идут свобода и натуральные фактуры: трикотаж, шерсть, деним. Образ удобный и при этом собранный.",
      word: "Лёгкая и естественная", line: "Вам важно, чтобы было легко и естественно",
      week: "Прогулки, поездки, дача", weekLine: "прогулки, поездки и дача", occ: "weekend",
      q1: 29, coat: 30, q1cap: "Голубые джинсы, розовый топ и светлая куртка-рубашка", coatCap: "Джинсовый тренч свободного кроя", looks: { work: 10, weekend: 29, evening: 27 },
      warm: [["оливковый", "#6B6F3A"], ["хаки", "#8A7F5A"], ["терракота", "#B5603E"], ["песочный", "#D8C3A5"]],
      cool: [["серый меланж", "#A7A9AC"], ["джинсовый синий", "#4A6A8A"], ["хвойный", "#2F4A3E"], ["молочный", "#F1E9DC"]],
      base: [["оливковый", "#6B6F3A"], ["серый меланж", "#A7A9AC"], ["джинсовый синий", "#4A6A8A"], ["песочный", "#D8C3A5"]],
      black: "Вместо чёрного: хвойный или графитовый меланж.",
      avoid: ["Спортивный костюм вместо одежды", "Вытянутый трикотаж", "«Удобное» на два размера больше", "Тесные вещи, которые сковывают движение", "Блестящие нарядные ткани на каждый день"]
    },
    rebel: {
      name: "Бунтарка", gen: "Бунтарки", dat: "Бунтарке", tag: "Яркий акцент",
      about: "Вам идут контраст и характер: графичные линии, насыщенный цвет, одна заметная вещь в образе. В тихих бежевых оттенках вы теряетесь.",
      word: "Яркая, с характером", line: "Вам нравится, когда в образе есть характер",
      week: "Праздники, выступления, всё, где я на виду", weekLine: "праздники и выступления", occ: "evening",
      q1: 31, coat: 25, q1cap: "Красная рубашка, белые брюки и платок на поясе", coatCap: "Ярко-розовое пальто", looks: { work: 2, weekend: 20, evening: 31 },
      warm: [["томатный", "#D1442F"], ["тыквенный", "#D9752B"], ["тёплый изумруд", "#1E7A5A"], ["шоколад", "#5C3A21"]],
      cool: [["кобальт", "#1F4FB4"], ["фуксия", "#C2257A"], ["изумруд", "#00855F"], ["чёрно-белый", "bw"]],
      base: [["изумруд", "#00855F"], ["кобальт", "#1F4FB4"], ["томатный", "#D1442F"], ["чёрно-белый", "bw"]],
      black: "Чёрный — только в паре с белым или ярким.",
      avoid: ["Пастель с головы до ног", "Три акцента в одном образе", "Мелкие «милые» принты", "Бесформенные вещи тусклых оттенков", "Россыпь мелких украшений"]
    },
    creator: {
      name: "Творец", gen: "Творца", dat: "Творцу", tag: "Свободный творческий стиль",
      about: "Вам идут необычный крой, фактуры и слои. Вы выглядите интересно, когда в образе есть деталь, о которой хочется спросить.",
      word: "Интересная, не как все", line: "Вам важно выглядеть интересно и по-своему",
      week: "Творческая работа, выставки, мастерские", weekLine: "творческая работа и выставки", occ: "weekend",
      q1: 28, coat: 33, q1cap: "Жёлтые джинсы, белый топ и голубая рубашка с узлом", coatCap: "Чёрная кожаная косуха", looks: { work: 32, weekend: 28, evening: 33 },
      warm: [["горчичный", "#C9A227"], ["кирпичный", "#9E4A35"], ["табачный", "#8B6A3E"], ["тёплый бирюзовый", "#2A9D8F"]],
      cool: [["индиго", "#2E3A6E"], ["сливовый", "#6B3A5B"], ["морская волна", "#1D6F7A"], ["графит", "#3B3F45"]],
      base: [["индиго", "#2E3A6E"], ["горчичный", "#C9A227"], ["сливовый", "#6B3A5B"], ["табачный", "#8B6A3E"]],
      black: "Вместо чёрного: индиго или сливовый.",
      avoid: ["Строгие комплекты «как у всех»", "Классика без единой детали", "Образы из соцсетей один в один", "Гладкий минимализм без фактур", "Вещи «на всякий случай», которые вам скучны"]
    }
  };

  const Q4 = [
    { id: "warmLight", label: "Тёплые светлые", sub: "молочный, персиковый, карамель", colors: ["#F1E9DC", "#F2B8A0", "#B5835A"], types: ["muse", "esthete"], pal: "warm", line: "Комплименты вам чаще делают в светлых тёплых оттенках" },
    { id: "warmDeep", label: "Тёплые насыщенные", sub: "терракота, горчица, оливка", colors: ["#B5603E", "#C9A227", "#6B6F3A"], types: ["traveler", "creator"], pal: "warm", line: "Комплименты вам чаще делают в насыщенных тёплых оттенках" },
    { id: "coolSoft", label: "Холодные мягкие", sub: "серо-голубой, лаванда, пудровый", colors: ["#9FB1C1", "#B9A7C9", "#E8C5C8"], types: ["esthete", "muse"], pal: "cool", line: "Комплименты вам чаще делают в мягких холодных оттенках" },
    { id: "coolBright", label: "Холодные яркие", sub: "кобальт, изумруд, фуксия", colors: ["#1F4FB4", "#00855F", "#C2257A"], types: ["rebel", "leader"], pal: "cool", line: "Комплименты вам чаще делают в ярких холодных цветах" },
    { id: "black", label: "Ношу чёрное и серое, других не помню", colors: ["#1C1A1B", "#5E5B5D", "#A9A6A8"], types: ["leader"], pal: null, tag: "ловушка чёрного", line: "Сейчас вы чаще носите чёрное и серое, с этого и начнём" },
    { id: "none", label: "Не замечала", colors: [], types: [], pal: null, line: "Свою гамму вы пока не замечали, ориентир подскажем" }
  ];
  const Q4BY = Object.fromEntries(Q4.map(o => [o.id, o]));
  const Q6 = [
    { id: "A", seg: "А", label: "Много работы и встреч, хочу выглядеть статусно, но не скучно" },
    { id: "B", seg: "Б", label: "Тело изменилось, и любимые вещи сидят уже не так" },
    { id: "V", seg: "В", label: "Появилось время на себя, хочу понять, какая я сейчас" },
    { id: "G", seg: "Г", label: "Начинается новый этап: работа, переезд, отношения" },
    { id: "D", seg: "Д", label: "Хочу одеваться современно и удобно, а не «как положено»" },
    { id: "X", seg: "общий", label: "Ничего особенного, хочу обновить гардероб" }
  ];
  const Q7 = [
    { id: "waist", label: "Талию" },
    { id: "legs", label: "Ноги" },
    { id: "shoulders", label: "Плечи и шею" },
    { id: "face", label: "Лицо, чтобы взгляд шёл к нему" },
    { id: "nofit", label: "Ничего не подчёркивать, лишь бы не обтягивало и не висело" },
    { id: "unsure", label: "Пока не знаю, пусть подскажет стилист" }
  ];
  const Q8 = [
    { id: "s42", label: "42–44" }, { id: "s46", label: "46–48" }, { id: "s50", label: "50–52" },
    { id: "s54", label: "54–56" }, { id: "s58", label: "58 и больше" }, { id: "mix", label: "Верх и низ разных размеров" }
  ];
  const QUESTIONS = [
    { id: "q1", kind: "photos", pick: k => T[k].q1, cap: k => T[k].q1cap, title: "Суббота, встреча с подругой в городе. Какой образ вы бы надели?" },
    { id: "q2", kind: "text", title: "Какие слова о себе вам было бы приятнее всего услышать?", options: ORDER.map(k => ({ id: k, label: T[k].word })) },
    { id: "q3", kind: "photos", pick: k => T[k].coat, cap: k => T[k].coatCap, title: "Какую верхнюю вещь вы бы забрали домой?" },
    { id: "q4", kind: "palette", title: "В каких цветах вам чаще всего делают комплименты?" },
    { id: "q5", kind: "text", multi: 2, title: "Где проходит ваша обычная неделя?", hint: "Можно выбрать два ответа", options: ORDER.map(k => ({ id: k, label: T[k].week })) },
    { id: "q6", kind: "text", title: "Что сейчас происходит в вашей жизни?", options: Q6 },
    { id: "q7", kind: "text", multi: 2, title: "Что в своей фигуре хочется подчеркнуть?", hint: "Можно выбрать два ответа", options: Q7 },
    { id: "q8", kind: "text", compact: true, title: "Какой размер вы обычно носите?", options: Q8 }
  ];

  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const modal = document.getElementById("quiz");
  const root = document.getElementById("quiz-root");
  const ui = () => window.TOOUI;
  const track = (event, params) => ui() && ui().track(event, params);
  const item = n => TOO.byN[n];

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }

  // ---------- подсчёт типа ----------
  function scores(a) {
    const s = {};
    ORDER.forEach(k => { s[k] = 0; });
    ["q1", "q2", "q3"].forEach(q => { if (a[q]) s[a[q]] += 2; });
    ((Q4BY[a.q4] || {}).types || []).forEach(k => { s[k] += 1; });
    (a.q5 || []).forEach(k => { s[k] += 1; });
    return s;
  }
  function tieBreak(cands, a) {
    if (cands.length === 1) return cands[0];
    for (const q of ["q2", "q3", "q1"]) if (cands.includes(a[q])) return a[q];
    return cands[0];
  }
  function compute(a) {
    const s = scores(a);
    const top = Math.max(...ORDER.map(k => s[k]));
    const main = tieBreak(ORDER.filter(k => s[k] === top), a);
    const rest = ORDER.filter(k => k !== main);
    const runner = Math.max(...rest.map(k => s[k]));
    const second = runner >= MIX_MIN && s[main] - runner <= 2 ? tieBreak(rest.filter(k => s[k] === runner), a) : null;
    const firstOcc = T[(a.q5 && a.q5[0]) || main].occ;
    const occs = [firstOcc].concat(OCC_ORDER.filter(o => o !== firstOcc));
    let looks = occs.map(o => ({ type: main, occ: o, n: T[main].looks[o] }));
    if (second) looks = [looks[0], looks[1], { type: second, occ: firstOcc, n: T[second].looks[firstOcc] }];
    const q4 = Q4BY[a.q4];
    const size = Q8.find(o => o.id === a.q8);
    const sizeOut = !!CONFIG.maxSizeInStock && a.q8 === "s58";
    return { s, main, second, pal: q4.pal, q4, looks, size, sizeOut, seg: Q6.find(o => o.id === a.q6), tags: q4.tag ? [q4.tag] : [] };
  }

  // ---------- состояние ----------
  const fresh = () => ({ screen: "intro", i: 0, answers: {}, order: { q1: shuffle(ORDER), q3: shuffle(ORDER) }, result: null, unlocked: false, channel: null, consentPd: false, consentAds: false, phoneOpen: false, err: "", lock: false, from: "page" });
  let state = fresh();

  // ---------- разметка ----------
  const sw = c => `<span class="qz-sw" style="background:${c === "bw" ? "linear-gradient(135deg,#151515 0 50%,#FAFAFA 50% 100%)" : c}"></span>`;
  const tick = multi => `<span class="qz-tick${multi ? " qz-tick--sq" : ""}" aria-hidden="true"></span>`;

  function vIntro() {
    const pics = ["muse", "leader", "traveler"].map(k => `<img src="${TOO.img(item(T[k].q1))}" alt="" loading="lazy">`).join("");
    return `<div class="qz-screen qz-intro">
      <p class="label">Подбор образа</p>
      <h2 class="qz-h" tabindex="-1" data-focus>Какой у вас стилевой тип?</h2>
      <p class="qz-lead">8 вопросов, около 90 секунд. Тип покажем сразу, а полный гид — палитру-ориентир, ещё два образа из коллекции и вещи, которые пора отпустить, — откроем, когда оставите контакт.</p>
      <div class="qz-collage" aria-hidden="true">${pics}</div>
      <button class="btn" type="button" data-q="start">Начать</button>
    </div>`;
  }

  function vQuestion() {
    const q = QUESTIONS[state.i], n = state.i + 1, sel = state.answers[q.id];
    let body;
    if (q.kind === "photos") {
      body = `<div class="qz-photos">${state.order[q.id].map(k => {
        const it = item(q.pick(k));
        return `<button type="button" class="qz-photo" data-pick="${k}" aria-pressed="${sel === k}"><span class="qz-photo__img"><img src="${TOO.img(it)}" alt="" loading="lazy"><span class="qz-check" aria-hidden="true"></span></span><span class="qz-photo__cap">${q.cap(k)}</span></button>`;
      }).join("")}</div>`;
    } else if (q.kind === "palette") {
      body = `<div class="qz-opts">${Q4.map(o => `<button type="button" class="qz-opt qz-opt--pal" data-pick="${o.id}" aria-pressed="${sel === o.id}">
          <span class="qz-sws">${o.colors.length ? o.colors.map(sw).join("") : `<span class="qz-sw qz-sw--empty">?</span>`}</span>
          <span class="qz-opt__txt"><span>${o.label}</span>${o.sub ? `<small>${o.sub}</small>` : ""}</span>${tick(false)}</button>`).join("")}</div>`;
    } else {
      body = `<div class="qz-opts${q.compact ? " qz-opts--2" : ""}">${q.options.map(o => {
        const on = q.multi ? (sel || []).includes(o.id) : sel === o.id;
        return `<button type="button" class="qz-opt" data-pick="${o.id}" aria-pressed="${on}"><span class="qz-opt__txt">${o.label}</span>${tick(q.multi)}</button>`;
      }).join("")}</div>`;
    }
    const canNext = !!(q.multi && sel && sel.length);
    return `<div class="qz-screen">
      <div class="qz-prog" role="progressbar" aria-label="Пройдено вопросов" aria-valuemin="0" aria-valuemax="${QUESTIONS.length}" aria-valuenow="${n - 1}"><span style="width:${(n - 1) / QUESTIONS.length * 100}%"></span></div>
      <div class="qz-meta"><button type="button" class="qz-back" data-q="back">← Назад</button><span>Вопрос ${n} из ${QUESTIONS.length}</span></div>
      <h2 class="qz-h" tabindex="-1" data-focus>${q.title}</h2>
      ${q.hint ? `<p class="qz-hint">${q.hint}</p>` : ""}
      ${body}
      ${q.multi ? `<button type="button" class="btn qz-next" data-q="next"${canNext ? "" : " disabled"}>Дальше</button>` : ""}
    </div>`;
  }

  function lookCard(L, idx, small) {
    const it = item(L.n);
    const from = L.type !== state.result.main ? ` · ${T[L.type].name}` : "";
    return `<article class="qz-look${small ? " qz-look--sm" : ""}">
      <button type="button" class="qz-look__img" data-product="${it.n}" aria-label="${it.name}, подробнее"><img src="${TOO.img(it)}" alt="" loading="lazy"></button>
      <div class="qz-look__txt">
        <p class="qz-eyebrow">Образ ${idx} из 3 · ${OCC[L.occ]}${from}</p>
        <p class="qz-look__name">${it.name}</p>
        <p class="qz-look__price">${TOO.money(it.price)}${it.old ? ` <s>${TOO.money(it.old)}</s>` : ""}</p>
        <button type="button" class="qz-link" data-product="${it.n}">Смотреть вещь</button>
      </div>
    </article>`;
  }

  function guide(R) {
    const M = T[R.main];
    const pal = R.pal ? M[R.pal] : M.base;
    return `<div class="qz-guide">
      <div class="qz-gsec"><p class="qz-eyebrow">Ещё 2 образа</p><div class="qz-looks2">${lookCard(R.looks[1], 2, true)}${lookCard(R.looks[2], 3, true)}</div></div>
      <div class="qz-gsec"><p class="qz-eyebrow">Палитра-ориентир · ${R.pal ? (R.pal === "warm" ? "тёплая" : "холодная") : "базовая"}</p>
        <div class="qz-pal">${pal.map(p => `<figure>${sw(p[1])}<figcaption>${p[0]}</figcaption></figure>`).join("")}</div>
        <p class="qz-note">${M.black}${R.pal ? "" : " Тёплая у вас гамма или холодная, стилист покажет при дневном свете."}</p></div>
      <div class="qz-gsec"><p class="qz-eyebrow">Что ${M.dat} пора отпустить</p><ol class="qz-avoid">${M.avoid.map(x => `<li>${x}</li>`).join("")}</ol></div>
    </div>`;
  }

  function vGate(R) {
    const M = T[R.main];
    const tg = CONFIG.telegramBot ? `<a class="btn" href="https://t.me/${CONFIG.telegramBot}?start=quiz_${R.main}" target="_blank" rel="noopener" data-gate="tg">Получить в Telegram</a>` : "";
    const phone = state.phoneOpen ? `<form class="qz-phone" data-phone-form novalidate>
        <label class="fld"><span class="sr">Ваше имя</span><input id="qz-name" type="text" placeholder="Ваше имя" autocomplete="given-name"></label>
        <label class="fld"><span class="sr">Телефон</span><span class="fld__code" aria-hidden="true">+7</span><input id="qz-phone" type="tel" inputmode="tel" placeholder="(000) 000-00-00" autocomplete="tel-national"></label>
        <button class="btn" type="submit">Открыть гид</button>
      </form>` : "";
    return `<section class="qz-gate" id="qz-gate">
      <h3 class="qz-h3">Откройте полный гид</h3>
      <p class="qz-text">Палитра-ориентир, ещё два образа из коллекции и пять вещей, которые ${M.dat} пора отпустить. Бесплатно, отписаться можно одной кнопкой.</p>
      <label class="chk"><input type="checkbox" id="qz-pd"${state.consentPd ? " checked" : ""}><span>Согласна на обработку персональных данных и с <a href="https://theonlyone1.ru/privacy" target="_blank" rel="noopener">политикой конфиденциальности</a></span></label>
      <label class="chk"><input type="checkbox" id="qz-ads"${state.consentAds ? " checked" : ""}><span>Хочу получать советы стилиста и предложения THE ONLY ONE</span></label>
      <p class="form-err" id="qz-err" role="alert"${state.err ? "" : " hidden"}>${state.err}</p>
      <div class="qz-gate__btns">
        <a class="btn" href="${CONFIG.vkDialog(R.main)}" target="_blank" rel="noopener" data-gate="vk">Получить во ВКонтакте</a>
        ${tg}
        <button class="btn btn--line" type="button" data-q="phone" aria-expanded="${state.phoneOpen}">Удобнее по телефону</button>
      </div>
      ${phone}
    </section>`;
  }

  function vResult() {
    const R = state.result, a = state.answers, M = T[R.main];
    const title = R.second ? `Ваш тип — ${M.name} с нотами ${T[R.second].gen}` : `Ваш стилевой тип — ${M.name}`;
    const lines = [T[a.q2].line, R.q4.line, `Ваша неделя: ${a.q5.map(k => T[k].weekLine).join("; ")}`];
    const doneNote = state.channel === "vk"
      ? "Гид открыт ниже. Во ВКонтакте открылся диалог с нами: напишите «Гид» — стилист ответит и поможет с записью."
      : state.channel === "tg" ? "Гид открыт ниже и придёт в Telegram." : "Спасибо! Гид открыт ниже, а стилист свяжется с вами по телефону.";
    const guideBlock = state.unlocked
      ? `<section class="qz-open" id="qz-guide"><p class="qz-ok" role="status">${doneNote}</p>${guide(R)}</section>`
      : `<section class="qz-locked"><div class="qz-blur" aria-hidden="true" inert>${guide(R)}</div>
          <div class="qz-veil"><p class="qz-veil__t">Ещё 2 образа, палитра-ориентир и 5 вещей, которые ${M.dat} пора отпустить</p><button class="btn" type="button" data-q="to-gate">Открыть полный гид</button></div></section>`;
    const bridge = R.sizeOut
      ? `<section class="qz-bridge"><h3 class="qz-h3">Подберём модели вашего размера</h3><p class="qz-text">Сейчас в шоуруме размеры до ${CONFIG.maxSizeInStock}. Оставьте контакт — напишем, когда появятся вещи вашего размера.</p></section>`
      : `<section class="qz-bridge"><p class="qz-text">Тип показывает направление. Какие оттенки и фасоны идут именно вам, стилист покажет вживую, при дневном свете.</p>
          <h3 class="qz-h3">Что вам идёт сейчас — за 90 минут</h3>
          <p class="qz-text">Личная встреча со стилистом в шоуруме на Казакова, 29. 1 990 ₽ целиком идут в зачёт покупки, покупать не обязательно.</p>
          <a class="btn" href="#form" data-q="book">Записаться к стилисту</a></section>`;
    return `<div class="qz-screen qz-res">
      <p class="label">Ваш результат</p>
      <h2 class="qz-h" tabindex="-1" data-focus>${title}</h2>
      <p class="qz-tag">${M.tag}</p>
      <p class="qz-text">${M.about}</p>
      <div class="qz-answers"><p class="qz-eyebrow">По вашим ответам</p><ul>${lines.map(l => `<li>${l}</li>`).join("")}</ul></div>
      ${lookCard(R.looks[0], 1, false)}
      ${guideBlock}
      ${state.unlocked ? "" : vGate(R)}
      ${bridge}
      <div class="qz-again"><button class="qz-link" type="button" data-q="restart">Пройти тест заново</button></div>
    </div>`;
  }

  function render(focus = true) {
    root.innerHTML = state.screen === "q" ? vQuestion() : state.screen === "result" ? vResult() : vIntro();
    if (focus) {
      modal.querySelector(".qz").scrollTop = 0;
      const h = root.querySelector("[data-focus]");
      if (h) h.focus({ preventScroll: true });
    }
  }

  // ---------- действия ----------
  function start() {
    const from = state.from;
    state = fresh();
    state.from = from;
    state.screen = "q";
    track("quiz_start", { from });
    render();
  }
  function pick(v) {
    if (state.lock) return;
    const q = QUESTIONS[state.i];
    if (q.multi) {
      const arr = (state.answers[q.id] || []).slice();
      const at = arr.indexOf(v);
      if (at >= 0) arr.splice(at, 1); else { arr.push(v); if (arr.length > q.multi) arr.shift(); }
      state.answers[q.id] = arr;
      render(false);
      const b = root.querySelector(`[data-pick="${v}"]`);
      if (b) b.focus({ preventScroll: true });
      return;
    }
    state.answers[q.id] = v;
    state.lock = true;
    render(false);
    setTimeout(() => { state.lock = false; next(); }, reduce ? 60 : 260);
  }
  function next() {
    const q = QUESTIONS[state.i], a = state.answers[q.id];
    if (q.multi ? !(a && a.length) : !a) return;
    track("quiz_answer", { question: q.id, answer: Array.isArray(a) ? a.join("+") : a });
    if (state.i < QUESTIONS.length - 1) { state.i += 1; render(); return; }
    state.result = compute(state.answers);
    state.screen = "result";
    const R = state.result;
    track("quiz_complete", { type: R.main, second: R.second || "", segment: R.seg.seg, size: R.size.label, palette: R.pal || "none" });
    render();
  }
  function back() {
    if (state.i === 0) state.screen = "intro"; else state.i -= 1;
    render();
  }
  function consentError() {
    state.err = "Отметьте согласие на обработку персональных данных, чтобы открыть гид.";
    const er = root.querySelector("#qz-err");
    if (er) { er.textContent = state.err; er.hidden = false; }
    const cb = root.querySelector("#qz-pd");
    if (cb) { cb.focus({ preventScroll: true }); cb.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }); }
  }
  function unlock(channel, contact) {
    const R = state.result;
    state.unlocked = true;
    state.channel = channel;
    state.phoneOpen = false;
    const lead = {
      source: "quiz", channel, type: R.main, second: R.second, palette: R.pal, segment: R.seg.seg, size: R.size.label,
      figure: state.answers.q7, week: state.answers.q5, consent_ads: state.consentAds, ...contact
    };
    track("quiz_lead", { channel, type: R.main, consent_ads: state.consentAds });
    // Отправку контакта в CRM или бот подключает разработчик: см. README, раздел «Что подключить».
    if (typeof window.TOO_SEND_LEAD === "function") window.TOO_SEND_LEAD(lead);
    render(false);
    const g = root.querySelector("#qz-guide");
    if (g) g.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }
  function maskPhone(input) {
    const d = input.value.replace(/\D/g, "").replace(/^[78](?=\d{10})/, "").slice(0, 10);
    const p = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)];
    input.value = d.length > 3 ? `(${p[0]}) ${p[1]}${d.length > 6 ? "-" + p[2] : ""}${d.length > 8 ? "-" + p[3] : ""}` : d;
  }

  root.addEventListener("click", e => {
    const t = e.target;
    const product = t.closest("[data-product]");
    if (product) { ui().openProduct(Number(product.dataset.product)); return; }
    const gate = t.closest("[data-gate]");
    if (gate) {
      if (!state.consentPd) { e.preventDefault(); consentError(); return; }
      // ссылка открывает мессенджер в новой вкладке, гид сразу открываем и на сайте
      setTimeout(() => unlock(gate.dataset.gate, {}), 0);
      return;
    }
    const pk = t.closest("[data-pick]");
    if (pk) { pick(pk.dataset.pick); return; }
    const act = t.closest("[data-q]");
    if (!act) return;
    switch (act.dataset.q) {
      case "start": start(); break;
      case "back": back(); break;
      case "next": next(); break;
      case "restart": state = fresh(); state.screen = "q"; track("quiz_start", { from: "restart" }); render(); break;
      case "to-gate": { const g = root.querySelector("#qz-gate"); if (g) g.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" }); break; }
      case "phone": state.phoneOpen = !state.phoneOpen; render(false); { const f = root.querySelector("#qz-name"); if (f) f.focus(); } break;
      case "book": e.preventDefault(); track("quiz_book_click", { type: state.result.main }); ui().closeModal(modal); document.getElementById("form").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); break;
    }
  });
  root.addEventListener("change", e => {
    if (e.target.id === "qz-pd") {
      state.consentPd = e.target.checked;
      if (state.consentPd && state.err) { state.err = ""; const er = root.querySelector("#qz-err"); if (er) er.hidden = true; }
    }
    if (e.target.id === "qz-ads") state.consentAds = e.target.checked;
  });
  root.addEventListener("input", e => { if (e.target.id === "qz-phone") maskPhone(e.target); });
  root.addEventListener("submit", e => {
    if (!e.target.matches("[data-phone-form]")) return;
    e.preventDefault();
    const digits = root.querySelector("#qz-phone").value.replace(/\D/g, "");
    if (!state.consentPd) { consentError(); return; }
    if (digits.length !== 10) {
      state.err = "Введите номер телефона полностью — 10 цифр после +7.";
      const er = root.querySelector("#qz-err");
      er.textContent = state.err; er.hidden = false;
      return;
    }
    unlock("phone", { name: root.querySelector("#qz-name").value.trim(), phone: "+7" + digits });
  });

  window.TOOQuiz = {
    open(from) {
      if (state.screen === "intro") state.from = from || "page";
      ui().openModal(modal);
      track("quiz_open", { from: from || "page" });
      render();
    }
  };
})();
