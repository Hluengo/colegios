#!/usr/bin/env node
/**
 * Script de Validación de Configuración de Branding
 * 
 * Valida que:
 * 1. Todas las variables VITE_* requeridas están definidas
 * 2. Archivos de logo/favicon existen en public/branding/
 * 3. Los paths en .env.local son válidos
 * 4. No hay valores faltantes críticos
 * 
 * Uso: node scripts/validate-branding-env.js
 * O en CI/CD: npm run validate:branding
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  error: (msg) => console.error(`${colors.red}✗${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.warn(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.bold}${msg}${colors.reset}`),
};

let errors = 0;
let warnings = 0;

/**
 * Leer archivo .env.local
 */
function readEnvFile() {
  const envPath = path.join(rootDir, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log.warn(`.env.local no encontrado - usando .env.example como referencia`);
    return {};
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    // Ignorar comentarios y líneas vacías
    if (line.startsWith('#') || !line.includes('=')) return;

    const [key, ...valueParts] = line.split('=');
    env[key.trim()] = valueParts.join('=').trim();
  });

  return env;
}

/**
 * Validar variable de entorno
 */
function validateEnvVar(envVars, varName, required = true) {
  const value = envVars[varName];
  
  if (!value) {
    if (required) {
      log.error(`Variable requerida no encontrada: ${varName}`);
      errors++;
    } else {
      log.warn(`Variable opcional no definida: ${varName}`);
      warnings++;
    }
    return null;
  }

  return value;
}

/**
 * Validar que un archivo existe
 */
function validateFile(filePath, description) {
  const fullPath = path.join(rootDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    log.error(`Archivo no encontrado: ${filePath} (${description})`);
    errors++;
    return false;
  }

  const stats = fs.statSync(fullPath);
  const sizeKb = (stats.size / 1024).toFixed(2);
  log.success(`${filePath} (${sizeKb} KB)`);
  return true;
}

/**
 * Main validation
 */
function validate() {
  console.clear();
  console.log(`${colors.bold}🎨 Validación de Configuración de Branding SGCE${colors.reset}\n`);

  const envVars = readEnvFile();

  // ====== VALIDACIÓN 1: Variables de Entorno ======
  log.section('1. Validando Variables de Entorno');

  const requiredVars = [
    'VITE_LOGO_AUTH_FALLBACK',  // CRÍTICO - debe siempre existir
    'VITE_FAVICON',             // Favicon debe existir
  ];

  const optionalVars = [
    'VITE_APP_NAME',
    'VITE_SCHOOL_NAME',
    'VITE_LOGO_APP',
    'VITE_LOGO_PDF',
    'VITE_LOGO_AUTH',
  ];

  // Validar variables requeridas
  requiredVars.forEach(varName => {
    const value = validateEnvVar(envVars, varName, true);
    if (value) {
      log.success(`${varName} = ${value}`);
    }
  });

  // Validar variables opcionales
  log.info('\nVariables opcionales:');
  optionalVars.forEach(varName => {
    const value = validateEnvVar(envVars, varName, false);
    if (value) {
      log.success(`  ${varName} = ${value}`);
    }
  });

  // ====== VALIDACIÓN 2: Archivos Requeridos en public/ ======
  log.section('2. Validando Archivos de Assets');

  // Fallback CRÍTICO
  log.info('\nFallback (CRÍTICO - debe existir siempre):');
  const fallbackPath = envVars['VITE_LOGO_AUTH_FALLBACK'] || '/default-logo.png';
  validateFile(`public${fallbackPath}`, 'Logo fallback auth');

  // Favicon CRÍTICO
  log.info('\nFavicon (CRÍTICO para browser tab):');
  const faviconPath = envVars['VITE_FAVICON'] || '/veritas.jpg';
  validateFile(`public${faviconPath}`, 'Favicon');

  // Logos opcionales
  log.info('\nLogos principales:');
  const logoAuthPath = envVars['VITE_LOGO_AUTH'];
  const logoPdfPath = envVars['VITE_LOGO_PDF'];
  const logoAppPath = envVars['VITE_LOGO_APP'];

  if (logoAuthPath) validateFile(`public${logoAuthPath}`, 'Logo auth');
  if (logoPdfPath) validateFile(`public${logoPdfPath}`, 'Logo PDF');
  if (logoAppPath) validateFile(`public${logoAppPath}`, 'Logo app');

  // ====== VALIDACIÓN 3: Verificar Carpeta public/branding/ ======
  log.section('3. Verificando Estructura de Carpetas');

  const brandingDir = path.join(rootDir, 'public', 'branding');
  if (fs.existsSync(brandingDir)) {
    const files = fs.readdirSync(brandingDir);
    log.success(`Carpeta public/branding/ existe con ${files.length} archivos`);
    
    if (files.length > 0) {
      log.info('  Archivos encontrados:');
      files.forEach(file => {
        const filePath = path.join(brandingDir, file);
        const stats = fs.statSync(filePath);
        const sizeKb = (stats.size / 1024).toFixed(2);
        console.log(`    • ${file} (${sizeKb} KB)`);
      });
    } else {
      log.warn('  Carpeta está vacía - agregar logos aquí');
      warnings++;
    }
  } else {
    log.warn('Carpeta public/branding/ no existe - crear y agregar logos');
    warnings++;
  }

  // ====== VALIDACIÓN 4: Verificar branding.ts ======
  log.section('4. Verificando src/config/branding.ts');

  const brandingConfigPath = path.join(rootDir, 'src', 'config', 'branding.ts');
  if (!fs.existsSync(brandingConfigPath)) {
    log.error('❌ src/config/branding.ts no encontrado');
    errors++;
  } else {
    const content = fs.readFileSync(brandingConfigPath, 'utf-8');
    const requiredExports = [
      'logoAuth',
      'logoAuthFallback',
      'favicon',
      'logoApp',
      'logoPdf',
    ];

    requiredExports.forEach(exportName => {
      if (content.includes(exportName)) {
        log.success(`Exporta ${exportName}`);
      } else {
        log.error(`Falta exportar ${exportName}`);
        errors++;
      }
    });
  }

  // ====== VALIDACIÓN 5: Verificar index.html ======
  log.section('5. Verificando index.html');

  const indexPath = path.join(rootDir, 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf-8');

  if (indexContent.includes('<link rel="icon"')) {
    log.success('Favicon link encontrado en index.html');
  } else {
    log.error('Favicon link no encontrado en index.html');
    errors++;
  }

  // ====== VALIDACIÓN 6: TypeScript Compilation ======
  log.section('6. Validando Compilación TypeScript');

  // Esta validación se hace mediante get_errors, pero podemos avisar al usuario
  log.info('Ejecutar antes de deploy: npm run build');

  // ====== RESULTADO FINAL ======
  log.section('📊 Resultado de Validación');

  const hasErrors = errors > 0;
  const hasWarnings = warnings > 0;

  if (!hasErrors && !hasWarnings) {
    console.log(`${colors.green}${colors.bold}✓ Validación completada exitosamente${colors.reset}`);
    console.log('\n✅ Configuración de branding está lista para deployment');
    process.exit(0);
  } else if (!hasErrors && hasWarnings) {
    console.log(`${colors.yellow}${colors.bold}⚠ Validación completada con ${warnings} advertencia(s)${colors.reset}`);
    console.log('\n⚠️  Revisar advertencias antes de deployment');
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bold}✗ Validación FALLIDA: ${errors} error(es), ${warnings} advertencia(s)${colors.reset}`);
    console.log('\n❌ Resolver errores antes del deployment');
    process.exit(1);
  }
}

// Ejecutar validación
validate();
