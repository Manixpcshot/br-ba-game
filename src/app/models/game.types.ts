export type Language = 'fa' | 'en';

export type CameraViewMode = 'third-person' | 'first-person' | 'cockpit' | 'lab';

export type PlayerOutfit = 'civilian' | 'heisenberg' | 'hazmat';

export type VehicleType = 'none' | 'aztek' | 'rv';

export type LocationCategory = 'city' | 'industrial' | 'desert' | 'lab';

export interface LocationPoint {
  id: string;
  nameKey: string;
  category: LocationCategory;
  x: number;
  z: number;
  radius: number;
  descriptionKey: string;
  icon: string;
  color: string;
}

export interface ActiveInteraction {
  id: string;
  type: 'cook_lab' | 'launder_desk' | 'skyler' | 'jesse' | 'saul' | 'gus' | 'rv_vehicle' | 'aztek_vehicle' | 'location';
  titleKey: string;
  subKey: string;
  actionKey: 'E' | 'F';
  distance: number;
  label?: string;
  labelEn?: string;
  actionText?: string;
  actionTextEn?: string;
  icon?: string;
}

export interface LaunderingBusiness {
  id: string;
  nameKey: string;
  descKey: string;
  cost: number;
  owned: boolean;
  cleanCapacityWeekly: number;
  currentWeeklyLaunder: number;
  irsRiskPercent: number;
  revenueWeekly: number;
  level: number;
}

export interface QuestStep {
  id: string;
  textKey: string;
  targetLocationId?: string;
  requiredPurity?: number;
  requiredCash?: number;
  completed: boolean;
}

export interface Quest {
  id: string;
  titleKey: string;
  descKey: string;
  rewardCash: number;
  rewardEgo: number;
  rewardHeat: number;
  unlocked: boolean;
  completed: boolean;
  steps: QuestStep[];
  currentStepIndex: number;
}

export interface ChemistryState {
  isActive: boolean;
  temperature: number; // 20 - 150 C. Optimal is 76 - 82 C
  methylamineInjected: number; // 0 - 100%
  catalystAdded: number; // 0 - 100%
  phLevel: number; // Target 6.8 - 7.2
  reactionProgress: number; // 0 - 100%
  currentPurity: number; // Up to 99.1%
  isOverheating: boolean;
  gasHazardLevel: number; // 0 - 100%
  batchYieldKg: number;
  stirrerSpeed: number; // 0 - 100 rpm
}

export interface GraphicsSettings {
  textureQuality: 'low' | 'medium' | 'high' | 'ultra';
  fpsLimit: 30 | 60 | 120 | 0; // 0 = unlocked
  shadows: boolean;
  bloom: boolean;
  resolutionScale: number; // 0.75, 1.0, 1.25
  showFps: boolean;
  postProcessing: boolean;
}

export interface DialogueChoice {
  textKey: string;
  egoDelta: number;
  familyDelta: number;
  jesseLoyaltyDelta: number;
  heatDelta: number;
  responseKey: string;
  nextDialogueId?: string;
}

export interface DialogueNode {
  id: string;
  speakerKey: string;
  avatar: string;
  textKey: string;
  choices: DialogueChoice[];
}
