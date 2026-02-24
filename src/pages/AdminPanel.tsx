import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Clock3,
  Filter,
  GraduationCap,
  LibraryBig,
  Menu,
  Palette,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  UserCog,
  X,
} from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../hooks/useToast';
import { Button, Input, Select } from '../components/ui';
import {
  applyCollegeCatalogs,
  createStudent,
  deleteStudent,
  importStudents,
  inviteTenantUser,
  listActionTypes,
  listAuditLogs,
  listConductCatalog,
  listConductTypes,
  listStageSla,
  listStudents,
  listTenantSettings,
  listTenantUsers,
  listTenants,
  onboardCollege,
  switchPlatformTenant,
  updateStudent,
  updateTenantBranding,
  uploadTenantBrandAsset,
  upsertTenantSetting,
  deleteTenantSetting,
  adminUpdateTenantUser,
  createManualAuditLog,
  updateAuditLogNote,
  deleteAuditLog,
  purgeAuditLogs,
  upsertConductType,
  upsertConductCatalogRow,
  upsertActionType,
  deleteConductType,
  deleteConductCatalogRow,
  deleteActionType,
  upsertStageSla,
  updateStageSla,
  deleteStageSla,
} from '../api/admin';

const TABS = [
  { id: 'branding', label: 'Colegio', icon: Palette },
  { id: 'students', label: 'Estudiantes', icon: GraduationCap },
  { id: 'platform', label: 'Plataforma', icon: Settings2 },
  { id: 'users', label: 'Usuarios', icon: UserCog },
  { id: 'catalogs', label: 'Catalogos', icon: LibraryBig },
  { id: 'settings', label: 'Parametros', icon: Settings2 },
  { id: 'audit', label: 'Auditoria', icon: ShieldCheck },
] as const;

type TabId = (typeof TABS)[number]['id'];
const DEFAULT_PLATFORM_FEATURES: Record<string, boolean> = {
  student_registry: true,
  case_tracking: true,
  followups: true,
  alerts: true,
  statistics: true,
  audit_log: true,
  branding_admin: true,
  catalog_admin: true,
};
const PLATFORM_FEATURE_LABELS: Record<string, string> = {
  student_registry: 'Registro de estudiantes',
  case_tracking: 'Gestión de casos',
  followups: 'Seguimientos',
  alerts: 'Alertas',
  statistics: 'Estadísticas',
  audit_log: 'Auditoría',
  branding_admin: 'Administración de colegio',
  catalog_admin: 'Administración de catálogos',
};

type SettingInputType = 'string' | 'number' | 'boolean' | 'json';

type SettingPreset = {
  key: string;
  label: string;
  type: SettingInputType;
  defaultValue: string;
  description: string;
};

const SETTING_PRESETS: SettingPreset[] = [
  {
    key: 'ui.primary_color',
    label: 'Color primario',
    type: 'string',
    defaultValue: '#2563eb',
    description: 'Color principal de botones y acentos.',
  },
  {
    key: 'ui.secondary_color',
    label: 'Color secundario',
    type: 'string',
    defaultValue: '#1e40af',
    description: 'Color de apoyo en elementos secundarios.',
  },
  {
    key: 'notifications.case_created_email',
    label: 'Mail al crear caso',
    type: 'boolean',
    defaultValue: 'true',
    description: 'Envía correo al registrar un caso.',
  },
  {
    key: 'notifications.case_updated_email',
    label: 'Mail al actualizar caso',
    type: 'boolean',
    defaultValue: 'true',
    description: 'Envía correo cuando cambia un caso.',
  },
  {
    key: 'cases.default_responsible_role',
    label: 'Cargo responsable por defecto',
    type: 'string',
    defaultValue: 'Inspectoría',
    description: 'Cargo sugerido al registrar casos.',
  },
  {
    key: 'workflow.auto_close_days',
    label: 'Cierre automático (días)',
    type: 'number',
    defaultValue: '30',
    description: 'Días sin actividad para cerrar automáticamente.',
  },
  {
    key: 'branding.footer_message',
    label: 'Mensaje en pie de página',
    type: 'string',
    defaultValue: 'Convivencia Escolar 2026',
    description: 'Texto institucional en pie de página.',
  },
  {
    key: 'integrations.webhook_url',
    label: 'Webhook de integración',
    type: 'string',
    defaultValue: '',
    description: 'Endpoint externo para eventos del sistema.',
  },
  {
    key: 'integrations.webhook_enabled',
    label: 'Webhook habilitado',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Activa/desactiva envío de eventos webhook.',
  },
  {
    key: 'reports.export_fields',
    label: 'Campos exportables',
    type: 'json',
    defaultValue: '["id","incident_date","student_name","status"]',
    description: 'Lista de campos en exportes.',
  },
];

export default function AdminPanel() {
  const { tenant, user, isTenantAdmin, isPlatformAdmin, refetch } = useTenant();
  const { push } = useToast();
  const tenantId = tenant?.id || null;

  const [tab, setTab] = useState<TabId>('branding');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [students, setStudents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [conductTypes, setConductTypes] = useState<any[]>([]);
  const [conductCatalog, setConductCatalog] = useState<any[]>([]);
  const [actionTypes, setActionTypes] = useState<any[]>([]);
  const [stageSla, setStageSla] = useState<any[]>([]);
  const [catalogTab, setCatalogTab] = useState<
    'types' | 'catalog' | 'actions' | 'sla'
  >('types');
  const [catalogImporting, setCatalogImporting] = useState(false);
  const [catalogImportPreview, setCatalogImportPreview] = useState<any[]>([]);
  const [catalogImportHeaders, setCatalogImportHeaders] = useState<string[]>(
    [],
  );
  const [catalogImportFileName, setCatalogImportFileName] = useState('');
  const [showSlaForm, setShowSlaForm] = useState(false);
  const [newSla, setNewSla] = useState({ stage_key: '', days_to_due: 0 });

  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [editing, setEditing] = useState<Record<string, any>>({});
  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    rut: '',
    level: '',
    course: '',
  });
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [newSetting, setNewSetting] = useState<{
    key: string;
    valueText: string;
    type: SettingInputType;
    valueBool: boolean;
  }>({ key: '', valueText: '', type: 'string', valueBool: true });
  const [editingSetting, setEditingSetting] = useState<{
    id: string;
    valueText: string;
  } | null>(null);
  const [settingSearch, setSettingSearch] = useState('');
  const [settingModule, setSettingModule] = useState('ui');
  const [settingName, setSettingName] = useState('');
  const [settingCategoryFilter, setSettingCategoryFilter] = useState('all');
  const [settingTypeFilter, setSettingTypeFilter] = useState<
    'all' | SettingInputType
  >('all');
  const [settingFormError, setSettingFormError] = useState('');
  const [newUser, setNewUser] = useState({
    email: '',
    fullName: '',
    role: 'user',
    department: '',
  });
  const [showUserForm, setShowUserForm] = useState(false);
  const [branding, setBranding] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    logo_url: '',
    favicon_url: '',
    primary_color: '#2563eb',
    secondary_color: '#1e40af',
  });
  const [onboard, setOnboard] = useState({
    slug: '',
    name: '',
    email: '',
    subscriptionPlan: 'basic',
    trialDays: 14,
  });
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [platformConfig, setPlatformConfig] = useState({
    subscription_status: 'trial',
    subscription_plan: 'basic',
    trial_end_date: '',
    timezone: 'America/Santiago',
    locale: 'es-CL',
    date_format: 'dd/MM/yyyy',
    features: { ...DEFAULT_PLATFORM_FEATURES } as Record<string, boolean>,
  });
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditTableFilter, setAuditTableFilter] = useState('all');
  const [auditPurgeDays, setAuditPurgeDays] = useState(90);
  const [newAuditEntry, setNewAuditEntry] = useState({
    action: 'MANUAL',
    tableName: 'manual',
    note: '',
  });
  const [editingAuditNotes, setEditingAuditNotes] = useState<
    Record<string, string>
  >({});

  const run = async (
    title: string,
    fn: () => Promise<void>,
    okMessage?: string,
  ) => {
    try {
      await fn();
      if (okMessage) push({ type: 'success', title, message: okMessage });
    } catch (err: any) {
      push({
        type: 'error',
        title,
        message: err?.message || `Error en ${title.toLowerCase()}`,
      });
    }
  };

  const parseValue = (raw: string) => {
    const t = raw.trim();
    if (!t) return '';
    try {
      return JSON.parse(t);
    } catch {
      return t;
    }
  };

  const slugifySettingSegment = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s._-]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_');

  const buildSettingValue = (input: typeof newSetting) => {
    if (input.type === 'boolean') return Boolean(input.valueBool);
    if (input.type === 'number') {
      const n = Number(input.valueText);
      if (!Number.isFinite(n))
        throw new Error('El valor numérico no es válido');
      return n;
    }
    if (input.type === 'json') {
      try {
        return JSON.parse(input.valueText || '{}');
      } catch {
        throw new Error('El JSON no es válido');
      }
    }
    return input.valueText;
  };

  const getSettingCategory = (key: string) =>
    (String(key || '').split('.')[0] || 'custom').toLowerCase();

  const detectSettingType = (value: unknown): SettingInputType => {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (value && typeof value === 'object') return 'json';
    return 'string';
  };

  const formatSettingValue = (value: unknown) => {
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value ?? '');
    }
  };

  const parseCsvLine = (line: string) => {
    const out: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        out.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    out.push(current.trim());
    return out.map((v) => v.replace(/^"|"$/g, '').trim());
  };

  const parseBoolean = (value: unknown, fallback = true) => {
    if (value == null || value === '') return fallback;
    const raw = String(value).trim().toLowerCase();
    if (['1', 'true', 't', 'si', 'sí', 'yes', 'y'].includes(raw)) return true;
    if (['0', 'false', 'f', 'no', 'n'].includes(raw)) return false;
    return fallback;
  };

  const parseNumber = (value: unknown, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const expectedCsvHeaders: Record<typeof catalogTab, string[]> = {
    types: ['key', 'label', 'color', 'sort_order', 'active'],
    catalog: ['conduct_type', 'conduct_category', 'sort_order', 'active'],
    actions: ['key', 'label', 'description', 'sort_order', 'is_active'],
    sla: ['stage_key', 'days_to_due'],
  };

  const handleCatalogCsvSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (!lines.length) {
        setCatalogImportPreview([]);
        setCatalogImportHeaders([]);
        setCatalogImportFileName(file.name);
        return;
      }
      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
      const rows = lines
        .slice(1)
        .map((line) => {
          const values = parseCsvLine(line);
          return headers.reduce<Record<string, string>>((acc, header, idx) => {
            acc[header] = values[idx] ?? '';
            return acc;
          }, {});
        })
        .filter((row) => Object.values(row).some(Boolean));
      setCatalogImportHeaders(headers);
      setCatalogImportPreview(rows);
      setCatalogImportFileName(file.name);
    };
    reader.readAsText(file);
  };

  const importCatalogCsv = async () => {
    if (!tenantId) return;
    if (!catalogImportPreview.length)
      throw new Error('No hay filas para importar');
    const requiredHeaders: Record<typeof catalogTab, string[]> = {
      types: ['key', 'label'],
      catalog: ['conduct_type', 'conduct_category'],
      actions: ['key', 'label'],
      sla: ['stage_key'],
    };
    const missing = requiredHeaders[catalogTab].filter(
      (header) => !catalogImportHeaders.includes(header),
    );
    if (missing.length) {
      throw new Error(
        `CSV inválido. Faltan columnas requeridas: ${missing.join(', ')}`,
      );
    }

    if (catalogTab === 'types') {
      for (const row of catalogImportPreview) {
        if (!row.key || !row.label) continue;
        await upsertConductType(tenantId, {
          key: row.key,
          label: row.label,
          color: row.color || '#64748b',
          sort_order: parseNumber(row.sort_order, 0),
          active: parseBoolean(row.active, true),
        });
      }
    } else if (catalogTab === 'catalog') {
      for (const row of catalogImportPreview) {
        if (!row.conduct_type || !row.conduct_category) continue;
        await upsertConductCatalogRow(tenantId, {
          conduct_type: row.conduct_type,
          conduct_category: row.conduct_category,
          sort_order: parseNumber(row.sort_order, 0),
          active: parseBoolean(row.active, true),
        });
      }
    } else if (catalogTab === 'actions') {
      for (const row of catalogImportPreview) {
        if (!row.key || !row.label) continue;
        await upsertActionType(tenantId, {
          key: row.key,
          label: row.label,
          description: row.description || '',
          sort_order: parseNumber(row.sort_order, 0),
          is_active: parseBoolean(row.is_active ?? row.active, true),
        });
      }
    } else {
      for (const row of catalogImportPreview) {
        if (!row.stage_key) continue;
        await upsertStageSla(tenantId, {
          stage_key: row.stage_key,
          days_to_due: parseNumber(row.days_to_due, 0),
        });
      }
    }

    await load();
    setCatalogImportPreview([]);
    setCatalogImportHeaders([]);
    setCatalogImportFileName('');
  };

  const load = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [s, u, a, st, ct, cc, at, sla] = await Promise.all([
        listStudents(tenantId),
        listTenantUsers(tenantId),
        listAuditLogs(tenantId, 200),
        listTenantSettings(tenantId),
        listConductTypes(tenantId),
        listConductCatalog(tenantId),
        listActionTypes(tenantId),
        listStageSla(tenantId),
      ]);
      setStudents(s || []);
      setUsers(u || []);
      setAudit(a || []);
      setSettings(st || []);
      setConductTypes(ct || []);
      setConductCatalog(cc || []);
      setActionTypes(at || []);
      setStageSla(sla || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tenant) return;
    const tenantFeatures =
      tenant.features && typeof tenant.features === 'object'
        ? (tenant.features as Record<string, boolean>)
        : {};
    setBranding({
      name: tenant.name || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      address: tenant.address || '',
      logo_url: tenant.logo_url || '',
      favicon_url: tenant.favicon_url || '',
      primary_color: tenant.primary_color || '#2563eb',
      secondary_color: tenant.secondary_color || '#1e40af',
    });
    setPlatformConfig({
      subscription_status: tenant.subscription_status || 'trial',
      subscription_plan: tenant.subscription_plan || 'basic',
      trial_end_date: (tenant.trial_end_date || '').slice(0, 10),
      timezone: tenant.timezone || 'America/Santiago',
      locale: tenant.locale || 'es-CL',
      date_format: tenant.date_format || 'dd/MM/yyyy',
      features: { ...DEFAULT_PLATFORM_FEATURES, ...tenantFeatures },
    });
  }, [tenant]);

  useEffect(() => {
    load();
  }, [tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!tenantId) return;
    setSelectedTenantId(tenantId);
  }, [tenantId]);

  useEffect(() => {
    if (!isPlatformAdmin) return;
    run('Tenants', async () => {
      const allTenants = await listTenants();
      setTenants(allTenants || []);
    });
  }, [isPlatformAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isPlatformAdmin && tab === 'platform') {
      setTab('branding');
    }
  }, [isPlatformAdmin, tab]);

  useEffect(() => {
    setCatalogImportPreview([]);
    setCatalogImportHeaders([]);
    setCatalogImportFileName('');
  }, [catalogTab]);

  const visibleTabs = useMemo(
    () => TABS.filter((t) => t.id !== 'platform' || isPlatformAdmin),
    [isPlatformAdmin],
  );

  const sortedStudents = useMemo(
    () =>
      [...students].sort((a, b) =>
        `${a.last_name} ${a.first_name}`.localeCompare(
          `${b.last_name} ${b.first_name}`,
        ),
      ),
    [students],
  );
  const courses = useMemo(
    () => [...new Set(sortedStudents.map((s) => s.course).filter(Boolean))],
    [sortedStudents],
  );
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedStudents.filter((s) => {
      const bySearch =
        !q ||
        `${s.first_name || ''} ${s.last_name || ''}`
          .toLowerCase()
          .includes(q) ||
        (s.rut || '').toLowerCase().includes(q) ||
        (s.course || '').toLowerCase().includes(q);
      const byCourse = courseFilter === 'all' || s.course === courseFilter;
      return bySearch && byCourse;
    });
  }, [sortedStudents, search, courseFilter]);
  const filteredSettings = useMemo(() => {
    const q = settingSearch.trim().toLowerCase();
    if (!q) return settings;
    return settings.filter((s) => {
      const key = String(s.setting_key || '').toLowerCase();
      const val =
        typeof s.setting_value === 'string'
          ? s.setting_value
          : JSON.stringify(s.setting_value || '');
      return key.includes(q) || String(val).toLowerCase().includes(q);
    });
  }, [settings, settingSearch]);
  const settingCategoryOptions = useMemo(
    () => [
      'all',
      ...Array.from(
        new Set(
          settings
            .map((s) => getSettingCategory(s.setting_key))
            .filter(Boolean),
        ),
      ),
    ],
    [settings],
  );
  const settingTypeOptions = useMemo(
    () => [
      'all',
      ...Array.from(
        new Set(
          settings
            .map((s) => detectSettingType(s.setting_value))
            .filter(Boolean),
        ),
      ),
    ],
    [settings],
  );
  const settingsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    settings.forEach((s) => {
      const cat = getSettingCategory(s.setting_key);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));
  }, [settings]);
  const visibleSettings = useMemo(
    () =>
      filteredSettings.filter((s) => {
        const byCategory =
          settingCategoryFilter === 'all' ||
          getSettingCategory(s.setting_key) === settingCategoryFilter;
        const byType =
          settingTypeFilter === 'all' ||
          detectSettingType(s.setting_value) === settingTypeFilter;
        return byCategory && byType;
      }),
    [filteredSettings, settingCategoryFilter, settingTypeFilter],
  );
  const auditActionOptions = useMemo(
    () => [
      'all',
      ...Array.from(
        new Set(
          audit
            .map((r) => String(r.action || '').toUpperCase())
            .filter(Boolean),
        ),
      ),
    ],
    [audit],
  );
  const auditTableOptions = useMemo(
    () => [
      'all',
      ...Array.from(
        new Set(
          audit
            .map((r) => String(r.table_name || '').toLowerCase())
            .filter(Boolean),
        ),
      ),
    ],
    [audit],
  );
  const filteredAudit = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return audit.filter((r) => {
      const byAction =
        auditActionFilter === 'all' ||
        String(r.action || '').toUpperCase() === auditActionFilter;
      const byTable =
        auditTableFilter === 'all' ||
        String(r.table_name || '').toLowerCase() === auditTableFilter;
      const bySearch =
        !q ||
        String(r.user_id || '')
          .toLowerCase()
          .includes(q) ||
        String(r.table_name || '')
          .toLowerCase()
          .includes(q) ||
        String(r.record_id || '')
          .toLowerCase()
          .includes(q) ||
        String(r.admin_note || '')
          .toLowerCase()
          .includes(q) ||
        String(r.action || '')
          .toLowerCase()
          .includes(q);
      return byAction && byTable && bySearch;
    });
  }, [audit, auditSearch, auditActionFilter, auditTableFilter]);

  const basicCount = students.filter((s) =>
    /b[áa]sica|basico|básico|1°|2°|3°|4°|5°|6°|7°|8°/i.test(
      s.level || s.course || '',
    ),
  ).length;
  const mediaCount = students.filter((s) =>
    /media|i medio|ii medio|iii medio|iv medio|1 medio|2 medio|3 medio|4 medio/i.test(
      s.level || s.course || '',
    ),
  ).length;
  const pendingBrandingFields = [
    branding.name,
    branding.email,
    branding.phone,
    branding.address,
  ].filter((value) => !value.trim()).length;
  const brandingFieldClass = (value: string) =>
    `input transition-colors ${value.trim() ? 'border-emerald-200 bg-emerald-50/40' : 'border-amber-300 bg-amber-50'}`;

  if (!isTenantAdmin)
    return <div className="p-6 text-red-700">No autorizado</div>;

  return (
    <div
      className="min-h-[100dvh] overflow-x-clip"
      style={{
        background:
          'radial-gradient(1200px 500px at 100% -120px, rgba(75, 96, 124, 0.08), transparent 65%), linear-gradient(180deg, #f5f7fb 0%, #fbfcfe 100%)',
      }}
    >
      <div className="mx-auto flex max-w-[1500px] gap-3 lg:gap-4 px-2.5 sm:px-4 lg:px-6 py-3 sm:py-4">
        <aside
          className={`${sidebarOpen ? 'w-64' : 'w-16'} hidden shrink-0 glass-panel p-3 lg:block`}
        >
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="mb-3 rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
          >
            <Menu size={16} />
          </button>
          <nav className="space-y-1">
            {visibleTabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  <Icon size={16} />
                  {sidebarOpen && t.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 space-y-4">
          <header className="glass-panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Panel /{' '}
                  {visibleTabs.find((t) => t.id === tab)?.label ||
                    'Administración'}
                </p>
                <h1 className="text-xl font-semibold text-slate-900">
                  {tenant?.name || 'Administración'}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={load}
                  variant="secondary"
                  size="sm"
                  leftIcon={<RefreshCw size={14} />}
                >
                  Recargar
                </Button>
                <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  {user?.email}
                </span>
              </div>
            </div>
            <div className="mt-3 lg:hidden overflow-x-auto pb-1">
              <div className="flex min-w-max gap-2">
                {visibleTabs.map((t) => {
                  const Icon = t.icon;
                  const active = tab === t.id;
                  return (
                    <button
                      key={`mobile-${t.id}`}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap ${active ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                    >
                      <Icon size={14} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Alumnos"
              value={students.length}
              icon={<GraduationCap size={16} />}
            />
            <StatCard
              title="Alumnos en Básica"
              value={basicCount}
              icon={<BookOpen size={16} />}
              tone="blue"
            />
            <StatCard
              title="Alumnos en Media"
              value={mediaCount}
              icon={<LibraryBig size={16} />}
              tone="violet"
            />
            <StatCard
              title="Última actualización"
              value={
                loading
                  ? 'Actualizando...'
                  : new Date().toLocaleTimeString('es-CL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
              }
              icon={<Clock3 size={16} />}
              tone="emerald"
            />
          </section>

          {tab === 'students' && (
            <div className="space-y-4">
              <div className="glass-panel p-5">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                  <Input
                    placeholder="Nombres"
                    value={newStudent.first_name}
                    onChange={(e) =>
                      setNewStudent((s) => ({
                        ...s,
                        first_name: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Apellidos"
                    value={newStudent.last_name}
                    onChange={(e) =>
                      setNewStudent((s) => ({
                        ...s,
                        last_name: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="RUT"
                    value={newStudent.rut}
                    onChange={(e) =>
                      setNewStudent((s) => ({ ...s, rut: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Nivel"
                    value={newStudent.level}
                    onChange={(e) =>
                      setNewStudent((s) => ({ ...s, level: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Curso"
                    value={newStudent.course}
                    onChange={(e) =>
                      setNewStudent((s) => ({ ...s, course: e.target.value }))
                    }
                  />
                </div>
                <Button
                  className="mt-3"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  onClick={() =>
                    run(
                      'Estudiantes',
                      async () => {
                        if (!tenantId) return;
                        await createStudent(tenantId, newStudent);
                        setNewStudent({
                          first_name: '',
                          last_name: '',
                          rut: '',
                          level: '',
                          course: '',
                        });
                        await load();
                      },
                      'Estudiante creado',
                    )
                  }
                >
                  Nuevo alumno
                </Button>
              </div>

              {/* Importación masiva CSV */}
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0 sm:min-w-[200px]">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <Upload size={14} />
                      <span>Importar desde CSV</span>
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const text = event.target?.result as string;
                            const lines = text
                              .split('\n')
                              .slice(1)
                              .filter((l) => l.trim());
                            const parsed = lines
                              .map((line) => {
                                const [
                                  first_name,
                                  last_name,
                                  rut,
                                  course,
                                  level,
                                ] = line
                                  .split(',')
                                  .map((s) => s?.trim().replace(/^"|"$/g, ''));
                                return {
                                  first_name,
                                  last_name,
                                  rut,
                                  course,
                                  level,
                                };
                              })
                              .filter((s) => s.first_name || s.last_name);
                            setImportPreview(parsed);
                          };
                          reader.readAsText(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  {importPreview.length > 0 && (
                    <>
                      <span className="text-sm text-slate-600">
                        {importPreview.length} estudiantes detectados
                      </span>
                      <button
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
                        disabled={importing}
                        onClick={() =>
                          run(
                            'Importar',
                            async () => {
                              if (!tenantId) return;
                              setImporting(true);
                              await importStudents(tenantId, importPreview);
                              setImportPreview([]);
                              await load();
                            },
                            `${importPreview.length} estudiantes importados`,
                          )
                        }
                      >
                        {importing ? 'Importando...' : 'Confirmar importación'}
                      </button>
                      <button
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                        onClick={() => setImportPreview([])}
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
                {importPreview.length > 0 && (
                  <div className="mt-3 max-h-40 overflow-auto rounded border border-slate-200 bg-white text-xs">
                    <table className="min-w-full">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left">Nombres</th>
                          <th className="px-2 py-1 text-left">Apellidos</th>
                          <th className="px-2 py-1 text-left">RUT</th>
                          <th className="px-2 py-1 text-left">Curso</th>
                          <th className="px-2 py-1 text-left">Nivel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 10).map((s, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-2 py-1">{s.first_name}</td>
                            <td className="px-2 py-1">{s.last_name}</td>
                            <td className="px-2 py-1">{s.rut}</td>
                            <td className="px-2 py-1">{s.course}</td>
                            <td className="px-2 py-1">{s.level}</td>
                          </tr>
                        ))}
                        {importPreview.length > 10 && (
                          <tr className="border-t">
                            <td
                              colSpan={5}
                              className="px-2 py-1 text-center text-slate-500"
                            >
                              ...y {importPreview.length - 10} más
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="glass-panel p-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  <label className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      className="h-10 pl-9 pr-3 text-sm"
                      placeholder="Buscar alumno"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <label className="relative">
                    <Filter
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <Select
                      className="h-10 pl-9 pr-3 text-sm"
                      value={courseFilter}
                      onChange={(e) => setCourseFilter(e.target.value)}
                      options={[
                        { value: 'all', label: 'Todos los cursos' },
                        ...courses.map((c) => ({ value: c, label: c })),
                      ]}
                    />
                  </label>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-xs sm:text-sm">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-2 py-2 sm:px-4 sm:py-3">Alumno</th>
                        <th className="px-2 py-2 sm:px-4 sm:py-3">RUT</th>
                        <th className="px-2 py-2 sm:px-4 sm:py-3">Nivel</th>
                        <th className="px-2 py-2 sm:px-4 sm:py-3">Curso</th>
                        <th className="px-2 py-2 sm:px-4 sm:py-3 text-right">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s) => {
                        const row = editing[s.id] || s;
                        const isEditing = Boolean(editing[s.id]);
                        return (
                          <tr
                            key={s.id}
                            className="border-t border-slate-200 hover:bg-slate-50"
                          >
                            <td className="px-2 py-2 sm:px-4 sm:py-3">
                              <input
                                className="input mb-1"
                                value={row.first_name || ''}
                                disabled={!isEditing}
                                onChange={(e) =>
                                  setEditing((m) => ({
                                    ...m,
                                    [s.id]: {
                                      ...row,
                                      first_name: e.target.value,
                                    },
                                  }))
                                }
                              />
                              <input
                                className="input"
                                value={row.last_name || ''}
                                disabled={!isEditing}
                                onChange={(e) =>
                                  setEditing((m) => ({
                                    ...m,
                                    [s.id]: {
                                      ...row,
                                      last_name: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </td>
                            <td className="px-2 py-2 sm:px-4 sm:py-3">
                              <input
                                className="input"
                                value={row.rut || ''}
                                disabled={!isEditing}
                                onChange={(e) =>
                                  setEditing((m) => ({
                                    ...m,
                                    [s.id]: { ...row, rut: e.target.value },
                                  }))
                                }
                              />
                            </td>
                            <td className="px-2 py-2 sm:px-4 sm:py-3">
                              <LevelBadge level={row.level || ''} />
                              <input
                                className="input mt-1"
                                value={row.level || ''}
                                disabled={!isEditing}
                                onChange={(e) =>
                                  setEditing((m) => ({
                                    ...m,
                                    [s.id]: { ...row, level: e.target.value },
                                  }))
                                }
                              />
                            </td>
                            <td className="px-2 py-2 sm:px-4 sm:py-3">
                              <input
                                className="input"
                                value={row.course || ''}
                                disabled={!isEditing}
                                onChange={(e) =>
                                  setEditing((m) => ({
                                    ...m,
                                    [s.id]: { ...row, course: e.target.value },
                                  }))
                                }
                              />
                            </td>
                            <td className="px-2 py-2 sm:px-4 sm:py-3 text-right">
                              {!isEditing ? (
                                <button
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-red-600 hover:bg-red-50 tap-target"
                                  onClick={() =>
                                    run(
                                      'Estudiantes',
                                      async () => {
                                        if (
                                          !window.confirm(
                                            '¿Eliminar este estudiante?',
                                          )
                                        )
                                          return;
                                        await deleteStudent(s.id);
                                        await load();
                                      },
                                      'Estudiante eliminado',
                                    )
                                  }
                                >
                                  <Trash2 size={14} />
                                  Eliminar
                                </button>
                              ) : null}
                              {!isEditing ? (
                                <button
                                  className="ml-2 rounded-lg border border-slate-200 px-3 py-1 text-xs tap-target"
                                  onClick={() =>
                                    setEditing((m) => ({
                                      ...m,
                                      [s.id]: { ...s },
                                    }))
                                  }
                                >
                                  Editar
                                </button>
                              ) : (
                                <>
                                  <button
                                    className="rounded-lg bg-slate-900 px-3 py-1 text-xs text-white tap-target"
                                    onClick={() =>
                                      run(
                                        'Estudiantes',
                                        async () => {
                                          await updateStudent(s.id, row);
                                          setEditing((m) => {
                                            const n = { ...m };
                                            delete n[s.id];
                                            return n;
                                          });
                                          await load();
                                        },
                                        'Estudiante actualizado',
                                      )
                                    }
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    className="ml-2 rounded-lg border border-slate-200 px-3 py-1 text-xs tap-target"
                                    onClick={() =>
                                      setEditing((m) => {
                                        const n = { ...m };
                                        delete n[s.id];
                                        return n;
                                      })
                                    }
                                  >
                                    Cancelar
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'branding' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              {/* Selector de colegio (solo para platform admin) */}
              {isPlatformAdmin && (
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                  <label className="text-sm font-medium text-slate-700">
                    Selecciona colegio:
                  </label>
                  <select
                    className="input flex-1 max-w-xs"
                    value={selectedTenantId || tenantId || ''}
                    onChange={(e) =>
                      run(
                        'Cambio de colegio',
                        async () => {
                          const newTenantId = e.target.value;
                          setSelectedTenantId(newTenantId);
                          if (!newTenantId || newTenantId === tenantId) return;
                          await switchPlatformTenant(newTenantId);
                          await refetch();
                          await load();
                        },
                        'Colegio activo actualizado',
                      )
                    }
                  >
                    <option value="">Seleccionar colegio...</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name || t.slug} ({t.slug})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      const allTenants = await listTenants();
                      setTenants(allTenants);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Actualizar lista
                  </button>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Datos por completar:{' '}
                <span
                  className={`font-semibold ${pendingBrandingFields > 0 ? 'text-amber-700' : 'text-emerald-700'}`}
                >
                  {pendingBrandingFields}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <input
                  className={brandingFieldClass(branding.name)}
                  placeholder="Nombre"
                  value={branding.name}
                  onChange={(e) =>
                    setBranding((s) => ({ ...s, name: e.target.value }))
                  }
                />
                <input
                  className={brandingFieldClass(branding.email)}
                  placeholder="Correo"
                  value={branding.email}
                  onChange={(e) =>
                    setBranding((s) => ({ ...s, email: e.target.value }))
                  }
                />
                <input
                  className={brandingFieldClass(branding.phone)}
                  placeholder="Telefono"
                  value={branding.phone}
                  onChange={(e) =>
                    setBranding((s) => ({ ...s, phone: e.target.value }))
                  }
                />
                <input
                  className={brandingFieldClass(branding.address)}
                  placeholder="Direccion"
                  value={branding.address}
                  onChange={(e) =>
                    setBranding((s) => ({ ...s, address: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <label className="text-sm">
                  Subir logo
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 block"
                    onChange={(e) =>
                      run(
                        'Storage',
                        async () => {
                          const f = e.target.files?.[0];
                          if (!f || !tenantId) return;
                          const { url } = await uploadTenantBrandAsset(
                            tenantId,
                            f,
                            'logo',
                          );
                          setBranding((s) => ({ ...s, logo_url: url }));
                        },
                        'Logo cargado',
                      )
                    }
                  />
                </label>
                <label className="text-sm">
                  Subir favicon
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 block"
                    onChange={(e) =>
                      run(
                        'Storage',
                        async () => {
                          const f = e.target.files?.[0];
                          if (!f || !tenantId) return;
                          const { url } = await uploadTenantBrandAsset(
                            tenantId,
                            f,
                            'favicon',
                          );
                          setBranding((s) => ({ ...s, favicon_url: url }));
                        },
                        'Favicon cargado',
                      )
                    }
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-primary px-4 py-2"
                  onClick={() =>
                    run(
                      'Colegio',
                      async () => {
                        if (!tenantId) return;
                        await updateTenantBranding(tenantId, branding);
                        await refetch();
                      },
                      'Colegio actualizado',
                    )
                  }
                >
                  Guardar Colegio
                </button>
                <button
                  className="rounded-lg bg-slate-100 px-4 py-2"
                  onClick={() =>
                    run(
                      'Catalogos',
                      async () => {
                        if (!tenantId) return;
                        await applyCollegeCatalogs(tenantId);
                        await load();
                      },
                      'Catálogos aplicados',
                    )
                  }
                >
                  Aplicar Catalogo RPC
                </button>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-semibold">
                  ¿Qué hace "Aplicar Catalogo RPC"?
                </p>
                <p className="mt-1">
                  Ejecuta la función de publicación de catálogos del colegio en
                  Supabase y deja activos los datos que se usarán en formularios
                  y flujos del sistema (tipos de conducta, catálogo de
                  conductas, SLA de etapas y tipos de acción).
                </p>
                <p className="mt-2 font-semibold">
                  Requisitos recomendados antes de ejecutarlo
                </p>
                <ul className="mt-1 list-disc pl-5 space-y-1">
                  <li>
                    Tener definido el colegio activo correcto (si eres platform
                    admin).
                  </li>
                  <li>
                    Completar y guardar la marca básica del colegio (nombre,
                    correo, teléfono, dirección).
                  </li>
                  <li>
                    Haber ejecutado el alta inicial del colegio cuando es un
                    tenant nuevo.
                  </li>
                </ul>
              </div>
              {isPlatformAdmin && (
                <div className="border-t pt-3">
                  <h3 className="mb-2 font-semibold">
                    Alta inicial del colegio
                  </h3>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                    <input
                      className="input"
                      placeholder="slug"
                      value={onboard.slug}
                      onChange={(e) =>
                        setOnboard((s) => ({ ...s, slug: e.target.value }))
                      }
                    />
                    <input
                      className="input"
                      placeholder="nombre"
                      value={onboard.name}
                      onChange={(e) =>
                        setOnboard((s) => ({ ...s, name: e.target.value }))
                      }
                    />
                    <input
                      className="input"
                      placeholder="correo"
                      value={onboard.email}
                      onChange={(e) =>
                        setOnboard((s) => ({ ...s, email: e.target.value }))
                      }
                    />
                    <select
                      className="input"
                      value={onboard.subscriptionPlan}
                      onChange={(e) =>
                        setOnboard((s) => ({
                          ...s,
                          subscriptionPlan: e.target.value,
                        }))
                      }
                    >
                      <option value="basic">Básico</option>
                      <option value="professional">Profesional</option>
                      <option value="enterprise">Empresarial</option>
                    </select>
                    <input
                      type="number"
                      className="input"
                      value={onboard.trialDays}
                      onChange={(e) =>
                        setOnboard((s) => ({
                          ...s,
                          trialDays: Number(e.target.value || 14),
                        }))
                      }
                    />
                  </div>
                  <button
                    className="mt-2 btn-primary px-4 py-2"
                    onClick={() =>
                      run(
                        'Alta inicial',
                        async () => {
                          await onboardCollege(onboard);
                        },
                        'Alta inicial ejecutada',
                      )
                    }
                  >
                    Ejecutar alta inicial
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'platform' && isPlatformAdmin && (
            <div className="space-y-4">
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <h3 className="font-semibold text-indigo-900">
                  Configuración de plataforma del colegio
                </h3>
                <p className="mt-1 text-sm text-indigo-800">
                  Estos parámetros impactan suscripción, localización y
                  habilitación de módulos del colegio activo.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <label className="text-sm text-slate-700">
                    Estado suscripción
                    <select
                      className="input mt-1"
                      value={platformConfig.subscription_status}
                      onChange={(e) =>
                        setPlatformConfig((s) => ({
                          ...s,
                          subscription_status: e.target.value,
                        }))
                      }
                    >
                      <option value="trial">Prueba</option>
                      <option value="active">Activa</option>
                      <option value="suspended">Suspendida</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </label>
                  <label className="text-sm text-slate-700">
                    Plan suscripción
                    <select
                      className="input mt-1"
                      value={platformConfig.subscription_plan}
                      onChange={(e) =>
                        setPlatformConfig((s) => ({
                          ...s,
                          subscription_plan: e.target.value,
                        }))
                      }
                    >
                      <option value="basic">Básico</option>
                      <option value="professional">Profesional</option>
                      <option value="enterprise">Empresarial</option>
                    </select>
                  </label>
                  <label className="text-sm text-slate-700">
                    Fin de período de prueba
                    <input
                      type="date"
                      className="input mt-1"
                      value={platformConfig.trial_end_date}
                      onChange={(e) =>
                        setPlatformConfig((s) => ({
                          ...s,
                          trial_end_date: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <label className="text-sm text-slate-700">
                    Zona horaria
                    <input
                      className="input mt-1"
                      value={platformConfig.timezone}
                      onChange={(e) =>
                        setPlatformConfig((s) => ({
                          ...s,
                          timezone: e.target.value,
                        }))
                      }
                      placeholder="America/Santiago"
                    />
                  </label>
                  <label className="text-sm text-slate-700">
                    Idioma y región
                    <input
                      className="input mt-1"
                      value={platformConfig.locale}
                      onChange={(e) =>
                        setPlatformConfig((s) => ({
                          ...s,
                          locale: e.target.value,
                        }))
                      }
                      placeholder="es-CL"
                    />
                  </label>
                  <label className="text-sm text-slate-700">
                    Formato de fecha
                    <input
                      className="input mt-1"
                      value={platformConfig.date_format}
                      onChange={(e) =>
                        setPlatformConfig((s) => ({
                          ...s,
                          date_format: e.target.value,
                        }))
                      }
                      placeholder="dd/MM/yyyy"
                    />
                  </label>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Funciones habilitadas
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(platformConfig.features).map(
                      ([key, enabled]) => (
                        <label
                          key={key}
                          className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                          <span className="text-slate-700">
                            {PLATFORM_FEATURE_LABELS[key] ||
                              key.replace(/_/g, ' ')}
                          </span>
                          <input
                            type="checkbox"
                            checked={Boolean(enabled)}
                            onChange={(e) =>
                              setPlatformConfig((s) => ({
                                ...s,
                                features: {
                                  ...s.features,
                                  [key]: e.target.checked,
                                },
                              }))
                            }
                          />
                        </label>
                      ),
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    className="btn-primary px-4 py-2"
                    onClick={() =>
                      run(
                        'Plataforma',
                        async () => {
                          if (!tenantId) return;
                          await updateTenantBranding(tenantId, {
                            subscription_status:
                              platformConfig.subscription_status,
                            subscription_plan: platformConfig.subscription_plan,
                            trial_end_date:
                              platformConfig.trial_end_date || null,
                            timezone: platformConfig.timezone,
                            locale: platformConfig.locale,
                            date_format: platformConfig.date_format,
                            features: platformConfig.features,
                          });
                          await refetch();
                          await load();
                        },
                        'Configuración de plataforma actualizada',
                      )
                    }
                  >
                    Guardar configuración
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="space-y-3">
              {/* Formulario de nuevo usuario */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                {!showUserForm ? (
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
                    onClick={() => setShowUserForm(true)}
                  >
                    <Plus size={14} />
                    Nuevo usuario
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">
                        Invitar nuevo usuario
                      </h3>
                      <button
                        onClick={() => setShowUserForm(false)}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                      <input
                        className="input"
                        placeholder="Correo *"
                        type="email"
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser((s) => ({ ...s, email: e.target.value }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="Nombre completo"
                        value={newUser.fullName}
                        onChange={(e) =>
                          setNewUser((s) => ({
                            ...s,
                            fullName: e.target.value,
                          }))
                        }
                      />
                      <select
                        className="input"
                        value={newUser.role}
                        onChange={(e) =>
                          setNewUser((s) => ({ ...s, role: e.target.value }))
                        }
                      >
                        <option value="user">Usuario</option>
                        <option value="tenant_admin">Administrador</option>
                        {isPlatformAdmin && (
                          <option value="platform_admin">
                            Administrador de plataforma
                          </option>
                        )}
                      </select>
                      <input
                        className="input"
                        placeholder="Departamento"
                        value={newUser.department}
                        onChange={(e) =>
                          setNewUser((s) => ({
                            ...s,
                            department: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <button
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
                      onClick={() =>
                        run(
                          'Usuarios',
                          async () => {
                            if (!tenantId || !newUser.email) return;
                            await inviteTenantUser(tenantId, newUser);
                            setNewUser({
                              email: '',
                              fullName: '',
                              role: 'user',
                              department: '',
                            });
                            setShowUserForm(false);
                            await load();
                          },
                          'Usuario invitado correctamente',
                        )
                      }
                    >
                      <User size={14} />
                      Enviar invitación
                    </button>
                  </div>
                )}
              </div>

              {/* Lista de usuarios */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-xs sm:text-sm">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-2 py-2 sm:px-4 sm:py-3">Usuario</th>
                        <th className="px-2 py-2 sm:px-4 sm:py-3">Rol</th>
                        <th className="px-2 py-2 sm:px-4 sm:py-3">Depto</th>
                        <th className="px-2 py-2 sm:px-4 sm:py-3">Activo</th>
                        <th className="px-2 py-2 sm:px-4 sm:py-3">
                          Último acceso
                        </th>
                        <th className="px-2 py-2 sm:px-4 sm:py-3 text-right">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const row = editing[u.id] || u;
                        const isEditing = Boolean(editing[u.id]);
                        return (
                          <tr
                            key={u.id}
                            className="border-t border-slate-200 hover:bg-slate-50"
                          >
                            <td className="px-2 py-2 sm:px-4 sm:py-3">
                              <div className="font-medium text-slate-900">
                                {u.full_name || '—'}
                              </div>
                              <div className="text-xs text-slate-500">
                                {u.email}
                              </div>
                            </td>
                            <td className="px-2 py-2 sm:px-4 sm:py-3">
                              {isEditing ? (
                                <select
                                  className="input"
                                  value={row.role || 'user'}
                                  onChange={(e) =>
                                    setEditing((m) => ({
                                      ...m,
                                      [u.id]: { ...row, role: e.target.value },
                                    }))
                                  }
                                >
                                  <option value="user">Usuario</option>
                                  <option value="tenant_admin">
                                    Administrador
                                  </option>
                                  {isPlatformAdmin && (
                                    <option value="platform_admin">
                                      Administrador de plataforma
                                    </option>
                                  )}
                                </select>
                              ) : (
                                <RoleBadge role={u.role || 'user'} />
                              )}
                            </td>
                            <td className="px-2 py-2 sm:px-4 sm:py-3">
                              {isEditing ? (
                                <input
                                  className="input"
                                  value={row.department || ''}
                                  onChange={(e) =>
                                    setEditing((m) => ({
                                      ...m,
                                      [u.id]: {
                                        ...row,
                                        department: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              ) : (
                                <span className="text-slate-600">
                                  {u.department || '—'}
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-2 sm:px-4 sm:py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                              >
                                {u.is_active ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-2 py-2 sm:px-4 sm:py-3 text-slate-500">
                              {u.last_login_at
                                ? new Date(u.last_login_at).toLocaleDateString(
                                    'es-CL',
                                  )
                                : 'Nunca'}
                            </td>
                            <td className="px-2 py-2 sm:px-4 sm:py-3 text-right">
                              {!isEditing ? (
                                <button
                                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs tap-target"
                                  onClick={() =>
                                    setEditing((m) => ({
                                      ...m,
                                      [u.id]: { ...u },
                                    }))
                                  }
                                >
                                  Editar
                                </button>
                              ) : (
                                <>
                                  <button
                                    className="rounded-lg bg-slate-900 px-3 py-1 text-xs text-white tap-target"
                                    onClick={() =>
                                      run(
                                        'Usuarios',
                                        async () => {
                                          await adminUpdateTenantUser({
                                            profileId: u.id,
                                            fullName: row.full_name,
                                            role: row.role,
                                            department: row.department,
                                            isActive: row.is_active,
                                          });
                                          setEditing((m) => {
                                            const n = { ...m };
                                            delete n[u.id];
                                            return n;
                                          });
                                          await load();
                                        },
                                        'Usuario actualizado',
                                      )
                                    }
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    className="ml-2 rounded-lg border border-slate-200 px-3 py-1 text-xs tap-target"
                                    onClick={() =>
                                      setEditing((m) => {
                                        const n = { ...m };
                                        delete n[u.id];
                                        return n;
                                      })
                                    }
                                  >
                                    Cancelar
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {tab === 'catalogs' && (
            <div className="space-y-3">
              {/* Tabs de catálogos */}
              <div className="flex gap-2 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setCatalogTab('types')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${catalogTab === 'types' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Tipos de Conducta ({conductTypes.length})
                </button>
                <button
                  onClick={() => setCatalogTab('catalog')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${catalogTab === 'catalog' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Catálogo ({conductCatalog.length})
                </button>
                <button
                  onClick={() => setCatalogTab('actions')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${catalogTab === 'actions' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Tipos de Acción ({actionTypes.length})
                </button>
                <button
                  onClick={() => setCatalogTab('sla')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${catalogTab === 'sla' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  SLA Etapas ({stageSla.length})
                </button>
              </div>

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <Upload size={14} />
                    <span>Subir CSV</span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        handleCatalogCsvSelected(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <span className="text-xs text-slate-600">
                    Columnas esperadas:{' '}
                    {expectedCsvHeaders[catalogTab].join(', ')}
                  </span>
                  {catalogImportFileName && (
                    <span className="text-xs text-slate-500">
                      Archivo: {catalogImportFileName}
                    </span>
                  )}
                </div>
                {catalogImportPreview.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                      <span>
                        {catalogImportPreview.length} filas listas para importar
                      </span>
                      <button
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700 disabled:opacity-50"
                        disabled={catalogImporting}
                        onClick={() =>
                          run(
                            'Importar CSV',
                            async () => {
                              setCatalogImporting(true);
                              try {
                                await importCatalogCsv();
                              } finally {
                                setCatalogImporting(false);
                              }
                            },
                            'Catálogo importado correctamente',
                          )
                        }
                      >
                        {catalogImporting
                          ? 'Importando...'
                          : 'Importar a tabla'}
                      </button>
                      <button
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-100"
                        onClick={() => {
                          setCatalogImportPreview([]);
                          setCatalogImportHeaders([]);
                          setCatalogImportFileName('');
                        }}
                      >
                        Limpiar
                      </button>
                    </div>
                    <div className="max-h-40 overflow-auto rounded border border-slate-200 bg-white text-xs">
                      <table className="min-w-full">
                        <thead className="sticky top-0 bg-slate-50">
                          <tr>
                            {catalogImportHeaders.map((header) => (
                              <th key={header} className="px-2 py-1 text-left">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {catalogImportPreview.slice(0, 10).map((row, idx) => (
                            <tr key={idx} className="border-t">
                              {catalogImportHeaders.map((header) => (
                                <td
                                  key={`${idx}-${header}`}
                                  className="px-2 py-1"
                                >
                                  {String(row[header] || '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                          {catalogImportPreview.length > 10 && (
                            <tr className="border-t">
                              <td
                                colSpan={catalogImportHeaders.length || 1}
                                className="px-2 py-1 text-center text-slate-500"
                              >
                                ...y {catalogImportPreview.length - 10} filas
                                más
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Contenido según tab */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                {catalogTab === 'types' && (
                  <CatalogEditor
                    title="Tipos de Conducta"
                    items={conductTypes}
                    onAdd={async (item) => {
                      if (!tenantId) return;
                      await run(
                        'Catálogos',
                        async () => {
                          await upsertConductType(tenantId, item);
                          await load();
                        },
                        'Tipo de conducta guardado',
                      );
                    }}
                    onDelete={async (id) => {
                      if (!window.confirm('¿Eliminar este tipo de conducta?'))
                        return;
                      await run(
                        'Catálogos',
                        async () => {
                          await deleteConductType(id);
                          await load();
                        },
                        'Tipo de conducta eliminado',
                      );
                    }}
                    fields={[
                      {
                        key: 'key',
                        label: 'Clave',
                        placeholder: 'Ej: agresion_fisica, respeto',
                      },
                      {
                        key: 'label',
                        label: 'Etiqueta',
                        placeholder: 'Ej: Agresión Física, Respeto',
                      },
                      {
                        key: 'color',
                        label: 'Color',
                        placeholder: 'Ej: #ef4444',
                      },
                      { key: 'sort_order', label: 'Orden', type: 'number' },
                    ]}
                    activeField="active"
                  />
                )}
                {catalogTab === 'catalog' && (
                  <CatalogEditor
                    title="Catálogo de Conductas"
                    items={conductCatalog}
                    onAdd={async (item) => {
                      if (!tenantId) return;
                      await run(
                        'Catálogos',
                        async () => {
                          await upsertConductCatalogRow(tenantId, item);
                          await load();
                        },
                        'Conducta guardada',
                      );
                    }}
                    onDelete={async (id) => {
                      if (!window.confirm('¿Eliminar esta conducta?')) return;
                      await run(
                        'Catálogos',
                        async () => {
                          await deleteConductCatalogRow(id);
                          await load();
                        },
                        'Conducta eliminada',
                      );
                    }}
                    fields={[
                      {
                        key: 'conduct_type',
                        label: 'Tipo',
                        placeholder: 'Seleccionar tipo de conducta',
                      },
                      {
                        key: 'conduct_category',
                        label: 'Conducta',
                        placeholder: 'Ej: Agresión verbal, Respeto, etc.',
                      },
                      { key: 'sort_order', label: 'Orden', type: 'number' },
                    ]}
                    typeOptions={conductTypes.map((t) => t.key)}
                    activeField="active"
                  />
                )}
                {catalogTab === 'actions' && (
                  <CatalogEditor
                    title="Tipos de Acción"
                    items={actionTypes}
                    onAdd={async (item) => {
                      if (!tenantId) return;
                      await run(
                        'Catálogos',
                        async () => {
                          await upsertActionType(tenantId, item);
                          await load();
                        },
                        'Tipo de acción guardado',
                      );
                    }}
                    onDelete={async (id) => {
                      if (!window.confirm('¿Eliminar este tipo de acción?'))
                        return;
                      await run(
                        'Catálogos',
                        async () => {
                          await deleteActionType(id);
                          await load();
                        },
                        'Tipo de acción eliminado',
                      );
                    }}
                    fields={[
                      {
                        key: 'key',
                        label: 'Clave',
                        placeholder: 'Ej: suspension, advertencia, citacion',
                      },
                      {
                        key: 'label',
                        label: 'Etiqueta',
                        placeholder: 'Ej: Suspensión, Amonestación, Citación',
                      },
                      {
                        key: 'description',
                        label: 'Descripción',
                        placeholder: 'Descripción de la acción',
                      },
                      { key: 'sort_order', label: 'Orden', type: 'number' },
                    ]}
                  />
                )}
                {catalogTab === 'sla' && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                      Configura los tiempos de respuesta para cada etapa del
                      proceso. El valor numérico siempre representa{' '}
                      <strong>días corridos</strong>.
                    </p>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">
                        SLA Etapas ({stageSla.length})
                      </h3>
                      {!showSlaForm && (
                        <button
                          onClick={() => setShowSlaForm(true)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white"
                        >
                          <Plus size={14} />
                          Agregar
                        </button>
                      )}
                    </div>
                    {showSlaForm && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                          <input
                            className="input"
                            placeholder="Clave de etapa (stage_key)"
                            value={newSla.stage_key}
                            onChange={(e) =>
                              setNewSla((s) => ({
                                ...s,
                                stage_key: e.target.value,
                              }))
                            }
                          />
                          <input
                            type="number"
                            min={0}
                            className="input"
                            placeholder="Cantidad de días"
                            value={newSla.days_to_due}
                            onChange={(e) =>
                              setNewSla((s) => ({
                                ...s,
                                days_to_due: Number(e.target.value || 0),
                              }))
                            }
                          />
                          <button
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white"
                            onClick={() =>
                              run(
                                'SLA',
                                async () => {
                                  if (!tenantId) return;
                                  if (!newSla.stage_key.trim())
                                    throw new Error('Debes ingresar stage_key');
                                  await upsertStageSla(tenantId, {
                                    stage_key: newSla.stage_key.trim(),
                                    days_to_due: Number(
                                      newSla.days_to_due || 0,
                                    ),
                                  });
                                  setNewSla({ stage_key: '', days_to_due: 0 });
                                  setShowSlaForm(false);
                                  await load();
                                },
                                'SLA creado',
                              )
                            }
                          >
                            Guardar
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          Ejemplo: si ingresas <strong>5</strong>, el plazo de
                          la etapa será de <strong>5 días</strong>.
                        </p>
                        <button
                          className="mt-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                          onClick={() => {
                            setShowSlaForm(false);
                            setNewSla({ stage_key: '', days_to_due: 0 });
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="min-w-full text-xs sm:text-sm">
                        <thead className="sticky top-0 bg-slate-50">
                          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                            <th className="px-4 py-3">Etapa</th>
                            <th className="px-4 py-3">Plazo (días)</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stageSla.map((sla) => (
                            <SlaRow
                              key={sla.stage_key}
                              sla={sla}
                              onSave={async (updated) => {
                                if (!tenantId) return;
                                await run(
                                  'SLA',
                                  async () => {
                                    await updateStageSla(
                                      tenantId,
                                      sla.stage_key,
                                      updated,
                                    );
                                    await load();
                                  },
                                  'SLA actualizado',
                                );
                              }}
                              onDelete={async () => {
                                if (!tenantId) return;
                                if (
                                  !window.confirm(
                                    `¿Eliminar SLA de etapa "${sla.stage_key}"?`,
                                  )
                                )
                                  return;
                                await run(
                                  'SLA',
                                  async () => {
                                    await deleteStageSla(sla.stage_key);
                                    await load();
                                  },
                                  'SLA eliminado',
                                );
                              }}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {tab === 'settings' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                <h3 className="flex items-center gap-2 font-semibold text-blue-900">
                  <Settings2 size={16} /> Parámetros del Sistema
                </h3>
                <p className="mt-1 text-sm text-blue-800">
                  Define claves (<code>setting_key</code>) y valores (
                  <code>setting_value</code>) para controlar marca, reglas y
                  comportamiento.
                </p>
                <p className="mt-2 text-xs text-blue-700">
                  Flujo recomendado: <strong>1)</strong> elegir plantilla,{' '}
                  <strong>2)</strong> ajustar clave y tipo, <strong>3)</strong>{' '}
                  guardar.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium text-slate-900">
                    Plantillas rápidas
                  </h4>
                  <span className="text-xs text-slate-500">
                    Selecciona una para autocompletar
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {SETTING_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-slate-300 hover:bg-slate-100"
                      onClick={() =>
                        setNewSetting({
                          key: preset.key,
                          type: preset.type,
                          valueText:
                            preset.type === 'boolean'
                              ? ''
                              : preset.defaultValue,
                          valueBool: preset.defaultValue === 'true',
                        })
                      }
                    >
                      <p className="text-sm font-semibold text-slate-800">
                        {preset.label}
                      </p>
                      <p className="text-xs font-mono text-slate-500">
                        {preset.key}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="font-medium text-slate-900">
                  Constructor de parámetro
                </h4>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <select
                    className="input"
                    value={settingModule}
                    onChange={(e) => setSettingModule(e.target.value)}
                  >
                    <option value="ui">ui</option>
                    <option value="notifications">notifications</option>
                    <option value="cases">cases</option>
                    <option value="workflow">workflow</option>
                    <option value="branding">branding</option>
                    <option value="integrations">integrations</option>
                    <option value="reports">reports</option>
                    <option value="custom">custom</option>
                  </select>
                  <input
                    className="input"
                    placeholder="Nombre interno (ej: default responsible role)"
                    value={settingName}
                    onChange={(e) => setSettingName(e.target.value)}
                  />
                  <button
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100"
                    onClick={() => {
                      const slug = slugifySettingSegment(settingName);
                      if (!slug) return;
                      setNewSetting((s) => ({
                        ...s,
                        key: `${settingModule}.${slug}`,
                      }));
                    }}
                  >
                    Generar clave
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Convención recomendada: <code>módulo.nombre_parametro</code>{' '}
                  (ej: <code>workflow.auto_close_days</code>).
                </p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <input
                    className="input md:col-span-2"
                    placeholder="Clave (setting_key)"
                    value={newSetting.key}
                    onChange={(e) =>
                      setNewSetting((s) => ({ ...s, key: e.target.value }))
                    }
                  />
                  <select
                    className="input"
                    value={newSetting.type}
                    onChange={(e) =>
                      setNewSetting((s) => ({
                        ...s,
                        type: e.target.value as SettingInputType,
                      }))
                    }
                  >
                    <option value="string">Texto</option>
                    <option value="number">Número</option>
                    <option value="boolean">Sí/No</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                {newSetting.type === 'boolean' ? (
                  <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={newSetting.valueBool}
                      onChange={(e) =>
                        setNewSetting((s) => ({
                          ...s,
                          valueBool: e.target.checked,
                        }))
                      }
                    />
                    Valor habilitado
                  </label>
                ) : (
                  <textarea
                    className="input min-h-24"
                    placeholder={
                      newSetting.type === 'json' ? '{"clave":"valor"}' : 'Valor'
                    }
                    value={newSetting.valueText}
                    onChange={(e) =>
                      setNewSetting((s) => ({
                        ...s,
                        valueText: e.target.value,
                      }))
                    }
                  />
                )}
                {settingFormError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {settingFormError}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="btn-primary px-3 py-2"
                    onClick={() =>
                      run(
                        'Parámetros',
                        async () => {
                          if (!tenantId) return;
                          if (!newSetting.key.trim()) {
                            setSettingFormError('Debes indicar una clave');
                            return;
                          }
                          if (!/^[a-z0-9._-]+$/i.test(newSetting.key.trim())) {
                            setSettingFormError(
                              'La clave solo admite letras, números, punto, guion y guion bajo',
                            );
                            return;
                          }
                          const value = buildSettingValue(newSetting);
                          setSettingFormError('');
                          await upsertTenantSetting(
                            tenantId,
                            newSetting.key.trim(),
                            value,
                          );
                          setNewSetting({
                            key: '',
                            valueText: '',
                            type: 'string',
                            valueBool: true,
                          });
                          setSettingName('');
                          await load();
                        },
                        'Parámetro guardado',
                      )
                    }
                  >
                    Guardar parámetro
                  </button>
                  <button
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100"
                    onClick={() => {
                      setNewSetting({
                        key: '',
                        valueText: '',
                        type: 'string',
                        valueBool: true,
                      });
                      setSettingName('');
                      setSettingFormError('');
                    }}
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              {/* Lista de parámetros */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Total
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {settings.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Booleanos
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {
                        settings.filter(
                          (s) =>
                            detectSettingType(s.setting_value) === 'boolean',
                        ).length
                      }
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      JSON
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {
                        settings.filter(
                          (s) => detectSettingType(s.setting_value) === 'json',
                        ).length
                      }
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Categorías
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {settingCategoryOptions.filter((x) => x !== 'all').length}
                    </p>
                  </div>
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {settingsByCategory.slice(0, 8).map((row) => (
                    <button
                      key={row.category}
                      className={`rounded-full border px-2 py-1 text-xs ${
                        settingCategoryFilter === row.category
                          ? 'border-blue-300 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                      onClick={() =>
                        setSettingCategoryFilter((prev) =>
                          prev === row.category ? 'all' : row.category,
                        )
                      }
                    >
                      {row.category} ({row.count})
                    </button>
                  ))}
                </div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-medium text-slate-900">
                    Parámetros configurados ({settings.length})
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      className="input max-w-xs"
                      placeholder="Buscar parámetro"
                      value={settingSearch}
                      onChange={(e) => setSettingSearch(e.target.value)}
                    />
                    <select
                      className="input w-40"
                      value={settingCategoryFilter}
                      onChange={(e) => setSettingCategoryFilter(e.target.value)}
                    >
                      {settingCategoryOptions.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === 'all' ? 'Todas las categorías' : cat}
                        </option>
                      ))}
                    </select>
                    <select
                      className="input w-36"
                      value={settingTypeFilter}
                      onChange={(e) =>
                        setSettingTypeFilter(
                          e.target.value as 'all' | SettingInputType,
                        )
                      }
                    >
                      {settingTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type === 'all' ? 'Todos los tipos' : type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {visibleSettings.length > 0 ? (
                  <div className="space-y-2">
                    {visibleSettings.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-start gap-3 border-t pt-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-medium text-slate-800">
                              {s.setting_key}
                            </span>
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-blue-700">
                              {getSettingCategory(s.setting_key)}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                              {detectSettingType(s.setting_value)}
                            </span>
                          </div>
                          {editingSetting?.id === s.id ? (
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <input
                                className="input w-full md:max-w-xl"
                                value={editingSetting.valueText}
                                onChange={(e) =>
                                  setEditingSetting({
                                    id: s.id,
                                    valueText: e.target.value,
                                  })
                                }
                              />
                              <button
                                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white"
                                onClick={() =>
                                  run(
                                    'Parámetros',
                                    async () => {
                                      if (!tenantId) return;
                                      await upsertTenantSetting(
                                        tenantId,
                                        s.setting_key,
                                        parseValue(editingSetting.valueText),
                                      );
                                      setEditingSetting(null);
                                      await load();
                                    },
                                    'Parámetro actualizado',
                                  )
                                }
                              >
                                Guardar
                              </button>
                              <button
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                                onClick={() => setEditingSetting(null)}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="font-mono text-xs text-slate-500 mt-0.5 break-all">
                              {formatSettingValue(s.setting_value)}
                            </div>
                          )}
                        </div>
                        {editingSetting?.id !== s.id && (
                          <button
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 shrink-0"
                            onClick={() =>
                              setEditingSetting({
                                id: s.id,
                                valueText: formatSettingValue(s.setting_value),
                              })
                            }
                          >
                            Editar
                          </button>
                        )}
                        <button
                          className="text-red-600 hover:text-red-800 shrink-0"
                          onClick={() =>
                            run(
                              'Parámetros',
                              async () => {
                                await deleteTenantSetting(s.id);
                                await load();
                              },
                              'Parámetro eliminado',
                            )
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">
                    No hay parámetros configurados
                  </p>
                )}
              </div>
            </div>
          )}
          {tab === 'audit' && (
            <div className="space-y-4">
              {/* Documentación */}
              <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
                <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                  <ShieldCheck size={16} /> Registro de Auditoría
                </h3>
                <p className="text-sm text-purple-800 mt-1">
                  Este módulo muestra un historial de todas las acciones
                  realizadas en el sistema. Permite rastrear cambios, creaciones
                  y eliminaciones para cumplimiento y seguridad.
                </p>
                <div className="mt-2 text-xs text-purple-700">
                  <strong>Información registrada:</strong> Usuario responsable,
                  acción realizada, tabla afectada, identificador del registro,
                  fecha y hora del cambio.
                </div>
              </div>

              {/* Tabla de auditoría */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-4">
                  <input
                    className="input"
                    placeholder="Buscar en auditoría"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                  />
                  <select
                    className="input"
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                  >
                    {auditActionOptions.map((a) => (
                      <option key={a} value={a}>
                        {a === 'all' ? 'Todas las acciones' : a}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input"
                    value={auditTableFilter}
                    onChange={(e) => setAuditTableFilter(e.target.value)}
                  >
                    {auditTableOptions.map((t) => (
                      <option key={t} value={t}>
                        {t === 'all' ? 'Todas las tablas' : t}
                      </option>
                    ))}
                  </select>
                  <button
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    onClick={load}
                  >
                    Refrescar auditoría
                  </button>
                </div>

                <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Registro manual
                  </p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                    <input
                      className="input"
                      placeholder="Acción (ej: MANUAL)"
                      value={newAuditEntry.action}
                      onChange={(e) =>
                        setNewAuditEntry((s) => ({
                          ...s,
                          action: e.target.value,
                        }))
                      }
                    />
                    <input
                      className="input"
                      placeholder="Tabla"
                      value={newAuditEntry.tableName}
                      onChange={(e) =>
                        setNewAuditEntry((s) => ({
                          ...s,
                          tableName: e.target.value,
                        }))
                      }
                    />
                    <input
                      className="input md:col-span-2"
                      placeholder="Nota"
                      value={newAuditEntry.note}
                      onChange={(e) =>
                        setNewAuditEntry((s) => ({
                          ...s,
                          note: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <button
                    className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
                    onClick={() =>
                      run(
                        'Auditoría',
                        async () => {
                          if (!tenantId) return;
                          await createManualAuditLog({
                            tenantId,
                            action: newAuditEntry.action || 'MANUAL',
                            tableName: newAuditEntry.tableName || 'manual',
                            note: newAuditEntry.note || null,
                            newValues: { source: 'admin_panel' },
                          });
                          setNewAuditEntry({
                            action: 'MANUAL',
                            tableName: 'manual',
                            note: '',
                          });
                          await load();
                        },
                        'Registro manual creado',
                      )
                    }
                  >
                    Crear registro manual
                  </button>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <span className="text-sm text-amber-900">
                    Purgar auditoría anterior a
                  </span>
                  <input
                    type="number"
                    min={1}
                    className="input w-28"
                    value={auditPurgeDays}
                    onChange={(e) =>
                      setAuditPurgeDays(Number(e.target.value || 90))
                    }
                  />
                  <span className="text-sm text-amber-900">días</span>
                  <button
                    className="rounded-lg bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700"
                    onClick={() =>
                      run(
                        'Auditoría',
                        async () => {
                          if (!tenantId) return;
                          const before = new Date();
                          before.setDate(
                            before.getDate() - Number(auditPurgeDays || 90),
                          );
                          await purgeAuditLogs(tenantId, before.toISOString());
                          await load();
                        },
                        'Purgado ejecutado',
                      )
                    }
                  >
                    Ejecutar purga
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full text-xs sm:text-sm">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3">Fecha/Hora</th>
                        <th className="px-4 py-3">Usuario</th>
                        <th className="px-4 py-3">Acción</th>
                        <th className="px-4 py-3">Tabla</th>
                        <th className="px-4 py-3">Registro</th>
                        <th className="px-4 py-3">Nota</th>
                        <th className="px-4 py-3">Detalles</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAudit.map((r) => (
                        <tr key={r.id} className="border-t hover:bg-slate-50">
                          <td className="px-2 py-2 sm:px-4 whitespace-nowrap">
                            {new Date(r.created_at).toLocaleString('es-CL')}
                          </td>
                          <td className="px-2 py-2 sm:px-4 text-slate-600">
                            {r.user_id
                              ? r.user_id.slice(0, 8) + '...'
                              : 'Sistema'}
                          </td>
                          <td className="px-2 py-2 sm:px-4">
                            <ActionBadge action={r.action} />
                          </td>
                          <td className="px-2 py-2 sm:px-4 font-mono text-xs">
                            {r.table_name || '—'}
                          </td>
                          <td className="px-2 py-2 sm:px-4 font-mono text-xs text-slate-500">
                            {r.record_id
                              ? r.record_id.slice(0, 8) + '...'
                              : '—'}
                          </td>
                          <td className="px-2 py-2 sm:px-4">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <input
                                className="h-10 w-full sm:w-52 rounded border border-slate-200 px-2 text-xs"
                                value={
                                  editingAuditNotes[r.id] ?? r.admin_note ?? ''
                                }
                                onChange={(e) =>
                                  setEditingAuditNotes((m) => ({
                                    ...m,
                                    [r.id]: e.target.value,
                                  }))
                                }
                              />
                              <button
                                className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-100 tap-target"
                                onClick={() =>
                                  run(
                                    'Auditoría',
                                    async () => {
                                      await updateAuditLogNote(
                                        r.id,
                                        editingAuditNotes[r.id] ??
                                          r.admin_note ??
                                          '',
                                      );
                                      await load();
                                    },
                                    'Nota actualizada',
                                  )
                                }
                              >
                                Guardar
                              </button>
                            </div>
                          </td>
                          <td className="px-2 py-2 sm:px-4">
                            {r.old_values || r.new_values ? (
                              <details className="group">
                                <summary className="cursor-pointer text-blue-600 hover:text-blue-800 text-xs inline-flex items-center tap-target">
                                  Ver cambios
                                </summary>
                                <div className="mt-1 text-xs bg-slate-100 p-2 rounded font-mono max-w-xs">
                                  {r.old_values && (
                                    <div className="text-red-600">
                                      Antes: {JSON.stringify(r.old_values)}
                                    </div>
                                  )}
                                  {r.new_values && (
                                    <div className="text-green-600">
                                      Después: {JSON.stringify(r.new_values)}
                                    </div>
                                  )}
                                </div>
                              </details>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-2 py-2 sm:px-4 text-right">
                            <button
                              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 tap-target"
                              onClick={() =>
                                run(
                                  'Auditoría',
                                  async () => {
                                    if (
                                      !window.confirm(
                                        '¿Eliminar este registro de auditoría?',
                                      )
                                    )
                                      return;
                                    await deleteAuditLog(r.id);
                                    await load();
                                  },
                                  'Registro eliminado',
                                )
                              }
                            >
                              <Trash2 size={12} />
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredAudit.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-8 text-center text-slate-500"
                          >
                            No hay registros de auditoría
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  tone = 'slate',
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: 'slate' | 'blue' | 'violet' | 'emerald';
}) {
  const toneClass = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-700',
    violet: 'bg-violet-100 text-violet-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  }[tone];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-500">
          {title}
        </span>
        <span className={`rounded-lg p-2 ${toneClass}`}>{icon}</span>
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  const text = level || 'Sin nivel';
  const isMedia =
    /media|i medio|ii medio|iii medio|iv medio|1 medio|2 medio|3 medio|4 medio/i.test(
      text,
    );
  const isBasica = /b[áa]sica|basico|básico|1°|2°|3°|4°|5°|6°|7°|8°/i.test(
    text,
  );
  if (isMedia)
    return (
      <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
        Media
      </span>
    );
  if (isBasica)
    return (
      <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
        Básica
      </span>
    );
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {text}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const roleConfig: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    platform_admin: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      label: 'Administrador de plataforma',
    },
    tenant_admin: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      label: 'Administrador',
    },
    user: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Usuario' },
  };
  const config = roleConfig[role] || roleConfig.user;
  return (
    <span
      className={`inline-flex rounded-full border border-slate-200 px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

type FieldConfig = {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'number';
};

function CatalogEditor({
  title,
  items,
  onAdd,
  onDelete,
  fields,
  typeOptions,
  activeField = 'is_active',
}: {
  title: string;
  items: any[];
  onAdd: (item: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  fields: FieldConfig[];
  typeOptions?: string[];
  activeField?: 'is_active' | 'active';
}) {
  const [newItem, setNewItem] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);

  const handleAdd = async () => {
    if (!fields.some((f) => newItem[f.key])) return;
    await onAdd({
      ...newItem,
      sort_order: Number(newItem.sort_order || 0),
      [activeField]: true,
    });
    setNewItem({});
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white"
          >
            <Plus size={14} />
            Agregar
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {fields.map((field) => (
              <input
                key={field.key}
                className="input"
                placeholder={field.placeholder || field.label}
                value={newItem[field.key] || ''}
                type={field.type || 'text'}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
              />
            ))}
            {typeOptions && (
              <select
                className="input"
                value={newItem.conduct_type || ''}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    conduct_type: e.target.value,
                  }))
                }
              >
                <option value="">Seleccionar tipo</option>
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleAdd}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white"
            >
              Guardar
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setNewItem({});
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {fields.map((f) => (
                <th key={f.key} className="px-3 py-2 text-left">
                  {f.label}
                </th>
              ))}
              <th className="px-3 py-2 text-left">Activo</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                {fields.map((f) => (
                  <td key={f.key} className="px-3 py-2">
                    {item[f.key]}
                  </td>
                ))}
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${item[activeField] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {item[activeField] ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => onDelete(item.id)}
                    className="inline-flex items-center justify-center rounded-md text-red-600 hover:text-red-800 hover:bg-red-50 tap-target"
                    aria-label="Eliminar elemento"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={fields.length + 2}
                  className="px-3 py-4 text-center text-slate-500"
                >
                  No hay elementos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SlaRow({
  sla,
  onSave,
  onDelete,
}: {
  sla: any;
  onSave: (item: any) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [days, setDays] = useState(sla.days_to_due || 0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ days_to_due: days });
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  };

  return (
    <tr className="border-t">
      <td className="px-4 py-2 font-medium">{sla.stage_key}</td>
      <td className="px-4 py-2">
        <input
          type="number"
          className="input w-20"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          min={0}
        />
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <button
            onClick={handleSave}
            disabled={saving || deleting}
            className="rounded-lg bg-slate-900 px-3 py-1 text-xs text-white disabled:opacity-50 tap-target"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            onClick={handleDelete}
            disabled={saving || deleting}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50 tap-target"
          >
            <Trash2 size={12} />
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </td>
    </tr>
  );
}

function ActionBadge({ action }: { action: string }) {
  const actionConfig: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    INSERT: { bg: 'bg-green-100', text: 'text-green-700', label: 'Crear' },
    UPDATE: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Actualizar' },
    DELETE: { bg: 'bg-red-100', text: 'text-red-700', label: 'Eliminar' },
    LOGIN: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Login' },
    LOGOUT: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Logout' },
  };
  const config = actionConfig[action] || {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    label: action,
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

function _SimpleTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="mb-2 font-semibold">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-3 py-2 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                {r.map((c, j) => (
                  <td key={`${i}-${j}`} className="px-3 py-2">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
