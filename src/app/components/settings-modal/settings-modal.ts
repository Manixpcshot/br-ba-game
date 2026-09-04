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
  selector: 'app-settings-modal',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      id="settings-modal-backdrop"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in font-persian"
    >
      <div
        id="settings-window"
        class="relative w-full max-w-2xl bg-[#050807] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#e0e7e1]"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-white/10 bg-black/60 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#0a2e1c] border border-[#2ecc71]/40 flex items-center justify-center text-[#2ecc71] shadow-[0_0_12px_rgba(46,204,113,0.25)]">
              <mat-icon>tune</mat-icon>
            </div>
            <div>
              <h2 class="text-lg font-bold text-white tracking-wide font-mono">
                SYSTEM CONFIG // {{ loc.t('settings_title') }}
              </h2>
              <p class="text-xs text-[#e0e7e1]/60 font-persian">{{ loc.t('settings_subtitle') }}</p>
            </div>
          </div>

          <button
            id="settings-close-btn"
            (click)="gameState.isSettingsOpen.set(false)"
            class="w-9 h-9 rounded-lg bg-black/60 hover:bg-[#0a2e1c] text-white/50 hover:text-[#2ecc71] border border-white/10 flex items-center justify-center transition-colors"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Settings Form Options -->
        <div class="p-6 overflow-y-auto space-y-6 flex-1 text-sm font-persian">
          <!-- Texture Quality -->
          <div class="space-y-2">
            <div class="flex justify-between text-xs font-semibold text-[#e0e7e1]/80 font-mono">
              <span>{{ loc.t('setting_texture_quality') }}</span>
              <span class="text-[#2ecc71] uppercase">{{ gameState.graphics().textureQuality }}</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
              @for (q of ['low', 'medium', 'high', 'ultra']; track q) {
                <button
                  (click)="updateTextureQuality(q)"
                  class="py-2.5 px-3 rounded-xl border text-xs font-medium transition-all"
                  [class.bg-[#2ecc71]/15]="gameState.graphics().textureQuality === q"
                  [class.border-[#2ecc71]]="gameState.graphics().textureQuality === q"
                  [class.text-[#2ecc71]]="gameState.graphics().textureQuality === q"
                  [class.shadow-[0_0_10px_rgba(46,204,113,0.2)]]="gameState.graphics().textureQuality === q"
                  [class.bg-black/60]="gameState.graphics().textureQuality !== q"
                  [class.border-white/10]="gameState.graphics().textureQuality !== q"
                  [class.text-[#e0e7e1]/60]="gameState.graphics().textureQuality !== q"
                >
                  {{ q.toUpperCase() }}
                </button>
              }
            </div>
          </div>

          <!-- Framerate Limit (FPS) -->
          <div class="space-y-2">
            <div class="flex justify-between text-xs font-semibold text-[#e0e7e1]/80 font-mono">
              <span>{{ loc.t('setting_fps_limit') }}</span>
              <span class="text-[#2ecc71]">{{ gameState.graphics().fpsLimit || 'UNLOCKED' }}</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
              @for (fps of [30, 60, 120, 0]; track fps) {
                <button
                  (click)="updateFpsLimit(fps)"
                  class="py-2.5 px-3 rounded-xl border text-xs font-medium transition-all"
                  [class.bg-[#2ecc71]/15]="gameState.graphics().fpsLimit === fps"
                  [class.border-[#2ecc71]]="gameState.graphics().fpsLimit === fps"
                  [class.text-[#2ecc71]]="gameState.graphics().fpsLimit === fps"
                  [class.shadow-[0_0_10px_rgba(46,204,113,0.2)]]="gameState.graphics().fpsLimit === fps"
                  [class.bg-black/60]="gameState.graphics().fpsLimit !== fps"
                  [class.border-white/10]="gameState.graphics().fpsLimit !== fps"
                  [class.text-[#e0e7e1]/60]="gameState.graphics().fpsLimit !== fps"
                >
                  {{ fps === 0 ? loc.t('fps_unlocked') : fps + ' FPS' }}
                </button>
              }
            </div>
          </div>

          <!-- Render Resolution Scale -->
          <div class="space-y-2">
            <div class="block text-xs font-semibold text-[#e0e7e1]/80 font-mono">
              {{ loc.t('setting_resolution_scale') }}
            </div>
            <div class="grid grid-cols-3 gap-2 font-mono">
              @for (scale of [0.75, 1.0, 1.25]; track scale) {
                <button
                  (click)="updateResolutionScale(scale)"
                  class="py-2.5 px-3 rounded-xl border text-xs font-medium transition-all"
                  [class.bg-[#2ecc71]/15]="gameState.graphics().resolutionScale === scale"
                  [class.border-[#2ecc71]]="gameState.graphics().resolutionScale === scale"
                  [class.text-[#2ecc71]]="gameState.graphics().resolutionScale === scale"
                  [class.bg-black/60]="gameState.graphics().resolutionScale !== scale"
                  [class.border-white/10]="gameState.graphics().resolutionScale !== scale"
                  [class.text-[#e0e7e1]/60]="gameState.graphics().resolutionScale !== scale"
                >
                  {{ scale }}x {{ scale === 0.75 ? '(Performance)' : scale === 1.0 ? '(Native)' : '(Quality)' }}
                </button>
              }
            </div>
          </div>

          <!-- Toggles: Shadows, Bloom, Show FPS -->
          <div class="space-y-3 pt-2 border-t border-white/10 font-mono">
            <!-- Shadows -->
            <div class="flex items-center justify-between p-3.5 rounded-xl bg-black/60 border border-white/10">
              <span class="text-xs text-[#e0e7e1] font-persian">{{ loc.t('setting_shadows') }}</span>
              <button
                (click)="toggleShadows()"
                class="w-12 h-6 rounded-full transition-colors relative"
                [class.bg-[#2ecc71]]="gameState.graphics().shadows"
                [class.shadow-[0_0_10px_rgba(46,204,113,0.4)]]="gameState.graphics().shadows"
                [class.bg-neutral-800]="!gameState.graphics().shadows"
              >
                <div
                  class="w-4 h-4 rounded-full bg-white transition-transform absolute top-1"
                  [class.translate-x-7]="gameState.graphics().shadows"
                  [class.translate-x-1]="!gameState.graphics().shadows"
                ></div>
              </button>
            </div>

            <!-- Bloom / Heat waves -->
            <div class="flex items-center justify-between p-3.5 rounded-xl bg-black/60 border border-white/10">
              <span class="text-xs text-[#e0e7e1] font-persian">{{ loc.t('setting_bloom') }}</span>
              <button
                (click)="toggleBloom()"
                class="w-12 h-6 rounded-full transition-colors relative"
                [class.bg-[#2ecc71]]="gameState.graphics().bloom"
                [class.shadow-[0_0_10px_rgba(46,204,113,0.4)]]="gameState.graphics().bloom"
                [class.bg-neutral-800]="!gameState.graphics().bloom"
              >
                <div
                  class="w-4 h-4 rounded-full bg-white transition-transform absolute top-1"
                  [class.translate-x-7]="gameState.graphics().bloom"
                  [class.translate-x-1]="!gameState.graphics().bloom"
                ></div>
              </button>
            </div>

            <!-- FPS Counter -->
            <div class="flex items-center justify-between p-3.5 rounded-xl bg-black/60 border border-white/10">
              <span class="text-xs text-[#e0e7e1] font-persian">{{ loc.t('setting_fps_counter') }}</span>
              <button
                (click)="toggleShowFps()"
                class="w-12 h-6 rounded-full transition-colors relative"
                [class.bg-[#2ecc71]]="gameState.graphics().showFps"
                [class.shadow-[0_0_10px_rgba(46,204,113,0.4)]]="gameState.graphics().showFps"
                [class.bg-neutral-800]="!gameState.graphics().showFps"
              >
                <div
                  class="w-4 h-4 rounded-full bg-white transition-transform absolute top-1"
                  [class.translate-x-7]="gameState.graphics().showFps"
                  [class.translate-x-1]="!gameState.graphics().showFps"
                ></div>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-white/10 bg-black/80 flex justify-end">
          <button
            (click)="gameState.isSettingsOpen.set(false)"
            class="px-6 py-2.5 rounded-xl bg-[#2ecc71] hover:bg-[#27ae60] text-black font-bold text-xs font-persian transition-all shadow-[0_0_15px_rgba(46,204,113,0.3)]"
          >
            {{ loc.t('save_settings') }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class SettingsModal {
  gameState = inject(GameStateService);
  loc = inject(LocalizationService);
  audio = inject(GameAudioService);

  updateTextureQuality(q: string) {
    this.audio.playClick();
    this.gameState.updateGraphics({
      textureQuality: q as 'low' | 'medium' | 'high' | 'ultra',
    });
  }

  updateFpsLimit(fps: number) {
    this.audio.playClick();
    this.gameState.updateGraphics({
      fpsLimit: fps as 30 | 60 | 120 | 0,
    });
  }

  updateResolutionScale(scale: number) {
    this.audio.playClick();
    this.gameState.updateGraphics({
      resolutionScale: scale,
    });
  }

  toggleShadows() {
    this.audio.playClick();
    this.gameState.updateGraphics({
      shadows: !this.gameState.graphics().shadows,
    });
  }

  toggleBloom() {
    this.audio.playClick();
    this.gameState.updateGraphics({
      bloom: !this.gameState.graphics().bloom,
      postProcessing: !this.gameState.graphics().postProcessing,
    });
  }

  toggleShowFps() {
    this.audio.playClick();
    this.gameState.updateGraphics({
      showFps: !this.gameState.graphics().showFps,
    });
  }
}
