import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {GameStateService} from '../../services/game-state.service';
import {LocalizationService} from '../../services/localization.service';
import {GameAudioService} from '../../services/game-audio.service';

@Component({
  selector: 'app-gdd-modal',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      id="gdd-modal-backdrop"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in font-persian"
    >
      <div
        id="gdd-window"
        class="relative w-full max-w-4xl bg-[#050807] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#e0e7e1]"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-white/10 bg-black/60 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#0a2e1c] border border-[#2ecc71]/40 flex items-center justify-center text-[#2ecc71] shadow-[0_0_12px_rgba(46,204,113,0.3)]">
              <mat-icon>auto_stories</mat-icon>
            </div>
            <div>
              <h2 class="text-lg font-bold text-white tracking-wide font-mono">
                DOCS // {{ loc.t('gdd_title') }}
              </h2>
              <p class="text-xs text-[#e0e7e1]/60 font-persian">Heisenberg: Empire Business — System Architecture & Mechanics</p>
            </div>
          </div>

          <button
            id="gdd-close-btn"
            (click)="gameState.isGddOpen.set(false)"
            class="w-9 h-9 rounded-lg bg-black/60 hover:bg-[#0a2e1c] text-white/50 hover:text-[#2ecc71] border border-white/10 flex items-center justify-center transition-colors"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex border-b border-white/10 bg-black/40 px-6 gap-2 pt-2">
          <button
            (click)="activeTab.set('overview')"
            class="px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2"
            [class.border-[#2ecc71]]="activeTab() === 'overview'"
            [class.text-[#2ecc71]]="activeTab() === 'overview'"
            [class.bg-[#0a2e1c]/40]="activeTab() === 'overview'"
            [class.border-transparent]="activeTab() !== 'overview'"
            [class.text-[#e0e7e1]/60]="activeTab() !== 'overview'"
          >
            {{ loc.t('gdd_tab_overview') }}
          </button>
          <button
            (click)="activeTab.set('map')"
            class="px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2"
            [class.border-[#2ecc71]]="activeTab() === 'map'"
            [class.text-[#2ecc71]]="activeTab() === 'map'"
            [class.bg-[#0a2e1c]/40]="activeTab() === 'map'"
            [class.border-transparent]="activeTab() !== 'map'"
            [class.text-[#e0e7e1]/60]="activeTab() !== 'map'"
          >
            {{ loc.t('gdd_tab_map') }}
          </button>
          <button
            (click)="activeTab.set('mechanics')"
            class="px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2"
            [class.border-[#2ecc71]]="activeTab() === 'mechanics'"
            [class.text-[#2ecc71]]="activeTab() === 'mechanics'"
            [class.bg-[#0a2e1c]/40]="activeTab() === 'mechanics'"
            [class.border-transparent]="activeTab() !== 'mechanics'"
            [class.text-[#e0e7e1]/60]="activeTab() !== 'mechanics'"
          >
            {{ loc.t('gdd_tab_mechanics') }}
          </button>
        </div>

        <!-- Tab Content -->
        <div class="p-6 overflow-y-auto space-y-6 flex-1 text-sm font-persian text-[#e0e7e1]/80 leading-relaxed">
          @if (activeTab() === 'overview') {
            <div class="space-y-4">
              <div class="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2">
                <h3 class="text-base font-bold text-[#2ecc71] flex items-center gap-2">
                  <mat-icon>military_tech</mat-icon>
                  <span>۱. نمای کلی و فلسفه بازی (Game Design Overview)</span>
                </h3>
                <p>
                  <strong>عنوان:</strong> Heisenberg: Empire Business<br />
                  <strong>سبک:</strong> اکشن-ماجراجویی جهان‌باز با عناصر شبیه‌ساز جنایی و بقا (Action-Adventure / Crime Sim RPG)<br />
                  <strong>دیدگاه دوربین:</strong> سوم‌شخص محیطی (با قابلیت رانندگی آزادانه و گردش آزاد دوربین) و تغییر خودکار/دستی به اول‌شخص هنگام کار با وسایل شیمیایی آزمایشگاه.
                </p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="p-4 rounded-xl bg-black/50 border border-white/10">
                  <h4 class="font-bold text-white mb-2 flex items-center gap-2">
                    <mat-icon class="text-[#2ecc71]">sports_esports</mat-icon>
                    <span>کنترل‌های یکپارچه</span>
                  </h4>
                  <ul class="text-xs space-y-1.5 text-[#e0e7e1]/70">
                    <li><code class="text-[#2ecc71] font-mono">WASD / کلیدهای جهتی:</code> حرکت پیاده و رانندگی</li>
                    <li><code class="text-[#2ecc71] font-mono">V:</code> تغییر نما (اول‌شخص / سوم‌شخص)</li>
                    <li><code class="text-[#2ecc71] font-mono">F:</code> سوار/پیاده شدن از خودرو (آزتک یا ون RV)</li>
                    <li><code class="text-[#2ecc71] font-mono">E:</code> تعامل با ساختمان‌ها و اشخاص</li>
                    <li><code class="text-[#2ecc71] font-mono">M:</code> باز کردن نقشه و رادار البوکرکی</li>
                    <li><code class="text-[#2ecc71] font-mono">Shift:</code> دویدن سریع و گاز دادن با خودرو</li>
                  </ul>
                </div>

                <div class="p-4 rounded-xl bg-black/50 border border-white/10">
                  <h4 class="font-bold text-white mb-2 flex items-center gap-2">
                    <mat-icon class="text-emerald-400">language</mat-icon>
                    <span>طراحی دوزبانه و تنظیمات بهینه</span>
                  </h4>
                  <p class="text-xs text-[#e0e7e1]/70">
                    سیستم بازی به طور کامل دوزبانه طراحی شده و با یک کلیک بین زبان فارسی (راست‌چین RTL) و انگلیسی جابه‌جا می‌شود. موتور گرافیکی Three.js شامل کنترل سقف فریم‌ریت (30 تا 120 FPS و نامحدود)، تنظیم رزولوشن و کیفیت بافت‌ها برای اجرای روان روی انواع موبایل و کامپیوتر است.
                  </p>
                </div>
              </div>
            </div>
          } @else if (activeTab() === 'map') {
            <div class="space-y-4">
              <h3 class="text-base font-bold text-[#2ecc71]">ساختار جهان بازی (Albuquerque & Outskirts):</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @for (locItem of gameState.locations; track locItem.id) {
                  <div class="p-4 rounded-xl bg-black/50 border border-white/10 hover:border-[#2ecc71]/40 transition-all flex flex-col justify-between">
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <span class="font-bold text-white flex items-center gap-2">
                          <mat-icon [style.color]="locItem.color">{{ locItem.icon }}</mat-icon>
                          {{ loc.t(locItem.nameKey) }}
                        </span>
                        <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#0a2e1c] text-[#2ecc71] border border-[#2ecc71]/30">
                          {{ locItem.category }}
                        </span>
                      </div>
                      <p class="text-xs text-[#e0e7e1]/60 leading-relaxed">{{ loc.t(locItem.descriptionKey) }}</p>
                    </div>

                    <div class="mt-4 pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                      <span class="font-mono text-[#e0e7e1]/40 text-[11px]">مختصات: [{{ locItem.x }}, {{ locItem.z }}]</span>
                      <button
                        (click)="teleportTo(locItem.x, locItem.z)"
                        class="px-3 py-1 rounded-lg bg-black/60 hover:bg-[#0a2e1c] text-[#2ecc71] border border-[#2ecc71]/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <mat-icon class="text-sm">near_me</mat-icon>
                        انتقال سریع
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          } @else if (activeTab() === 'mechanics') {
            <div class="space-y-4">
              <!-- Mech 1 -->
              <div class="p-4 rounded-xl bg-black/50 border border-white/10">
                <h4 class="font-bold text-[#2ecc71] mb-1 flex items-center gap-2">
                  <mat-icon>science</mat-icon>
                  <span>۱. سیستم شیمی و سنتز (Purity Minigame)</span>
                </h4>
                <p class="text-xs text-[#e0e7e1]/70">
                  خلوص محصول کریستال نهایی بر اساس کنترل بلادرنگ دما (بازه بهینه ۷۶ تا ۸۲ درجه سلسیوس)، نسبت کاتالیزورهای P2P، تزریق متیل‌آمین و کنترل pH سنجیده می‌شود. رسیدن به خلوص افسانه‌ای ۹۹.۱٪ درآمد نجومی ایجاد می‌کند، اما حرارت بیش از ۸۸ درجه باعث تشکیل بخار سمی فسفین و جلب توجه پلیس و DEA می‌شود.
                </p>
              </div>

              <!-- Mech 2 -->
              <div class="p-4 rounded-xl bg-black/50 border border-white/10">
                <h4 class="font-bold text-red-400 mb-1 flex items-center gap-2">
                  <mat-icon>local_police</mat-icon>
                  <span>۲. شاخص خطر و سوءظن (Heat & DEA Meter)</span>
                </h4>
                <p class="text-xs text-[#e0e7e1]/70">
                  انجام معاملات، خطاهای آزمایشگاهی یا تیراندازی در بیابان سطح هشدار هنک شریدر و اداره مبارزه با مواد مخدر را تا ۵ ستاره بالا می‌برد. با افزایش ستاره‌ها، گشت‌های APD، ایست‌های بازرسی فدرال و در نهایت تیم تاکتیکی DEA وارد صحنه می‌شوند. بازیکن باید با نابودی شواهد یا تماس با سال گودمن برای ایجاد صحنه‌سازی، سوءظن را کاهش دهد.
                </p>
              </div>

              <!-- Mech 3 -->
              <div class="p-4 rounded-xl bg-black/50 border border-white/10">
                <h4 class="font-bold text-indigo-400 mb-1 flex items-center gap-2">
                  <mat-icon>balance</mat-icon>
                  <span>۳. سیستم دوگانگی شخصیت (Ego vs. Family)</span>
                </h4>
                <p class="text-xs text-[#e0e7e1]/70">
                  هر انتخاب در دیالوگ‌ها و ماموریت‌ها دو قطب درونی والتر را تغییر می‌دهد: تغذیه غرور سیری‌ناپذیر هایزنبرگ (Ego) یا محافظت و تعهد به خانواده (Family). این تصمیمات بر وفاداری جسی پینکمن و ترس یا همکاری اسکایلر اثر مستقیم می‌گذارد.
                </p>
              </div>

              <!-- Mech 4 -->
              <div class="p-4 rounded-xl bg-black/50 border border-white/10">
                <h4 class="font-bold text-emerald-400 mb-1 flex items-center gap-2">
                  <mat-icon>account_balance_wallet</mat-icon>
                  <span>۴. سیستم پول‌شویی و کسب‌وکارهای پوششی (Laundering Network)</span>
                </h4>
                <p class="text-xs text-[#e0e7e1]/70">
                  پول نقد کثیف حاصل از فروش نمی‌تواند مستقیماً در بازار مصرف شود. بازیکن باید کسب‌وکارهای مشروع نظیر کارواش A1A، لیزرتگ سال و شرکت سم‌پاشی Vamonos Pest را خریده و با مدیریت سقف هفتگی، دلارها را بدون ریسک حسابرسی اداره مالیات (IRS) تمیز کند.
                </p>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class GddModal {
  gameState = inject(GameStateService);
  loc = inject(LocalizationService);
  audio = inject(GameAudioService);

  activeTab = signal<'overview' | 'map' | 'mechanics'>('overview');

  teleportTo(x: number, z: number) {
    this.audio.playClick();
    this.gameState.playerPos.set({x, y: 0.8, z});
    this.gameState.isGddOpen.set(false);
    this.gameState.showToast(`انتقال به مختصات [${x}, ${z}] انجام شد.`);
  }
}
