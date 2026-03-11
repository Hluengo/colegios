import { useEffect, useState } from 'react';
import {
  getInvolucrados,
  addInvolucrado,
  deleteInvolucrado,
  updateInvolucrado,
} from '../api/db';
import { logger } from '../utils/logger';
import { useToast } from '../hooks/useToast';
import { supabase } from '../api/supabaseClient';
import { useTenant } from '../context/TenantContext';

const ROLES = ['Afectado', 'Agresor', 'Testigo', 'Denunciante'];

interface InvolucradoItem {
  id: string;
  case_id: string;
  nombre: string;
  rol: string;
  curso?: string | null;
  metadata?: { curso?: string };
}

interface InvolucradosListProps {
  casoId?: string | null;
  readOnly?: boolean;
}

export default function InvolucradosList({
  casoId,
  readOnly = false,
}: InvolucradosListProps) {
  const { tenant } = useTenant();
  const tenantId = tenant?.id || null;
  const [items, setItems] = useState<InvolucradoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('');
  const [curso, setCurso] = useState('');
  const [cursos, setCursos] = useState<string[]>([]);
  const [nombresPorCurso, setNombresPorCurso] = useState<Record<string, string[]>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editRol, setEditRol] = useState('');
  const [editCurso, setEditCurso] = useState('');
  const { push } = useToast();

  useEffect(() => {
    let mounted = true;

    async function loadStudentsCatalog() {
      try {
        let query = supabase
          .from('students')
          .select('first_name, last_name, course')
          .not('course', 'is', null)
          .order('course', { ascending: true })
          .order('last_name', { ascending: true });

        if (tenantId) {
          query = query.eq('tenant_id', tenantId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const byCourse: Record<string, string[]> = {};
        for (const row of data || []) {
          const course = String(row.course || '').trim();
          if (!course) continue;
          const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim();
          if (!fullName) continue;
          if (!byCourse[course]) byCourse[course] = [];
          byCourse[course].push(fullName);
        }

        const deduped: Record<string, string[]> = {};
        for (const key of Object.keys(byCourse)) {
          deduped[key] = Array.from(new Set(byCourse[key])).sort((a, b) =>
            a.localeCompare(b, 'es'),
          );
        }

        if (!mounted) return;
        setNombresPorCurso(deduped);
        setCursos(Object.keys(deduped).sort((a, b) => a.localeCompare(b, 'es')));
      } catch (error) {
        logger.error('Error cargando catálogo estudiantes por curso:', error);
      }
    }

    loadStudentsCatalog();
    return () => {
      mounted = false;
    };
  }, [tenantId]);

  useEffect(() => {
    if (!casoId) return setItems([]);
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await getInvolucrados(casoId);
        if (mounted) setItems(data || []);
      } catch (error) {
        logger.error(error);
        if (mounted) {
          // silently fail on load
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [casoId]);

  async function handleAdd() {
    if (!curso || !nombre.trim() || !rol) {
      push({
        type: 'error',
        title: 'Datos',
        message: 'Curso, nombre y rol son requeridos',
      });
      return;
    }

    try {
      const created = await addInvolucrado({
        case_id: casoId,
        nombre: nombre.trim(),
        rol,
        curso: curso.trim() || null,
      });
      setItems((prev) => [...prev, created]);
      setNombre('');
      setRol('');
      setCurso('');
      setShowForm(false);
      push({
        type: 'success',
        title: 'Agregado',
        message: 'Involucrado agregado',
      });
    } catch (error) {
      logger.error(error);
      push({
        type: 'error',
        title: 'Error',
        message: 'No se pudo agregar involucrado',
      });
    }
  }

  async function handleDelete(itemId: string) {
    try {
      await deleteInvolucrado(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      push({
        type: 'success',
        title: 'Eliminado',
        message: 'Involucrado eliminado',
      });
    } catch (error) {
      logger.error(error);
      push({
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar involucrado',
      });
    }
  }

  function startEdit(item: InvolucradoItem) {
    setEditingId(item.id);
    setEditNombre(item.nombre || '');
    setEditRol(item.rol || '');
    setEditCurso(item.curso || item.metadata?.curso || '');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNombre('');
    setEditRol('');
    setEditCurso('');
  }

  async function handleSaveEdit(itemId: string) {
    if (!editCurso || !editNombre.trim() || !editRol) {
      push({
        type: 'error',
        title: 'Datos',
        message: 'Curso, nombre y rol son requeridos',
      });
      return;
    }

    try {
      const updated = await updateInvolucrado(itemId, {
        nombre: editNombre.trim(),
        rol: editRol,
        curso: editCurso.trim() || null,
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                nombre: updated?.nombre ?? editNombre.trim(),
                rol: updated?.rol ?? editRol,
                curso: updated?.curso ?? (editCurso.trim() || null),
              }
            : item,
        ),
      );
      cancelEdit();
      push({
        type: 'success',
        title: 'Actualizado',
        message: 'Involucrado actualizado',
      });
    } catch (error) {
      logger.error(error);
      push({
        type: 'error',
        title: 'Error',
        message: 'No se pudo actualizar involucrado',
      });
    }
  }

  if (!casoId)
    return (
      <div className="text-sm text-slate-500 italic">
        No hay caso seleccionado.
      </div>
    );

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
        Involucrados
      </h3>

      {loading ? (
        <div className="text-xs text-slate-500">Cargando...</div>
      ) : (
        <div className="space-y-2">
          {items.length === 0 && (
            <div className="text-sm text-slate-500 italic">
              No hay personas registradas.
            </div>
          )}
          {items.map((it) => (
            <div
              key={it.id}
              className="p-3 border border-slate-100 rounded-md bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:border-slate-200 transition-colors"
            >
              {editingId === it.id ? (
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 mr-2">
                  <select
                    value={editCurso}
                    onChange={(event) => {
                      setEditCurso(event.target.value);
                      setEditNombre('');
                    }}
                    className="w-full border border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
                  >
                    <option value="">Selecciona curso</option>
                    {cursos.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    value={editNombre}
                    onChange={(event) => setEditNombre(event.target.value)}
                    disabled={!editCurso}
                    className="w-full border border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white disabled:opacity-60"
                  >
                    <option value="">
                      {editCurso ? 'Selecciona estudiante' : 'Primero selecciona curso'}
                    </option>
                    {(nombresPorCurso[editCurso] || []).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                    {editNombre && !(nombresPorCurso[editCurso] || []).includes(editNombre) && (
                      <option value={editNombre}>{editNombre}</option>
                    )}
                  </select>
                  <select
                    value={editRol}
                    onChange={(event) => setEditRol(event.target.value)}
                    className="w-full border border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
                  >
                    <option value="">Selecciona rol</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-slate-800">
                    {it.nombre}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      {it.rol}
                    </span>
                    {(it.curso || it.metadata?.curso) ? (
                      <span className="ml-1 text-slate-500">
                        · {it.curso || it.metadata?.curso}
                      </span>
                    ) : (
                      ''
                    )}
                  </div>
                </div>
              )}
              {!readOnly && (
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-end sm:self-auto shrink-0">
                  {editingId === it.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(it.id)}
                        className="text-xs text-green-600 hover:text-green-700 font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors tap-target whitespace-nowrap"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-xs text-slate-600 hover:text-slate-700 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors tap-target whitespace-nowrap"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(it)}
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1 rounded hover:bg-brand-50 transition-colors tap-target whitespace-nowrap"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(it.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors tap-target whitespace-nowrap"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full py-2 border border-dashed border-slate-300 rounded text-sm text-slate-500 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50 transition-all font-medium"
            >
              + Agregar involucrado
            </button>
          ) : (
            <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <select
                value={curso}
                onChange={(event) => {
                  setCurso(event.target.value);
                  setNombre('');
                }}
                className="w-full border border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
              >
                <option value="">Selecciona curso</option>
                {cursos.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                disabled={!curso}
                className="w-full border border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white disabled:opacity-60"
              >
                <option value="">
                  {curso ? 'Selecciona estudiante' : 'Primero selecciona curso'}
                </option>
                {(nombresPorCurso[curso] || []).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <select
                value={rol}
                onChange={(event) => setRol(event.target.value)}
                className="w-full border border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
              >
                <option value="">Selecciona rol</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setNombre('');
                    setRol('');
                    setCurso('');
                  }}
                  className="px-3 py-1.5 border border-slate-300 bg-white text-slate-600 rounded text-xs font-medium hover:bg-brand-50 tap-target"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="px-3 py-1.5 bg-brand-600 text-white rounded text-xs font-medium hover:bg-brand-700 shadow-sm tap-target"
                >
                  Guardar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
