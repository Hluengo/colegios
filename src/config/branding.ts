export const BRANDING = {
  appName: import.meta.env.VITE_APP_NAME || 'Registro de Casos',
  schoolName: import.meta.env.VITE_SCHOOL_NAME || '',
  logoApp: import.meta.env.VITE_LOGO_APP || '/branding/generic_logo.png',
  logoPdf: import.meta.env.VITE_LOGO_PDF || '/branding/generic_logo.png',
  // Logos de autenticación
  logoAuth: import.meta.env.VITE_LOGO_AUTH || '/branding/praxia-novus-logo-auth-DZuVhk42.png',
  logoAuthFallback: import.meta.env.VITE_LOGO_AUTH_FALLBACK || '/branding/praxia-novus-logo.svg',
  // Favicon
  favicon: import.meta.env.VITE_FAVICON || '/veritas.jpg',
};
