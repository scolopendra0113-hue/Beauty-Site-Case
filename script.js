"use strict";

/* =========================================================
   1. КОНСТАНТЫ — ВСЁ, ЧТО МЕНЯЕТСЯ, ЗДЕСЬ
   ========================================================= */

// ЗАМЕНИТЬ: ссылка на онлайн-запись YClients.
// Где взять: личный кабинет YClients → Онлайн-запись → «Прямая ссылка на запись».
// Формат: https://n123456.yclients.com/company/123456/personal/select-time
const YCLIENTS_URL = "https://yclients.com/";

// ЗАМЕНИТЬ: эндпоинт вашего бэкенд-прокси / webhook, который пересылает заявку в Telegram Bot API.
// ВАЖНО: НЕ храните токен Telegram-бота в клиентском коде — он будет виден всем.
// Прокси (Cloudflare Worker / VPS / serverless) принимает POST и вызывает
// https://api.telegram.org/bot<TOKEN>/sendMessage.
// Пример тела запроса: { name, phone, service, time }
const TELEGRAM_ENDPOINT = "https://example.com/api/telegram-proxy"; // ЗАМЕНИТЬ

// ЗАМЕНИТЬ: список услуг (используется в карточках услуг и в select формы).
// Поля: category — группа, name — название, desc — описание, price — «от X ₽», duration — длительность.
const SERVICES = [
  {
    category: "Парикмахерские услуги",
    items: [
      { name: "Женская стрижка", desc: "Стрижка + укладка феном", price: "2 500 ₽", duration: "60 мин" },
      { name: "Окрашивание в один тон", desc: "Стойкая краска, уход включён", price: "4 500 ₽", duration: "120 мин" },
      { name: "Блонд / тонирование", desc: "Сложное окрашивание у колориста", price: "7 000 ₽", duration: "180 мин" },
      { name: "Укладка / локоны", desc: "Повседневная или вечерняя", price: "1 800 ₽", duration: "45 мин" }
    ]
  },
  {
    category: "Маникюр и педикюр",
    items: [
      { name: "Маникюр аппаратный", desc: "Без покрытия", price: "1 500 ₽", duration: "50 мин" },
      { name: "Маникюр + гель-лак", desc: "Покрытие любого цвета", price: "2 500 ₽", duration: "90 мин" },
      { name: "Педикюр", desc: "Аппаратный с покрытием", price: "3 000 ₽", duration: "90 мин" },
      { name: "Наращивание ногтей", desc: "Гель, форма на выбор", price: "4 000 ₽", duration: "150 мин" }
    ]
  },
  {
    category: "Косметология",
    items: [
      { name: "Чистка лица", desc: "Комбинированная, с уходом", price: "4 200 ₽", duration: "90 мин" },
      { name: "Пилинг", desc: "Химический / энзимный", price: "3 500 ₽", duration: "45 мин" },
      { name: "Уход по типу кожи", desc: "Подбор процедуры с косметологом", price: "2 800 ₽", duration: "60 мин" }
    ]
  },
  {
    category: "Массаж",
    items: [
      { name: "Расслабляющий массаж", desc: "Всё тело, 60 минут", price: "3 500 ₽", duration: "60 мин" },
      { name: "Лимфодренажный", desc: "Снятие отёков", price: "4 000 ₽", duration: "60 мин" },
      { name: "Антицеллюлитный", desc: "Курсом, от 10 сеансов", price: "3 800 ₽", duration: "60 мин" }
    ]
  }
];

/* =========================================================
   2. РЕНДЕР УСЛУГ И SELECT
   ========================================================= */
(function renderServices() {
  const grid = document.getElementById("servicesGrid");
  const select = document.getElementById("service");
  if (!grid) return;

  const frag = document.createDocumentFragment();

  SERVICES.forEach((group) => {
    const block = document.createElement("div");
    block.className = "service-group";

    const title = document.createElement("h3");
    title.className = "service-group__title";
    title.textContent = group.category;
    block.appendChild(title);

    group.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "service";

      const name = document.createElement("p");
      name.className = "service__name";
      name.textContent = item.name;

      const desc = document.createElement("p");
      desc.className = "service__desc";
      desc.textContent = item.desc;

      const meta = document.createElement("div");
      meta.className = "service__meta";
      meta.innerHTML = `<span class="service__price">от ${item.price}</span>
                        <span class="service__duration">${item.duration}</span>`;

      row.append(name, desc, meta);
      block.appendChild(row);
    });

    frag.appendChild(block);
  });

  grid.appendChild(frag);

  // Заполняем select в форме
  if (select) {
    SERVICES.forEach((group) => {
      const og = document.createElement("optgroup");
      og.label = group.category;
      group.items.forEach((item) => {
        const opt = document.createElement("option");
        opt.value = `${group.category}: ${item.name}`;
        opt.textContent = `${item.name} (от ${item.price})`;
        og.appendChild(opt);
      });
      select.appendChild(og);
    });
  }
})();

/* =========================================================
   3. YCLIENTS-ссылка подставляется из константы
   ========================================================= */
(function setYclientsLink() {
  const link = document.getElementById("yclientsLink");
  if (link && YCLIENTS_URL) link.href = YCLIENTS_URL;
})();

/* =========================================================
   4. СЛАЙДЕР ОТЗЫВОВ (scroll-snap + стрелки)
   ========================================================= */
(function initSlider() {
  const slider = document.getElementById("reviewsSlider");
  if (!slider) return;

  const prev = document.querySelector('[data-slider="prev"]');
  const next = document.querySelector('[data-slider="next"]');

  const scrollByCard = (dir) => {
    const card = slider.querySelector(".review");
    if (!card) return;
    const gap = parseInt(getComputedStyle(slider).columnGap || getComputedStyle(slider).gap || 16, 10);
    const step = card.getBoundingClientRect().width + gap;
    slider.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  prev && prev.addEventListener("click", () => scrollByCard(-1));
  next && next.addEventListener("click", () => scrollByCard(1));

  // Управление с клавиатуры
  slider.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); scrollByCard(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); scrollByCard(-1); }
  });
})();

/* =========================================================
   5. МАСКА ТЕЛЕФОНА (простая, под +7)
   ========================================================= */
(function initPhoneMask() {
  const input = document.getElementById("phone");
  if (!input) return;

  const format = (digits) => {
    // digits: строка только цифр, начинается с 7 или 8
    if (!digits) return "";
    let d = digits.replace(/^8/, "7");
    if (!d.startsWith("7")) d = "7" + d;
    d = d.slice(0, 11);

    const p1 = d.slice(1, 4);
    const p2 = d.slice(4, 7);
    const p3 = d.slice(7, 9);
    const p4 = d.slice(9, 11);

    let out = "+7";
    if (p1) out += ` (${p1}`;
    if (p1.length === 3) out += ")";
    if (p2) out += ` ${p2}`;
    if (p3) out += `-${p3}`;
    if (p4) out += `-${p4}`;
    return out;
  };

  input.addEventListener("input", () => {
    const digits = input.value.replace(/\D/g, "");
    input.value = format(digits);
  });

  input.addEventListener("focus", () => {
    if (!input.value) input.value = "+7 (";
  });

  input.addEventListener("blur", () => {
    if (input.value === "+7 (" || input.value === "+7") input.value = "";
  });
})();

/* =========================================================
   6. ВАЛИДАЦИЯ + ОТПРАВКА ФОРМЫ
   ========================================================= */
(function initForm() {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  const nameInput = document.getElementById("name");
  const phoneInput = document.getElementById("phone");
  const serviceSelect = document.getElementById("service");
  const timeInput = document.getElementById("time");
  const submitBtn = document.getElementById("submitBtn");
  const statusBox = document.getElementById("formStatus");

  const setError = (input, errEl, message) => {
    input.classList.toggle("is-invalid", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (errEl) errEl.textContent = message || "";
  };

  const clearStatus = () => {
    statusBox.textContent = "";
    statusBox.className = "form__status";
  };

  const showStatus = (text, type) => {
    statusBox.textContent = text;
    statusBox.className = `form__status form__status--${type}`;
  };

  const validate = () => {
    let ok = true;

    // Имя
    if (nameInput.value.trim().length < 2) {
      setError(nameInput, document.getElementById("nameErr"), "Укажите имя (минимум 2 символа)");
      ok = false;
    } else {
      setError(nameInput, document.getElementById("nameErr"), "");
    }

    // Телефон: должно быть 11 цифр
    const digits = phoneInput.value.replace(/\D/g, "");
    if (digits.length !== 11) {
      setError(phoneInput, document.getElementById("phoneErr"), "Введите номер полностью: +7 (___) ___-__-__");
      ok = false;
    } else {
      setError(phoneInput, document.getElementById("phoneErr"), "");
    }

    // Услуга
    if (!serviceSelect.value) {
      setError(serviceSelect, document.getElementById("serviceErr"), "Выберите услугу");
      ok = false;
    } else {
      setError(serviceSelect, document.getElementById("serviceErr"), "");
    }

    return ok;
  };

  // Снимаем ошибку при вводе
  [nameInput, phoneInput, serviceSelect].forEach((el) => {
    el.addEventListener("input", () => {
      el.classList.remove("is-invalid");
      el.setAttribute("aria-invalid", "false");
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearStatus();

    if (!validate()) {
      // Фокус на первое поле с ошибкой
      const firstInvalid = form.querySelector(".is-invalid");
      firstInvalid && firstInvalid.focus();
      return;
    }

    const payload = {
      name: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      service: serviceSelect.value,
      time: timeInput.value.trim(),
      page: window.location.href,
      ts: new Date().toISOString()
    };

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Отправляем…";

    try {
      const res = await fetch(TELEGRAM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      form.reset();
      showStatus(
        "Спасибо! Заявка отправлена. Мы свяжемся с вами в ближайшее время, чтобы подтвердить запись.",
        "success"
      );
      // Опционально: после успеха показать ссылку на YClients
      if (YCLIENTS_URL) {
        const a = document.createElement("a");
        a.href = YCLIENTS_URL;
        a.target = "_blank";
        a.rel = "noopener";
        a.className = "link";
        a.textContent = "Или запишитесь сразу в YClients →";
        const p = document.createElement("p");
        p.style.margin = "8px 0 0";
        p.appendChild(a);
        statusBox.appendChild(p);
      }
    } catch (err) {
      console.error("Ошибка отправки:", err);
      showStatus(
        "Не удалось отправить заявку. Проверьте соединение и попробуйте снова или позвоните нам.",
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
})();

/* =========================================================
   7. ЛЕНИВАЯ ЗАГРУЗКА IFRAME КАРТЫ (IntersectionObserver)
   ========================================================= */
(function lazyMap() {
  const iframe = document.getElementById("mapFrame");
  if (!iframe || !("IntersectionObserver" in window)) {
    if (iframe && iframe.dataset.src) iframe.src = iframe.dataset.src;
    return;
  }

  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        iframe.src = iframe.dataset.src;
        observer.disconnect();
      }
    });
  }, { rootMargin: "200px" });

  io.observe(iframe);
})();

/* =========================================================
   8. ГОД В ФУТЕРЕ
   ========================================================= */
(function setYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();