import { z } from 'zod'

export const applicationStatusValues = [
  'BROUILLON',
  'EN_ATTENTE',
  'ENTRETIEN',
  'OFFRE',
  'REFUSE',
] as const

export type ApplicationStatus = (typeof applicationStatusValues)[number]

const statusSchema = z.enum(applicationStatusValues)

export const createApplicationSchema = z.object({
  company: z.string().trim().min(1, 'company is required'),
  roleTitle: z.string().trim().min(1, 'roleTitle is required'),
  status: statusSchema,
  appliedAt: z.string().datetime().optional(),

  notes: z.string().trim().optional(),
  offerUrl: z.string().trim().optional(),
  source: z.string().trim().optional(),
  contactName: z.string().trim().optional(),
  contactEmail: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  salaryText: z.string().trim().optional(),
  jobPostingId: z.string().trim().min(1).optional(),
})

export const updateApplicationSchema = z
  .object({
    company: z.string().trim().min(1).optional(),
    roleTitle: z.string().trim().min(1).optional(),
    status: statusSchema.optional(),
    appliedAt: z.string().datetime().optional(),

    notes: z.string().trim().optional(),
    offerUrl: z.string().trim().optional(),
    source: z.string().trim().optional(),
    contactName: z.string().trim().optional(),
    contactEmail: z.string().trim().optional(),
    contactPhone: z.string().trim().optional(),
    salaryText: z.string().trim().optional(),
    jobPostingId: z.string().trim().min(1).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'at least one field must be provided',
  })

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>
