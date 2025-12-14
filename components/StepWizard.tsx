import React from 'react';

interface StepWizardProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  canProceed: boolean;
  isFinal?: boolean;
}

export const StepWizard: React.FC<StepWizardProps> = ({
  currentStep,
  totalSteps,
  title,
  children,
  onBack,
  onNext,
  canProceed,
  isFinal = false,
}) => {
  const progress = ((currentStep) / totalSteps) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl w-full mx-auto border border-slate-100">
      <div className="h-2 bg-slate-100 w-full">
        <div 
          className="h-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="p-6 md:p-8">
        <div className="mb-6">
          <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase">
            Stap {currentStep} van {totalSteps}
          </span>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">{title}</h2>
        </div>

        <div className="min-h-[300px]">
          {children}
        </div>

        {(onBack || onNext) && (
          <div className="mt-8 flex justify-between pt-6 border-t border-slate-100">
            <button
              onClick={onBack}
              disabled={!onBack}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                onBack 
                  ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' 
                  : 'text-transparent cursor-default'
              }`}
            >
              Terug
            </button>
            
            {onNext && (
              <button
                onClick={onNext}
                disabled={!canProceed}
                className={`px-8 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all ${
                  canProceed
                    ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isFinal ? 'Diagnose Tonen' : 'Volgende'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};