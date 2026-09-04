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
  selector: 'app-chemistry-lab',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      id="chemistry-modal-backdrop"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in font-persian"
    >
      <div
        id="chemistry-lab-window"
        class="relative w-full max-w-4xl bg-[#050807] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#e0e7e1]"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-white/10 bg-black/60 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#0a2e1c] border border-[#2ecc71]/40 flex items-center justify-center text-[#2ecc71] shadow-[0_0_12px_rgba(46,204,113,0.3)]">
              <mat-icon>science</mat-icon>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                {{ loc.t('chem_title') }}
                <span class="text-xs px-2 py-0.5 rounded-full bg-[#0a2e1c] text-[#2ecc71] font-mono border border-[#2ecc71]/40">
                  99.1% FORMULA
                </span>
              </h2>
              <p class="text-xs text-[#e0e7e1]/60 font-persian">{{ loc.t('chem_subtitle') }}</p>
            </div>
          </div>

          <button
            id="chem-close-btn"
            (click)="gameState.closeChemistryMinigame()"
            class="w-9 h-9 rounded-lg bg-black/60 hover:bg-[#0a2e1c] text-white/50 hover:text-[#2ecc71] border border-white/10 flex items-center justify-center transition-colors"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Overheat / Gas Hazard Banner -->
        @if (gameState.chemState().isOverheating) {
          <div class="bg-red-950/90 border-y border-red-500/50 px-6 py-2.5 flex items-center gap-3 text-red-300 text-sm font-semibold animate-pulse">
            <mat-icon class="text-red-400">warning</mat-icon>
            <span>{{ loc.t('chem_hazard_warning') }}</span>
          </div>
        }

        <!-- Main Lab Bench View (First-Person Simulation) -->
        <div class="p-6 overflow-y-auto space-y-6 flex-1">
          <!-- Central Flask & Reaction Visualizer -->
          <div class="relative bg-black/50 border border-white/10 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
            <!-- Flask Visual -->
            <div class="relative w-44 h-56 flex items-end justify-center">
              <!-- Glass Flask Outer -->
              <div class="relative w-40 h-44 rounded-b-3xl rounded-t-lg border-2 border-[#2ecc71]/40 bg-[#0a2e1c]/30 backdrop-blur-sm overflow-hidden flex items-end shadow-[0_0_30px_rgba(46,204,113,0.15)]">
                <!-- Neck of Flask -->
                <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-10 h-14 border-x-2 border-[#2ecc71]/40 bg-[#0a2e1c]/30"></div>

                <!-- Bubbling Solution Level -->
                <div
                  class="w-full bg-gradient-to-t from-emerald-600 via-[#2ecc71] to-cyan-300/80 transition-all duration-300 relative flex items-center justify-center"
                  [style.height.%]="Math.min(95, 20 + gameState.chemState().reactionProgress * 0.75)"
                >
                  <!-- Floating Crystal particles -->
                  <div class="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-emerald-200 to-transparent"></div>
                  <!-- Chemical bubbles -->
                  <div class="w-3 h-3 rounded-full bg-white/70 absolute bottom-3 left-6 animate-bounce"></div>
                  <div class="w-2 h-2 rounded-full bg-white/50 absolute bottom-8 right-8 animate-ping"></div>
                </div>
              </div>

              <!-- Bunsen Burner Flame Beneath -->
              <div class="absolute -bottom-5 flex flex-col items-center">
                <div
                  class="w-6 h-10 rounded-full bg-gradient-to-t from-amber-500 via-yellow-300 to-[#2ecc71] blur-[2px] transition-all duration-300"
                  [style.transform]="'scale(' + (gameState.chemState().temperature / 50) + ')'"
                ></div>
                <div class="w-14 h-2 bg-neutral-800 rounded-full"></div>
              </div>
            </div>

            <!-- Reaction Gauges & Telemetry -->
            <div class="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
              <!-- Temperature Dial -->
              <div class="p-4 rounded-xl bg-black/60 border border-white/10">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs text-[#e0e7e1]/60 font-persian">{{ loc.t('chem_temp') }}</span>
                  <span
                    class="text-sm font-bold font-mono px-2 py-0.5 rounded"
                    [class.text-[#2ecc71]]="gameState.chemState().temperature >= 76 && gameState.chemState().temperature <= 82"
                    [class.text-amber-400]="gameState.chemState().temperature < 76"
                    [class.text-red-400]="gameState.chemState().temperature > 88"
                  >
                    {{ gameState.chemState().temperature }} °C
                  </span>
                </div>
                <!-- Progress bar with Target zone -->
                <div class="relative w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    class="h-full transition-all duration-200"
                    [style.width.%]="(gameState.chemState().temperature / 135) * 100"
                    [class.bg-sky-500]="gameState.chemState().temperature < 76"
                    [class.bg-[#2ecc71]]="gameState.chemState().temperature >= 76 && gameState.chemState().temperature <= 82"
                    [class.shadow-[0_0_10px_rgba(46,204,113,0.6)]]="gameState.chemState().temperature >= 76 && gameState.chemState().temperature <= 82"
                    [class.bg-red-500]="gameState.chemState().temperature > 88"
                  ></div>
                  <!-- Target zone marker (76-82C) -->
                  <div class="absolute top-0 bottom-0 left-[56%] w-[7%] bg-[#2ecc71]/40 border-x border-[#2ecc71]"></div>
                </div>
                <p class="text-[11px] text-[#e0e7e1]/50 mt-1 font-persian">{{ loc.t('chem_temp_target') }}</p>
              </div>

              <!-- Purity Gauge -->
              <div class="p-4 rounded-xl bg-black/60 border border-[#2ecc71]/30">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs text-[#2ecc71] font-persian">{{ loc.t('chem_live_purity') }}</span>
                  <span class="text-lg font-black font-display text-[#2ecc71] shadow-[0_0_10px_rgba(46,204,113,0.3)]">
                    {{ gameState.chemState().currentPurity }}%
                  </span>
                </div>
                <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-emerald-600 via-[#2ecc71] to-teal-200 transition-all duration-200 shadow-[0_0_10px_rgba(46,204,113,0.5)]"
                    [style.width.%]="gameState.chemState().currentPurity"
                  ></div>
                </div>
                <p class="text-[11px] text-[#2ecc71]/80 mt-1 font-mono">Target: 99.1% (Blue Sky Standard)</p>
              </div>

              <!-- Methylamine Level -->
              <div class="p-4 rounded-xl bg-black/60 border border-white/10">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs text-[#e0e7e1]/60 font-persian">{{ loc.t('chem_inject_methylamine') }}</span>
                  <span class="text-sm font-mono text-[#e0e7e1]">{{ gameState.chemState().methylamineInjected }}%</span>
                </div>
                <div class="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div class="h-full bg-indigo-500 transition-all duration-200" [style.width.%]="gameState.chemState().methylamineInjected"></div>
                </div>
              </div>

              <!-- Reaction Progress -->
              <div class="p-4 rounded-xl bg-black/60 border border-white/10">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs text-[#e0e7e1]/60 font-persian">{{ loc.t('chem_progress') }}</span>
                  <span class="text-sm font-mono text-[#2ecc71] font-bold">{{ gameState.chemState().reactionProgress }}%</span>
                </div>
                <div class="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div class="h-full bg-[#2ecc71] shadow-[0_0_8px_rgba(46,204,113,0.5)] transition-all duration-200" [style.width.%]="gameState.chemState().reactionProgress"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Interactive Chemical Control Stations -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <!-- Heat Up -->
            <button
              id="chem-heat-up-btn"
              (click)="gameState.heatUpChem()"
              class="flex flex-col items-center justify-center p-3.5 rounded-xl bg-black/60 hover:bg-neutral-900 border border-amber-500/30 text-amber-300 transition-all active:scale-95 group"
            >
              <mat-icon class="group-hover:scale-110 transition-transform">local_fire_department</mat-icon>
              <span class="text-xs font-semibold mt-1 font-persian">{{ loc.t('chem_heat_up') }}</span>
              <span class="text-[10px] text-[#e0e7e1]/50 font-mono">+4.5 °C</span>
            </button>

            <!-- Cool Down -->
            <button
              id="chem-cool-down-btn"
              (click)="gameState.coolDownChem()"
              class="flex flex-col items-center justify-center p-3.5 rounded-xl bg-black/60 hover:bg-neutral-900 border border-sky-500/30 text-sky-300 transition-all active:scale-95 group"
            >
              <mat-icon class="group-hover:scale-110 transition-transform">ac_unit</mat-icon>
              <span class="text-xs font-semibold mt-1 font-persian">{{ loc.t('chem_cool_down') }}</span>
              <span class="text-[10px] text-[#e0e7e1]/50 font-mono">-6.0 °C</span>
            </button>

            <!-- Inject Methylamine -->
            <button
              id="chem-inject-btn"
              (click)="gameState.injectMethylamine()"
              class="flex flex-col items-center justify-center p-3.5 rounded-xl bg-black/60 hover:bg-neutral-900 border border-indigo-500/30 text-indigo-300 transition-all active:scale-95 group"
            >
              <mat-icon class="group-hover:scale-110 transition-transform">colorize</mat-icon>
              <span class="text-xs font-semibold mt-1 font-persian">{{ loc.t('chem_inject_methylamine') }}</span>
              <span class="text-[10px] text-[#e0e7e1]/50 font-mono">CH3NH2</span>
            </button>

            <!-- Add Catalyst -->
            <button
              id="chem-catalyst-btn"
              (click)="gameState.addCatalyst()"
              class="flex flex-col items-center justify-center p-3.5 rounded-xl bg-black/60 hover:bg-[#0a2e1c]/60 border border-[#2ecc71]/40 text-[#2ecc71] transition-all active:scale-95 group"
            >
              <mat-icon class="group-hover:scale-110 transition-transform">scatter_plot</mat-icon>
              <span class="text-xs font-semibold mt-1 font-persian">{{ loc.t('chem_add_catalyst') }}</span>
              <span class="text-[10px] text-[#2ecc71]/70 font-mono">P2P Catalyst</span>
            </button>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="px-6 py-4 border-t border-white/10 bg-black/80 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xs text-[#e0e7e1]/60 font-persian">وضعیت آزمایش:</span>
            <span
              class="text-xs font-semibold font-mono"
              [class.text-[#2ecc71]]="gameState.chemState().currentPurity >= 96"
              [class.text-amber-400]="gameState.chemState().currentPurity < 96"
            >
              {{ gameState.chemState().currentPurity >= 99.0 ? 'Heisenberg Grade' : 'Standard Yield' }}
            </span>
          </div>

          <button
            id="chem-finish-btn"
            (click)="gameState.finishChemBatch()"
            [disabled]="gameState.chemState().reactionProgress < 40"
            class="px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center gap-2 font-mono"
            [class.bg-[#2ecc71]]="gameState.chemState().reactionProgress >= 40"
            [class.shadow-[0_0_15px_rgba(46,204,113,0.4)]]="gameState.chemState().reactionProgress >= 40"
            [class.text-black]="gameState.chemState().reactionProgress >= 40"
            [class.hover:opacity-90]="gameState.chemState().reactionProgress >= 40"
            [class.bg-white/10]="gameState.chemState().reactionProgress < 40"
            [class.text-white/30]="gameState.chemState().reactionProgress < 40"
            [class.cursor-not-allowed]="gameState.chemState().reactionProgress < 40"
          >
            <mat-icon>inventory_2</mat-icon>
            <span class="font-persian">{{ loc.t('chem_finish_batch') }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ChemistryLab {
  gameState = inject(GameStateService);
  loc = inject(LocalizationService);
  audio = inject(GameAudioService);

  Math = Math;
}
