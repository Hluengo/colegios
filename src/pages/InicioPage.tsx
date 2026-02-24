/**
 * Página de Inicio Pública - Landing Page COLEGIOS482
 * Presenta la plataforma de gestión institucional y gobernanza escolar
 */

import { ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const INFO_CARDS = [
  {
    title: 'ESTABLECIMIENTOS CONECTADOS',
    subtitle: 'Colegio Demo Gestión',
    description:
      'Datos institucionales organizados y protegidos con control de accesos por roles.',
  },
  {
    title: 'ESTADO NORMATIVO',
    subtitle: 'Reglamento Interno Vigente',
    description:
      'Conforme a Circular 482 y exigencias de difusión y actualización.',
  },
];

const FEATURES = [
  'Multi-colegio con aislamiento de datos por establecimiento y control de acceso por perfiles.',
  'Gestión estructurada del Reglamento Interno como instrumento central de gobernanza.',
  'Control de versiones y trazabilidad de modificaciones normativas.',
  'Registro de constancia de entrega y difusión del Reglamento Interno.',
  'Integración operativa de protocolos obligatorios dentro del marco institucional.',
  'Organización documental centralizada con respaldo verificable.',
  'Panel directivo con visión clara del estado normativo y administrativo.',
];

export default function InicioPage() {
  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <div className="w-full px-5 sm:px-8 lg:px-12 py-8 lg:py-10">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-cyan-400">
              COLEGIOS482
            </h1>
            <p className="text-xs uppercase tracking-widest font-black text-slate-400 mt-1">
              Procedimiento organizado. Gestión institucional trazable.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 min-h-[44px] text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 hover:bg-cyan-300 transition-colors"
          >
            Acceder
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </header>

        {/* Main Content */}
        <section className="mt-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-10 items-start">
          <div className="space-y-5">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-300/40 bg-cyan-400/10 text-cyan-100 text-xs font-black uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              Procedimiento organizado. Gestión institucional trazable.
            </div>

            {/* Title and Description */}
            <div className="space-y-3">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.02] tracking-tight">
                Gestión Institucional y Gobernanza Escolar
              </h2>
              <p className="text-base lg:text-lg text-slate-300 leading-relaxed">
                Plataforma de gestión que organiza el Reglamento Interno y la
                administración escolar en un sistema estructurado, alineado a la
                Circular 482 y al marco normativo vigente.
              </p>
            </div>

            {/* Info Cards Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {INFO_CARDS.map((card, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-slate-800/60 backdrop-blur-lg p-5 shadow-lg hover:border-cyan-300/30 transition-colors"
                >
                  <h3 className="text-xs font-black uppercase tracking-widest text-cyan-300 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-xl font-bold text-white mb-2">
                    {card.subtitle}
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="rounded-3xl border border-white/15 bg-slate-800/60 backdrop-blur-xl p-6 shadow-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-cyan-200 mb-3">
              Funcionalidades clave
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-5">
              Panel directivo con visión clara del estado normativo, control de
              versiones del Reglamento Interno y registro de constancia de
              difusión institucional.
            </p>
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-400/15 px-4 py-3 min-h-[44px] text-xs font-black uppercase tracking-widest text-cyan-100 hover:bg-cyan-400/25 transition-colors"
            >
              Ir a acceso seguro
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </aside>
        </section>

        {/* Features List */}
        <section className="mt-8">
          <h3 className="text-xs uppercase tracking-widest font-black text-cyan-200 mb-4">
            Capacidades del sistema
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {FEATURES.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/40 border border-white/5 hover:border-cyan-300/20 transition-colors"
              >
                <CheckCircle2
                  className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-sm text-slate-300 leading-relaxed">
                  {feature}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Message */}
        <footer className="mt-12 pt-8 border-t border-white/10 space-y-4">
          <div>
            <p className="text-base font-bold text-slate-200 leading-relaxed">
              Gestión ordenada que transforma normativa en práctica
              institucional.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-wider text-cyan-300">
                COLEGIOS no reemplaza la normativa.
              </p>
              <p className="text-sm text-slate-400">
                La organiza y la vuelve gestionable.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-wider text-cyan-300">
                Gobernanza clara.
              </p>
              <p className="text-sm text-slate-400">Respaldo institucional.</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
