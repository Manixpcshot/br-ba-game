import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {GameStateService} from './services/game-state.service';
import {LocalizationService} from './services/localization.service';
import {GameAudioService} from './services/game-audio.service';
import {GameCanvas} from './components/game-canvas/game-canvas';
import {Hud} from './components/hud/hud';
import {MainMenu} from './components/main-menu/main-menu';
import {ChemistryLab} from './components/chemistry-lab/chemistry-lab';
import {LaunderingModal} from './components/laundering-modal/laundering-modal';
import {SettingsModal} from './components/settings-modal/settings-modal';
import {GddModal} from './components/gdd-modal/gdd-modal';
import {WorldMap} from './components/world-map/world-map';
import {DialogueOverlay} from './components/dialogue-overlay/dialogue-overlay';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    GameCanvas,
    Hud,
    MainMenu,
    ChemistryLab,
    LaunderingModal,
    SettingsModal,
    GddModal,
    WorldMap,
    DialogueOverlay,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  gameState = inject(GameStateService);
  loc = inject(LocalizationService);
  audio = inject(GameAudioService);
}

