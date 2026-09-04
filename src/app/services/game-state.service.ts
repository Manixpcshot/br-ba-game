import {Injectable, signal, computed, inject} from '@angular/core';
import {
  ActiveInteraction,
  CameraViewMode,
  ChemistryState,
  DialogueNode,
  GraphicsSettings,
  LaunderingBusiness,
  LocationPoint,
  PlayerOutfit,
  Quest,
  VehicleType,
} from '../models/game.types';
import {GameAudioService} from './game-audio.service';
import {LocalizationService} from './localization.service';

@Injectable({
  providedIn: 'root',
})
export class GameStateService {
  private audio = inject(GameAudioService);
  private loc = inject(LocalizationService);

  // App / Game Screen State
  isGameStarted = signal<boolean>(false);
  isPaused = signal<boolean>(false);
  isGddOpen = signal<boolean>(false);
  isSettingsOpen = signal<boolean>(false);
  isLaunderingOpen = signal<boolean>(false);
  isChemistryOpen = signal<boolean>(false);
  isMapOpen = signal<boolean>(false);
  isDialogueOpen = signal<boolean>(false);

  // Graphics Settings
  graphics = signal<GraphicsSettings>({
    textureQuality: 'high',
    fpsLimit: 60,
    shadows: true,
    bloom: true,
    resolutionScale: 1.0,
    showFps: true,
    postProcessing: true,
  });

  // Current FPS counter for HUD
  currentFps = signal<number>(60);

  // Camera & Movement
  cameraMode = signal<CameraViewMode>('third-person');
  currentOutfit = signal<PlayerOutfit>('heisenberg');
  inVehicle = signal<VehicleType>('none');

  // Player position in the world (Three.js coordinates)
  playerPos = signal<{x: number; y: number; z: number}>({x: -110, y: 0.8, z: -70});
  playerRotY = signal<number>(0);

  // Finances
  dirtyCash = signal<number>(245000);
  cleanCash = signal<number>(45000);
  totalBatchesCooked = signal<number>(4);
  highestPurity = signal<number>(99.1);

  // Heat & DEA Investigation
  heatPoints = signal<number>(28); // 0 - 100
  heatStars = computed(() => {
    const h = this.heatPoints();
    if (h < 15) return 0;
    if (h < 35) return 1;
    if (h < 55) return 2;
    if (h < 75) return 3;
    if (h < 90) return 4;
    return 5;
  });

  // Ego vs Family Duality
  egoLevel = signal<number>(68); // 0 - 100
  familyLevel = signal<number>(75); // 0 - 100
  jesseLoyalty = signal<number>(82); // 0 - 100
  skylerSuspicion = signal<number>(45); // 0 - 100

  // Active In-World Contextual Interaction
  activeInteraction = signal<ActiveInteraction | null>(null);

  // Key Albuquerque Locations
  locations: LocationPoint[] = [
    {
      id: 'white_residence',
      nameKey: 'loc_white_residence',
      category: 'city',
      x: -110,
      z: -70,
      radius: 20,
      descriptionKey: 'loc_white_residence_desc',
      icon: 'cottage',
      color: '#38bdf8',
    },
    {
      id: 'secret_lab',
      nameKey: 'loc_secret_lab',
      category: 'lab',
      x: -60,
      z: -35,
      radius: 22,
      descriptionKey: 'loc_secret_lab_desc',
      icon: 'biotech',
      color: '#2ecc71',
    },
    {
      id: 'pollos',
      nameKey: 'loc_pollos',
      category: 'city',
      x: 130,
      z: -90,
      radius: 22,
      descriptionKey: 'loc_pollos_desc',
      icon: 'restaurant',
      color: '#facc15',
    },
    {
      id: 'saul_office',
      nameKey: 'loc_saul',
      category: 'city',
      x: 50,
      z: 80,
      radius: 20,
      descriptionKey: 'loc_saul_desc',
      icon: 'gavel',
      color: '#fb923c',
    },
    {
      id: 'carwash',
      nameKey: 'loc_carwash',
      category: 'city',
      x: -50,
      z: 110,
      radius: 24,
      descriptionKey: 'loc_carwash_desc',
      icon: 'local_car_wash',
      color: '#4ade80',
    },
    {
      id: 'superlab',
      nameKey: 'loc_superlab',
      category: 'industrial',
      x: 240,
      z: 130,
      radius: 25,
      descriptionKey: 'loc_superlab_desc',
      icon: 'science',
      color: '#06b6d4',
    },
    {
      id: 'madrigal',
      nameKey: 'loc_madrigal',
      category: 'industrial',
      x: 200,
      z: 180,
      radius: 25,
      descriptionKey: 'loc_madrigal_desc',
      icon: 'warehouse',
      color: '#a855f7',
    },
    {
      id: 'desert_rv',
      nameKey: 'loc_desert',
      category: 'desert',
      x: -240,
      z: -240,
      radius: 30,
      descriptionKey: 'loc_desert_desc',
      icon: 'rv_hookup',
      color: '#ea580c',
    },
  ];

  // Laundering Network
  businesses = signal<LaunderingBusiness[]>([
    {
      id: 'a1a_carwash',
      nameKey: 'biz_carwash',
      descKey: 'biz_carwash_desc',
      cost: 800000,
      owned: true,
      cleanCapacityWeekly: 75000,
      currentWeeklyLaunder: 50000,
      irsRiskPercent: 12,
      revenueWeekly: 15000,
      level: 2,
    },
    {
      id: 'saul_lasertag',
      nameKey: 'biz_lasertag',
      descKey: 'biz_lasertag_desc',
      cost: 320000,
      owned: false,
      cleanCapacityWeekly: 40000,
      currentWeeklyLaunder: 0,
      irsRiskPercent: 25,
      revenueWeekly: 8000,
      level: 1,
    },
    {
      id: 'vamonos_pest',
      nameKey: 'biz_vamonos',
      descKey: 'biz_vamonos_desc',
      cost: 550000,
      owned: false,
      cleanCapacityWeekly: 65000,
      currentWeeklyLaunder: 0,
      irsRiskPercent: 18,
      revenueWeekly: 12000,
      level: 1,
    },
  ]);

  // Quests & Missions
  quests = signal<Quest[]>([
    {
      id: 'q1_desert_cook',
      titleKey: 'Cooking in To\'hajiilee',
      descKey: 'Drive the RV to the isolated desert dunes and synthesize a pure batch of Blue Sky without blowing up.',
      rewardCash: 60000,
      rewardEgo: 15,
      rewardHeat: 8,
      unlocked: true,
      completed: false,
      currentStepIndex: 0,
      steps: [
        {
          id: 'step_1',
          textKey: 'Reach the Fleetwood RV in the To\'hajiilee Desert',
          targetLocationId: 'desert_rv',
          completed: false,
        },
        {
          id: 'step_2',
          textKey: 'Enter first-person chemistry mode and achieve >96% purity',
          requiredPurity: 96,
          completed: false,
        },
        {
          id: 'step_3',
          textKey: 'Stash the earnings in the buried money barrels',
          completed: false,
        },
      ],
    },
    {
      id: 'q2_call_saul',
      titleKey: 'Better Call Saul',
      descKey: 'Visit Saul Goodman\'s office on Montgomery Boulevard to establish shell corporations and shield your identity.',
      rewardCash: 0,
      rewardEgo: 10,
      rewardHeat: -20,
      unlocked: true,
      completed: false,
      currentStepIndex: 0,
      steps: [
        {
          id: 'step_saul_1',
          textKey: 'Drive to Saul Goodman & Associates office',
          targetLocationId: 'saul_office',
          completed: false,
        },
        {
          id: 'step_saul_2',
          textKey: 'Consult Saul about laundering channels and lower DEA Heat',
          completed: false,
        },
      ],
    },
    {
      id: 'q3_pollos_contract',
      titleKey: 'The Chicken Brother Proposition',
      descKey: 'Gus Fring requires a sample distribution. Deliver 10kg of Blue Sky to Los Pollos Hermanos.',
      rewardCash: 250000,
      rewardEgo: 25,
      rewardHeat: 15,
      unlocked: true,
      completed: false,
      currentStepIndex: 0,
      steps: [
        {
          id: 'step_pollos_1',
          textKey: 'Meet Gus Fring in the back office of Los Pollos Hermanos',
          targetLocationId: 'pollos',
          completed: false,
        },
        {
          id: 'step_pollos_2',
          textKey: 'Deliver high-purity product and negotiate distribution terms',
          completed: false,
        },
      ],
    },
    {
      id: 'q4_madrigal_heist',
      titleKey: 'Madrigal Chemical Sourcing',
      descKey: 'Methylamine supplies are drying up. Infiltrate the Madrigal industrial container yard.',
      rewardCash: 80000,
      rewardEgo: 20,
      rewardHeat: 25,
      unlocked: true,
      completed: false,
      currentStepIndex: 0,
      steps: [
        {
          id: 'step_mad_1',
          textKey: 'Infiltrate Madrigal Electromotive Warehouse containers',
          targetLocationId: 'madrigal',
          completed: false,
        },
      ],
    },
  ]);

  activeQuest = computed(() => {
    return this.quests().find((q) => !q.completed && q.unlocked) || this.quests()[0];
  });

  // Chemistry Minigame Active State
  chemState = signal<ChemistryState>({
    isActive: false,
    temperature: 24,
    methylamineInjected: 0,
    catalystAdded: 0,
    phLevel: 7.0,
    reactionProgress: 0,
    currentPurity: 88.0,
    isOverheating: false,
    gasHazardLevel: 0,
    batchYieldKg: 0,
    stirrerSpeed: 30,
  });

  // Active Story Dialogue
  currentDialogue = signal<DialogueNode | null>(null);

  // Notification Toast
  toastMessage = signal<string | null>(null);

  // Nearest Location Computed
  nearestLocation = computed(() => {
    const pos = this.playerPos();
    let closest: LocationPoint | null = null;
    let minDist = Infinity;
    for (const loc of this.locations) {
      const dist = Math.hypot(loc.x - pos.x, loc.z - pos.z);
      if (dist < minDist) {
        minDist = dist;
        closest = loc;
      }
    }
    return {
      location: closest,
      distance: Math.round(minDist),
      isInside: minDist <= (closest ? closest.radius : 20),
    };
  });

  constructor() {
    // Start interval for periodic game simulation (money laundering, heat cooldown, IRS check)
    if (typeof window !== 'undefined') {
      setInterval(() => {
        if (this.isGameStarted() && !this.isPaused()) {
          this.processWeeklyTick();
        }
      }, 5000);
    }
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }

  togglePause() {
    this.isPaused.update((p) => !p);
    this.audio.playClick();
  }

  startGame() {
    this.isGameStarted.set(true);
    this.isPaused.set(false);
    this.audio.playHeisenbergThemeStab();
    this.showToast(this.loc.t('app_title') + ' - ' + this.loc.t('menu_freeroam'));
  }

  toggleCamera() {
    this.audio.playClick();
    this.cameraMode.update((mode) => (mode === 'third-person' ? 'first-person' : 'third-person'));
    this.showToast(this.loc.t(this.cameraMode() === 'first-person' ? 'cam_first_person' : 'cam_third_person'));
  }

  toggleVehicle(forcedType?: VehicleType) {
    this.audio.playClick();
    if (this.inVehicle() !== 'none') {
      this.inVehicle.set('none');
      this.audio.stopEngine();
      this.showToast(this.loc.t('exit_vehicle'));
    } else {
      if (forcedType && forcedType !== 'none') {
        this.inVehicle.set(forcedType);
        const name = forcedType === 'rv' ? this.loc.t('vehicle_rv') : this.loc.t('vehicle_aztek');
        this.showToast(this.loc.t('drive_vehicle') + ': ' + name);
        return;
      }
      const p = this.playerPos();
      const distToRv = Math.hypot(p.x - (-52), p.z - (-48));
      const distToAztek = Math.hypot(p.x - (-118), p.z - (-62));
      if (distToRv < distToAztek && distToRv < 35) {
        this.inVehicle.set('rv');
        this.showToast(this.loc.t('drive_vehicle') + ': ' + this.loc.t('vehicle_rv'));
      } else {
        this.inVehicle.set('aztek');
        this.showToast(this.loc.t('drive_vehicle') + ': ' + this.loc.t('vehicle_aztek'));
      }
    }
  }

  toggleOutfit() {
    this.audio.playClick();
    const cycle: PlayerOutfit[] = ['heisenberg', 'hazmat', 'civilian'];
    const curIdx = cycle.indexOf(this.currentOutfit());
    const next = cycle[(curIdx + 1) % cycle.length];
    this.currentOutfit.set(next);
  }

  enterChemistryMinigame() {
    this.audio.playClick();
    this.isChemistryOpen.set(true);
    this.chemState.set({
      isActive: true,
      temperature: 30,
      methylamineInjected: 15,
      catalystAdded: 10,
      phLevel: 6.9,
      reactionProgress: 5,
      currentPurity: 91.2,
      isOverheating: false,
      gasHazardLevel: 0,
      batchYieldKg: 0,
      stirrerSpeed: 45,
    });
  }

  closeChemistryMinigame() {
    this.isChemistryOpen.set(false);
    this.chemState.update((s) => ({...s, isActive: false}));
  }

  heatUpChem() {
    this.audio.playChemicalBubble();
    this.chemState.update((s) => {
      const newTemp = Math.min(135, s.temperature + 4.5);
      const isOver = newTemp > 88;
      const gas = isOver ? Math.min(100, s.gasHazardLevel + 18) : Math.max(0, s.gasHazardLevel - 5);
      let purity = s.currentPurity;
      if (newTemp >= 76 && newTemp <= 82) {
        purity = Math.min(99.1, purity + 0.9);
      } else if (newTemp > 92) {
        purity = Math.max(82, purity - 1.2);
      }
      return {
        ...s,
        temperature: parseFloat(newTemp.toFixed(1)),
        isOverheating: isOver,
        gasHazardLevel: gas,
        currentPurity: parseFloat(purity.toFixed(1)),
        reactionProgress: Math.min(100, s.reactionProgress + 7),
      };
    });
    if (this.chemState().isOverheating) {
      this.increaseHeat(4);
    }
  }

  coolDownChem() {
    this.audio.playClick();
    this.chemState.update((s) => {
      const newTemp = Math.max(20, s.temperature - 6.0);
      return {
        ...s,
        temperature: parseFloat(newTemp.toFixed(1)),
        isOverheating: newTemp > 88,
        gasHazardLevel: Math.max(0, s.gasHazardLevel - 15),
      };
    });
  }

  injectMethylamine() {
    this.audio.playChemicalBubble();
    this.chemState.update((s) => {
      const m = Math.min(100, s.methylamineInjected + 12);
      const progress = Math.min(100, s.reactionProgress + 10);
      let purity = s.currentPurity;
      if (s.temperature >= 74 && s.temperature <= 84) {
        purity = Math.min(99.1, purity + 1.2);
      }
      return {
        ...s,
        methylamineInjected: m,
        reactionProgress: progress,
        currentPurity: parseFloat(purity.toFixed(1)),
      };
    });
  }

  addCatalyst() {
    this.audio.playChemicalBubble();
    this.chemState.update((s) => {
      const cat = Math.min(100, s.catalystAdded + 15);
      const progress = Math.min(100, s.reactionProgress + 12);
      let purity = s.currentPurity;
      if (cat > 30 && cat < 85) {
        purity = Math.min(99.1, purity + 1.5);
      }
      return {
        ...s,
        catalystAdded: cat,
        reactionProgress: progress,
        currentPurity: parseFloat(purity.toFixed(1)),
      };
    });
  }

  finishChemBatch() {
    const s = this.chemState();
    const finalPurity = s.currentPurity;
    const yieldKg = parseFloat((12 + (finalPurity / 100) * 18).toFixed(1));
    const earnedStreetCash = Math.round(yieldKg * 22000 * (finalPurity / 90));

    this.audio.playCash();
    this.dirtyCash.update((c) => c + earnedStreetCash);
    this.totalBatchesCooked.update((b) => b + 1);
    if (finalPurity > this.highestPurity()) {
      this.highestPurity.set(finalPurity);
    }

    // Impact on Ego & Heat
    if (finalPurity >= 99.0) {
      this.egoLevel.update((e) => Math.min(100, e + 12));
      this.showToast(this.loc.t('chem_perfect_heisenberg') + ` +$${earnedStreetCash.toLocaleString()}`);
    } else {
      this.showToast(`Batch Complete: ${finalPurity}% Blue Sky (${yieldKg}kg) -> +$${earnedStreetCash.toLocaleString()}`);
    }

    // Complete active quest step if applicable
    const curQ = this.activeQuest();
    if (curQ.id === 'q1_desert_cook') {
      this.completeQuestStep('q1_desert_cook', 1);
    }

    this.closeChemistryMinigame();
  }

  completeQuestStep(questId: string, stepIndex: number) {
    this.quests.update((list) =>
      list.map((q) => {
        if (q.id === questId) {
          const newSteps = q.steps.map((s, idx) => (idx === stepIndex ? {...s, completed: true} : s));
          const allDone = newSteps.every((s) => s.completed);
          return {
            ...q,
            steps: newSteps,
            currentStepIndex: Math.min(newSteps.length - 1, stepIndex + 1),
            completed: allDone,
          };
        }
        return q;
      })
    );
  }

  increaseHeat(amount: number) {
    this.heatPoints.update((h) => Math.min(100, h + amount));
    if (this.heatStars() >= 3) {
      this.audio.startSiren();
    }
  }

  reduceHeatWithSaul() {
    if (this.cleanCash() >= 5000 || this.dirtyCash() >= 5000) {
      if (this.cleanCash() >= 5000) {
        this.cleanCash.update((c) => c - 5000);
      } else {
        this.dirtyCash.update((d) => d - 5000);
      }
      this.audio.playCash();
      this.heatPoints.update((h) => Math.max(0, h - 35));
      if (this.heatStars() < 3) {
        this.audio.stopSiren();
      }
      this.showToast('Saul Goodman deflected DEA attention. Heat reduced by 35%!');
    } else {
      this.showToast('Not enough funds to pay Saul ($5,000 required).');
    }
  }

  destroyEvidence() {
    if (this.dirtyCash() >= 2500) {
      this.dirtyCash.update((d) => d - 2500);
      this.audio.playChemicalBubble();
      this.heatPoints.update((h) => Math.max(0, h - 20));
      if (this.heatStars() < 3) {
        this.audio.stopSiren();
      }
      this.showToast('Evidence dissolved in hydrofluoric acid. Heat reduced by 20%!');
    } else {
      this.showToast('Need $2,500 for HF chemical supplies.');
    }
  }

  launderCash(amount: number, businessId: string) {
    if (this.dirtyCash() < amount) {
      this.showToast('Not enough dirty cash to transfer.');
      return;
    }
    const biz = this.businesses().find((b) => b.id === businessId);
    if (!biz || !biz.owned) {
      this.showToast('Business not owned.');
      return;
    }

    // Fee and IRS risk
    const fee = Math.round(amount * 0.15); // Saul & operations cut
    const netClean = amount - fee;

    this.dirtyCash.update((d) => d - amount);
    this.cleanCash.update((c) => c + netClean);
    this.familyLevel.update((f) => Math.min(100, f + 5));
    this.audio.playCash();

    // Check IRS risk
    if (Math.random() * 100 < biz.irsRiskPercent) {
      this.increaseHeat(18);
      this.showToast(`IRS Audit Alert! DEA suspicion increased (+18%). Cleaned $${netClean.toLocaleString()}`);
    } else {
      this.showToast(`Successfully laundered $${amount.toLocaleString()} into $${netClean.toLocaleString()} clean funds.`);
    }
  }

  upgradeBusiness(bizId: string) {
    const biz = this.businesses().find((b) => b.id === bizId);
    if (!biz) return;
    const upgradeCost = Math.round(biz.cost * 0.35 * biz.level);
    if (this.cleanCash() < upgradeCost) {
      this.showToast(`Need $${upgradeCost.toLocaleString()} in CLEAN funds for commercial upgrade.`);
      return;
    }
    this.cleanCash.update((c) => c - upgradeCost);
    this.audio.playCash();
    this.businesses.update((list) =>
      list.map((b) =>
        b.id === bizId
          ? {
              ...b,
              level: b.level + 1,
              cleanCapacityWeekly: Math.round(b.cleanCapacityWeekly * 1.4),
              irsRiskPercent: Math.max(5, b.irsRiskPercent - 3),
              revenueWeekly: Math.round(b.revenueWeekly * 1.3),
            }
          : b
      )
    );
    this.showToast(`${biz.nameKey} upgraded to Level ${biz.level + 1}!`);
  }

  buyBusiness(bizId: string) {
    const biz = this.businesses().find((b) => b.id === bizId);
    if (!biz || biz.owned) return;
    if (this.cleanCash() < biz.cost) {
      this.showToast(`Requires $${biz.cost.toLocaleString()} in clean cash to acquire.`);
      return;
    }
    this.cleanCash.update((c) => c - biz.cost);
    this.audio.playCash();
    this.businesses.update((list) => list.map((b) => (b.id === bizId ? {...b, owned: true} : b)));
    this.showToast(`Acquired ${biz.nameKey}! Laundering capacity unlocked.`);
  }

  private processWeeklyTick() {
    // Passive laundering from owned businesses
    let passiveCleaned = 0;
    let passiveRevenue = 0;
    this.businesses().forEach((biz) => {
      if (biz.owned) {
        passiveRevenue += biz.revenueWeekly;
        if (this.dirtyCash() > 0 && biz.currentWeeklyLaunder > 0) {
          const toClean = Math.min(this.dirtyCash(), Math.round(biz.cleanCapacityWeekly * 0.25));
          if (toClean > 0) {
            this.dirtyCash.update((d) => d - toClean);
            passiveCleaned += Math.round(toClean * 0.85);
          }
        }
      }
    });

    if (passiveRevenue > 0 || passiveCleaned > 0) {
      this.cleanCash.update((c) => c + passiveRevenue + passiveCleaned);
    }

    // Natural slow cooldown of heat if player isn't actively reckless
    if (this.heatPoints() > 10) {
      this.heatPoints.update((h) => Math.max(5, h - 0.5));
      if (this.heatStars() < 3) {
        this.audio.stopSiren();
      }
    }
  }

  triggerDialogue(node: DialogueNode) {
    this.currentDialogue.set(node);
    this.isDialogueOpen.set(true);
    this.audio.playClick();
  }

  triggerSkylerDialogue() {
    this.triggerDialogue({
      id: 'skyler_home_1',
      speakerKey: 'اسکایلر وایت (Skyler White)',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      textKey: 'والت... دوباره شب‌ها دیر میای خونه و تلفن دوم پیشت داری. بوی بنزین و مواد شیمیایی عجیب میدی! تو داری چه بلایی سر این خانواده میاری؟',
      choices: [
        {
          textKey: 'اسکایلر، هر کاری که انجام می‌دم، هر قدمی که برمی‌دارم فقط و فقط برای تو و بچه‌هاست تا بعد از من در رفاه باشید.',
          egoDelta: -5,
          familyDelta: 20,
          jesseLoyaltyDelta: 0,
          heatDelta: -5,
          responseKey: 'اسکایلر با بغض نگاه می‌کند: "والت، من فقط سلامتی خودت رو می‌خوام، نه این همه پنهان‌کاری..."',
        },
        {
          textKey: 'من اون کسی نیستم که در خطره اسکایلر؛ من خود خطرم! اگر کسی در این خونه رو بزنه، منم که در رو باز می‌کنم!',
          egoDelta: 25,
          familyDelta: -15,
          jesseLoyaltyDelta: 5,
          heatDelta: 10,
          responseKey: 'اسکایلر چند قدم به عقب برمی‌دارد و با بهت و ترس به چهره سرد هایزنبرگ خیره می‌شود.',
        },
        {
          textKey: 'کارواش رو خریدیم و تمام پول‌ها با فاکتور قانونی داره شسته می‌شه. نگران اداره مالیات نباش.',
          egoDelta: 10,
          familyDelta: 10,
          jesseLoyaltyDelta: 0,
          heatDelta: 0,
          responseKey: 'اسکایلر پوشه‌های مالی کارواش را روی میز مرتب می‌کند: "باید خیلی محتاط باشیم، هنک هفته آینده میاد شام."',
        },
      ],
    });
  }

  triggerJesseDialogue() {
    this.triggerDialogue({
      id: 'jesse_lab_1',
      speakerKey: 'جسی پینکمن (Jesse Pinkman)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      textKey: 'هی آقای وایت! ون RV رو جلوی آزمایشگاه پارک کردم، متیل‌آمین و پیش‌سازها آماده‌ست. دستگاه سنتز روی میز داغه. امروز چه برنامه‌ای برای پخت داریم؟',
      choices: [
        {
          textKey: 'شیمی یک علم مقدسه جسی! دما باید دقیقاً روی ۷۸ درجه بمونه و خلوص کمتر از ۹۹.۱٪ توهین به علمه.',
          egoDelta: 15,
          familyDelta: -5,
          jesseLoyaltyDelta: 15,
          heatDelta: 5,
          responseKey: 'جسی پینکمن: "دمت گرم مستر وایت! شیشه آبی ما کل جنوب غرب رو دیوونه کرده، بریم بپزیم!"',
        },
        {
          textKey: 'باید سهم امروز رو سریع ببریم به کارواش و تحویل شبکه پول‌شویی بدیم. هنک داره همه جا رو می‌گرده.',
          egoDelta: -5,
          familyDelta: 10,
          jesseLoyaltyDelta: 5,
          heatDelta: -10,
          responseKey: 'جسی: "حواسم هست مرد، پول‌ها رو داخل ساک ورزشی می‌ذارم و رد پا به جا نمی‌ذارم."',
        },
        {
          textKey: 'فقط طبق دستورالعمل من کار کن و چیزی رو سرخود تغییر نده.',
          egoDelta: 20,
          familyDelta: -10,
          jesseLoyaltyDelta: -10,
          heatDelta: 5,
          responseKey: 'جسی کلاه هودی‌اش را سر می‌کند: "باشه رئیس، تو دانشمند بزرگی هستی!"',
        },
      ],
    });
  }

  triggerSaulDialogue() {
    this.triggerDialogue({
      id: 'saul_office_1',
      speakerKey: 'سائول گودمن (Saul Goodman)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      textKey: 'به به والتر عزیز! به دفتر سال گودمن خوش اومدی! بگو ببینم، اداره مالیات بو برده، یا هنک شریدر با ذره‌بین افتاده دنبالت؟ راه‌حل دست منه!',
      choices: [
        {
          textKey: '۵,۰۰۰ دلار بهت می‌دم تا توجه کارگروه DEA رو از اطراف خونه و آزمایشگاه منحرف کنی.',
          egoDelta: 5,
          familyDelta: 5,
          jesseLoyaltyDelta: 0,
          heatDelta: -30,
          responseKey: 'سال گودمن قهقهه می‌زند: "بهتره به سال زنگ بزنی! پرونده‌ها همین الان به یک آدرس قلابی هدایت می‌شن!"',
        },
        {
          textKey: 'می‌خوام ظرفیت شستشوی کارواش و مجموعه لیزرتگ رو افزایش بدیم تا دلارهای بیشتری قانونی بشن.',
          egoDelta: 15,
          familyDelta: 10,
          jesseLoyaltyDelta: 5,
          heatDelta: 0,
          responseKey: 'سال روی میز می‌کوبد: "عالیه! ثبت شرکت‌های کاغذی تخصص منه، دلارهات سفیدِ سفید برمی‌گردن."',
        },
      ],
    });
  }

  triggerGusDialogue() {
    this.triggerDialogue({
      id: 'gus_office_1',
      speakerKey: 'گاس فرینگ (Gustavo Fring)',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      textKey: 'آقای وایت. من یک تاجر هستم و تنها چیزی که برایم اهمیت دارد کیفیت پایدار و عدم جلب توجه است. آیا می‌توانید خلوص ۹۹٪ را تضمین کنید؟',
      choices: [
        {
          textKey: 'فرمول من بی‌نقص است آقای فرینگ. هیچکس در هیچ کجای دنیا نمی‌تواند محصولی نزدیک به هایزنبرگ تولید کند.',
          egoDelta: 30,
          familyDelta: -10,
          jesseLoyaltyDelta: 10,
          heatDelta: 10,
          responseKey: 'گاس عینک خود را تنظیم می‌کند و با رضایت سر تکان می‌دهد: "قرارداد توزیع ۳ ماهه با مبلغ ۳ میلیون دلار امضا شد."',
        },
        {
          textKey: 'من فقط در ازای تضمین امنیت جسی و خانواده‌ام محموله‌ها را به موقع تحویل می‌دهم.',
          egoDelta: 0,
          familyDelta: 20,
          jesseLoyaltyDelta: 20,
          heatDelta: -10,
          responseKey: 'گاس: "شرایط شما منطقی است. حرفه‌ای بودن اساس همکاری ما خواهد بود."',
        },
      ],
    });
  }

  selectDialogueChoice(choiceIndex: number) {
    const d = this.currentDialogue();
    if (!d || !d.choices[choiceIndex]) return;
    const choice = d.choices[choiceIndex];

    this.audio.playClick();
    this.egoLevel.update((e) => Math.max(0, Math.min(100, e + choice.egoDelta)));
    this.familyLevel.update((f) => Math.max(0, Math.min(100, f + choice.familyDelta)));
    this.jesseLoyalty.update((j) => Math.max(0, Math.min(100, j + choice.jesseLoyaltyDelta)));
    if (choice.heatDelta > 0) {
      this.increaseHeat(choice.heatDelta);
    } else if (choice.heatDelta < 0) {
      this.heatPoints.update((h) => Math.max(0, h + choice.heatDelta));
    }

    this.showToast(choice.responseKey);
    this.isDialogueOpen.set(false);
    this.currentDialogue.set(null);
  }

  updateGraphics(newSettings: Partial<GraphicsSettings>) {
    this.graphics.update((current) => ({...current, ...newSettings}));
    this.showToast(this.loc.t('save_settings'));
  }
}
