import React, { useState } from 'react';
import { PenBox, Download, CheckCircle2 } from 'lucide-react';

export default function Questionnaire({ history }) {
  const isComplete = history.R1 && history.R2 && history.R3;
  
  const [answers, setAnswers] = useState({ q1: '', q2: '' });
  const [submitted, setSubmitted] = useState(false);

  // According to requirements, download button is disabled until 3 experiments run 
  // AND the student answers at least the first question about Hess's law.
  const isQ1Answered = answers.q1.trim().length > 5;
  const canDownload = isComplete && submitted && isQ1Answered;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isQ1Answered) setSubmitted(true);
  };

  const handleDownloadReport = () => {
    const sum = history.R1.dH + history.R3.dH;
    const h2 = history.R2.dH;
    const error = Math.abs((sum - h2) / h2) * 100;

    const reportContent = `
=== INFORME DE LABORATORIO: CALORIMETRÍA (LEI DE HESS) ===

1. DATOS EXPERIMENTAIS
--------------------------------------------------
[R1] Disolución NaOH(s):
- Masa NaOH: ${history.R1.nNaOH * 40} g
- Incremento Térmico: +${history.R1.deltaT.toFixed(2)} °C
- Entalpía Experimental (ΔH1): ${history.R1.dH.toFixed(2)} kJ/mol

[R2] Reacción Directa NaOH(s) + HCl(aq):
- Masa NaOH: ${history.R2.nNaOH * 40} g
- Incremento Térmico: +${history.R2.deltaT.toFixed(2)} °C
- Entalpía Experimental (ΔH2): ${history.R2.dH.toFixed(2)} kJ/mol

[R3] Neutralización NaOH(aq) + HCl(aq):
- Moles NaOH: ${history.R3.nNaOH.toFixed(3)} mol
- Incremento Térmico: +${history.R3.deltaT.toFixed(2)} °C
- Entalpía Experimental (ΔH3): ${history.R3.dH.toFixed(2)} kJ/mol

2. VERIFICACIÓN DA LEI DE HESS
--------------------------------------------------
Suma de etapas (ΔH1 + ΔH3) = ${sum.toFixed(2)} kJ/mol
Vía directa (ΔH2) = ${h2.toFixed(2)} kJ/mol
Erro Relativo de comprobación = ${error.toFixed(2)}%

3. CUESTONARIO
--------------------------------------------------
P1. Enunciado da Lei de Hess e aplicación á práctica:
R: ${answers.q1}

P2. Fontes de erro experimental (Opcional):
R: ${answers.q2}
`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'informe_calorimetria.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-xl w-full border border-zinc-200 dark:border-zinc-700 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <PenBox className="text-amber-500" />
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Cuestionario Final e Informe</h2>
      </div>

      {!isComplete ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50">
          <p>Debes completar as 3 reaccións (R1, R2, R3) no simulador para desbloquear o cuestionario e o informe.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                1. Baseándose nos resultados obtidos, enuncia brevemente a Lei de Hess e explica como se cumpre nesta práctica. <span className="text-red-500">*</span>
              </label>
              <textarea 
                required
                disabled={submitted}
                className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-amber-500 outline-none transition"
                rows={4}
                value={answers.q1}
                onChange={e => setAnswers({...answers, q1: e.target.value})}
                placeholder="Escribe a túa resposta aquí..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                2. ¿Cales cres que son as principais fontes de erro do simulador respecto a un laboratorio real? (Opcional)
              </label>
              <textarea 
                disabled={submitted}
                className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-amber-500 outline-none transition"
                rows={2}
                value={answers.q2}
                onChange={e => setAnswers({...answers, q2: e.target.value})}
                placeholder="Escribe a túa resposta aquí..."
              />
            </div>

            {!submitted && (
              <button 
                type="submit"
                disabled={!isQ1Answered}
                className="bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-400 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                Gardar Respostas
              </button>
            )}
            
            {submitted && (
               <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold">
                 <CheckCircle2 size={20} /> Respostas rexistradas correctamente.
               </div>
            )}
          </form>

          <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 flex flex-col justify-center items-center text-center">
            <h3 className="text-lg font-bold mb-2">Xerar Informe de Prácticas</h3>
            <p className="text-sm text-zinc-500 mb-6">
              O informe incluirá os cálculos de Entalpía, a comprobación automática da suma (ΔH₁ + ΔH₃ vs ΔH₂) e as túas respostas ao cuestionario.
            </p>
            <button
              disabled={!canDownload}
              onClick={handleDownloadReport}
              className={`flex items-center gap-2 font-bold py-4 px-8 rounded-xl transition-all shadow-lg
                ${canDownload 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transform hover:scale-105' 
                  : 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'}`}
            >
              <Download size={24} /> Descargar Informe (TXT)
            </button>
            {!canDownload && submitted && (
               <p className="text-xs text-red-500 mt-4 px-4">Por favor, responde correctamente á pregunta principal para habilitar a descarga.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
