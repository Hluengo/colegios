/**
 * DatePicker - Selector de fechas
 * 
 * DatePicker moderno con calendario popup.
 * 
 * @example
 * <DatePicker 
 *   value={date} 
 *   onChange={(date) => setDate(date)}
 *   label="Fecha de nacimiento"
 * />
 */

import { useState, useRef, useEffect, ReactNode } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface DatePickerProps {
  /** Fecha seleccionada */
  value?: Date | null;
  /** Callback al cambiar fecha */
  onChange?: (date: Date) => void;
  /** Fecha mínima */
  minDate?: Date;
  /** Fecha máxima */
  maxDate?: Date;
  /** Placeholder */
  placeholder?: string;
  /** Label */
  label?: string;
  /** Mostrar selector de tiempo */
  showTime?: boolean;
  /** Formato de fecha */
  format?: string;
  /** Disabled */
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Seleccionar fecha',
  label,
  showTime = false,
  format = 'DD/MM/YYYY',
  disabled = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [selectedTime, setSelectedTime] = useState({
    hours: value?.getHours() || 0,
    minutes: value?.getMinutes() || 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, selectedTime.hours, selectedTime.minutes);
    onChange?.(newDate);
    if (!showTime) setIsOpen(false);
  };

  const handleTimeChange = (type: 'hours' | 'minutes', val: number) => {
    const newTime = { ...selectedTime, [type]: val };
    setSelectedTime(newTime);
    if (value) {
      const newDate = new Date(value);
      newDate.setHours(newTime.hours);
      newDate.setMinutes(newTime.minutes);
      onChange?.(newDate);
    }
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    return (
      value.getDate() === day &&
      value.getMonth() === currentMonth.getMonth() &&
      value.getFullYear() === currentMonth.getFullYear()
    );
  };

  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return '';
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return showTime
      ? `${d}/${m}/${y} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      : `${d}/${m}/${y}`;
  };

  return (
    <div ref={containerRef} className="relative">
      {label && <label className="label mb-1.5 block">{label}</label>}
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 rounded-xl border bg-white text-left
          flex items-center gap-3
          transition-colors duration-200
          ${disabled ? 'bg-surface-50 text-surface-400 cursor-not-allowed' : 'text-surface-900 border-surface-200 hover:border-surface-300'}
        `}
      >
        <Calendar className="w-5 h-5 text-surface-400" />
        <span className={value ? 'text-surface-900' : 'text-surface-400'}>
          {value ? formatDate(value) : placeholder}
        </span>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 p-4 bg-white rounded-2xl border border-surface-200 shadow-surface-xl w-80 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-1 hover:bg-surface-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-surface-600" />
            </button>
            <span className="font-semibold text-surface-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-1 hover:bg-surface-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-surface-600" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-surface-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const disabled = isDateDisabled(day);
              const selected = isSelected(day);

              return (
                <button
                  key={day}
                  onClick={() => !disabled && handleDateSelect(day)}
                  disabled={disabled}
                  className={`
                    p-2 text-sm rounded-lg transition-colors
                    ${disabled ? 'text-surface-300 cursor-not-allowed' : 'hover:bg-surface-100'}
                    ${selected ? 'bg-primary-500 text-white hover:bg-primary-600' : 'text-surface-700'}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time picker */}
          {showTime && (
            <div className="mt-4 pt-4 border-t border-surface-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-surface-500" />
                <span className="text-sm font-medium text-surface-700">Hora</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <select
                  value={selectedTime.hours}
                  onChange={(e) => handleTimeChange('hours', parseInt(e.target.value))}
                  className="input py-1.5 text-sm"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                  ))}
                </select>
                <span className="text-surface-500">:</span>
                <select
                  value={selectedTime.minutes}
                  onChange={(e) => handleTimeChange('minutes', parseInt(e.target.value))}
                  className="input py-1.5 text-sm"
                >
                  {Array.from({ length: 60 }).map((_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * DateRangePicker - Selector de rango de fechas
 */
interface DateRangePickerProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onChange?: (start: Date | null, end: Date | null) => void;
  label?: string;
  placeholder?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  label,
  placeholder = 'Seleccionar rango',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const [tempStart, setTempStart] = useState<Date | null>(startDate);
  const [tempEnd, setTempEnd] = useState<Date | null>(endDate);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatRange = (): string => {
    if (!tempStart && !tempEnd) return '';
    if (tempStart && !tempEnd) return `${tempStart.toLocaleDateString()} - ...`;
    if (tempStart && tempEnd) {
      return `${tempStart.toLocaleDateString()} - ${tempEnd.toLocaleDateString()}`;
    }
    return '';
  };

  const handleConfirm = () => {
    onChange?.(tempStart, tempEnd);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && <label className="label mb-1.5 block">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 rounded-xl border bg-white text-left flex items-center gap-3 text-surface-900 border-surface-200 hover:border-surface-300"
      >
        <Calendar className="w-5 h-5 text-surface-400" />
        <span className={tempStart ? 'text-surface-900' : 'text-surface-400'}>
          {formatRange() || placeholder}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-white rounded-2xl border border-surface-200 shadow-surface-xl w-80">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setSelecting('start')}
              className={`px-3 py-1.5 text-sm rounded-lg ${selecting === 'start' ? 'bg-primary-100 text-primary-700' : 'text-surface-600'}`}
            >
              Inicio
            </button>
            <button
              onClick={() => setSelecting('end')}
              className={`px-3 py-1.5 text-sm rounded-lg ${selecting === 'end' ? 'bg-primary-100 text-primary-700' : 'text-surface-600'}`}
            >
              Fin
            </button>
          </div>
          
          <div className="flex justify-end gap-2 pt-3 border-t border-surface-100">
            <button onClick={() => setIsOpen(false)} className="btn-secondary px-3 py-1.5 text-sm">
              Cancelar
            </button>
            <button onClick={handleConfirm} className="btn-primary px-3 py-1.5 text-sm">
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
