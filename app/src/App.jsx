import React, { useState, useRef, useCallback } from 'react';
import { Play, RotateCcw, Download, Info, Settings, Beaker, FileText, Activity, Zap, X, ChevronRight, Thermometer, FlaskConical } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const CE_WATER  = 4.184;  // J/(g·ºC)
const MW_NAOH   = 40.0;   // g/mol
const T_INITIAL = 20.0;   // ºC

const THEORETICAL_DH = {
  R1: -44.5,
  R2: -102.0,
  R3: -57.5,
};

const REACTION_LABELS = {
  R1: 'Exp 1 – Disolución NaOH(s) en auga',
  R2: 'Exp 2 – Disolución NaOH(s) en HCl 1M',
  R3: 'Exp 3 – Neutralización NaOH(aq) + HCl(aq)',
};

// ─── SURVEY & QUESTIONNAIRE DATA ─────────────────────────────────────────────
const SURVEY_QUESTIONS = [
  'Os obxectivos da práctica estaban claros antes de comezala.',
  'O simulador axudoume a comprender o concepto de entalpía.',
  'A interface é intuitiva e doada de usar.',
  'A simulación reflicte adecuadamente o comportamento real do calorímetro.',
  'A curva de temperatura axudoume a identificar o punto de Tmax.',
  'O ciclo de Hess quedou máis claro tras o experimento.',
  'Volvería usar este simulador para estudar.',
  'Recomendaríache este simulador a outros/as compañeiros/as.',
  'O nivel de dificultade das cuestións finais é axeitado.',
  'En xeral, estou satisfeito/a coa experiencia de aprendizaxe.',
];

const PEDAGOGY_QUESTIONS = [
  { id: 'q1', label: 'Explica a Lei de Hess e como se verifica nesta práctica.' },
  { id: 'q2', label: 'Indica dúas fontes de erro experimentais e como afectan a ΔH.' },
  { id: 'q3', label: 'Por que é necesario coñecer a capacidade calorífica do calorímetro (K)?' },
];

// ─── CUSTOM HOOK ─────────────────────────────────────────────────────────────
function useCalorimetry() {
  const [config, setConfig] = useState({
    massNaOH:     2.0,
    volume:       50,
    volumeNaOHaq: 50,
    molarityHCl:  1.0,
    kCalorimeter: 15.0,
    reactionType: 'R1',
  });

  const [state, setState] = useState({
    status:      'idle',
    currentTime: 0,
    currentTemp: T_INITIAL,
    dataPoints:  [],
    results:     null,
  });

  const timerRef   = useRef(null);
  const agitRef    = useRef(false); // has the user pressed Agitar?

  // ── Calculate expected ΔT given config ──────────────────────────────────
  const calcTheory = useCallback((cfg) => {
    const nNaOH = cfg.massNaOH / MW_NAOH;
    const nHCl  = (cfg.volume / 1000) * cfg.molarityHCl;
    let qTheory  = 0;
    let totalMass = 0;

    if (cfg.reactionType === 'R1') {
      qTheory   = nNaOH * Math.abs(THEORETICAL_DH.R1) * 1000;
      totalMass = cfg.volume + cfg.massNaOH;
    } else if (cfg.reactionType === 'R2') {
      const nNeu = Math.min(nNaOH, nHCl);
      qTheory    = nNaOH * Math.abs(THEORETICAL_DH.R1) * 1000 + nNeu * Math.abs(THEORETICAL_DH.R3) * 1000;
      totalMass  = cfg.volume + cfg.massNaOH;
    } else {
      const nNeu = Math.min(nNaOH, nHCl);
      qTheory    = nNeu * Math.abs(THEORETICAL_DH.R3) * 1000;
      totalMass  = cfg.volume + cfg.volumeNaOHaq + cfg.massNaOH;
    }

    const errFactor   = 0.96 + Math.random() * 0.03;
    const qExp        = qTheory * errFactor;
    const heatCap     = totalMass * CE_WATER + cfg.kCalorimeter;
    const deltaT      = qExp / heatCap;
    const dH_exp      = -(qExp / (nNaOH * 1000));
    const errPct      = Math.abs((dH_exp - THEORETICAL_DH[cfg.reactionType]) / THEORETICAL_DH[cfg.reactionType]) * 100;

    return { qExp, totalMass, deltaT, dH_exp, nNaOH, errPct };
  }, []);

  // ── Start experiment with optional agitation ─────────────────────────────
  const startExperiment = useCallback(() => {
    if (state.status === 'running') return;

    const theory = calcTheory(config);
    agitRef.current = false;

    setState(s => ({
      ...s, status: 'running', currentTime: 0,
      currentTemp: T_INITIAL, dataPoints: [{ time: 0, temp: T_INITIAL }], results: null,
    }));

    let t = 0;
    const maxTime = 40;
    const dt      = 1;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      t += dt;

      // heating rate depends on whether the user agitated
      const kHeat = agitRef.current ? 0.20 : 0.07;
      // add noise if not agitated
      const noise = agitRef.current ? 0 : (Math.random() - 0.5) * 0.3;

      // Newton cooling after t=20
      const heated  = theory.deltaT * (1 - Math.exp(-kHeat * t));
      let   cooling = 0;
      if (t > 20) {
        const tPeak    = T_INITIAL + theory.deltaT;
        const kCool    = 0.03;
        cooling        = (tPeak - T_INITIAL) * (1 - Math.exp(-kCool * (t - 20)));
      }
      const currentTemp = T_INITIAL + heated - cooling + noise;

      setState(s => {
        const newDataPoints = [...s.dataPoints, { time: t, temp: Math.max(T_INITIAL - 0.5, currentTemp) }];
        if (t >= maxTime) {
          clearInterval(timerRef.current);
          const finalResults = {
            T0: T_INITIAL, Tmax: T_INITIAL + theory.deltaT,
            deltaT: theory.deltaT, Q: theory.qExp,
            nNaOH: theory.nNaOH, dH: theory.dH_exp,
            error: theory.errPct, reaction: config.reactionType,
          };
          return { ...s, status: 'finished', currentTime: t, currentTemp, dataPoints: newDataPoints, results: finalResults };
        }
        return { ...s, currentTime: t, currentTemp, dataPoints: newDataPoints };
      });
    }, 150);
  }, [config, state.status, calcTheory]);

  const agitate = useCallback(() => {
    agitRef.current = true;
  }, []);

  const resetExperiment = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState({ status: 'idle', currentTime: 0, currentTemp: T_INITIAL, dataPoints: [], results: null });
  }, []);

  const updateConfig = useCallback((key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    resetExperiment();
  }, [resetExperiment]);

  return { config, state, startExperiment, agitate, resetExperiment, updateConfig };
}

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/90 border border-white/10 rounded-xl p-3 backdrop-blur-xl shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{label}s</p>
      <p className="font-mono text-emerald-400 font-bold">{Number(payload[0].value).toFixed(2)} ºC</p>
    </div>
  );
}

// ─── HELP PANEL ──────────────────────────────────────────────────────────────
function HelpPanel({ isOpen, onClose }) {
  if (!isOpen) return null;
  const steps = [
    { n: 1, title: 'Pesada do NaOH', desc: 'Pesa entre 1.0 g e 3.0 g de NaOH(s) cunha balanza analítica.' },
    { n: 2, title: 'Preparación do calorímetro', desc: 'Mide 50 mL de auga ou HCl 1M e introduce a sonda do termómetro.' },
    { n: 3, title: 'Rexistro da T\u2080', desc: 'Anota a temperatura inicial de equilibrio durante 1 minuto.' },
    { n: 4, title: 'Adición do reactivo', desc: 'Engade o NaOH(s) ao vaso calorimétrico e fecha a tapa.' },
    { n: 5, title: 'Axitación', desc: 'Preme "Axitar" inmediatamente para garantir disolución completa.' },
    { n: 6, title: 'Lectura de T\u2098\u2090\u02e3', desc: 'Observa o punto de inflexión da curva e rexistra o valor máximo.' },
    { n: 7, title: 'Arrefriamento', desc: 'Permite que a temperatura baixe (Newton) durante 20 s e anota.' },
    { n: 8, title: 'Rexistro e cálculos', desc: 'Calcula Q = m·c\u2091·\u0394T + K·\u0394T e \u0394H = \u2212Q/n\u2098\u2092\u2095.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-sm bg-slate-900/80 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-2xl overflow-y-auto">
        {/* glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-blue-400" /> Guía do Experimento
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-4">
          {steps.map(s => (
            <div key={s.n} className="flex gap-3 group">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs font-bold flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                {s.n}
              </span>
              <div>
                <p className="text-white text-sm font-semibold">{s.title}</p>
                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/10">
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
            <p className="text-orange-300 text-xs font-semibold mb-1">⚠️ Erro frecuente</p>
            <p className="text-slate-400 text-xs">Non esquecer premer "Axitar" xusto tras engadir o NaOH. Sen axitación, a curva é irregular e o valor de T\u2098\u2090\u02e3 non é representativo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SURVEY MODAL ─────────────────────────────────────────────────────────────
function SurveyModal({ isOpen, onClose }) {
  const [ratings, setRatings] = useState({});
  if (!isOpen) return null;

  const allAnswered = SURVEY_QUESTIONS.every((_, i) => ratings[i] !== undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl w-full max-w-xl backdrop-blur-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Enquisa de Calidade</h2>
            <p className="text-slate-400 text-sm mt-1">Valora do 1 (moi en desacordo) ao 5 (totalmente de acordo)</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {SURVEY_QUESTIONS.map((q, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-slate-300 text-sm mb-3 leading-relaxed">{i + 1}. {q}</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(v => (
                  <button key={v} onClick={() => setRatings(r => ({ ...r, [i]: v }))}
                    className={`flex-1 h-8 rounded-lg text-sm font-bold border transition-all ${
                      ratings[i] === v
                        ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-indigo-400/50 hover:text-white'
                    }`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-white/10 flex justify-between items-center">
          <p className="text-slate-500 text-xs">{Object.keys(ratings).length}/{SURVEY_QUESTIONS.length} respondidas</p>
          <button
            onClick={() => { if (allAnswered) { alert('Enquisa enviada. Grazas!'); onClose(); } }}
            disabled={!allAnswered}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              allAnswered
                ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'
            }`}>
            Enviar <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── GLASS CARD ──────────────────────────────────────────────────────────────
function GlassCard({ children, className = '', glow = '' }) {
  return (
    <div className={`relative backdrop-blur-2xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl ${className}`}
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)' }}>
      {/* top-edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      {glow && (
        <div className={`absolute pointer-events-none -z-0 w-56 h-56 rounded-full blur-3xl opacity-25 ${glow}`} />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const { config, state, startExperiment, agitate, resetExperiment, updateConfig } = useCalorimetry();
  const [history, setHistory]     = useState({ R1: null, R2: null, R3: null });
  const [isHelpOpen, setHelpOpen] = useState(false);
  const [isSurveyOpen, setSurvey] = useState(false);
  const [answers, setAnswers]     = useState({ q1: '', q2: '', q3: '' });
  const [agitated, setAgitated]   = useState(false);

  // Persist finished results into history
  if (
    state.status === 'finished' &&
    state.results &&
    history[config.reactionType] !== state.results
  ) {
    setHistory(prev => ({ ...prev, [config.reactionType]: state.results }));
  }

  const allDone  = history.R1 && history.R2 && history.R3;
  const canPrint = !!allDone;

  const handleAgitate = () => {
    agitate();
    setAgitated(true);
    setTimeout(() => setAgitated(false), 1200);
  };

  const hessData = allDone ? (() => {
    const H1 = history.R1.dH, H2 = history.R2.dH, H3 = history.R3.dH;
    const sum = H1 + H3;
    const dev = Math.abs((sum - H2) / H2) * 100;
    return { H1, H2, H3, sum, dev };
  })() : null;

  return (
    <div className="min-h-screen w-full text-slate-200 font-sans relative overflow-x-hidden"
      style={{ background: 'radial-gradient(ellipse 120% 80% at 50% -10%, #0e1a40 0%, #020617 60%), radial-gradient(ellipse 60% 40% at 80% 90%, #0d1f3c 0%, transparent 70%)' }}>

      {/* Animated ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-[-15%] left-[-8%] w-[700px] h-[700px] rounded-full bg-blue-500/8 blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[-15%] right-[-8%] w-[600px] h-[600px] rounded-full bg-indigo-500/8 blur-3xl animate-pulse" style={{ animationDuration: '14s' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[250px] rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-3xl animate-pulse" style={{ animationDuration: '18s' }} />
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-slate-900 pt-8 px-8">
        <h1 className="text-3xl font-black border-b-2 border-slate-300 pb-3 mb-4">Informe: Práctica 1. Termoquímica: Calorimetría — U. Vigo</h1>
        <p className="text-sm text-slate-500">Data: {new Date().toLocaleDateString('gl-ES')}</p>
      </div>

      {/* ── MAIN LAYOUT ───────────────────────────────────────────────────── */}
      <div className="w-full px-4 md:px-8 lg:px-10 xl:px-14 py-6 space-y-6 print:p-0">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-[0_0_28px_rgba(99,102,241,0.6)] ring-1 ring-white/20">
              <Beaker className="w-7 h-7 text-white drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-indigo-400">
                Simulador Termodinámico
              </h1>
              <p className="text-slate-500 text-sm">Práctica 1 · Termoquímica: Calorimetría · U. Vigo</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setHelpOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] hover:border-blue-400/50 rounded-xl text-sm text-slate-300 hover:text-white transition-all backdrop-blur-md">
              <Info className="w-4 h-4 text-blue-400" /> Guía
            </button>
            <button onClick={() => setSurvey(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] hover:border-indigo-400/50 rounded-xl text-sm text-slate-300 hover:text-white transition-all backdrop-blur-md">
              <FileText className="w-4 h-4 text-indigo-400" /> Enquisa
            </button>
            <button onClick={() => window.print()} disabled={!canPrint}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border backdrop-blur-md ${
                canPrint
                  ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-400 hover:bg-emerald-500 hover:text-slate-900 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                  : 'bg-white/[0.03] border-white/[0.05] text-slate-600 cursor-not-allowed'
              }`}>
              <Download className="w-4 h-4" /> Informe PDF
            </button>
          </div>
        </header>

        {/* ── MAIN 50/50 LAYOUT ─────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-5 print:block">

          {/* ══ LEFT COLUMN — 50% ════════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 flex flex-col gap-5 print:hidden">

            {/* ── TOP ROW: Config + Thermometer side by side ── */}
            <div className="flex flex-col sm:flex-row gap-5">

              {/* Config card */}
              <GlassCard glow="top-0 left-0 bg-blue-500" className="p-6 shadow-2xl flex-1">
                <h2 className="text-base font-bold mb-5 flex items-center gap-2 text-white">
                  <Settings className="w-4 h-4 text-blue-400" /> Parámetros
                </h2>

                <div className="space-y-5">
                  {/* Reaction selector */}
                  <div>
                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest">Reacción</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['R1', 'R2', 'R3'].map(r => (
                        <button key={r} onClick={() => { updateConfig('reactionType', r); setAgitated(false); }}
                          className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                            config.reactionType === r
                              ? 'bg-blue-500/25 border-blue-400/50 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                          }`}>
                          {r}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{REACTION_LABELS[config.reactionType]}</p>
                  </div>

                  {/* NaOH mass slider */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <p className="text-xs text-slate-500 uppercase tracking-widest">Masa NaOH</p>
                      <span className="font-mono text-emerald-400 font-bold text-sm">{config.massNaOH.toFixed(1)} g</span>
                    </div>
                    <input type="range" min="1.0" max="3.0" step="0.1" value={config.massNaOH}
                      onChange={e => updateConfig('massNaOH', parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer h-1.5 rounded-full bg-slate-700" />
                    <div className="flex justify-between text-xs text-slate-600 mt-1">
                      <span>1.0 g</span><span>3.0 g</span>
                    </div>
                  </div>

                  {/* K calorimeter */}
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Capacidade K (J/ºC)</p>
                    <input type="number" min="0" max="100" step="1" value={config.kCalorimeter}
                      onChange={e => updateConfig('kCalorimeter', parseFloat(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 transition-all" />
                  </div>

                  {/* Volume readouts */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Vol. Disolvente', val: `${config.volume} mL` },
                      {
                        label: config.reactionType === 'R3' ? 'Vol. NaOH(aq)' : 'Molaridade HCl',
                        val: config.reactionType === 'R3' ? `${config.volumeNaOHaq} mL` : `${config.molarityHCl} M`
                      },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-white/5 border border-white/5 rounded-xl p-3">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="font-mono text-slate-200 font-semibold mt-0.5">{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-white/[0.06] flex gap-3">
                    <button onClick={() => { startExperiment(); setAgitated(false); }} disabled={state.status === 'running'}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-3 rounded-xl shadow-[0_0_24px_rgba(52,211,153,0.4)] hover:shadow-[0_0_32px_rgba(52,211,153,0.6)] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      <Play className="w-5 h-5" /> {state.status === 'running' ? 'Simulando…' : 'Iniciar'}
                    </button>
                    <button onClick={() => { resetExperiment(); setAgitated(false); }} disabled={state.status === 'idle'}
                      className="px-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded-xl transition-all disabled:opacity-40">
                      <RotateCcw className="w-5 h-5 text-slate-300" />
                    </button>
                  </div>

                  {/* Agitate button */}
                  {state.status === 'running' && (
                    <button onClick={handleAgitate}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border transition-all ${
                        agitated
                          ? 'bg-orange-500/30 border-orange-400/60 text-orange-200 shadow-[0_0_16px_rgba(251,146,60,0.4)]'
                          : 'bg-orange-500/10 border-orange-400/30 text-orange-400 hover:bg-orange-500/20 hover:border-orange-400/60'
                      }`}>
                      <Zap className={`w-4 h-4 ${agitated ? 'animate-pulse' : ''}`} /> Axitar Calorímetro
                    </button>
                  )}
                </div>
              </GlassCard>

              {/* Live thermometer display */}
              <GlassCard glow="bottom-0 right-0 bg-red-500" className="p-6 shadow-xl text-center sm:w-48 lg:w-56">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Thermometer className={`w-5 h-5 ${state.status === 'running' ? 'text-red-400' : 'text-slate-600'}`} />
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Termómetro</p>
                  {state.status === 'running' && (
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-ping" />
                  )}
                </div>
                <p className="font-mono text-5xl font-thin tracking-tighter drop-shadow-[0_0_16px_rgba(255,255,255,0.2)] transition-all duration-300">
                  {state.currentTemp.toFixed(2)}
                  <span className="text-2xl text-slate-500 ml-1">ºC</span>
                </p>
                <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 via-orange-400 to-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((state.currentTemp - T_INITIAL) / 20) * 100)}%` }} />
                </div>
              </GlassCard>
            </div>

            {/* ── BOTTOM ROW: Hess + Cuestionario side by side ── */}
            <div className="flex flex-col sm:flex-row gap-5 flex-1">

              {/* Hess Cycle */}
              <GlassCard className="p-6 shadow-2xl flex-1 print:bg-white print:border-slate-300 print:shadow-none print:break-inside-avoid print:mb-8" glow="top-0 left-0 bg-indigo-500">
                <h3 className="text-base font-bold mb-5 text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" /> Verificación da Lei de Hess
                </h3>
                {hessData ? (
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/5 print:border-slate-200 print:divide-slate-200">
                      {[
                        { label: 'ΔH₁ — Disolución', val: hessData.H1.toFixed(1), color: 'text-blue-400' },
                        { label: 'ΔH₃ — Neutralización', val: hessData.H3.toFixed(1), color: 'text-orange-400' },
                        { label: 'Ruta Indirecta (ΔH₁+ΔH₃)', val: hessData.sum.toFixed(1), color: 'text-emerald-400' },
                        { label: 'Ruta Directa ΔH₂', val: hessData.H2.toFixed(1), color: 'text-purple-400' },
                      ].map(({ label, val, color }) => (
                        <div key={label} className="flex justify-between items-center py-2.5 px-4 text-sm">
                          <span className="text-slate-400 print:text-slate-600">{label}</span>
                          <span className={`font-mono font-bold ${color} print:text-slate-900`}>{val} kJ/mol</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center print:border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Desviación Relativa</p>
                      <p className={`text-4xl font-black font-mono ${hessData.dev < 5 ? 'text-emerald-400' : hessData.dev < 10 ? 'text-amber-400' : 'text-red-400'} print:text-slate-900`}>
                        {hessData.dev.toFixed(2)}%
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        {hessData.dev < 5 ? '✓ Excelente concordancia' : hessData.dev < 10 ? '△ Aceptable — revisar fontes de erro' : '✗ Desviación elevada — posible erro experimental'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-600 border border-dashed border-white/10 rounded-xl gap-3">
                    <Beaker className="w-8 h-8 opacity-30" />
                    <p className="text-sm text-center">Realiza os 3 experimentos<br />para ver o ciclo de Hess</p>
                  </div>
                )}
              </GlassCard>

              {/* Pedagogical Questionnaire */}
              <GlassCard className="p-6 shadow-2xl flex-1 print:bg-white print:border-slate-300 print:shadow-none print:break-inside-avoid" glow="bottom-0 right-0 bg-purple-500">
                <h3 className="text-base font-bold mb-5 text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" /> Cuestionario Pedagóxico
                </h3>
                {allDone ? (
                  <div className="space-y-4">
                    {PEDAGOGY_QUESTIONS.map(q => (
                      <div key={q.id}>
                        <p className="text-sm text-slate-300 mb-2 leading-relaxed print:text-slate-700">{q.label}</p>
                        <textarea rows={3}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/30 transition-all resize-none print:hidden"
                          placeholder="Escribe a túa resposta…"
                          value={answers[q.id]}
                          onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        />
                        <div className="hidden print:block border border-slate-300 rounded p-3 min-h-16 text-sm text-slate-800 print:text-slate-800">
                          {answers[q.id]}
                        </div>
                      </div>
                    ))}
                    {!canPrint && (
                      <p className="text-xs text-slate-500 mt-2">Responde polo menos á primeira cuestión para activar o PDF</p>
                    )}
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-600 border border-dashed border-white/10 rounded-xl gap-3">
                    <FileText className="w-8 h-8 opacity-30" />
                    <p className="text-sm text-center">O cuestionario activarase<br />ao completar os 3 experimentos</p>
                  </div>
                )}
              </GlassCard>
            </div>
          </div>

          {/* ══ RIGHT COLUMN — 50% ═══════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Thermogram */}
            <GlassCard className="p-6 shadow-2xl flex-1 print:bg-white print:border-slate-300 print:shadow-none print:break-inside-avoid" glow="top-0 right-0 bg-emerald-500">
              <h3 className="text-base font-bold mb-4 text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Termograma en Tempo Real
              </h3>
              <div className="h-72 md:h-[26rem] print:h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={state.dataPoints} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}s`} />
                    <YAxis domain={['auto', 'auto']} stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}ºC`} width={50} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={T_INITIAL} stroke="#475569" strokeDasharray="4 4" label={{ value: 'T₀', fill: '#64748b', fontSize: 10 }} />
                    <Line type="monotone" dataKey="temp" stroke="#34d399" strokeWidth={2.5} dot={false}
                      activeDot={{ r: 5, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }} animationDuration={200} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Results table */}
            <GlassCard className="p-6 shadow-2xl print:bg-white print:border-slate-300 print:shadow-none print:break-inside-avoid">
              <h3 className="text-base font-bold mb-4 text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" /> Rexistro de Datos
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-white/10 print:border-slate-200">
                      {['Exp', 'm_NaOH (g)', 'ΔT (ºC)', 'Q (J)', 'ΔH_exp (kJ/mol)', 'Erro (%)'].map(h => (
                        <th key={h} className="pb-3 px-2 font-semibold text-slate-400 print:text-slate-600 text-xs uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 print:divide-slate-200">
                    {['R1', 'R2', 'R3'].map(r => {
                      const res = history[r] || (state.results?.reaction === r ? state.results : null);
                      const active = config.reactionType === r && state.status !== 'idle';
                      return (
                        <tr key={r} className={`transition-colors ${active ? 'bg-emerald-500/5' : 'hover:bg-white/3'}`}>
                          <td className="py-3 px-2 font-bold text-blue-300 print:text-blue-700">{r}</td>
                          <td className="py-3 px-2 font-mono text-slate-300 print:text-slate-700">{res ? (res.nNaOH * MW_NAOH).toFixed(2) : '—'}</td>
                          <td className="py-3 px-2 font-mono text-emerald-400 font-bold print:text-emerald-700">{res ? res.deltaT.toFixed(2) : '—'}</td>
                          <td className="py-3 px-2 font-mono text-slate-300 print:text-slate-700">{res ? res.Q.toFixed(0) : '—'}</td>
                          <td className="py-3 px-2 font-mono text-orange-400 print:text-orange-700">{res ? res.dH.toFixed(1) : '—'}</td>
                          <td className="py-3 px-2 font-mono text-slate-400 print:text-slate-600">{res ? `${res.error.toFixed(1)}%` : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Progress pills */}
              <div className="mt-4 pt-4 border-t border-white/5 flex gap-2 flex-wrap">
                {['R1', 'R2', 'R3'].map(r => (
                  <span key={r} className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    history[r]
                      ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-slate-500'
                  }`}>
                    {history[r] ? '✓' : '○'} {r}
                  </span>
                ))}
                {!allDone && (
                  <span className="text-xs text-slate-500 self-center ml-1">Completa os 3 experimentos para desbloquear o informe</span>
                )}
              </div>
            </GlassCard>
          </div>
        </div>


      </div>

      {/* Modals */}
      <HelpPanel isOpen={isHelpOpen} onClose={() => setHelpOpen(false)} />
      <SurveyModal isOpen={isSurveyOpen} onClose={() => setSurvey(false)} />
    </div>
  );
}
