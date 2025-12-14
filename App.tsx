import React, { useState } from 'react';
import { 
  Activity, 
  Brain, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Eye, 
  Microscope,
  Stethoscope,
  RefreshCcw,
  BookOpen,
  ListChecks,
  ArrowLeft,
  UserCog,
  ScanLine
} from 'lucide-react';
import { StepWizard } from './components/StepWizard';
import { AnatomicalLocation, ClinicalScenario, DiagnosisState, DiagnosisResult, UserRole } from './types';

const INITIAL_STATE: DiagnosisState = {
  scenario: null,
  ageOver50: false,
  vascularRisk: false,
  locations: [],
  hasDIT: false,
  hasCSF: false,
  hasCVS: false,
  hasPRL: false,
  progressionDuration: false,
};

// Pure function to calculate diagnosis based on a specific state snapshot
const getDiagnosis = (currentState: DiagnosisState): DiagnosisResult => {
    const { 
      scenario, 
      locations, 
      hasDIT, 
      hasCSF, 
      hasCVS, 
      hasPRL,
      progressionDuration 
    } = currentState;

    // Construct Evidence Summaries
    const disList = locations.length > 0 ? locations.join(', ') : 'Geen regio\'s geselecteerd';
    const ditFactors = [];
    if (hasDIT) ditFactors.push('MRI (DIT)');
    if (hasCSF) ditFactors.push('Liquor (CSF)');
    if (hasCVS) ditFactors.push('Central Vein Sign (CVS)');
    if (hasPRL) ditFactors.push('Paramagnetic Rim (PRL)');
    const ditList = ditFactors.length > 0 ? ditFactors.join(', ') : 'Geen';

    const evidenceSummary = { dis: disList, dit: ditList };

    // DIS: Dissemination in Space (>= 2 locations out of 5)
    const hasDIS = locations.length >= 2;

    // Additional Evidence (Supportive criteria)
    const hasSupportiveEvidence = hasDIT || hasCSF || hasCVS || hasPRL;

    // --- LOGIC PER SCENARIO ---

    // 1. RIS (Radiologically Isolated Syndrome)
    if (scenario === ClinicalScenario.RIS) {
      const risEvidence = hasDIT || hasCSF || hasCVS; 
      if (hasDIS && risEvidence) {
        return {
          status: 'MS',
          title: 'MS (via RIS)',
          description: 'Voldoet aan 2024 criteria voor MS vanuit RIS.',
          evidenceSummary,
          recommendations: ['DIS + (DIT/CSF/CVS) aanwezig.', 'Symptomen niet vereist.']
        };
      }
      return {
        status: 'RIS_HIGH_RISK',
        title: 'RIS',
        description: 'Voldoet aan RIS criteria, nog geen MS.',
        evidenceSummary,
        recommendations: [hasDIS ? 'DIS aanwezig.' : 'Geen DIS.', 'Monitor kliniek/MRI.']
      };
    }

    // 2. Progressive
    if (scenario === ClinicalScenario.PROGRESSIVE) {
      if (!progressionDuration) {
        return {
          status: 'POSSIBLE',
          title: 'Mogelijk Progressief',
          description: 'Vereist 1 jaar progressie.',
          evidenceSummary,
          recommendations: ['Documenteer beloop.']
        };
      }
      if (hasDIS && hasSupportiveEvidence) {
        return {
          status: 'MS',
          title: 'Progressieve MS',
          description: 'Voldoet aan criteria.',
          evidenceSummary,
          recommendations: ['1jr Progressie + DIS + Support.']
        };
      }
      return {
        status: 'NO_MS',
        title: 'Geen diagnose',
        description: 'Onvoldoende criteria.',
        evidenceSummary,
        recommendations: []
      };
    }

    // 3. CIS / Relapsing (Standard)
    if (scenario === ClinicalScenario.CIS) {
      if (hasDIS && hasSupportiveEvidence) {
        return {
          status: 'MS',
          title: 'Relapsing MS',
          description: 'Voldoet aan McDonald 2024.',
          evidenceSummary,
          recommendations: ['DIS + (DIT/CSF/CVS/PRL).']
        };
      }
      // Specific Case: 1 Location + CVS/PRL + DIT/CSF
      if (locations.length === 1 && (hasCVS || hasPRL) && (hasDIT || hasCSF)) {
         return {
          status: 'MS',
          title: 'MS (Biomarker)',
          description: '1 regio, maar biomarker + DIT/CSF.',
          evidenceSummary,
          recommendations: ['Nieuwe 2024 regel.']
        };
      }
      return {
        status: 'POSSIBLE',
        title: 'Mogelijk MS / CIS',
        description: 'Voldoet nog niet volledig.',
        evidenceSummary,
        recommendations: ['DIS of DIT ontbreekt.']
      };
    }

    // Fallback
    return {
      status: 'NO_MS',
      title: 'Geen diagnose',
      description: 'Onvoldoende criteria.',
      evidenceSummary,
      recommendations: []
    };
};

export default function App() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState(1);
  const [state, setState] = useState<DiagnosisState>(INITIAL_STATE);

  const resetApp = () => {
    setState(INITIAL_STATE);
    setStep(1);
    // Note: We keep the userRole. To switch role, user must click explicit button.
  };

  const switchRole = () => {
    setUserRole(null);
    resetApp();
  };

  const toggleLocation = (loc: AnatomicalLocation) => {
    setState(prev => ({
      ...prev,
      locations: prev.locations.includes(loc)
        ? prev.locations.filter(l => l !== loc)
        : [...prev.locations, loc]
    }));
  };

  // --------------------------------------------------------------------------
  // RENDER HELPERS
  // --------------------------------------------------------------------------

  // STEP: Role Selection
  if (!userRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900">MS Diagnose 2024</h1>
            <p className="text-slate-500">McDonald Criteria Revisie Tool</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <button 
              onClick={() => setUserRole(UserRole.NEUROLOGIST)}
              className="bg-white p-8 rounded-2xl shadow-md border-2 border-transparent hover:border-blue-500 hover:shadow-xl transition-all group text-left"
            >
              <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UserCog className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Neuroloog</h2>
              <p className="text-slate-500 text-sm">
                Start met de klinische presentatie. Flow gericht op symptomatologie en differentiaal diagnose.
              </p>
            </button>

            <button 
              onClick={() => setUserRole(UserRole.RADIOLOGIST)}
              className="bg-white p-8 rounded-2xl shadow-md border-2 border-transparent hover:border-purple-500 hover:shadow-xl transition-all group text-left"
            >
              <div className="bg-purple-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ScanLine className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Radioloog</h2>
              <p className="text-slate-500 text-sm">
                Start met MRI bevindingen. Flow gericht op locaties en biomarkers, met een klinische conclusie matrix.
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // COMPONENT: Step 1 - Locations (Shared logic, different context text)
  const renderLocationsStep = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-700">MRI Bevindingen - Locaties:</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${state.locations.length >= 2 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {state.locations.length} / 5 Geselecteerd
        </span>
      </div>

      <div className="grid gap-3">
        {[
          { id: AnatomicalLocation.PERIVENTRICULAR, label: 'Periventriculair', icon: Brain, desc: 'Rondom de ventrikels' },
          { id: AnatomicalLocation.CORTICAL_JUXTA, label: 'Corticaal / Juxtacorticaal', icon: Activity, desc: 'Cortex of direct aangrenzend' },
          { id: AnatomicalLocation.INFRATENTORIAL, label: 'Infratentoriaal', icon: Brain, desc: 'Hersenstam of cerebellum' },
          { id: AnatomicalLocation.SPINAL_CORD, label: 'Ruggenmerg', icon: Activity, desc: 'Spinale laesies' },
          { id: AnatomicalLocation.OPTIC_NERVE, label: 'Oogzenuw', icon: Eye, desc: 'NIEUW in 2024: Klinisch of MRI bewijs van neuritis optica' },
        ].map((loc) => {
          const isSelected = state.locations.includes(loc.id);
          const Icon = loc.icon;
          return (
            <button
              key={loc.id}
              onClick={() => toggleLocation(loc.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                <Icon size={24} />
              </div>
              <div className="text-left flex-1">
                <span className={`block font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                  {loc.label}
                </span>
                <span className="text-xs text-slate-500">{loc.desc}</span>
              </div>
              {isSelected && <CheckCircle2 className="text-blue-600" size={20} />}
            </button>
          );
        })}
      </div>
      
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex gap-3 text-sm text-slate-600">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <p>Minimaal 2 locaties nodig voor Disseminatie in Ruimte (DIS).</p>
      </div>
    </div>
  );

  // COMPONENT: Step 2/3 - Biomarkers (Shared)
  const renderBiomarkerStep = () => (
    <div className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600 mb-6">
        <p>Selecteer indien beschikbaar. Criteria voor DIT zijn versoepeld in 2024 door biomarkers (CVS/kFLC).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          onClick={() => setState(s => ({ ...s, hasDIT: !s.hasDIT }))}
          className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${state.hasDIT ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
        >
          <div className="flex items-center gap-2 mb-2">
             <RefreshCcw size={20} className={state.hasDIT ? 'text-blue-600' : 'text-slate-400'} />
             <span className="font-semibold text-slate-800">DIT (MRI)</span>
          </div>
          <p className="text-xs text-slate-500">Nieuwe T2 laesies of gelijktijdige aankleuring.</p>
        </div>

        <div 
          onClick={() => setState(s => ({ ...s, hasCVS: !s.hasCVS }))}
          className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${state.hasCVS ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white'}`}
        >
          <div className="flex items-center gap-2 mb-2">
             <Microscope size={20} className={state.hasCVS ? 'text-purple-600' : 'text-slate-400'} />
             <span className="font-semibold text-slate-800">Central Vein Sign</span>
          </div>
          <p className="text-xs text-slate-500">"Select 6" regel (of >50%).</p>
        </div>

        <div 
          onClick={() => setState(s => ({ ...s, hasPRL: !s.hasPRL }))}
          className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${state.hasPRL ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white'}`}
        >
          <div className="flex items-center gap-2 mb-2">
             <Activity size={20} className={state.hasPRL ? 'text-purple-600' : 'text-slate-400'} />
             <span className="font-semibold text-slate-800">Paramagnetic Rim</span>
          </div>
          <p className="text-xs text-slate-500">≥1 laesie met ijzerstapeling rand.</p>
        </div>

        <div 
          onClick={() => setState(s => ({ ...s, hasCSF: !s.hasCSF }))}
          className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${state.hasCSF ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
        >
          <div className="flex items-center gap-2 mb-2">
             <Stethoscope size={20} className={state.hasCSF ? 'text-blue-600' : 'text-slate-400'} />
             <span className="font-semibold text-slate-800">CSF Positief</span>
          </div>
          <p className="text-xs text-slate-500">OCB of kFLC.</p>
        </div>
      </div>
    </div>
  );

  // COMPONENT: Clinical Step (Neurologist Only)
  const renderClinicalStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">Klinische Context</label>
        
        <button
          onClick={() => setState(s => ({ ...s, scenario: ClinicalScenario.CIS }))}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
            state.scenario === ClinicalScenario.CIS 
              ? 'border-blue-600 bg-blue-50' 
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
           <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${state.scenario === ClinicalScenario.CIS ? 'border-blue-600' : 'border-slate-300'}`}>
            {state.scenario === ClinicalScenario.CIS && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
          </div>
          <div>
            <span className="font-semibold block text-slate-900">Typische Aanval (CIS) of Relapsing</span>
            <span className="text-sm text-slate-500">Actuele neurologische symptomen.</span>
          </div>
        </button>

        <button
          onClick={() => setState(s => ({ ...s, scenario: ClinicalScenario.PROGRESSIVE }))}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
            state.scenario === ClinicalScenario.PROGRESSIVE
              ? 'border-blue-600 bg-blue-50' 
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${state.scenario === ClinicalScenario.PROGRESSIVE ? 'border-blue-600' : 'border-slate-300'}`}>
            {state.scenario === ClinicalScenario.PROGRESSIVE && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
          </div>
          <div>
            <span className="font-semibold block text-slate-900">Progressief Verloop</span>
            <span className="text-sm text-slate-500">Gestage achteruitgang.</span>
          </div>
        </button>

        <button
          onClick={() => setState(s => ({ ...s, scenario: ClinicalScenario.RIS }))}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
            state.scenario === ClinicalScenario.RIS
              ? 'border-blue-600 bg-blue-50' 
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${state.scenario === ClinicalScenario.RIS ? 'border-blue-600' : 'border-slate-300'}`}>
            {state.scenario === ClinicalScenario.RIS && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
          </div>
          <div>
            <span className="font-semibold block text-slate-900">Asymptomatisch (RIS)</span>
            <span className="text-sm text-slate-500">Toevalsbevinding MRI.</span>
          </div>
        </button>
      </div>

       {state.scenario === ClinicalScenario.PROGRESSIVE && (
         <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              checked={state.progressionDuration}
              onChange={(e) => setState(s => ({ ...s, progressionDuration: e.target.checked }))}
            />
            <span className="text-slate-700 font-medium">Is er >1 jaar progressie?</span>
          </label>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
          <input 
            type="checkbox" 
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            checked={state.ageOver50}
            onChange={(e) => setState(s => ({ ...s, ageOver50: e.target.checked }))}
          />
          <span className="text-slate-700">Patiënt is 50 jaar of ouder</span>
        </label>
      </div>
    </div>
  );

  // COMPONENT: Result - Radiologist Matrix
  const renderRadioMatrix = () => {
    // Generate results for 3 distinct scenarios based on current MRI/Bio findings
    const resCIS = getDiagnosis({ ...state, scenario: ClinicalScenario.CIS });
    const resRIS = getDiagnosis({ ...state, scenario: ClinicalScenario.RIS });
    const resPROG = getDiagnosis({ ...state, scenario: ClinicalScenario.PROGRESSIVE, progressionDuration: true }); // Assume duration met for hypothetical

    const getStatusColor = (status: string) => {
      if (status === 'MS') return 'bg-green-50 border-green-200 text-green-900';
      if (status === 'RIS_HIGH_RISK') return 'bg-orange-50 border-orange-200 text-orange-900';
      return 'bg-slate-50 border-slate-200 text-slate-900';
    };

    const MatrixCard = ({ title, sub, result }: {title: string, sub: string, result: DiagnosisResult}) => (
      <div className={`p-4 rounded-xl border-2 flex flex-col h-full ${getStatusColor(result.status)}`}>
        <div className="mb-2">
          <h4 className="font-bold text-sm uppercase tracking-wide opacity-70">{title}</h4>
          <p className="text-xs opacity-60">{sub}</p>
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg leading-tight mb-2">{result.title}</p>
          <ul className="text-xs space-y-1 opacity-80 list-disc list-inside">
            {result.recommendations.slice(0, 2).map((rec, i) => <li key={i}>{rec}</li>)}
          </ul>
        </div>
        <div className="mt-3 pt-3 border-t border-black/10 text-xs font-semibold">
          Conclusie: {result.status === 'MS' ? 'Voldoet aan criteria' : 'Niet diagnostisch'}
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Radiologische Conclusie Matrix</h2>
          <p className="text-slate-500">Op basis van de ingevoerde beeldvorming:</p>
          <div className="flex justify-center gap-4 text-xs font-medium mt-2">
            <span className="bg-slate-100 px-2 py-1 rounded">DIS: {state.locations.length >= 2 ? 'Ja' : 'Nee'}</span>
            <span className="bg-slate-100 px-2 py-1 rounded">Supportive (DIT/Bio): {state.hasDIT || state.hasCSF || state.hasCVS || state.hasPRL ? 'Ja' : 'Nee'}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <MatrixCard 
            title="Symptomatisch" 
            sub="Bij typische aanval (CIS)" 
            result={resCIS} 
          />
          <MatrixCard 
            title="Asymptomatisch" 
            sub="Toevalsbevinding (RIS)" 
            result={resRIS} 
          />
          <MatrixCard 
            title="Progressief" 
            sub="Bij >1jr achteruitgang" 
            result={resPROG} 
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 mt-6 flex gap-3">
          <Info className="flex-shrink-0 w-5 h-5" />
          <p>
            Bovenstaande matrix toont de diagnose afhankelijk van de (vaak onbekende) klinische context. 
            Vermeld in het verslag of de beelden voldoen aan de criteria voor DIS en DIT/Biomarkers, en correleer met bovenstaande scenario's.
          </p>
        </div>

         <div className="flex justify-center gap-4 mt-8">
          <button 
             onClick={() => setStep(2)}
             className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
           >
             <ArrowLeft size={18} /> Terug
           </button>

          <button onClick={resetApp} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all shadow-sm">
            <RefreshCcw size={16} /> Nieuwe Patiënt
          </button>
        </div>
      </div>
    );
  };

  // COMPONENT: Result - Neurologist Single
  const renderNeuroResult = () => {
    const result = getDiagnosis(state);
    let statusColor = '';
    let statusIcon = null;

    switch (result.status) {
      case 'MS':
        statusColor = 'bg-green-100 border-green-200 text-green-900';
        statusIcon = <CheckCircle2 className="text-green-600 w-12 h-12" />;
        break;
      case 'POSSIBLE':
        statusColor = 'bg-amber-100 border-amber-200 text-amber-900';
        statusIcon = <AlertCircle className="text-amber-600 w-12 h-12" />;
        break;
      case 'RIS_HIGH_RISK':
        statusColor = 'bg-orange-100 border-orange-200 text-orange-900';
        statusIcon = <AlertCircle className="text-orange-600 w-12 h-12" />;
        break;
      case 'NO_MS':
      default:
        statusColor = 'bg-slate-100 border-slate-200 text-slate-900';
        statusIcon = <XCircle className="text-slate-500 w-12 h-12" />;
        break;
    }

    return (
      <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className={`p-8 rounded-2xl border-2 ${statusColor} flex flex-col items-center gap-4`}>
          {statusIcon}
          <h2 className="text-3xl font-bold">{result.title}</h2>
          <p className="text-lg opacity-90 max-w-lg">{result.description}</p>
        </div>

        <div className="text-left bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm mb-6">
            <h5 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <ListChecks size={16} className="text-slate-500"/>
              Onderbouwing Diagnose
            </h5>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-1 sm:gap-4">
                <span className="font-medium text-slate-500 text-xs uppercase tracking-wide pt-1">DIS (Locaties)</span>
                <span className="text-slate-900 font-medium">{result.evidenceSummary.dis}</span>
              </div>
              <div className="border-t border-slate-200/50"></div>
              <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-1 sm:gap-4">
                <span className="font-medium text-slate-500 text-xs uppercase tracking-wide pt-1">DIT / Bio</span>
                <span className="text-slate-900 font-medium">{result.evidenceSummary.dit}</span>
              </div>
            </div>
          </div>

          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <BookOpen size={18} />
            Aanbevelingen
          </h4>
          <ul className="space-y-2">
            {result.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center gap-4">
          <button 
             onClick={() => setStep(3)}
             className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
           >
             <ArrowLeft size={18} /> Terug
           </button>

          <button onClick={resetApp} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all shadow-sm">
            <RefreshCcw size={16} /> Nieuwe Patiënt
          </button>
        </div>
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // MAIN RENDER (Flow Switching)
  // --------------------------------------------------------------------------
  
  const isNeuro = userRole === UserRole.NEUROLOGIST;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans text-slate-900">
      <header className="max-w-2xl mx-auto mb-8 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg shadow-sm ${isNeuro ? 'bg-blue-600' : 'bg-purple-600'}`}>
              {isNeuro ? <UserCog className="text-white w-6 h-6" /> : <ScanLine className="text-white w-6 h-6" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">MS Diagnose 2024</h1>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">
                {isNeuro ? 'Modus: Neuroloog' : 'Modus: Radioloog'}
              </p>
            </div>
         </div>
         <button onClick={switchRole} className="text-xs font-medium text-slate-400 hover:text-slate-700">
           Wijzig Rol
         </button>
      </header>

      {/* --- NEUROLOGIST FLOW (Clinical First) --- */}
      {isNeuro && (
        <>
          {step === 1 && (
            <StepWizard currentStep={1} totalSteps={4} title="Klinische Context" canProceed={!!state.scenario} onNext={() => setStep(2)}>
              {renderClinicalStep()}
            </StepWizard>
          )}
          {step === 2 && (
            <StepWizard currentStep={2} totalSteps={4} title="MRI Locaties (DIS)" canProceed={true} onBack={() => setStep(1)} onNext={() => setStep(3)}>
              {renderLocationsStep()}
            </StepWizard>
          )}
          {step === 3 && (
            <StepWizard currentStep={3} totalSteps={4} title="Biomarkers (DIT)" canProceed={true} onBack={() => setStep(2)} onNext={() => setStep(4)} isFinal>
              {renderBiomarkerStep()}
            </StepWizard>
          )}
          {step === 4 && (
            <StepWizard currentStep={4} totalSteps={4} title="Resultaat" canProceed={false}>
              {renderNeuroResult()}
            </StepWizard>
          )}
        </>
      )}

      {/* --- RADIOLOGIST FLOW (MRI First, No Explicit Clinical Step) --- */}
      {!isNeuro && (
        <>
          {step === 1 && (
            <StepWizard currentStep={1} totalSteps={3} title="MRI Locaties (DIS)" canProceed={true} onNext={() => setStep(2)}>
              {renderLocationsStep()}
            </StepWizard>
          )}
          {step === 2 && (
            <StepWizard currentStep={2} totalSteps={3} title="Biomarkers (DIT)" canProceed={true} onBack={() => setStep(1)} onNext={() => setStep(3)} isFinal>
              {renderBiomarkerStep()}
            </StepWizard>
          )}
          {step === 3 && (
            <StepWizard currentStep={3} totalSteps={3} title="Conclusie Matrix" canProceed={false}>
              {renderRadioMatrix()}
            </StepWizard>
          )}
        </>
      )}

      <footer className="max-w-2xl mx-auto mt-12 text-center text-xs text-slate-400">
        <p>Gebaseerd op: <em>Diagnosis of multiple sclerosis: 2024 revisions of the McDonald criteria (The Lancet Neurology)</em>.</p>
      </footer>
    </div>
  );
}