import {Injectable, signal} from '@angular/core';
import {Language} from '../models/game.types';

@Injectable({
  providedIn: 'root',
})
export class LocalizationService {
  currentLang = signal<Language>('fa');

  private translations: Record<Language, Record<string, string>> = {
    fa: {
      // General & Header
      app_title: 'هایزنبرگ: تجارت امپراتوری',
      app_subtitle: 'شبیه‌ساز جهان‌باز جرم، شیمی و بقا در البوکرکی',
      switch_lang: 'English',
      status_paused: 'بازی متوقف شد (PAUSE)',
      day: 'روز',
      clean_cash: 'پول تمیز و قانونی',
      dirty_cash: 'پول نقد معاملات (کثیف)',
      launder_rate: 'نرخ شستشو در هفته',
      dea_heat: 'سوءظن DEA و هنک شریدر',
      ego: 'غرور هایزنبرگ (Ego)',
      family: 'تعهد به خانواده (Family)',
      jesse_loyalty: 'وفاداری جسی پینکمن',
      skyler_suspicion: 'سوءظن اسکایلر',
      blue_purity: 'خلوص کریستال آبی',

      // Menu
      menu_resume: 'ادامه بازی',
      menu_new_game: 'شروع کمپین جدید',
      menu_freeroam: 'گشت آزاد جهان‌باز',
      menu_missions: 'فهرست ماموریت‌ها',
      menu_chemistry: 'ورود به آزمایشگاه (اول‌شخص)',
      menu_laundering: 'شبکه پول‌شویی و شرکت‌ها',
      menu_settings: 'تنظیمات گرافیک و سیستم',
      menu_gdd: 'سند طراحی بازی (GDD)',
      menu_quit: 'خروج به منو',

      // Camera & Modes
      cam_third_person: 'دید سوم‌شخص (آزاد)',
      cam_first_person: 'دید اول‌شخص',
      cam_toggle: 'تغییر دوربین [V]',
      drive_vehicle: 'سوار شدن [F]',
      exit_vehicle: 'پیاده شدن [F]',
      vehicle_aztek: 'پونتیاک آزتک والتر',
      vehicle_rv: 'ون فلیت‌وود RV (آزمایشگاه سیار)',
      interact_action: 'تعامل [E]',
      toggle_map: 'نقشه جامع [M]',

      // Locations
      loc_white_residence: 'خانه والتر وایت (۳۰۸ نگرا آرویو)',
      loc_white_residence_desc: 'محیط کامل داخل خانه؛ اتاق نشیمن، آشپزخانه، دریچه مخفی کانال هوا و حضور اسکایلر وایت',
      loc_secret_lab: 'آزمایشگاه اختصاصی هایزنبرگ (Secret Lab)',
      loc_secret_lab_desc: 'کارگاه سرپوشیده پخت کریستال، راکتور شیمیایی پیشرفته، میز شبکه پول‌شویی و محل پارک کاروان RV',
      loc_pollos: 'شعبه لوس پویوس هرمانوس (Gus Fring)',
      loc_pollos_desc: 'ملاقات‌های تجاری سری در دفتر مدیریت گاس فرینگ و دریافت قراردادهای بزرگ توزیع',
      loc_saul: 'دفتر وکالت سال گودمن (Saul & Associates)',
      loc_saul_desc: 'ارتقای حقوقی، کاهش تعقیب پلیس، خرید هویت جدید از مرد جاروبرقی و تاسیس شرکت‌های صوری',
      loc_carwash: 'کارواش A1A (مرکز پول‌شویی)',
      loc_carwash_desc: 'شستن هفتگی صدها هزار دلار پول نقد حاصل از پخت در قالب فیش‌های شستشوی خودرو',
      loc_superlab: 'سوپرلب صنعتی زیرزمینی (Lavandería)',
      loc_superlab_desc: 'تاسیسات مخفی فوق‌پیشرفته در اعماق خشکشویی صنعتی با مخازن عظیم و ظرفیت تناژ بالا',
      loc_madrigal: 'انبار تجهیزات شیمیایی مادریگال',
      loc_madrigal_desc: 'تامین و سرقت پیش‌سازهای شیمیایی حیاتی شامل بشکه‌های متیل‌آمین و فنیل‌استون',
      loc_desert: 'کویر نیومکزیکو و تواجلی (To\'hajiilee)',
      loc_desert_desc: 'پایگاه اولیه آشپزی با ون RV، خاکسپاری بشکه‌های پول با مختصات GPS و نبردهای سنگین کارتل',

      // In-World Physical Interactions
      interact_cook_apparatus: 'دستگاه سنتز و پخت شیشه کریستال',
      interact_cook_apparatus_sub: 'فشردن [E] برای آغاز پخت اول‌شخص با دمای دقیق و تزریق متیل‌آمین',
      interact_laundering_desk: 'میز پول‌شویی و گاوصندوق شرکت‌ها',
      interact_laundering_desk_sub: 'فشردن [E] برای انتقال پول نقد کثیف، خرید کسب‌وکار و پاک‌سازی مالی',
      interact_skyler: 'اسکایلر وایت (Skyler White)',
      interact_skyler_sub: 'فشردن [E] برای گفتگو درباره پول‌های مخفی، سوءظن و خانواده',
      interact_jesse: 'جسی پینکمن (Jesse Pinkman)',
      interact_jesse_sub: 'فشردن [E] برای هماهنگی پخت، وضعیت کاروان RV و وفاداری',
      interact_saul: 'سائول گودمن (Saul Goodman)',
      interact_saul_sub: 'فشردن [E] برای مشاوره حقوقی، کاهش تعقیب DEA و شرکت‌های پوششی',
      interact_gus: 'گاس فرینگ (Gus Fring)',
      interact_gus_sub: 'فشردن [E] برای مذاکره قرارداد و سهمیه توزیع محموله ۹۹.۱٪',
      interact_rv: 'کاروان Fleetwood RV (آزمایشگاه سیار)',
      interact_rv_sub: 'فشردن [F] برای رانندگی در البوکرکی و کویر تواجلی',
      interact_aztek: 'خودروی پونتیاک آزتک والتر وایت',
      interact_aztek_sub: 'فشردن [F] برای رانندگی با پونتیاک سبز شاسی‌بلند',
      gta_mouse_look: 'حالت دید آزاد موس (GTA Mode)',
      gta_mouse_hint: 'کلیک روی صفحه برای چرخش آزاد ۳۶۰ درجه با حرکت موس | کلید Esc برای خروج',

      // Chemistry Minigame
      chem_title: 'سنتز شیمیایی و کنترل خلوص (دید اول‌شخص)',
      chem_subtitle: 'شیمی یک علم دقیق است؛ هر صدم درصد خلوص، میلیاردها دلار ارزش دارد.',
      chem_temp: 'دمای رآکتور (°C)',
      chem_temp_target: 'بازه بهینه: ۷۶ - ۸۲ درجه',
      chem_heat_up: 'افزایش شعله بونزن',
      chem_cool_down: 'سوپاپ کندانسور / خنک‌کننده',
      chem_inject_methylamine: 'تزریق متیل‌آمین',
      chem_add_catalyst: 'افزودن کاتالیزور P2P',
      chem_stirrer: 'میکسر مغناطیسی',
      chem_ph: 'تعادل pH محلول',
      chem_progress: 'پیشرفت واکنش کریستالیزاسیون',
      chem_live_purity: 'خلوص فعلی',
      chem_hazard_warning: 'هشدار: تشکیل بخار سمی فسفین! دما بیش از حد مجاز است!',
      chem_finish_batch: 'استخراج کریستال و بسته‌بندی محموله',
      chem_perfect_heisenberg: 'خلوص خیره‌کننده ۹۹.۱٪ (فرمول افسانه‌ای هایزنبرگ)!',

      // Laundering System
      laundering_title: 'امپراتوری پول‌شویی و شرکت‌های پوششی',
      laundering_desc: 'پول نقد حاصل از معاملات نمی‌تواند مستقیماً در بازار رسمی خرج شود؛ باید از طریق کسب‌وکارهای قانونی به چرخه بانکی وارد گردد.',
      clean_capacity: 'ظرفیت هفتگی شستشو',
      irs_audit_risk: 'ریسک حسابرسی اداره مالیات (IRS)',
      upgrade_business: 'ارتقا و خرید تجهیزات',
      buy_business: 'خرید این کسب‌وکار',
      launder_transfer: 'انتقال پول کثیف به فرآیند شستشو',
      biz_carwash: 'کارواش مکانیزه A1A',
      biz_carwash_desc: 'اضافه کردن خط شستشوی خودکار، فروش خوشبوکننده‌ها و گزارش درآمدهای نقدی افزایشی.',
      biz_lasertag: 'مجموعه بازی لیزرتگ سال گودمن',
      biz_lasertag_desc: 'توصیه اکید سال: یک سرمایه‌گذاری نقدی ایده‌آل با جریان نامشخص مشتریان.',
      biz_vamonos: 'شرکت سم‌پاشی Vamonos Pest',
      biz_vamonos_desc: 'پوشش بی‌نقص برای پخت متحرک در خانه‌های چادرزده و شستشوی درآمد خدمات شرکتی.',

      // Heat System
      heat_title: 'وضعیت هشدار و تعقیب DEA',
      heat_stars_1: 'گشت عادی پلیس APD در محدوده شهر',
      heat_stars_2: 'سوءظن محلی؛ تعقیب خودروهای مشکوک',
      heat_stars_3: 'ورود اداره مبارزه با مواد مخدر (DEA) و شنود مکالمات',
      heat_stars_4: 'ایست‌های بازرسی فدرال در جاده‌های بین شهری',
      heat_stars_5: 'محاصره کامل تیم تاکتیکی هنک شریدر و استیو گومز!',
      reduce_heat_saul: 'تماس فوری با سال گودمن جهت ایجاد انحراف پلیس ($۵,۰۰۰)',
      destroy_evidence: 'نابودی شواهد آزمایشگاهی با هیدروفلوئوریک اسید ($۲,۵۰۰)',

      // Settings
      settings_title: 'تنظیمات گرافیک و عملکرد سیستم',
      settings_subtitle: 'بهینه‌سازی نرخ فریم و کیفیت رندرینگ برای تمام پلتفرم‌ها',
      setting_texture_quality: 'کیفیت بافت‌ها و مدل‌ها (Texture Quality)',
      setting_fps_limit: 'سقف نرخ فریم (FPS Limit)',
      setting_resolution_scale: 'مقیاس رزولوشن رندر (Render Scale)',
      setting_shadows: 'سایه‌زنی پویا (Dynamic Shadows)',
      setting_bloom: 'افکت گرما و بلوم بیابان (Desert Heat & Bloom)',
      setting_fps_counter: 'نمایشگر زنده نرخ فریم (FPS Counter)',
      quality_low: 'پایین (Low - حداکثر پرفورمنس)',
      quality_medium: 'متوسط (Medium - متعادل)',
      quality_high: 'بالا (High - جزئیات عالی)',
      quality_ultra: 'اولترا (Ultra - حداکثر گرافیک)',
      fps_unlocked: 'نامحدود (Max)',
      save_settings: 'ذخیره و اعمال تنظیمات',

      // GDD Section
      gdd_title: 'سند طراحی بازی (Game Design Document)',
      gdd_tab_overview: 'بررسی اجمالی',
      gdd_tab_map: 'نقشه و مناطق',
      gdd_tab_mechanics: 'مکانیک‌های کلیدی',
      gdd_role: 'نقش بازیکن: والتر وایت / هایزنبرگ',
      gdd_perspective: 'زاویه دید: سوم‌شخص محیطی با سوییچ آنی به اول‌شخص شیمیایی',

      // Dialogue & Missions
      mission_current: 'ماموریت فعال',
      mission_objective: 'هدف بعدی',
      dist_meters: 'متر',
      dialogue_skip: 'رد کردن دیالوگ',
      dialogue_continue: 'ادامه',
    },
    en: {
      // General & Header
      app_title: 'Heisenberg: Empire Business',
      app_subtitle: 'Open-World Crime, Chemistry & Survival RPG in Albuquerque',
      switch_lang: 'فارسی',
      status_paused: 'GAME PAUSED',
      day: 'Day',
      clean_cash: 'Clean / Laundered Cash',
      dirty_cash: 'Dirty Street Cash',
      launder_rate: 'Weekly Laundering Rate',
      dea_heat: 'DEA & Hank Schrader Heat',
      ego: 'Heisenberg Ego',
      family: 'Family Devotion',
      jesse_loyalty: 'Jesse Pinkman Loyalty',
      skyler_suspicion: 'Skyler Suspicion',
      blue_purity: 'Blue Crystal Purity',

      // Menu
      menu_resume: 'Resume Game',
      menu_new_game: 'New Campaign',
      menu_freeroam: 'Free Roam Albuquerque',
      menu_missions: 'Mission Dossier',
      menu_chemistry: 'Enter Laboratory (1st Person)',
      menu_laundering: 'Laundering Network',
      menu_settings: 'Graphics & Engine Settings',
      menu_gdd: 'Game Design Document',
      menu_quit: 'Exit to Title',

      // Camera & Modes
      cam_third_person: 'Third-Person View [V]',
      cam_first_person: 'First-Person View [V]',
      cam_toggle: 'Toggle Camera [V]',
      drive_vehicle: 'Drive Vehicle [F]',
      exit_vehicle: 'Exit Vehicle [F]',
      vehicle_aztek: 'Walter\'s Pontiac Aztek',
      vehicle_rv: 'Fleetwood Bounder RV (Mobile Lab)',
      interact_action: 'Interact [E]',
      toggle_map: 'World Map [M]',

      // Locations
      loc_white_residence: 'Walter White Residence (308 Negra Arroyo)',
      loc_white_residence_desc: 'Full walkable interior: living room, kitchen, air vent crawlspace and Skyler White.',
      loc_secret_lab: 'Heisenberg\'s Secret Lab Compound',
      loc_secret_lab_desc: 'Hidden facility near the residence featuring chemical synthesis reactor, money laundering desk & RV parking.',
      loc_pollos: 'Los Pollos Hermanos (Gus Fring)',
      loc_pollos_desc: 'Covert meetings in Gus\'s back office, high-stakes supply contracts and drops.',
      loc_saul: 'Saul Goodman & Associates',
      loc_saul_desc: 'Upgrade legal shielding, cool DEA heat, buy new vacuum identity and shell companies.',
      loc_carwash: 'A1A Carwash (Laundering Hub)',
      loc_carwash_desc: 'Bogdan\'s former carwash. Primary cash flow laundering facility for millions in drug money.',
      loc_superlab: 'Subterranean Superlab (Lavandería)',
      loc_superlab_desc: 'High-tech clandestine facility under industrial laundry with mass synthesis capacity.',
      loc_madrigal: 'Madrigal Electromotive Warehouse',
      loc_madrigal_desc: 'Procure and hijack crucial chemical precursors: Methylamine barrels and catalyst.',
      loc_desert: 'New Mexico Desert & To\'hajiilee',
      loc_desert_desc: 'Birthplace of the cook in the bullet-hole RV, buried cash barrels with GPS coordinates.',

      // In-World Physical Interactions
      interact_cook_apparatus: 'Chemical Synthesis Reactor',
      interact_cook_apparatus_sub: 'Press [E] to begin First-Person Blue Sky cook minigame',
      interact_laundering_desk: 'Laundering Terminal & Safe',
      interact_laundering_desk_sub: 'Press [E] to launder dirty cash and acquire shell companies',
      interact_skyler: 'Skyler White',
      interact_skyler_sub: 'Press [E] to speak about family and suspicions',
      interact_jesse: 'Jesse Pinkman',
      interact_jesse_sub: 'Press [E] to discuss the cook and the Fleetwood RV',
      interact_saul: 'Saul Goodman',
      interact_saul_sub: 'Press [E] for legal counsel and DEA heat mitigation',
      interact_gus: 'Gus Fring',
      interact_gus_sub: 'Press [E] to negotiate supply contracts and cartel deals',
      interact_rv: 'Fleetwood Bounder RV (Mobile Lab)',
      interact_rv_sub: 'Press [F] to drive the iconic RV',
      interact_aztek: 'Walter\'s Pontiac Aztek',
      interact_aztek_sub: 'Press [F] to drive Walter\'s SUV',
      gta_mouse_look: 'GTA Mouse-Look Mode',
      gta_mouse_hint: 'Click canvas to look around freely with mouse movement | Press Esc to unlock',

      // Chemistry Minigame
      chem_title: 'Synthesis & Purity Minigame (First-Person)',
      chem_subtitle: 'Chemistry is the study of change. Respect the chemistry for 99.1% pure Blue Sky.',
      chem_temp: 'Reactor Temperature (°C)',
      chem_temp_target: 'Optimal Zone: 76°C - 82°C',
      chem_heat_up: 'Increase Bunsen Burner',
      chem_cool_down: 'Condenser Cooling Valve',
      chem_inject_methylamine: 'Inject Methylamine',
      chem_add_catalyst: 'Add P2P Catalyst',
      chem_stirrer: 'Magnetic Stirrer Speed',
      chem_ph: 'Solution pH Balance',
      chem_progress: 'Crystallization Progress',
      chem_live_purity: 'Current Purity',
      chem_hazard_warning: 'WARNING: Toxic phosphine gas hazard! Temperature runaway!',
      chem_finish_batch: 'Filter & Package Blue Crystals',
      chem_perfect_heisenberg: 'Legendary 99.1% Heisenberg Purity Achieved!',

      // Laundering System
      laundering_title: 'Laundering Network & Shell Companies',
      laundering_desc: 'Street cash cannot be spent openly. Filter illicit funds into legal revenue to build your empire.',
      clean_capacity: 'Weekly Clean Capacity',
      irs_audit_risk: 'IRS Audit Risk',
      upgrade_business: 'Upgrade Facilities',
      buy_business: 'Acquire Business',
      launder_transfer: 'Transfer Dirty Cash to Clean Ledger',
      biz_carwash: 'A1A Automated Carwash',
      biz_carwash_desc: 'Add automatic wash lanes, air freshener retail, and inflate legal cash receipts.',
      biz_lasertag: 'Saul\'s Danny Laser Tag',
      biz_lasertag_desc: 'Saul\'s favorite recommendation: high-volume cash business with untraceable patrons.',
      biz_vamonos: 'Vamonos Pest Control',
      biz_vamonos_desc: 'Mobile fumigation cover to cook in tented suburban houses and launder commercial income.',

      // Heat System
      heat_title: 'DEA Heat & Investigation Level',
      heat_stars_1: 'Routine APD police patrols in city limits',
      heat_stars_2: 'Suspicious vehicle alert; regional patrol tracking',
      heat_stars_3: 'DEA Task Force intervention; wiretaps and tailing',
      heat_stars_4: 'Federal highway checkpoints and roadblocks',
      heat_stars_5: 'Full tactical raid ordered by Hank Schrader and Gomez!',
      reduce_heat_saul: 'Call Saul for emergency diversion ($5,000)',
      destroy_evidence: 'Dissolve evidence in Hydrofluoric Acid ($2,500)',

      // Settings
      settings_title: 'Graphics & Performance Settings',
      settings_subtitle: 'Optimize framerate and rendering quality across devices and platforms',
      setting_texture_quality: 'Texture Quality',
      setting_fps_limit: 'FPS Limit',
      setting_resolution_scale: 'Render Resolution Scale',
      setting_shadows: 'Dynamic Shadows',
      setting_bloom: 'Desert Heat Waves & Bloom',
      setting_fps_counter: 'Live FPS Counter',
      quality_low: 'Low (Max Performance)',
      quality_medium: 'Medium (Balanced)',
      quality_high: 'High (Detailed)',
      quality_ultra: 'Ultra (Maximum Fidelity)',
      fps_unlocked: 'Unlocked (Max)',
      save_settings: 'Apply & Save Settings',

      // GDD Section
      gdd_title: 'Game Design Document (GDD)',
      gdd_tab_overview: 'Overview',
      gdd_tab_map: 'World & Map',
      gdd_tab_mechanics: 'Key Mechanics',
      gdd_role: 'Protagonist: Walter White / Heisenberg',
      gdd_perspective: 'Perspective: 3rd-Person World with 1st-Person Chemistry View',

      // Dialogue & Missions
      mission_current: 'Active Mission',
      mission_objective: 'Next Objective',
      dist_meters: 'm',
      dialogue_skip: 'Skip Dialogue',
      dialogue_continue: 'Continue',
    },
  };

  t(key: string): string {
    const lang = this.currentLang();
    return this.translations[lang]?.[key] || this.translations['en']?.[key] || key;
  }

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    }
  }

  toggleLanguage() {
    this.setLanguage(this.currentLang() === 'fa' ? 'en' : 'fa');
  }
}
