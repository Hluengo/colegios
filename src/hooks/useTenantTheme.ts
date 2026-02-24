// =====================================================
// Hook para aplicar theming dinámico según el tenant
// =====================================================

import { useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { BRANDING } from '../config/branding';

export function useTenantTheme() {
  const { tenant } = useTenant();

  useEffect(() => {
    const root = document.documentElement;

    if (!tenant) {
      // Evitar conservar tema del tenant anterior durante cargas/cambios de sesión.
      root.style.removeProperty('--color-primary');
      root.style.removeProperty('--color-primary-dark');
      root.style.removeProperty('--color-primary-light');
      root.style.removeProperty('--color-secondary');
      root.style.setProperty('--logo-url', `url(${BRANDING.logoApp})`);
      return;
    }

    // Aplicar colores del tenant
    if (tenant.primary_color) {
      root.style.setProperty('--color-primary', tenant.primary_color);

      // Generar variantes de color
      const primaryHex = tenant.primary_color.replace('#', '');
      const r = parseInt(primaryHex.substring(0, 2), 16);
      const g = parseInt(primaryHex.substring(2, 4), 16);
      const b = parseInt(primaryHex.substring(4, 6), 16);

      // Color más oscuro para hover
      const darken = (amount: number) => {
        const nr = Math.max(0, r - amount);
        const ng = Math.max(0, g - amount);
        const nb = Math.max(0, b - amount);
        return `rgb(${nr}, ${ng}, ${nb})`;
      };

      root.style.setProperty('--color-primary-dark', darken(30));
      root.style.setProperty(
        '--color-primary-light',
        `rgba(${r}, ${g}, ${b}, 0.1)`,
      );
    }

    if (tenant.secondary_color) {
      root.style.setProperty('--color-secondary', tenant.secondary_color);
    }

    // Aplicar logo si existe
    if (tenant.logo_url) {
      root.style.setProperty('--logo-url', `url(${tenant.logo_url})`);
    }

    // Aplicar favicon del tenant si existe
    if (tenant.favicon_url) {
      let favicon = document.querySelector(
        "link[rel='icon']",
      ) as HTMLLinkElement | null;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = tenant.favicon_url;
    }

    // Guardar en localStorage para persistencia
    localStorage.setItem(
      'tenant_theme',
      JSON.stringify({
        primary_color: tenant.primary_color,
        secondary_color: tenant.secondary_color,
        logo_url: tenant.logo_url,
        favicon_url: tenant.favicon_url,
      }),
    );
  }, [tenant]);
}
