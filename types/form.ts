/**
 * Shared form state type for Server Actions.
 * Used by all form components that interact with server actions.
 */
export type FormState = {
  message?: string
  errors?: Record<string, string[]>
}
