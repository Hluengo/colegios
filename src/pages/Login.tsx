/**
 * Página de Login / Autenticación - COLEGIOS482
 * Maneja inicio de sesión con email/password
 * Muestra información institucional y funcionalidades del sistema
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../api/supabaseClient';
import { BRANDING } from '../config/branding';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  Database,
  FileText,
  Users2,
  Calendar,
  FolderOpen,
  BarChart3,
} from 'lucide-react';
import { Button, Input } from '../components/ui';
import { Link } from 'react-router-dom';

interface LoginProps {
  onLoginSuccess?: () => void;
}

type AuthTab = 'login' | 'forgot' | 'reset';

const INFO_CARDS = [
  {
    title: 'ESTABLECIMIENTO CONECTADO',
    subtitle: 'Colegio Demo Gestión',
    description:
      'Datos institucionales organizados y protegidos con control de accesos por roles.',
  },
  {
    title: 'ESTADO NORMATIVO',
    subtitle: 'Reglamento Interno Vigente',
    description:
      'Conforme a Circular 482 y exigencias de difusión, actualización y aplicación formal.',
  },
];

const FEATURES_LIST = [
  {
    icon: CheckCircle2,
    text: 'Gestión estructurada del Reglamento Interno como instrumento central de regulación institucional.',
  },
  {
    icon: FileText,
    text: 'Control de versiones y trazabilidad de modificaciones normativas.',
  },
  {
    icon: Users2,
    text: 'Registro formal de constancia de entrega y difusión del Reglamento Interno.',
  },
  {
    icon: Database,
    text: 'Organización de procedimientos conforme a principios de debido proceso.',
  },
  {
    icon: BarChart3,
    text: 'Integración operativa de protocolos obligatorios dentro del marco institucional.',
  },
  {
    icon: FolderOpen,
    text: 'Organización documental centralizada con respaldo verificable.',
  },
  {
    icon: Calendar,
    text: 'Panel directivo con visión clara del estado normativo y administrativo.',
  },
];

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  const passwordChecks = {
    length: password.length >= 12,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;
  const passwordStrengthLabel =
    passwordScore <= 2 ? 'Débil' : passwordScore <= 4 ? 'Media' : 'Fuerte';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        if (!Object.values(passwordChecks).every(Boolean)) {
          throw new Error(
            'La contraseña debe tener al menos 12 caracteres, mayúscula, minúscula, número y símbolo.',
          );
        }

        // Registro de nuevo usuario
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // El tenant_slug se guarda en metadata para crear el perfil después
            data: {
              tenant_slug: 'demo', // Por defecto, se asigna al tenant demo
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // El perfil tenant_profiles debe crearse en backend (auth hook / service role),
          // nunca desde el cliente para mantener aislamiento multi-tenant por RLS.
          setMessage('Revisa tu email para confirmar tu cuenta');
        }
      } else {
        // Inicio de sesión
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError) throw signInError;

        if (data.user && onLoginSuccess) {
          onLoginSuccess();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Ingresa tu email para recuperar contraseña');
      return;
    }
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setMessage(' Te enviamos un correo para restablecer tu contraseña');
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar correo de recuperación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gradient-to-br from-[#0f1419] via-[#1a2332] to-[#0f1419]">
      {/* Panel izquierdo - Información COLEGIOS */}
      <div className="hidden lg:flex lg:w-[55%] p-10 xl:p-16 flex-col justify-between relative overflow-y-auto">
        {/* Efectos decorativos mejorados con animación */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-sky-400/15 to-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/10 to-sky-400/5 rounded-full translate-y-1/2 -translate-x-1/3 blur-[100px] animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[80px]" />

        {/* Logo con animación de entrada */}
        <div className="relative z-10 animate-fade-in">
          <img
            src={BRANDING.logoAuth}
            alt="Praxia Novus - COLEGIOS482"
            className="h-24 w-auto object-contain drop-shadow-2xl transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              const imgElement = e.target as HTMLImageElement;
              const failedUrl = imgElement.src;
              const fallbackUrl = BRANDING.logoAuthFallback;
              
              // Log en consola para monitoreo
              console.warn(
                `[Branding] Logo auth fallido: ${failedUrl}\nUsando fallback: ${fallbackUrl}`,
                {
                  timestamp: new Date().toISOString(),
                  environment: process.env.NODE_ENV,
                  hostname: window.location.hostname,
                }
              );
              
              // Cambiar a fallback
              imgElement.src = fallbackUrl;
              
              // Si fallback también falla, log crítico
              imgElement.onerror = () => {
                console.error(
                  `[Branding Critical] Ambos logos fallaron:\n- Primary: ${BRANDING.logoAuth}\n- Fallback: ${fallbackUrl}`,
                  {
                    timestamp: new Date().toISOString(),
                    severity: 'CRITICAL',
                    action: 'Verificar public/branding/logos existen y son accesibles',
                  }
                );
                // Ocultar la imagen para evitar X visual
                imgElement.style.display = 'none';
              };
            }}
          />
        </div>

        {/* Contenido principal */}
        <div className="relative z-10 space-y-8 max-w-2xl">
          {/* Header con gradiente de texto */}
          <div className="space-y-3">
            <h1 className="text-5xl xl:text-6xl font-black tracking-tight bg-gradient-to-r from-sky-300 via-cyan-300 to-sky-400 bg-clip-text text-transparent leading-tight">
              COLEGIOS482
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-sky-300/90 pl-0.5">
              Procedimiento organizado. Gestión institucional trazable.
            </p>
          </div>

          {/* Título principal */}
          <div className="space-y-4">
            <h2 className="text-3xl xl:text-4xl font-bold text-white/95 leading-tight">
              Gestión del Reglamento Interno y<br />
              Resguardo del Debido Proceso
            </h2>
            <p className="text-base xl:text-lg text-slate-300/90 leading-relaxed max-w-xl">
              Plataforma de gestión institucional que organiza el Reglamento
              Interno como instrumento central de gobernanza escolar, alineado a
              la Circular 482 y al marco normativo vigente, con foco en el
              resguardo efectivo del debido proceso.
            </p>
          </div>

          {/* Tarjetas de información con mejor diseño */}
          <div className="grid grid-cols-2 gap-4 xl:gap-5">
            {INFO_CARDS.map((card, idx) => (
              <div
                key={idx}
                className="group relative bg-white/[0.03] backdrop-blur-xl rounded-2xl p-5 border border-white/10 
                           hover:bg-white/[0.06] hover:border-sky-400/30 transition-all duration-300
                           shadow-lg hover:shadow-sky-500/10 hover:shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-sky-400/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300" />
                <div className="relative z-10">
                  <h3 className="text-[10px] uppercase tracking-[0.15em] font-extrabold text-sky-400/90 mb-2.5">
                    {card.title}
                  </h3>
                  <p className="text-lg font-bold text-white/95 mb-1.5 leading-tight">
                    {card.subtitle}
                  </p>
                  <p className="text-xs text-slate-400/80 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Lista de características mejorada */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-black uppercase tracking-wider text-sky-300/90 mb-3">
              Funcionalidades clave
            </h3>
            {FEATURES_LIST.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 group hover:translate-x-1 transition-transform duration-200"
                >
                  <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                    <Icon className="w-full h-full text-sky-400/80 group-hover:text-sky-300 transition-colors" />
                  </div>
                  <p className="text-sm text-slate-300/85 leading-relaxed group-hover:text-slate-200/90 transition-colors">
                    {feature.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer con mejor diseño */}
        <div className="relative z-10 space-y-5 max-w-2xl">
          <div className="h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />
          <p className="text-base font-semibold text-white/90 leading-relaxed">
            Gestión ordenada que transforma la normativa en práctica
            institucional trazable.
          </p>
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-sky-300/90">
              Enfoque
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-black uppercase tracking-wider text-sky-400/90">
                  Colegios482 no reemplaza la normativa.
                </p>
                <p className="text-xs text-slate-400/70">
                  La organiza, la estructura y permite demostrar su correcta
                  aplicación.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-black uppercase tracking-wider text-sky-400/90">
                  Resguarda el debido proceso.
                </p>
                <p className="text-xs text-slate-400/70">
                  Fortalece la gobernanza institucional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario de autenticación */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12 relative overflow-y-auto">
        {/* Efecto de glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-tl from-sky-500/5 via-transparent to-transparent" />

        <div className="max-w-md w-full relative">
          {/* Tarjeta principal con glassmorphism profesional */}
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Borde gradiente superior */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-400 to-sky-500" />

            <div className="p-8 sm:p-10">
              {/* Header mejorado */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-sm uppercase tracking-[0.15em] font-black text-slate-700 mb-1">
                      Acceso Seguro
                    </h2>
                    <p className="text-xs text-slate-500">
                      Sistema de autenticación
                    </p>
                  </div>
                  <Link
                    to="/inicio"
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors 
                             px-3 py-1.5 rounded-lg hover:bg-sky-50 duration-200"
                  >
                    Ver inicio
                  </Link>
                </div>

                {/* Tabs mejoradas con mejor diseño */}
                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setIsSignUp(false);
                      setError(null);
                      setMessage(null);
                    }}
                    className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                      activeTab === 'login'
                        ? 'bg-white text-sky-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot');
                      setIsSignUp(false);
                      setError(null);
                      setMessage(null);
                    }}
                    className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                      activeTab === 'forgot'
                        ? 'bg-white text-sky-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Recuperar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('reset');
                      setIsSignUp(false);
                      setError(null);
                      setMessage(null);
                    }}
                    className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                      activeTab === 'reset'
                        ? 'bg-white text-sky-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Nueva clave
                  </button>
                </div>
              </div>

              {/* Contenido de los tabs con diseño mejorado */}
              {/* Tab: Ingreso */}
              {activeTab === 'login' && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-300 text-red-800 px-5 py-4 rounded-xl text-sm font-medium shadow-sm">
                      {error}
                    </div>
                  )}

                  {message && (
                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-300 text-emerald-800 px-5 py-4 rounded-xl text-sm font-medium shadow-sm">
                      {message}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">
                      Correo electrónico
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu.correo@ejemplo.com"
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 
                               text-slate-900 placeholder:text-slate-400
                               focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 focus:bg-white
                               hover:border-slate-300 transition-all duration-200 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 bg-slate-50 
                                 text-slate-900 placeholder:text-slate-400
                                 focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 focus:bg-white
                                 hover:border-slate-300 transition-all duration-200 outline-none"
                        placeholder="••••••••"
                        required
                        minLength={isSignUp ? 12 : 6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-sky-600 
                                 transition-colors duration-200 p-1 rounded-lg hover:bg-sky-50"
                        aria-label={
                          showPassword
                            ? 'Ocultar contraseña'
                            : 'Mostrar contraseña'
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                    {isSignUp && (
                      <div className="mt-3 p-4 bg-slate-50 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600">
                            Fortaleza de contraseña:
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              passwordScore <= 2
                                ? 'text-red-600'
                                : passwordScore <= 4
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                            }`}
                          >
                            {passwordStrengthLabel}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              passwordScore <= 2
                                ? 'bg-red-500'
                                : passwordScore <= 4
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            }`}
                            style={{ width: `${(passwordScore / 5) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Requisitos: 12+ caracteres, mayúscula, minúscula,
                          número y símbolo.
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    isLoading={isLoading}
                    size="lg"
                    className="w-full py-3.5 bg-gradient-to-r from-sky-500 via-sky-600 to-cyan-600 text-white 
                             font-bold text-sm uppercase tracking-wide rounded-xl shadow-lg shadow-sky-500/30
                             hover:shadow-xl hover:shadow-sky-600/40 hover:from-sky-600 hover:to-cyan-700
                             active:scale-[0.98] transition-all duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? 'Procesando...' : 'INGRESAR'}
                  </Button>
                </form>
              )}

              {/* Tab: Recuperar */}
              {activeTab === 'forgot' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleForgotPassword();
                  }}
                  className="space-y-5"
                >
                  {error && (
                    <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-300 text-red-800 px-5 py-4 rounded-xl text-sm font-medium shadow-sm">
                      {error}
                    </div>
                  )}
                  {message && (
                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-300 text-emerald-800 px-5 py-4 rounded-xl text-sm font-medium shadow-sm">
                      {message}
                    </div>
                  )}

                  <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
                    <p className="text-sm text-sky-800 leading-relaxed">
                      Ingresa tu correo electrónico y te enviaremos un enlace
                      para restablecer tu contraseña.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">
                      Correo institucional
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu.correo@ejemplo.com"
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 
                               text-slate-900 placeholder:text-slate-400
                               focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 focus:bg-white
                               hover:border-slate-300 transition-all duration-200 outline-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    isLoading={isLoading}
                    size="lg"
                    className="w-full py-3.5 bg-gradient-to-r from-sky-500 via-sky-600 to-cyan-600 text-white 
                             font-bold text-sm uppercase tracking-wide rounded-xl shadow-lg shadow-sky-500/30
                             hover:shadow-xl hover:shadow-sky-600/40 hover:from-sky-600 hover:to-cyan-700
                             active:scale-[0.98] transition-all duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading
                      ? 'Enviando...'
                      : 'Enviar enlace de recuperación'}
                  </Button>
                </form>
              )}

              {/* Tab: Nueva clave */}
              {activeTab === 'reset' && (
                <div className="space-y-5">
                  <div className="p-5 bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-200 rounded-xl">
                    <p className="font-bold text-sky-900 mb-2">
                      Restablecer contraseña
                    </p>
                    <p className="text-sm text-sky-800 leading-relaxed">
                      Revisa tu correo electrónico. Si solicitaste un
                      restablecimiento de contraseña, recibirás un enlace para
                      crear una nueva.
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setIsSignUp(true);
                    }}
                    className="space-y-5"
                  >
                    {error && (
                      <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-300 text-red-800 px-5 py-4 rounded-xl text-sm font-medium shadow-sm">
                        {error}
                      </div>
                    )}
                    {message && (
                      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-300 text-emerald-800 px-5 py-4 rounded-xl text-sm font-medium shadow-sm">
                        {message}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 block">
                        Nueva contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 bg-slate-50 
                                   text-slate-900 placeholder:text-slate-400
                                   focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 focus:bg-white
                                   hover:border-slate-300 transition-all duration-200 outline-none"
                          placeholder="••••••••"
                          required
                          minLength={12}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-sky-600 
                                   transition-colors duration-200 p-1 rounded-lg hover:bg-sky-50"
                        >
                          {showPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed px-1">
                        Mínimo 12 caracteres, incluyendo mayúscula, minúscula,
                        número y símbolo.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      className="w-full py-3.5 bg-gradient-to-r from-sky-500 via-sky-600 to-cyan-600 text-white 
                               font-bold text-sm uppercase tracking-wide rounded-xl shadow-lg shadow-sky-500/30
                               hover:shadow-xl hover:shadow-sky-600/40 hover:from-sky-600 hover:to-cyan-700
                               active:scale-[0.98] transition-all duration-200"
                    >
                      Establecer nueva contraseña
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
