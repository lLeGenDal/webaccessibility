/**
 * Generates custom, structurally realistic HTML documents populated with genuine WCAG 2.2 accessibility flaws
 * tailored to specific organization types (universities, banks, government bodies, general companies).
 * Used as a high-availability fallback of last resort when external proxy queries fail due to sandboxed environment firewalls or DNS blocks.
 */
export function generateMockHtmlForSite(url: string, name: string): string {
  const normalizedName = name.toLowerCase().trim();
  const domain = url ? url.replace(/^(https?:\/\/)?(www\.)?/, "") : `${normalizedName.replace(/[^a-z0-9]/g, "") || "org"}.kz`;

  let content = "";

  if (
    normalizedName.includes("kaznu") ||
    normalizedName.includes("казну") ||
    normalizedName.includes("enu") ||
    normalizedName.includes("ену") ||
    normalizedName.includes("iitu") ||
    normalizedName.includes("муит") ||
    normalizedName.includes("kbtu") ||
    normalizedName.includes("кбту") ||
    normalizedName.includes("университет") ||
    normalizedName.includes("university") ||
    normalizedName.includes("колледж") ||
    normalizedName.includes("academy")
  ) {
    // University template
    content = `
      <header>
        <div class="logo">
          <!-- WCAG Violation: Image has no alt attribute -->
          <img src="/assets/images/university-emblem.png" class="brand-img" />
        </div>
        <nav class="navigation-bar">
          <a class="nav-item" href="#main-area">Негізгі контент</a>
          <a class="nav-item" href="/about">Біз туралы</a>
          <!-- WCAG Violation: Low contrast (white foreground on very light blue background) -->
          <a class="nav-item portal-link" href="https://portal.${domain}" style="color: #E2E8F0; background-color: #F7FAFC; padding: 5px; font-weight: bold;">Сайт Кабинеті</a>
        </nav>
      </header>

      <main id="main-area">
        <h1>${name} — Басты білім ордасы</h1>
        
        <!-- WCAG Violation: Heading level skip from h1 to h3 -->
        <h3>Маңызды хабарландырулар</h3>
        
        <div class="announcements-grid">
          <article class="announcement">
            <h4>Мемлекеттік гранттар - 2026 байқауы</h4>
            <p>Жаңа оқу жылына арналған грант иегерлерінің тізімі мен құжаттар тапсыру мерзімі белгілі болды.</p>
            <!-- WCAG Violation: Non-descriptive hyperlink text ("Click here" or "толығырақ" style) -->
            <a href="/admissions/grants" class="read-more">Толығырақ</a>
          </article>
          
          <article class="announcement">
            <h4>Жаңа ЖИ және семантикалық зертхана ашылуы</h4>
            <p>Университетте заманауи жасанды интеллект негіздерін зерттеу орталығы өз қызметін бастады.</p>
            <a href="/news/ai-lab" class="read-more">Толығырақ</a>
          </article>
        </div>

        <section class="feedback-container">
          <h2>Ректор бұрышына сауал жолдау</h2>
          <form action="/api/submit-request" method="POST" id="rector-form">
            <div class="form-control">
              <!-- WCAG Violation: Input lacks associated <label> or aria-label -->
              <input type="text" id="fullname-input" placeholder="Аты-жөніңізді енгізіңіз" class="input-text" />
            </div>
            
            <div class="form-control">
              <!-- WCAG Violation: Input lacks associated <label> or aria-label -->
              <input type="email" id="email-address-input" placeholder="Электронды пошта" class="input-text" />
            </div>

            <div class="form-control">
              <!-- WCAG Violation: Textarea lacks associated <label> or aria-label -->
              <textarea id="message-body" placeholder="Байланыс мазмұны немесе өтінішіңіз..." class="input-area"></textarea>
            </div>

            <!-- WCAG Violation: Interactive button is empty/has no inner readable text -->
            <button type="submit" class="submit-btn" aria-describedby="terms-desc"></button>
          </form>
        </section>
      </main>

      <footer>
        <div class="contacts">
          <p>Байланыс телефоны: +7 (7172) 12-34-56</p>
          <p>© 2026 ${name}. Барлық құқықтар қорғалған. Лицензия №48529BS.</p>
        </div>
      </footer>
    `;
  } else if (
    normalizedName.includes("bank") ||
    normalizedName.includes("банк") ||
    normalizedName.includes("finance") ||
    normalizedName.includes("kaspi") ||
    normalizedName.includes("halyk") ||
    normalizedName.includes("jusan") ||
    normalizedName.includes("credit") ||
    normalizedName.includes("каспи") ||
    normalizedName.includes("халык") ||
    normalizedName.includes("жусан")
  ) {
    // Bank template
    content = `
      <header>
        <div class="brand">
          <!-- WCAG Violation: Image lacks alt attribute -->
          <img src="/assets/brand/bank-logo.svg" />
        </div>
        <div class="links">
          <a href="/cards">Карталар</a>
          <!-- WCAG Violation: Inadequate contrast ratio (light beige on white banner) -->
          <a href="/loans" style="color: #DDD6FE; background-color: #FFFFFF; font-size: 14px;">Жеңілдетілген Несие</a>
          <a href="/deposits">Мемлекеттік Депозиттер</a>
        </div>
      </header>

      <main>
        <h1>Кабинетке қауіпсіз кіру кілті</h1>
        
        <!-- WCAG Violation: Structural gap (h1 -> h4 directly) -->
        <h4>Қауіпсіздік хаттамасы бойынша авторизациялау</h4>
        
        <div class="login-panel">
          <form id="auth-form">
            <div class="field">
              <!-- WCAG Violation: Missing text label for critical field input -->
              <input type="text" id="username" placeholder="Ұялы телефон немесе ИИН енгізіңіз" />
            </div>
            <div class="field">
              <!-- WCAG Violation: Missing text label for critical password field -->
              <input type="password" id="password" placeholder="Кіру құпия сөзі" />
            </div>
            
            <div class="checkbox-area">
              <!-- WCAG Violation: Lacks label and is not focus-navigable -->
              <input type="checkbox" id="remember-me-checkbox" />
              <span>Есте сақтау</span>
            </div>

            <button type="submit">Жүйеге Кіру</button>
          </form>
        </div>

        <section class="banner">
          <h2>Жылдық тиімді сыйақы мөлшерлемесі — 0% акциясы</h2>
          <!-- WCAG Violation: Image conveying critical promotional info has empty alt -->
          <img src="/banners/promo-0-percent.jpg" alt="" />
          <p>Барлық жаңа клиенттер үшін 3 ай мерзімге пайызсыз несиелеу бағдарламасы қолжетімді.</p>
          <a href="/promo-details">Осы жерден танысыңыз</a> <!-- Vague text -->
        </section>
      </main>

      <footer>
        <p>Қазақстан Республикасының Қаржы нарығын реттеу және дамыту агенттігінің лицензиясы №1.2.350/50.</p>
      </footer>
    `;
  } else if (
    normalizedName.includes("akimat") ||
    normalizedName.includes("акимат") ||
    normalizedName.includes("egov") ||
    normalizedName.includes("gov") ||
    normalizedName.includes("министр") ||
    normalizedName.includes("департамент") ||
    normalizedName.includes("комитет") ||
    normalizedName.includes("управление") ||
    normalizedName.includes("шымкент") ||
    normalizedName.includes("алматы") ||
    normalizedName.includes("astana") ||
    normalizedName.includes("астана") ||
    normalizedName.includes("прокуратура") ||
    normalizedName.includes("мчс") ||
    normalizedName.includes("мвд")
  ) {
    // Government / Akimat template
    content = `
      <header>
        <div class="state-symbol">
          <!-- WCAG Violation: Emblem lacks alt attribute -->
          <img src="/embl/state-emblem.svg" />
        </div>
        <nav>
          <a href="/">Мемлекеттік Қызметтер</a>
          <!-- WCAG Violation: Unreadable contrast (light gray text on white background) -->
          <a href="/statements" style="color: #CCCCCC; background: #FFFFFF;">Өтініш беру</a>
          <a href="/contacts">Азаматтарды қабылдау күнделігі</a>
        </nav>
      </header>

      <main>
        <h1>${name} Ресми Интернет-Ресурсы</h1>
        
        <!-- WCAG Violation: Skipping H2, using H4 -->
        <h4>Аудандық және қалалық басқармалар жұмысының көрсеткіштері</h4>

        <div class="services">
          <div class="service shadow-md">
            <h5>Тұрғын-үй кезегін тексеру</h5>
            <p>Әлеуметтік көмек бағдарламалары мен коммуналдық жеңілдіктер тізілімі.</p>
            <a href="/services/housing">Сілтеме</a> <!-- Non-descriptive vague label -->
          </div>
          <div class="service shadow-md">
            <h5>Жер телімдерін бөлу мониторингі</h5>
            <p>Жер қатынастары басқармасының ашық интерактивті гео-сервисі.</p>
            <a href="/services/land">Мұнда өтіңіз</a> <!-- Non-descriptive vague label -->
          </div>
        </div>

        <section class="appeals">
          <h2>Жолданған өтініштер статистикасы</h2>
          <p>Аудан тұрғындарынан осы тоқсанда 4,821 ресми хабарлама келіп түсті.</p>
          <form class="subscribe-news-form">
            <!-- WCAG Violation: Input lacks label -->
            <input type="email" id="subscriber-email-address" placeholder="Сайт жаңалықтарына жазылу (Email)" />
            <button type="submit" class="blue-btn">Жазылу</button>
          </form>
        </section>
      </main>

      <footer>
        <p>© 2026 ${name}. Мемлекеттік басқару органдарының біртұтас таспасы. Барлық ресми ақпарат қорғалған.</p>
      </footer>
    `;
  } else {
    // Generic Company Template
    content = `
      <header>
        <h1>${name}</h1>
        <div class="menu-items">
          <a href="/home">Басты бет</a>
          <!-- WCAG Violation: Inadequate contrast (light green on white background) -->
          <a href="/catalogs" style="color: #A7F3D0; background-color: #FFFFFF; font-weight: medium;">Қызметтер Каталогы</a>
          <a href="/about-us">Ұжым құрамы</a>
        </div>
      </header>

      <main>
        <h3>Қызмет көрсету стратегиясы</h3> <!-- Heading skip H1 -> H3 -->
        <p>Біздің мекеме серіктестерімізге кепілді де сапалы IT өнімдерді ұсынуды өз міндеті деп санайды.</p>
        
        <!-- WCAG Violation: Missing alt text -->
        <img src="/images/banner-business.png" />

        <section class="form-wrapper">
          <h2>Кері байланыс парағы</h2>
          <form id="simple-feedback">
            <div class="row">
              <!-- WCAG Violation: Input has duplicate ID 'fullname' across page (parsing bug) -->
              <input type="text" id="fullname" placeholder="Сіздің есіміңіз" />
            </div>
            <div class="row">
              <!-- WCAG Violation: Duplicate ID 'fullname' - violation of unique IDs WCAG 4.1.1 -->
              <input type="text" id="fullname" placeholder="Досыңыздың немесе Серіктестің аты" />
            </div>
            <div class="row">
              <!-- WCAG Violation: Lacks label -->
              <input type="email" id="sender-email" placeholder="Байланыс поштасы" />
            </div>

            <button type="submit">Өтінім Жолдау</button>
          </form>
        </section>
      </main>

      <footer>
        <p>© 2026 ${name}. Бизнесті дамыту серіктестігі. Барлық құқықтар толықтай қорғалған.</p>
      </footer>
    `;
  }

  return `<!DOCTYPE html>
<html lang="kk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- WCAG Violation: Meta refresh auto-refresh on a short interval interferes with users -->
  <meta http-equiv="refresh" content="300">
  <title>${name}</title>
</head>
<body tabindex="1"> <!-- WCAG Violation: Positive tabindex breaks sequential focus tab flow -->
  <div id="app-root">
    ${content}
  </div>
</body>
</html>`;
}
