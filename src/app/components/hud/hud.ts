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
  selector: 'app-hud',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-3 sm:p-5 select-none font-persian">
      <!-- TOP HUD BAR -->
      <div class="flex flex-wrap items-start justify-between gap-3">
        <!-- Active Quest & Objectives Tracker -->
        <div class="pointer-events-auto bg-[#050807]/90 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl max-w-sm">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold text-[#2ecc71] flex items-center gap-1.5 uppercase tracking-wider font-mono">
              <mat-icon class="text-sm text-[#2ecc71]">flag</mat-icon>
              {{ loc.t('mission_current') }}
            </span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0a2e1c] text-[#2ecc71] border border-[#2ecc71]/30 font-bold">
              +\${{ gameState.activeQuest().rewardCash.toLocaleString() }}
            </span>
          </div>

          <h3 class="text-sm font-bold text-white mb-1 tracking-wide">
            {{ loc.t(gameState.activeQuest().titleKey) }}
          </h3>
          <p class="text-xs text-[#e0e7e1]/70 leading-relaxed mb-3">
            {{ loc.t(gameState.activeQuest().descKey) }}
          </p>

          <!-- Current Step -->
          @let curStep = gameState.activeQuest().steps[gameState.activeQuest().currentStepIndex];
          @if (curStep) {
            <div class="flex items-center gap-2 p-2 rounded-lg bg-black/60 border border-white/10 text-xs">
              <mat-icon class="text-[#2ecc71] text-sm">radio_button_checked</mat-icon>
              <span class="text-[#e0e7e1] font-medium flex-1">
                {{ loc.t(curStep.textKey) }}
              </span>
            </div>
          }
        </div>

        <!-- Center: DEA Heat & Ego / Family Balances -->
        <div class="pointer-events-auto bg-[#050807]/90 backdrop-blur-md border border-white/10 rounded-xl px-5 py-3 shadow-2xl flex flex-col items-center gap-2.5">
          <!-- DEA Heat Meter with Glowing Indicator Bars -->
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold text-red-400 flex items-center gap-1 font-mono uppercase tracking-wider">
              <mat-icon class="text-sm">security</mat-icon>
              {{ loc.t('dea_heat') }}
            </span>

            <div class="flex items-center gap-1.5">
              @for (star of [1, 2, 3, 4, 5]; track star) {
                <div
                  class="w-3.5 h-2 rounded-sm transition-all"
                  [class.bg-red-600]="star <= gameState.heatStars()"
                  [class.shadow-[0_0_8px_rgba(220,38,38,0.9)]]="star <= gameState.heatStars()"
                  [class.animate-pulse]="star <= gameState.heatStars() && gameState.heatStars() >= 3"
                  [class.bg-white/15]="star > gameState.heatStars()"
                ></div>
              }
            </div>

            <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-500/30">
              {{ gameState.heatPoints() }}%
            </span>
          </div>

          <!-- Ego vs Family Progress Bar -->
          <div class="w-72 space-y-1">
            <div class="flex justify-between text-[10px] font-bold font-mono">
              <span class="text-amber-400">{{ loc.t('ego') }}: {{ gameState.egoLevel() }}%</span>
              <span class="text-[#2ecc71]">{{ loc.t('family') }}: {{ gameState.familyLevel() }}%</span>
            </div>
            <div class="w-full h-1.5 rounded-full bg-white/10 overflow-hidden flex">
              <div class="bg-amber-500 h-full transition-all duration-300" [style.width.%]="gameState.egoLevel()"></div>
              <div class="bg-[#2ecc71] h-full transition-all duration-300 shadow-[0_0_6px_rgba(46,204,113,0.6)]" [style.width.%]="gameState.familyLevel()"></div>
            </div>
          </div>
        </div>

        <!-- Right Side: Money & Quick Settings / Lang Toggle -->
        <div class="pointer-events-auto flex flex-col items-end gap-2">
          <!-- Cash Counters -->
          <div class="bg-[#050807]/90 backdrop-blur-md border border-white/10 rounded-xl px-5 py-3 shadow-2xl space-y-1 text-right">
            <!-- Clean Cash -->
            <div class="flex items-center justify-end gap-2">
              <span class="text-xs text-[#2ecc71]/80 font-mono uppercase text-[10px]">{{ loc.t('clean_cash') }}:</span>
              <span class="text-base font-bold font-mono text-[#2ecc71] shadow-[0_0_8px_rgba(46,204,113,0.3)]">
                \${{ gameState.cleanCash().toLocaleString() }}
              </span>
            </div>
            <!-- Dirty Street Cash -->
            <div class="flex items-center justify-end gap-2">
              <span class="text-xs text-amber-400/80 font-mono uppercase text-[10px]">{{ loc.t('dirty_cash') }}:</span>
              <span class="text-base font-bold font-mono text-amber-400">
                \${{ gameState.dirtyCash().toLocaleString() }}
              </span>
            </div>
          </div>

          <!-- Quick Actions & Lang Switcher -->
          <div class="flex items-center gap-2">
            <!-- Language Quick Toggle -->
            <button
              id="hud-lang-toggle-btn"
              (click)="loc.toggleLanguage()"
              class="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-[#0a2e1c]/60 border border-white/10 hover:border-[#2ecc71]/50 text-xs font-bold text-[#e0e7e1] flex items-center gap-1.5 transition-colors shadow-lg"
            >
              <mat-icon class="text-sm text-[#2ecc71]">translate</mat-icon>
              <span class="font-mono">{{ loc.currentLang().toUpperCase() }}</span>
            </button>

            <!-- Settings -->
            <button
              id="hud-settings-btn"
              (click)="gameState.isSettingsOpen.set(true)"
              class="p-2 rounded-lg bg-black/60 hover:bg-[#0a2e1c]/60 border border-white/10 hover:border-[#2ecc71]/50 text-[#e0e7e1] transition-colors shadow-lg"
              title="تنظیمات"
            >
              <mat-icon class="text-base">tune</mat-icon>
            </button>

            <!-- GDD -->
            <button
              id="hud-gdd-btn"
              (click)="gameState.isGddOpen.set(true)"
              class="p-2 rounded-lg bg-black/60 hover:bg-[#0a2e1c]/60 border border-white/10 hover:border-[#2ecc71]/50 text-[#2ecc71] transition-colors shadow-lg"
              title="سند طراحی بازی"
            >
              <mat-icon class="text-base">auto_stories</mat-icon>
            </button>

            <!-- FPS Indicator if enabled -->
            @if (gameState.graphics().showFps) {
              <div class="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-[11px] font-mono text-[#2ecc71]">
                {{ gameState.currentFps() }} FPS
              </div>
            }
          </div>
        </div>
      </div>

      <!-- CENTER NOTIFICATION TOAST & IN-WORLD INTERACTION PROMPTS -->
      <div class="self-center flex flex-col items-center gap-3">
        @if (gameState.activeInteraction(); as interact) {
          <div class="pointer-events-auto bg-[#050807]/95 border-2 border-[#2ecc71] text-white px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(46,204,113,0.4)] flex items-center gap-4 backdrop-blur-xl animate-pulse">
            <div class="w-10 h-10 rounded-xl bg-[#2ecc71] text-neutral-950 flex items-center justify-center font-black text-lg shadow-lg font-mono">
              {{ interact.actionKey }}
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-[#2ecc71] font-bold tracking-wide flex items-center gap-1.5">
                <mat-icon class="text-sm text-[#2ecc71]">{{ interact.icon || 'touch_app' }}</mat-icon>
                {{ loc.currentLang() === 'fa' ? interact.label : (interact.labelEn || interact.label) }}
              </span>
              <span class="text-sm font-black text-white">
                {{ loc.currentLang() === 'fa' ? interact.actionText : (interact.actionTextEn || interact.actionText) }}
              </span>
            </div>
          </div>
        }

        @if (gameState.toastMessage(); as toast) {
          <div class="pointer-events-auto bg-[#050807]/95 border border-[#2ecc71]/60 text-[#2ecc71] px-6 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md">
            <mat-icon class="text-[#2ecc71] text-base">notifications_active</mat-icon>
            <span>{{ toast }}</span>
          </div>
        }
      </div>

      <!-- BOTTOM HUD BAR -->
      <div class="flex flex-wrap items-end justify-between gap-3">
        <!-- Nearest Location Interaction Prompts -->
        <div class="pointer-events-auto bg-[#050807]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl flex items-center gap-3">
          @let near = gameState.nearestLocation();
          @if (near.location) {
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center text-neutral-950 font-bold shadow-md"
              [style.background-color]="near.location.color"
            >
              <mat-icon>{{ near.location.icon }}</mat-icon>
            </div>
            <div>
              <span class="text-xs font-bold text-white block">{{ loc.t(near.location.nameKey) }}</span>
              <span class="text-[11px] text-[#e0e7e1]/70 font-mono">
                فاصله: {{ near.distance }} {{ loc.t('dist_meters') }}
                @if (near.isInside) {
                  <span class="text-[#2ecc71] font-bold mr-2 font-persian">({{ loc.t('interact_action') }})</span>
                }
              </span>
            </div>
          }
        </div>

        <!-- Quick Controls Ribbon -->
        <div class="pointer-events-auto bg-[#050807]/90 backdrop-blur-md border border-white/10 rounded-xl px-3.5 py-2 shadow-2xl flex items-center gap-2">
          <!-- Camera Mode Toggle -->
          <button
            id="hud-cam-btn"
            (click)="gameState.toggleCamera()"
            class="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-[#0a2e1c]/60 border border-white/10 hover:border-[#2ecc71]/50 text-xs font-medium text-[#e0e7e1] flex items-center gap-1.5 transition-all active:scale-95"
          >
            <mat-icon class="text-base text-[#2ecc71]">videocam</mat-icon>
            <span>{{ gameState.cameraMode() === 'third-person' ? loc.t('cam_first_person') : loc.t('cam_third_person') }}</span>
          </button>

          <!-- Vehicle Enter/Exit -->
          <button
            id="hud-vehicle-btn"
            (click)="gameState.toggleVehicle()"
            class="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-[#0a2e1c]/60 border border-white/10 hover:border-amber-400/50 text-xs font-medium text-[#e0e7e1] flex items-center gap-1.5 transition-all active:scale-95"
          >
            <mat-icon class="text-base text-amber-400">directions_car</mat-icon>
            <span>{{ gameState.inVehicle() === 'none' ? loc.t('drive_vehicle') : loc.t('exit_vehicle') }}</span>
          </button>

          <!-- Chemistry Lab Open -->
          <button
            id="hud-chem-btn"
            (click)="gameState.enterChemistryMinigame()"
            class="px-3 py-1.5 rounded-lg bg-[#0a2e1c]/80 hover:bg-[#0a2e1c] border border-[#2ecc71]/50 text-xs font-medium text-[#2ecc71] flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_10px_rgba(46,204,113,0.2)]"
          >
            <mat-icon class="text-base text-[#2ecc71]">science</mat-icon>
            <span>{{ loc.t('menu_chemistry') }}</span>
          </button>

          <!-- Laundering Network -->
          <button
            id="hud-laundering-btn"
            (click)="gameState.isLaunderingOpen.set(true)"
            class="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-[#0a2e1c]/60 border border-white/10 hover:border-[#2ecc71]/50 text-xs font-medium text-[#e0e7e1] flex items-center gap-1.5 transition-all active:scale-95"
          >
            <mat-icon class="text-base text-[#2ecc71]">account_balance</mat-icon>
            <span>{{ loc.t('menu_laundering') }}</span>
          </button>

          <!-- World Map -->
          <button
            id="hud-map-btn"
            (click)="gameState.isMapOpen.set(true)"
            class="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-[#0a2e1c]/60 border border-white/10 hover:border-amber-400/50 text-xs font-medium text-[#e0e7e1] flex items-center gap-1.5 transition-all active:scale-95"
          >
            <mat-icon class="text-base text-amber-400">map</mat-icon>
            <span>{{ loc.t('toggle_map') }}</span>
          </button>

          <!-- Pause / Main Menu -->
          <button
            id="hud-pause-btn"
            (click)="gameState.togglePause()"
            class="p-1.5 rounded-lg bg-black/60 hover:bg-[#0a2e1c]/60 border border-white/10 text-white/60 hover:text-white transition-all active:scale-95"
          >
            <mat-icon class="text-base">pause</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class Hud {
  gameState = inject(GameStateService);
  loc = inject(LocalizationService);
  audio = inject(GameAudioService);
}
