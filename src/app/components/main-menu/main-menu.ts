import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {GameStateService} from '../../services/game-state.service';
import {LocalizationService} from '../../services/localization.service';
import {GameAudioService} from '../../services/game-audio.service';

@Component({
  selector: 'app-main-menu',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      id="main-menu-container"
      class="fixed inset-0 z-40 flex flex-col justify-between bg-[#050807]/95 text-[#e0e7e1] backdrop-blur-md select-none overflow-y-auto animate-fade-in relative"
    >
      <!-- Subtle Radial Glow & Scanlines Layer -->
      <div class="absolute inset-0 opacity-20 pointer-events-none" style="background: radial-gradient(circle at 50% 50%, #2ecc71 0%, transparent 70%); filter: blur(60px);"></div>
      <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none immersive-scanlines"></div>

      <!-- HEADER -->
      <header class="flex flex-wrap justify-between items-start p-6 sm:p-10 z-10 gap-4 border-b border-white/5">
        <div class="flex flex-col">
          <!-- Chemical Element Tiles -->
          <div class="flex gap-2">
            <div class="w-14 h-14 sm:w-16 sm:h-16 border-2 border-[#2ecc71] flex flex-col justify-between p-1.5 bg-[#0a2e1c]/80 shadow-[0_0_15px_rgba(46,204,113,0.25)]">
              <span class="text-[9px] font-mono text-[#2ecc71]/80 leading-none">2</span>
              <span class="text-2xl sm:text-3xl font-bold font-display text-[#2ecc71] text-center leading-none">He</span>
              <span class="text-[8px] font-mono text-[#2ecc71]/70 leading-none text-right">4.00</span>
            </div>
            <div class="w-14 h-14 sm:w-16 sm:h-16 border-2 border-[#2ecc71] flex flex-col justify-between p-1.5 bg-[#0a2e1c]/80 shadow-[0_0_15px_rgba(46,204,113,0.25)]">
              <span class="text-[9px] font-mono text-[#2ecc71]/80 leading-none">56</span>
              <span class="text-2xl sm:text-3xl font-bold font-display text-[#2ecc71] text-center leading-none">Ba</span>
              <span class="text-[8px] font-mono text-[#2ecc71]/70 leading-none text-right">137.3</span>
            </div>
          </div>

          <!-- Title -->
          <h1 class="text-3xl sm:text-5xl font-black uppercase tracking-tight mt-4 text-white leading-none font-display">
            Heisenberg<br />
            <span class="text-[#2ecc71] tracking-wider">Empire Business</span>
          </h1>
          <p class="text-xs uppercase tracking-widest text-[#e0e7e1]/60 mt-2 font-mono">
            Albuquerque Crime Syndicate Simulator v.1.0.9
          </p>
        </div>

        <!-- Right Header Status Ticker & Language Selector -->
        <div class="flex flex-col items-end gap-3">
          <div class="flex items-center gap-4 bg-black/60 p-3.5 border border-white/10 rounded-lg shadow-xl backdrop-blur-md">
            <!-- Heat Meter -->
            <div class="text-right">
              <p class="text-[10px] uppercase text-[#e0e7e1]/50 font-mono">{{ loc.t('dea_heat') }}</p>
              <div class="flex gap-1 mt-1.5 items-center">
                @for (star of [1, 2, 3, 4, 5]; track star) {
                  <div
                    class="w-3.5 sm:w-4 h-1.5 transition-all"
                    [class.bg-red-600]="star <= gameState.heatStars()"
                    [class.shadow-[0_0_6px_rgba(220,38,38,0.9)]]="star <= gameState.heatStars()"
                    [class.bg-white/20]="star > gameState.heatStars()"
                  ></div>
                }
              </div>
            </div>

            <div class="h-8 w-[1px] bg-white/10"></div>

            <!-- Purity Level -->
            <div class="text-right">
              <p class="text-[10px] uppercase text-[#e0e7e1]/50 font-mono">Purity Level</p>
              <p class="text-[#2ecc71] font-mono font-bold text-lg leading-none shadow-[0_0_10px_rgba(46,204,113,0.3)]">
                {{ gameState.chemState().currentPurity }}%
              </p>
            </div>
          </div>

          <!-- Quick Switch Language -->
          <button
            id="main-menu-lang-btn"
            (click)="loc.toggleLanguage()"
            class="px-3.5 py-1.5 rounded-lg bg-black/50 hover:bg-[#0a2e1c]/70 border border-white/10 hover:border-[#2ecc71]/60 text-xs font-bold text-[#e0e7e1] flex items-center gap-2 transition-all"
          >
            <mat-icon class="text-base text-[#2ecc71]">translate</mat-icon>
            <span class="font-mono">{{ loc.currentLang().toUpperCase() }}</span>
            <span class="text-[11px] text-[#e0e7e1]/60 font-persian">({{ loc.t('switch_lang') }})</span>
          </button>
        </div>
      </header>

      <!-- MAIN CONTENT: Navigation Buttons & Quick System Matrix -->
      <main class="flex-1 flex flex-col lg:flex-row px-6 sm:px-10 py-6 gap-10 items-center justify-between z-10 max-w-7xl mx-auto w-full">
        <!-- Navigation Menu Column -->
        <nav class="flex flex-col gap-3 w-full lg:w-80 font-persian">
          <!-- Resume / Start Game -->
          @if (gameState.isGameStarted()) {
            <button
              id="menu-resume-btn"
              (click)="gameState.togglePause()"
              class="group flex flex-col items-start p-4 border-l-4 border-[#2ecc71] bg-gradient-to-r from-[#2ecc71]/15 to-transparent text-left transition-all hover:pl-5 rounded-r-lg"
            >
              <div class="flex items-center justify-between w-full">
                <span class="text-xl sm:text-2xl font-bold uppercase text-white group-hover:text-[#2ecc71] transition-colors font-display">
                  {{ loc.t('menu_resume') }}
                </span>
                <span class="text-xs font-mono text-[#2ecc71] px-2 py-0.5 rounded bg-[#0a2e1c] border border-[#2ecc71]/40">[ESC]</span>
              </div>
              <span class="text-[11px] text-[#e0e7e1]/60 font-mono mt-0.5">ادامه ماموریت در البوکرکی</span>
            </button>
          } @else {
            <button
              id="menu-start-btn"
              (click)="gameState.startGame()"
              class="group flex flex-col items-start p-4 border-l-4 border-[#2ecc71] bg-gradient-to-r from-[#2ecc71]/15 to-transparent text-left transition-all hover:pl-5 rounded-r-lg"
            >
              <div class="flex items-center justify-between w-full">
                <span class="text-xl sm:text-2xl font-bold uppercase text-white group-hover:text-[#2ecc71] transition-colors font-display">
                  NEW EMPIRE
                </span>
                <mat-icon class="text-[#2ecc71] group-hover:translate-x-1 transition-transform">arrow_forward</mat-icon>
              </div>
              <span class="text-[11px] text-[#e0e7e1]/60 font-mono mt-0.5">{{ loc.t('menu_freeroam') }}</span>
            </button>
          }

          <!-- First-Person Chemistry Minigame -->
          <button
            id="menu-chem-btn"
            (click)="gameState.enterChemistryMinigame()"
            class="group flex flex-col items-start p-4 border-l-4 border-transparent hover:border-[#2ecc71] hover:bg-gradient-to-r hover:from-[#2ecc71]/10 hover:to-transparent text-left transition-all hover:pl-5 rounded-r-lg"
          >
            <div class="flex items-center justify-between w-full">
              <span class="text-lg sm:text-xl font-bold uppercase text-[#e0e7e1] group-hover:text-[#2ecc71] transition-colors font-display">
                Cook & Synthesis
              </span>
              <span class="text-[10px] font-mono text-[#2ecc71] px-1.5 py-0.5 rounded bg-[#0a2e1c] border border-[#2ecc71]/30">99.1%</span>
            </div>
            <span class="text-[11px] text-[#e0e7e1]/60 font-mono mt-0.5">{{ loc.t('menu_chemistry') }}</span>
          </button>

          <!-- Laundering Network -->
          <button
            id="menu-laundering-btn"
            (click)="gameState.isLaunderingOpen.set(true)"
            class="group flex flex-col items-start p-4 border-l-4 border-transparent hover:border-[#2ecc71] hover:bg-gradient-to-r hover:from-[#2ecc71]/10 hover:to-transparent text-left transition-all hover:pl-5 rounded-r-lg"
          >
            <div class="flex items-center justify-between w-full">
              <span class="text-lg sm:text-xl font-bold uppercase text-[#e0e7e1] group-hover:text-[#2ecc71] transition-colors font-display">
                Laundering Net
              </span>
              <span class="text-[10px] font-mono text-[#2ecc71] px-1.5 py-0.5 rounded bg-[#0a2e1c] border border-[#2ecc71]/30">A1A CARWASH</span>
            </div>
            <span class="text-[11px] text-[#e0e7e1]/60 font-mono mt-0.5">{{ loc.t('menu_laundering') }}</span>
          </button>

          <!-- Game Design Document (GDD) -->
          <button
            id="menu-gdd-btn"
            (click)="gameState.isGddOpen.set(true)"
            class="group flex flex-col items-start p-4 border-l-4 border-transparent hover:border-white/40 hover:bg-white/5 text-left transition-all hover:pl-5 rounded-r-lg"
          >
            <div class="flex items-center justify-between w-full">
              <span class="text-lg sm:text-xl font-bold uppercase text-[#e0e7e1] group-hover:text-white transition-colors font-display">
                Empire Blueprint
              </span>
              <mat-icon class="text-xs text-[#e0e7e1]/40">auto_stories</mat-icon>
            </div>
            <span class="text-[11px] text-[#e0e7e1]/60 font-mono mt-0.5">{{ loc.t('menu_gdd') }}</span>
          </button>

          <!-- Settings -->
          <button
            id="menu-settings-btn"
            (click)="gameState.isSettingsOpen.set(true)"
            class="group flex flex-col items-start p-4 border-l-4 border-transparent hover:border-white/40 hover:bg-white/5 text-left transition-all hover:pl-5 rounded-r-lg"
          >
            <div class="flex items-center justify-between w-full">
              <span class="text-lg sm:text-xl font-bold uppercase text-[#e0e7e1] group-hover:text-white transition-colors font-display">
                System Settings
              </span>
              <mat-icon class="text-xs text-[#e0e7e1]/40">tune</mat-icon>
            </div>
            <span class="text-[11px] text-[#e0e7e1]/60 font-mono mt-0.5">{{ loc.t('menu_settings') }}</span>
          </button>
        </nav>

        <!-- Right Side: Immersive Telemetry & System Matrix Panel -->
        <section class="flex-1 w-full max-w-xl">
          <div class="bg-black/50 border border-white/10 p-6 rounded-xl backdrop-blur-md shadow-2xl">
            <!-- Panel Header -->
            <div class="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
              <h2 class="text-xs uppercase tracking-[0.2em] font-bold text-white font-mono flex items-center gap-2">
                <mat-icon class="text-sm text-[#2ecc71]">settings</mat-icon>
                <span>System Settings / تنظیمات سیستم</span>
              </h2>
              <div class="flex-1 h-[1px] bg-white/5"></div>
              <div class="flex gap-2">
                <button
                  (click)="loc.setLanguage('en')"
                  class="px-2 py-0.5 text-[9px] font-bold rounded transition-colors font-mono"
                  [class.bg-[#2ecc71]]="loc.currentLang() === 'en'"
                  [class.text-black]="loc.currentLang() === 'en'"
                  [class.border]="loc.currentLang() !== 'en'"
                  [class.border-white/20]="loc.currentLang() !== 'en'"
                  [class.text-white]="loc.currentLang() !== 'en'"
                  [class.opacity-40]="loc.currentLang() !== 'en'"
                >
                  ENG
                </button>
                <button
                  (click)="loc.setLanguage('fa')"
                  class="px-2 py-0.5 text-[9px] font-bold rounded transition-colors font-mono"
                  [class.bg-[#2ecc71]]="loc.currentLang() === 'fa'"
                  [class.text-black]="loc.currentLang() === 'fa'"
                  [class.border]="loc.currentLang() !== 'fa'"
                  [class.border-white/20]="loc.currentLang() !== 'fa'"
                  [class.text-white]="loc.currentLang() !== 'fa'"
                  [class.opacity-40]="loc.currentLang() !== 'fa'"
                >
                  FA
                </button>
              </div>
            </div>

            <!-- 2-Column Matrix Controls -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono">
              <!-- Left Column: Texture Quality & Max Framerate -->
              <div class="space-y-4">
                <div class="flex flex-col gap-1.5">
                  <div class="flex justify-between text-[10px] uppercase">
                    <span>Texture Quality / بافت</span>
                    <span class="text-[#2ecc71] font-bold">{{ gameState.graphics().textureQuality.toUpperCase() }}</span>
                  </div>
                  <div class="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-[#2ecc71] shadow-[0_0_10px_rgba(46,204,113,0.5)] transition-all duration-300"
                      [style.width.%]="gameState.graphics().textureQuality === 'low' ? 30 : gameState.graphics().textureQuality === 'medium' ? 60 : gameState.graphics().textureQuality === 'high' ? 85 : 100"
                    ></div>
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <div class="flex justify-between text-[10px] uppercase">
                    <span>Max Framerate / نرخ فریم</span>
                    <span class="text-[#2ecc71] font-bold">
                      {{ gameState.graphics().fpsLimit ? gameState.graphics().fpsLimit + ' FPS' : 'UNLOCKED' }}
                    </span>
                  </div>
                  <div class="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-[#2ecc71] transition-all duration-300"
                      [style.width.%]="gameState.graphics().fpsLimit === 30 ? 30 : gameState.graphics().fpsLimit === 60 ? 60 : gameState.graphics().fpsLimit === 120 ? 85 : 100"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Right Column: Shadow Details & Bloom -->
              <div class="space-y-4 sm:border-l sm:border-white/10 sm:pl-6">
                <div class="flex flex-col gap-1.5">
                  <div class="flex justify-between text-[10px] uppercase">
                    <span>Shadow Details / سایه‌ها</span>
                    <span [class.text-[#2ecc71]]="gameState.graphics().shadows" [class.text-white/40]="!gameState.graphics().shadows">
                      {{ gameState.graphics().shadows ? 'ENABLED' : 'DISABLED' }}
                    </span>
                  </div>
                  <div class="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      class="h-full transition-all duration-300"
                      [class.bg-[#2ecc71]]="gameState.graphics().shadows"
                      [class.bg-white/30]="!gameState.graphics().shadows"
                      [style.width.%]="gameState.graphics().shadows ? 100 : 20"
                    ></div>
                  </div>
                </div>

                <div class="flex flex-col gap-1 text-[10px] uppercase text-white/60">
                  <span>Bloom & Desert Post-FX</span>
                  <div class="flex gap-2 mt-1">
                    <button
                      (click)="gameState.updateGraphics({bloom: false})"
                      class="w-full p-1.5 border text-center text-[9px] font-bold rounded transition-colors"
                      [class.border-[#2ecc71]]="!gameState.graphics().bloom"
                      [class.bg-[#2ecc71]/10]="!gameState.graphics().bloom"
                      [class.text-[#2ecc71]]="!gameState.graphics().bloom"
                      [class.border-white/20]="gameState.graphics().bloom"
                      [class.text-white/40]="gameState.graphics().bloom"
                    >
                      OFF
                    </button>
                    <button
                      (click)="gameState.updateGraphics({bloom: true})"
                      class="w-full p-1.5 border text-center text-[9px] font-bold rounded transition-colors"
                      [class.border-[#2ecc71]]="gameState.graphics().bloom"
                      [class.bg-[#2ecc71]/10]="gameState.graphics().bloom"
                      [class.text-[#2ecc71]]="gameState.graphics().bloom"
                      [class.border-white/20]="!gameState.graphics().bloom"
                      [class.text-white/40]="!gameState.graphics().bloom"
                    >
                      ON
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Financial Summary Ribbon -->
            <div class="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span class="text-[#e0e7e1]/60 uppercase text-[10px]">Laundered Clean Reserve:</span>
              <span class="text-[#2ecc71] font-bold text-sm">\${{ gameState.cleanCash().toLocaleString() }}</span>
            </div>
          </div>
        </section>
      </main>

      <!-- FOOTER -->
      <footer class="p-4 sm:p-6 bg-black/80 border-t border-white/5 flex flex-wrap justify-between items-center z-10 gap-4">
        <div class="flex gap-4 sm:gap-6 items-center">
          <div class="flex flex-col">
            <span class="text-[9px] opacity-40 uppercase font-mono">Active Lab</span>
            <span class="text-xs font-mono text-[#2ecc71] font-bold">Superlab-ABQ-01</span>
          </div>
          <div class="w-[1px] h-6 bg-white/10"></div>
          <div class="flex flex-col">
            <span class="text-[9px] opacity-40 uppercase font-mono">Stock Availability</span>
            <span class="text-xs font-mono text-[#e0e7e1]">245.8 KG P-METH</span>
          </div>
          <div class="w-[1px] h-6 bg-white/10 hidden sm:block"></div>
          <div class="flex flex-col hidden sm:flex">
            <span class="text-[9px] opacity-40 uppercase font-mono">Engine</span>
            <span class="text-xs font-mono text-[#e0e7e1]/80">Three.js / WebGL 2.0</span>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-[10px] opacity-70 font-mono tracking-wider uppercase text-white font-bold">I AM THE ONE WHO KNOCKS</p>
            <p class="text-[8px] opacity-40 font-mono uppercase">Heisenberg Legacy © 2024</p>
          </div>
          <div class="w-9 h-9 rounded-full border border-[#2ecc71]/40 flex items-center justify-center p-1 shadow-[0_0_10px_rgba(46,204,113,0.3)]">
            <div class="w-full h-full rounded-full bg-[#2ecc71] animate-pulse"></div>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class MainMenu {
  gameState = inject(GameStateService);
  loc = inject(LocalizationService);
  audio = inject(GameAudioService);
}
