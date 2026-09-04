import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {GameStateService} from '../../services/game-state.service';
import {LocalizationService} from '../../services/localization.service';
import {GameAudioService} from '../../services/game-audio.service';
import {LocationPoint} from '../../models/game.types';

@Component({
  selector: 'app-world-map',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      id="world-map-backdrop"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in font-persian"
    >
      <div
        id="world-map-window"
        class="relative w-full max-w-4xl bg-[#050807] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#e0e7e1]"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-white/10 bg-black/60 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#0a2e1c] border border-[#2ecc71]/40 flex items-center justify-center text-[#2ecc71] shadow-[0_0_12px_rgba(46,204,113,0.3)]">
              <mat-icon>map</mat-icon>
            </div>
            <div>
              <h2 class="text-lg font-bold text-white tracking-wide font-mono">
                GPS RADAR // {{ loc.t('toggle_map') }}
              </h2>
              <p class="text-xs text-[#e0e7e1]/60 font-persian">Albuquerque, New Mexico & Outskirts Cartography</p>
            </div>
          </div>

          <button
            id="map-close-btn"
            (click)="gameState.isMapOpen.set(false)"
            class="w-9 h-9 rounded-lg bg-black/60 hover:bg-[#0a2e1c] text-white/50 hover:text-[#2ecc71] border border-white/10 flex items-center justify-center transition-colors"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Interactive Map Canvas / SVG Display -->
        <div class="relative p-6 flex-1 flex flex-col items-center justify-center bg-black/60 overflow-hidden">
          <div class="relative w-full aspect-video max-h-[500px] bg-[#050807] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
            <!-- Grid Lines -->
            <div class="absolute inset-0 bg-[radial-gradient(#2ecc71_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>

            <!-- Desert Region Tint (Bottom-Left quadrant) -->
            <div class="absolute bottom-0 left-0 w-1/2 h-1/2 bg-amber-950/15 border-r border-t border-amber-900/30 flex items-end p-4">
              <span class="text-xs font-bold text-amber-500/70 tracking-widest uppercase font-mono">To'hajiilee Desert</span>
            </div>

            <!-- City Region Tint (Top-Right quadrant) -->
            <div class="absolute top-0 right-0 w-1/2 h-1/2 bg-[#0a2e1c]/30 border-l border-b border-[#2ecc71]/20 flex items-start justify-end p-4">
              <span class="text-xs font-bold text-[#2ecc71]/70 tracking-widest uppercase font-mono">Albuquerque Metro</span>
            </div>

            <!-- Major Highways Lines -->
            <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 600">
              <line x1="100" y1="500" x2="900" y2="100" stroke="#1f2d24" stroke-width="6" stroke-dasharray="10 6" />
              <line x1="300" y1="100" x2="300" y2="500" stroke="#1f2d24" stroke-width="4" />
              <line x1="700" y1="100" x2="700" y2="500" stroke="#1f2d24" stroke-width="4" />
              <line x1="100" y1="300" x2="900" y2="300" stroke="#1f2d24" stroke-width="4" />
            </svg>

            <!-- Map Location Markers -->
            @for (locItem of gameState.locations; track locItem.id) {
              <!-- Map scale: [-300, 300] translates to [10% to 90%] -->
              @let posX = 50 + (locItem.x / 600) * 80;
              @let posY = 50 + (locItem.z / 600) * 80;
              <button
                type="button"
                (click)="onMarkerClick(locItem)"
                class="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 group z-20 flex flex-col items-center bg-transparent border-none p-0"
                [style.left.%]="posX"
                [style.top.%]="posY"
              >
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-125 border border-white/30"
                  [style.background-color]="locItem.color"
                >
                  <mat-icon class="text-black text-sm font-bold">{{ locItem.icon }}</mat-icon>
                </div>
                <span class="mt-1 text-[11px] font-bold text-white bg-black/90 px-2.5 py-0.5 rounded border border-white/10 whitespace-nowrap opacity-90 group-hover:opacity-100 font-persian shadow-md">
                  {{ loc.t(locItem.nameKey) }}
                </span>
              </button>
            }

            <!-- Player Indicator Marker -->
            @let playerX = 50 + (gameState.playerPos().x / 600) * 80;
            @let playerZ = 50 + (gameState.playerPos().z / 600) * 80;
            <div
              class="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center justify-center"
              [style.left.%]="playerX"
              [style.top.%]="playerZ"
            >
              <div class="w-8 h-8 rounded-full bg-[#2ecc71]/30 animate-ping absolute"></div>
              <div class="w-4 h-4 rounded-full bg-[#2ecc71] border-2 border-white flex items-center justify-center shadow-[0_0_12px_rgba(46,204,113,0.8)]">
                <div class="w-1.5 h-1.5 rounded-full bg-black"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Coordinates & Instructions -->
        <div class="px-6 py-3.5 border-t border-white/10 bg-black/80 flex flex-wrap items-center justify-between text-xs text-[#e0e7e1]/70 font-persian gap-2">
          <div class="flex items-center gap-2">
            <span class="font-mono text-[#2ecc71] bg-[#0a2e1c] px-2 py-0.5 rounded border border-[#2ecc71]/30">
              GPS: [X: {{ Math.round(gameState.playerPos().x) }}, Z: {{ Math.round(gameState.playerPos().z) }}]
            </span>
            <span>• کلیک روی نشانگرها برای انتقال سریع (Fast Travel)</span>
          </div>

          <button
            (click)="gameState.isMapOpen.set(false)"
            class="px-4 py-1.5 rounded-xl bg-black/60 hover:bg-[#0a2e1c] text-[#2ecc71] border border-[#2ecc71]/40 font-medium text-xs transition-colors"
          >
            بستن نقشه
          </button>
        </div>
      </div>
    </div>
  `,
})
export class WorldMap {
  gameState = inject(GameStateService);
  loc = inject(LocalizationService);
  audio = inject(GameAudioService);

  Math = Math;

  onMarkerClick(location: LocationPoint) {
    this.audio.playClick();
    this.gameState.playerPos.set({x: location.x, y: 0.8, z: location.z});
    this.gameState.isMapOpen.set(false);
    this.gameState.showToast(`انتقال سریع به ${this.loc.t(location.nameKey)}`);
  }
}
