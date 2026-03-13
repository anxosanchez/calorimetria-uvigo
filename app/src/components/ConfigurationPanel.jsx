import React from 'react';
import { Play, RotateCcw, Droplets, Scale, FlaskConical } from 'lucide-react';

export default function ConfigurationPanel({ config, updateConfig, state, startExperiment, resetExperiment }) {
  const isRunning = state.status !== 'idle';

  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 w-full max-w-md">
      <h2 className="text-xl font-bold mb-6 text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
        <FlaskConical className="text-purple-500" />
        Configuración
      </h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Tipo de Reacción
          </label>
          <select 
            disabled={isRunning}
            value={config.reactionType}
            onChange={(e) => updateConfig('reactionType', e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-zinc-900 dark:text-zinc-100"
          >
            <option value="R1">R1: NaOH(s) + H₂O → Disolución</option>
            <option value="R2">R2: NaOH(s) + HCl(aq) → Directa</option>
            <option value="R3">R3: NaOH(aq) + HCl(aq) → Neutralización</option>
          </select>
        </div>

        <div>
          <label className="flex justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            <span className="flex items-center gap-1"><Scale size={16}/> Masa de NaOH (g)</span>
            <span className="text-purple-600 dark:text-purple-400 font-bold">{config.massNaOH} g</span>
          </label>
          <input 
            type="range" min="1.0" max="3.0" step="0.1" 
            value={config.massNaOH} 
            onChange={(e) => updateConfig('massNaOH', parseFloat(e.target.value))}
            disabled={isRunning || config.reactionType === 'R3'}
            className="w-full accent-purple-500"
          />
          {config.reactionType === 'R3' && <p className="text-xs text-zinc-500 mt-1">En R3 úsase NaOH(aq) xa preparado previamente con esta masa.</p>}
        </div>

        <div>
           <label className="flex justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            <span className="flex items-center gap-1"><Droplets size={16}/> Vol. Ácido/Solvente (mL)</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">{config.volume} mL</span>
          </label>
          <input 
            type="range" min="10" max="100" step="5" 
            value={config.volume} 
            onChange={(e) => updateConfig('volume', parseInt(e.target.value))}
            disabled={isRunning}
            className="w-full accent-blue-500"
          />
        </div>

        {config.reactionType === 'R3' && (
          <div>
            <label className="flex justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              <span className="flex items-center gap-1"><Droplets size={16}/> Vol. NaOH(aq) (mL)</span>
              <span className="text-teal-600 dark:text-teal-400 font-bold">{config.volumeNaOHaq} mL</span>
            </label>
            <input 
              type="range" min="10" max="100" step="5" 
              value={config.volumeNaOHaq} 
              onChange={(e) => updateConfig('volumeNaOHaq', parseInt(e.target.value))}
              disabled={isRunning}
              className="w-full accent-teal-500"
            />
          </div>
        )}

        {config.reactionType !== 'R1' && (
          <div>
             <label className="flex justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              <span>Molaridad HCl (M)</span>
              <span className="text-orange-600 dark:text-orange-400 font-bold">{config.molarityHCl} M</span>
            </label>
            <input 
              type="range" min="0.5" max="2.0" step="0.1" 
              value={config.molarityHCl} 
              onChange={(e) => updateConfig('molarityHCl', parseFloat(e.target.value))}
              disabled={isRunning}
              className="w-full accent-orange-500"
            />
          </div>
        )}

      </div>

      <div className="flex gap-3 mt-8">
        <button 
          onClick={startExperiment}
          disabled={isRunning || state.status === 'finished'}
          className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-300 disabled:dark:bg-zinc-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Play size={20} /> Comezar
        </button>
        <button 
          onClick={resetExperiment}
          disabled={state.status === 'idle'}
          className="flex-1 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw size={20} /> Limpar
        </button>
      </div>
    </div>
  );
}
