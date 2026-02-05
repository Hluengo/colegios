import { z } from 'zod';

const uuid = z.string().uuid();
const optionalText = z.string().optional();
const optionalNullableText = z.string().nullable().optional();

export const caseInsertSchema = z.object({
  student_id: uuid.nullable().optional(),
  incident_date: optionalText,
  incident_time: optionalText,
  status: optionalText,
  conduct_type: optionalText,
  conduct_category: optionalText,
  short_description: optionalText,
  course_incident: optionalText,
  responsible: optionalText,
  responsible_role: optionalText,
});

export const caseUpdateSchema = caseInsertSchema.extend({
  closed_at: optionalNullableText,
  due_process_closed_at: optionalNullableText,
  final_resolution_text: optionalNullableText,
  final_disciplinary_measure: optionalNullableText,
  closed_by_name: optionalNullableText,
  closed_by_role: optionalNullableText,
  final_pdf_storage_path: optionalNullableText,
});

export const followupInsertSchema = z.object({
  case_id: uuid,
  action_date: z.string(),
  action_type: z.string(),
  process_stage: z.string(),
  stage_status: z.string(),
  detail: optionalText,
  responsible: optionalText,
  observations: optionalText,
  description: optionalText,
});

export const followupUpdateSchema = followupInsertSchema.partial();

export function validateOrThrow(schema, payload, label) {
  const parsed = schema.safeParse(payload);
  if (parsed.success) return parsed.data;
  const issues = parsed.error.issues
    .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
    .join('; ');
  throw new Error(`${label} inválido: ${issues}`);
}
