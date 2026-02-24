/**
 * Página de Login / Autenticación
 * Maneja inicio de sesión con email/password
 * Muestra colegio demo destacado para potenciales clientes
 */

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../api/supabaseClient';
import {
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Mail,
  Building2,
  Star,
  Users,
  Shield,
  BarChart3,
} from 'lucide-react';
import { Button, Input } from '../components/ui';

interface LoginProps {
  onLoginSuccess?: () => void;
}

interface ColegioDemo {
  id: string;
  slug: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string;
  descripcion: string;
  primary_color: string;
  secondary_color: string;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [colegioDemo, setColegioDemo] = useState<ColegioDemo | null>(null);
  const [loadingColegio, setLoadingColegio] = useState(true);
  const demoRequestEmail = colegioDemo?.email || 'hluengo.ro@gmail.com';

  // Cargar colegio demo al montar
  useEffect(() => {
    const loadColegioDemo = async () => {
      try {
        const { data, error } = await supabase.rpc('get_demo_colegio').single();

        if (!error && data) {
          setColegioDemo(data as ColegioDemo);
        }
      } catch {
        // Silencioso: el panel demo es opcional
      } finally {
        setLoadingColegio(false);
      }
    };
    loadColegioDemo();
  }, []);

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
    <div className="min-h-[100dvh] flex">
      {/* Panel izquierdo - Colegio Demo destacado */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white p-8 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-xl font-semibold">
              Plataforma de Convivencia Escolar
            </span>
          </div>
        </div>

        {/* Colegio Demo Card */}
        {loadingColegio ? (
          <div className="relative z-10 animate-pulse">
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="h-8 bg-white/20 rounded w-3/4 mb-4" />
              <div className="h-4 bg-white/20 rounded w-full mb-2" />
              <div className="h-4 bg-white/20 rounded w-2/3" />
            </div>
          </div>
        ) : colegioDemo ? (
          <div className="relative z-10">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
              {/* Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-400/20 text-yellow-200 rounded-full text-sm font-medium">
                  <Star className="w-4 h-4" />
                  Colegio Destacado
                </span>
              </div>

              {/* Logo y Nombre */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
                  <img
                    src={colegioDemo.logo_url}
                    alt={`Logo ${colegioDemo.name}`}
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        '/branding/generic_logo.png';
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{colegioDemo.name}</h2>
                  <p className="text-white/70 text-sm">Cliente desde 2024</p>
                </div>
              </div>

              {/* Descripción */}
              <p className="text-white/90 mb-6 leading-relaxed">
                {colegioDemo.descripcion}
              </p>

              {/* Contacto */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-white/80">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{colegioDemo.address}</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{colegioDemo.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{colegioDemo.email}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <Users className="w-5 h-5 mx-auto mb-1 text-white/70" />
                  <div className="text-xl font-bold">500+</div>
                  <div className="text-xs text-white/60">Estudiantes</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <Shield className="w-5 h-5 mx-auto mb-1 text-white/70" />
                  <div className="text-xl font-bold">98%</div>
                  <div className="text-xs text-white/60">Resolución</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <BarChart3 className="w-5 h-5 mx-auto mb-1 text-white/70" />
                  <div className="text-xl font-bold">-40%</div>
                  <div className="text-xs text-white/60">Incidentes</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="relative z-10 text-white/60 text-sm">
          <p>Sistema de gestión de casos de convivencia escolar</p>
          <p className="mt-1">Desarrollado con tecnología moderna y segura</p>
        </div>
      </div>

      {/* Panel derecho - Formulario de login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-5 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              Convivencia Escolar
            </h1>
            <p className="text-slate-500 mt-2">
              {isSignUp ? 'Crea tu cuenta' : 'Inicia sesión en tu cuenta'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            <div>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
                  placeholder="********"
                  required
                  minLength={isSignUp ? 12 : 6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 tap-target flex items-center justify-center"
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {isSignUp && (
                <div className="mt-2 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Fortaleza:</span>
                    <span
                      className={
                        passwordScore <= 2
                          ? 'text-red-600'
                          : passwordScore <= 4
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                      }
                    >
                      {passwordStrengthLabel}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordScore <= 2
                          ? 'bg-red-500'
                          : passwordScore <= 4
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(passwordScore / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-slate-500">
                    Requisitos: 12+ caracteres, mayúscula, minúscula, número y
                    símbolo.
                  </p>
                </div>
              )}
            </div>

            <Button type="submit" fullWidth isLoading={isLoading} size="lg">
              {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
            </Button>
            {!isSignUp && (
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={handleForgotPassword}
              >
                ¿Olvidaste tu contraseña?
              </Button>
            )}
          </form>

          {/* Toggle SignUp/SignIn */}
          <div className="mt-6 text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
            >
              {isSignUp
                ? '¿Ya tienes cuenta? Inicia sesión'
                : '¿No tienes cuenta? Regístrate'}
            </Button>
          </div>

          {/* Demo info */}
          <div className="mt-6 p-4 bg-primary-50 rounded-lg text-sm border border-primary-100">
            <p className="font-medium text-primary-700 mb-2">
              {' '}
              Cuenta demo disponible
            </p>
            <p className="text-primary-600">
              Solicita acceso de prueba para explorar todas las funcionalidades
              del sistema.
            </p>
            <a
              href={`mailto:${demoRequestEmail}?subject=${encodeURIComponent('Solicitud de demo')}`}
              className="inline-block mt-2 text-primary-600 hover:text-primary-700 font-medium underline"
            >
              Solicitar demo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
