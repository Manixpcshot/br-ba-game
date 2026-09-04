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
  selector: 'app-laundering-modal',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      id="laundering-modal-backdrop"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in font-persian"
    >
      <div
        id="laundering-window"
        class="relative w-full max-w-4xl bg-[#050807] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#e0e7e1]"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-white/10 bg-black/60 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#0a2e1c] border border-[#2ecc71]/40 flex items-center justify-center text-[#2ecc71] shadow-[0_0_12px_rgba(46,204,113,0.3)]">
              <mat-icon>account_balance</mat-icon>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                {{ loc.t('laundering_title') }}
                <span class="text-xs font-mono px-2 py-0.5 rounded bg-[#0a2e1c] text-[#2ecc71] border border-[#2ecc71]/30">
                  FINANCIAL LEDGER
                </span>
              </h2>
              <p class="text-xs text-[#e0e7e1]/60 font-persian">{{ loc.t('laundering_desc') }}</p>
            </div>
          </div>

          <button
            id="laundering-close-btn"
            (click)="gameState.isLaunderingOpen.set(false)"
            class="w-9 h-9 rounded-lg bg-black/60 hover:bg-[#0a2e1c] text-white/50 hover:text-[#2ecc71] border border-white/10 flex items-center justify-center transition-colors"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Ledger Financial Bar -->
        <div class="grid grid-cols-1 sm:grid-cols-2 bg-black/40 border-b border-white/10 px-6 py-4 gap-4 font-mono">
          <!-- Clean Funds -->
          <div class="flex items-center gap-3 p-3.5 rounded-xl bg-[#0a2e1c]/40 border border-[#2ecc71]/30">
            <div class="w-10 h-10 rounded-lg bg-[#2ecc71]/10 text-[#2ecc71] flex items-center justify-center">
              <mat-icon>verified</mat-icon>
            </div>
            <div>
              <span class="text-xs text-[#2ecc71]/80 font-persian">{{ loc.t('clean_cash') }}</span>
              <p class="text-xl font-black font-display text-[#2ecc71] shadow-[0_0_10px_rgba(46,204,113,0.2)]">
                \${{ gameState.cleanCash().toLocaleString() }}
              </p>
            </div>
          </div>

          <!-- Dirty Street Cash -->
          <div class="flex items-center gap-3 p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
            <div class="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <mat-icon>attach_money</mat-icon>
            </div>
            <div>
              <span class="text-xs text-amber-400/80 font-persian">{{ loc.t('dirty_cash') }}</span>
              <p class="text-xl font-black font-display text-amber-400">
                \${{ gameState.dirtyCash().toLocaleString() }}
              </p>
            </div>
          </div>
        </div>

        <!-- Emergency Heat Cooldown Actions (Saul & Acid) -->
        <div class="px-6 py-3 bg-black/60 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xs text-[#e0e7e1]/60 font-persian">عملیات کاهش سوءظن:</span>
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-500/30">
              DEA Heat: {{ gameState.heatPoints() }}%
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              id="call-saul-btn"
              (click)="gameState.reduceHeatWithSaul()"
              class="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <mat-icon class="text-base">phone_in_talk</mat-icon>
              <span>{{ loc.t('reduce_heat_saul') }}</span>
            </button>

            <button
              id="destroy-evidence-btn"
              (click)="gameState.destroyEvidence()"
              class="px-3.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <mat-icon class="text-base">delete_forever</mat-icon>
              <span>{{ loc.t('destroy_evidence') }}</span>
            </button>
          </div>
        </div>

        <!-- Business Network Cards -->
        <div class="p-6 overflow-y-auto space-y-4 flex-1">
          @for (biz of gameState.businesses(); track biz.id) {
            <div
              class="p-5 rounded-2xl bg-black/50 border transition-all"
              [class.border-[#2ecc71]/30]="biz.owned"
              [class.border-white/10]="!biz.owned"
            >
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <h3 class="text-base font-bold text-white">{{ loc.t(biz.nameKey) }}</h3>
                    @if (biz.owned) {
                      <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#0a2e1c] text-[#2ecc71] border border-[#2ecc71]/40 font-mono font-bold">
                        OWNED (Lvl {{ biz.level }})
                      </span>
                    } @else {
                      <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50 font-mono font-bold">
                        LOCKED
                      </span>
                    }
                  </div>
                  <p class="text-xs text-[#e0e7e1]/60 font-persian max-w-xl">{{ loc.t(biz.descKey) }}</p>
                </div>

                <!-- Stats & Actions -->
                <div class="flex flex-wrap items-center gap-3">
                  @if (biz.owned) {
                    <!-- Quick Transfer Buttons -->
                    <div class="flex items-center gap-1.5 font-mono">
                      <button
                        (click)="gameState.launderCash(10000, biz.id)"
                        class="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-neutral-800 text-xs text-[#e0e7e1] border border-white/10 transition-colors"
                      >
                        +$10k
                      </button>
                      <button
                        (click)="gameState.launderCash(25000, biz.id)"
                        class="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-neutral-800 text-xs text-[#e0e7e1] border border-white/10 transition-colors"
                      >
                        +$25k
                      </button>
                      <button
                        (click)="gameState.launderCash(50000, biz.id)"
                        class="px-2.5 py-1.5 rounded-lg bg-[#0a2e1c] hover:bg-[#0e3d25] text-xs text-[#2ecc71] border border-[#2ecc71]/40 transition-colors"
                      >
                        +$50k
                      </button>
                    </div>

                    <button
                      (click)="gameState.upgradeBusiness(biz.id)"
                      class="px-3.5 py-1.5 rounded-xl bg-black/60 hover:bg-neutral-800 text-xs font-semibold text-[#e0e7e1] border border-white/10 flex items-center gap-1 transition-colors"
                    >
                      <mat-icon class="text-sm">upgrade</mat-icon>
                      <span>{{ loc.t('upgrade_business') }}</span>
                    </button>
                  } @else {
                    <button
                      (click)="gameState.buyBusiness(biz.id)"
                      class="px-4 py-2 rounded-xl bg-[#2ecc71] hover:bg-[#27ae60] text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(46,204,113,0.3)] font-mono"
                    >
                      <mat-icon class="text-base">shopping_cart</mat-icon>
                      <span class="font-persian">{{ loc.t('buy_business') }} (\${{ biz.cost.toLocaleString() }})</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Metric Badges -->
              <div class="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div>
                  <span class="text-[#e0e7e1]/50 font-persian block text-[10px]">{{ loc.t('clean_capacity') }}</span>
                  <span class="text-[#e0e7e1] font-semibold">\${{ biz.cleanCapacityWeekly.toLocaleString() }}/wk</span>
                </div>
                <div>
                  <span class="text-[#e0e7e1]/50 font-persian block text-[10px]">{{ loc.t('irs_audit_risk') }}</span>
                  <span class="font-semibold" [class.text-[#2ecc71]]="biz.irsRiskPercent < 15" [class.text-amber-400]="biz.irsRiskPercent >= 15">
                    {{ biz.irsRiskPercent }}%
                  </span>
                </div>
                <div>
                  <span class="text-[#e0e7e1]/50 font-persian block text-[10px]">درآمد قانونی هفتگی</span>
                  <span class="text-[#2ecc71] font-semibold">\${{ biz.revenueWeekly.toLocaleString() }}/wk</span>
                </div>
                <div>
                  <span class="text-[#e0e7e1]/50 font-persian block text-[10px]">سطح ارتقا</span>
                  <span class="text-[#e0e7e1] font-semibold">Tier {{ biz.level }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class LaunderingModal {
  gameState = inject(GameStateService);
  loc = inject(LocalizationService);
  audio = inject(GameAudioService);
}
