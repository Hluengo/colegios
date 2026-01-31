import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText } from 'lucide-react';
import { getCaseFollowups, getCases } from '../api/db';
import { getStudentName } from '../utils/studentName';
import { formatDate } from '../utils/formatDate';
import { tipBadgeClasses } from '../utils/tipColors';
import { useToast } from '../hooks/useToast';
import { logger } from '../utils/logger';

export default function CasosCerrados() {
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { push } = useToast();

  useEffect(() => {
    let mounted = true;

    async function cargar() {
      try {
        setLoading(true);
        const data = await getCases('Cerrado');
        if (mounted) setCasos(data);
      } catch (e) {
        if (mounted) setError(e?.message || 'Error al cargar casos cerrados');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    cargar();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <p className="text-gray-500">Cargando casos cerrados…</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  async function handleExportPDF(caso) {
    try {
      const seguimientos = await getCaseFollowups(caso.id);
      const [{ pdf }, { default: InformeCasoDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/InformeCasoDocument'),
      ]);

      const blob = await pdf(
        <InformeCasoDocument caso={caso} seguimientos={seguimientos} />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informe_${caso.id}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      logger.error('Error al generar PDF:', e);
      push({
        type: 'error',
        title: 'PDF',
        message: e?.message || 'No se pudo generar el informe',
      });
    }
  }

  return (
    <div className="h-full p-2">
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-xl font-black text-slate-900 tracking-tight truncate">
            Archivo Histórico
          </h2>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {casos.length} casos
          </span>
        </div>
      </div>

      <div className="glass-panel overflow-hidden flex flex-col border border-white/60 shadow-xl">
            {/* ENCABEZADO LISTA */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Listado Cerrados</span>
              <span>Fecha Cierre</span>
            </div>

            {/* LISTA SCROLLABLE */}
            <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {loading && (
                <p className="p-8 text-center text-slate-400 text-sm animate-pulse">
                  Cargando archivo...
                </p>
              )}

              {!loading && casos.length === 0 && (
                <div className="p-10 text-center text-slate-400 text-sm">
                  No hay casos cerrados.
                </div>
              )}

              {!loading &&
                casos.map((caso) => {
                  return (
                    <div
                      key={caso.id}
                      className="bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition shadow-sm"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tipBadgeClasses(caso.fields.Tipificacion_Conducta)}`}
                        >
                          {caso.fields.Tipificacion_Conducta}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {formatDate(caso.fields.Fecha_Incidente)}
                        </span>
                        </div>

                        <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-1 line-clamp-1 group-hover:text-slate-900 transition-colors">
                          {getStudentName(
                            caso.fields.Estudiante_Responsable,
                            'Estudiante',
                          )}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {caso.fields.Categoria}
                        </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                              {caso.fields.Curso_Incidente?.substring(0, 2) ||
                                'NA'}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Cerrado
                            </span>
                          </div>

                          <button
                            onClick={() => navigate(`/cierre-caso/${caso.id}`)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                            title="Ver detalle"
                            aria-label="Ver detalle"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleExportPDF(caso)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                            title="Imprimir informe"
                            aria-label="Imprimir informe"
                          >
                            <FileText size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

    </div>
  );
}
