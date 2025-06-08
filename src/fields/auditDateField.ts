import type { DateField } from 'payload'

type DateFieldOverrides = Partial<DateField>

type Args = {
  name: string
  overrides?: DateFieldOverrides
}

export function auditDateField(args: Args): DateField {
  const { name, overrides = {} } = args
  return {
    type: 'date',
    admin: {
      date: {
        displayFormat: 'PPPppp',
        ...(overrides.admin?.date || {}),
      },
      readOnly: true,
      ...(overrides.admin || {}),
    },
    ...overrides,
    name,
  }
}
