import React from 'react';
import { ArrowDown, ArrowRight, CornerDownRight, Info } from 'lucide-react';

export default function HessCycle({ history }) {
  // history is a dictionary of the last executed results for R1, R2, R3
  const h1 = history.R1 ? history.R1.dH : null;
  const h2 = history.R2 ? history.R2.dH : null;
  const h3 = history.R3 ? history.R3.dH : null;
  
  const sum = (h1 !== null && h3 !== null) ? (h1 + h3) : null;
  const error = (sum !== null && h2 !== null) ? Math.abs((sum - h2) / h2) * 100 : null;

  return (
    <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-xl w-full border border-zinc-200 dark:border-zinc-700 mt-8">
      <div className="flex items-center gap-3 mb-8">
        <Info className="text-blue-500" />
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Verificación da Lei de Hess</h2>
        <p className="text-zinc-500 dark:text-zinc-400 ml-auto">ΔH₂ = ΔH₁ + ΔH₃</p>
      </div>

      <div className="relative flex flex-col items-center justify-center py-10 w-full max-w-3xl mx-auto">
        
        {/* TOP ROW */}
        <div className="flex justify-between w-full relative z-10 px-8">
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-4 rounded-xl text-center w-48 shadow-sm">
             <p className="font-bold text-zinc-800 dark:text-zinc-200">NaOH(s)</p>
             <p className="text-xs text-zinc-500">+ HCl(aq)</p>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-4 rounded-xl text-center w-48 shadow-sm">
             <p className="font-bold text-zinc-800 dark:text-zinc-200">NaCl(aq)</p>
             <p className="text-xs text-zinc-500">+ H₂O(l)</p>
          </div>
        </div>

        {/* ΔH2 Direct Arrow */}
        <div className="absolute top-18 w-2/3 h-px border-t-[3px] border-dashed border-purple-400 dark:border-purple-600 flex justify-center z-0">
           <div className="absolute -top-6 bg-white dark:bg-zinc-800 px-3 flex flex-col items-center">
             <span className="font-bold text-purple-600 dark:text-purple-400">R2 (Directa)</span>
             <span className="text-sm rounded bg-purple-100 dark:bg-purple-900 px-2 py-0.5 mt-1 font-mono">
               ΔH₂: {h2 !== null ? `${h2.toFixed(1)} kJ/mol` : 'Pendente'}
             </span>
           </div>
           <ArrowRight className="absolute -right-3 -top-3 text-purple-500" size={24} strokeWidth={3} />
        </div>

        {/* BOTTOM ROW */}
        <div className="mt-24 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-4 rounded-xl text-center w-48 shadow-sm z-10 relative">
          <p className="font-bold text-zinc-800 dark:text-zinc-200">NaOH(aq)</p>
          <p className="text-xs text-zinc-500">+ HCl(aq)</p>
        </div>

        {/* ΔH1 Arrow (Down-Left) */}
        <div className="absolute top-28 left-[22%] w-px h-24 border-l-[3px] border-amber-400 dark:border-amber-600 z-0">
           <div className="absolute top-8 -left-28 bg-white dark:bg-zinc-800 px-2 py-1 flex flex-col items-end">
             <span className="font-bold text-amber-600 dark:text-amber-500">R1 (Disol.)</span>
             <span className="text-sm rounded bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 mt-1 font-mono">
               ΔH₁: {h1 !== null ? `${h1.toFixed(1)}` : 'Pendente'}
             </span>
           </div>
           <ArrowDown className="absolute -bottom-3 -left-3 text-amber-500" size={24} strokeWidth={3} />
        </div>

        {/* ΔH3 Arrow (Up-Right) -> going from bottom node to right top node */}
        <div className="absolute top-24 right-[16%] w-1/3 h-28 border-l-[0px] border-b-[3px] border-r-[3px] border-teal-400 dark:border-teal-600 rounded-br-2xl -z-10 bg-transparent">
           <div className="absolute bottom-[-18px] right-24 bg-white dark:bg-zinc-800 px-2 flex flex-col items-center">
             <span className="font-bold text-teal-600 dark:text-teal-400">R3 (Neutral.)</span>
             <span className="text-sm rounded bg-teal-100 dark:bg-teal-900/40 px-2 py-0.5 mt-1 font-mono">
               ΔH₃: {h3 !== null ? `${h3.toFixed(1)}` : 'Pendente'}
             </span>
           </div>
           {/* The angle arrow here points UP to the right node. Wait, let's keep it simple and just do a vertical arrow up to the right node. */}
        </div>
        <div className="absolute top-24 right-[16%] w-px h-[100px] border-r-[0px] bg-transparent z-0">
            <ArrowDown className="absolute -top-3 -right-3 text-teal-500 rotate-180" size={24} strokeWidth={3} />
        </div>

      </div>

      {sum !== null && h2 !== null && (
        <div className="mt-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-xl flex justify-between items-center animate-in fade-in slide-in-from-bottom flex-wrap gap-4">
          <div>
            <h4 className="font-bold text-green-800 dark:text-green-300 text-lg mb-1">¡Ciclo Completado!</h4>
            <p className="text-green-700 dark:text-green-400 text-sm">Validación experimental da Lei de Hess</p>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-xs uppercase font-bold text-green-600 dark:text-green-500 tracking-wider">Suma (R1 + R3)</p>
              <p className="text-xl font-mono text-green-700 dark:text-green-400">{sum.toFixed(1)} kJ/mol</p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase font-bold text-green-600 dark:text-green-500 tracking-wider">Directa (R2)</p>
              <p className="text-xl font-mono text-green-700 dark:text-green-400">{h2.toFixed(1)} kJ/mol</p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase font-bold text-red-600 dark:text-red-500 tracking-wider text-rose-600">Desviación</p>
              <p className="text-xl font-mono font-bold text-red-600">{error.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
