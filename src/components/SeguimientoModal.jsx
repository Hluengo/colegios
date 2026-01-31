import { useMemo } from 'react';
import ModalShell from './ModalShell';
import SeguimientoPage from '../pages/SeguimientoPage';
import { getStudentName } from '../utils/studentName';

export default function SeguimientoModal({ caso, onClose }) {
  const title = useMemo(
    () => getStudentName(caso?.fields?.Estudiante_Responsable, 'Caso cerrado'),
    [caso],
  );

  const subtitle = useMemo(() => {
    if (!caso) return '';
    const tip = caso.fields?.Tipificacion_Conducta || '';
    const curso = caso.fields?.Curso_Incidente || '';
    const fecha = caso.fields?.Fecha_Incidente || '';
    return [tip, curso, fecha].filter(Boolean).join(' • ');
  }, [caso]);

  if (!caso) return null;

  return (
    <ModalShell title={title} subtitle={subtitle} onClose={onClose} size="xl">
      <div className="bg-white">
        <SeguimientoPage
          casoId={caso.id}
          readOnly
          showExport
          onClose={onClose}
        />
      </div>
    </ModalShell>
  );
}
