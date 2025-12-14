export enum UserRole {
  NEUROLOGIST = 'NEUROLOGIST',
  RADIOLOGIST = 'RADIOLOGIST',
}

export enum ClinicalScenario {
  CIS = 'CIS', // Clinisch Geïsoleerd Syndroom / Relapsing onset
  PROGRESSIVE = 'PROGRESSIVE', // Progressief
  RIS = 'RIS', // Radiologisch Geïsoleerd Syndroom
  UNKNOWN = 'UNKNOWN', // Klinische context onbekend (voor radioloog)
}

export enum AnatomicalLocation {
  PERIVENTRICULAR = 'Periventriculair',
  CORTICAL_JUXTA = 'Cortical/Juxtacortical',
  INFRATENTORIAL = 'Infratentoriaal',
  SPINAL_CORD = 'Ruggenmerg',
  OPTIC_NERVE = 'Oogzenuw (Nieuw 2024)',
}

export interface DiagnosisState {
  scenario: ClinicalScenario | null;
  ageOver50: boolean;
  vascularRisk: boolean;
  locations: AnatomicalLocation[];
  hasDIT: boolean; // Dissemination in Time (New T2 or Enhancing)
  hasCSF: boolean; // OCB or kFLC
  hasCVS: boolean; // Central Vein Sign (Select 6)
  hasPRL: boolean; // Paramagnetic Rim Lesions
  progressionDuration: boolean; // For progressive MS (>1 year)
}

export interface DiagnosisResult {
  status: 'MS' | 'NO_MS' | 'POSSIBLE' | 'RIS_HIGH_RISK' | 'RADIOLOGICALLY_SUGGESTIVE';
  title: string;
  description: string;
  recommendations: string[];
  evidenceSummary: {
    dis: string;
    dit: string;
  };
}