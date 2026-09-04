import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {GameStateService} from '../../services/game-state.service';
import {LocalizationService} from '../../services/localization.service';

@Component({
  selector: 'app-dialogue-overlay',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (gameState.currentDialogue(); as dialogue) {
      <div
        id="dialogue-backdrop"
        class="fixed inset-0 z-50 flex items-end justify-center pb-12 px-4 bg-black/75 backdrop-blur-md animate-fade-in font-persian"
      >
        <div
          id="dialogue-box"
          class="relative w-full max-w-3xl bg-[#050807] border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row gap-6 items-start text-[#e0e7e1]"
        >
          <!-- Speaker Avatar / Character Badge -->
          <div class="flex flex-col items-center gap-2 flex-shrink-0">
            <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-[#2ecc71]/50 shadow-[0_0_15px_rgba(46,204,113,0.3)] bg-[#0a2e1c] flex items-center justify-center">
              <mat-icon class="text-3xl text-[#2ecc71]">person</mat-icon>
            </div>
            <span class="text-xs font-bold text-[#2ecc71] font-mono tracking-wider uppercase">
              {{ dialogue.speakerKey }}
            </span>
          </div>

          <!-- Dialogue Content & Choices -->
          <div class="flex-1 space-y-4">
            <!-- Line of speech -->
            <div class="p-4 rounded-xl bg-black/60 border border-white/10 text-sm font-persian text-white leading-relaxed">
              "{{ dialogue.textKey }}"
            </div>

            <!-- Branching Choices -->
            <div class="space-y-2">
              <span class="text-[11px] font-bold text-[#e0e7e1]/60 uppercase tracking-wider font-persian block">
                انتخاب پاسخ (تاثیر مستقیم بر Ego و Family):
              </span>
              @for (choice of dialogue.choices; track choice.textKey; let idx = $index) {
                <button
                  (click)="gameState.selectDialogueChoice(idx)"
                  class="w-full text-left p-3.5 rounded-xl bg-black/60 hover:bg-[#0a2e1c]/40 border border-white/10 hover:border-[#2ecc71]/40 transition-all flex items-center justify-between group"
                >
                  <span class="text-xs font-persian text-[#e0e7e1] group-hover:text-[#2ecc71] transition-colors">
                    {{ idx + 1 }}. {{ choice.textKey }}
                  </span>

                  <!-- Delta Badges -->
                  <div class="flex items-center gap-2 text-[10px] font-mono">
                    @if (choice.egoDelta !== 0) {
                      <span [class.text-amber-400]="choice.egoDelta > 0" [class.text-[#e0e7e1]/40]="choice.egoDelta <= 0">
                        EGO {{ choice.egoDelta > 0 ? '+' : '' }}{{ choice.egoDelta }}
                      </span>
                    }
                    @if (choice.familyDelta !== 0) {
                      <span [class.text-sky-400]="choice.familyDelta > 0" [class.text-[#e0e7e1]/40]="choice.familyDelta <= 0">
                        FAM {{ choice.familyDelta > 0 ? '+' : '' }}{{ choice.familyDelta }}
                      </span>
                    }
                    @if (choice.heatDelta !== 0) {
                      <span [class.text-red-400]="choice.heatDelta > 0" [class.text-[#2ecc71]]="choice.heatDelta <= 0">
                        HEAT {{ choice.heatDelta > 0 ? '+' : '' }}{{ choice.heatDelta }}
                      </span>
                    }
                  </div>
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class DialogueOverlay {
  gameState = inject(GameStateService);
  loc = inject(LocalizationService);
}
