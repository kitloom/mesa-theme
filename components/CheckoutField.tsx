'use client'

import type { CheckoutField as Field } from '@/lib/types'

/**
 * One field of a checkout or address form as the shop configured it: a text, a country from those
 * the shop sells or ships to, a state from the country's list or typed where it has none, with the
 * country's own words for state and postcode.
 */
export function CheckoutField({ name, field, value, onChange, country, countries, states, statesOptional, labels, error }: {
  name: string
  field: Field
  value: string
  onChange: (value: string) => void
  country: string
  countries?: Record<string, string>
  states?: Record<string, Record<string, string>>
  statesOptional?: string[]
  labels?: Record<string, { state: string; postcode: string }>
  error?: string
}) {
  const own = labels?.[country]
  const label = field.type === 'state' && own ? own.state : name.endsWith('_postcode') && own ? own.postcode : field.label
  const stateOptions = field.type === 'state' ? states?.[country] ?? null : null
  const required = field.type === 'state' ? !!stateOptions && !statesOptional?.includes(country) : field.required
  const type = field.type === 'email' || field.type === 'tel' ? field.type : 'text'

  return (
    <label className={`field${field.wide ? ' wide' : ''}${error ? ' invalid' : ''}`}>
      <span className="label">{label}{required && <sup>*</sup>}</span>
      {field.type === 'country' ? (
        <select name={name} value={value} autoComplete={field.autocomplete} onChange={e => onChange(e.target.value)}>
          <option value="">Select a country…</option>
          {Object.entries(countries ?? {}).map(([code, title]) => <option key={code} value={code}>{title}</option>)}
        </select>
      ) : stateOptions ? (
        <select name={name} value={value} autoComplete={field.autocomplete} onChange={e => onChange(e.target.value)}>
          <option value="">Select an option…</option>
          {Object.entries(stateOptions).map(([code, title]) => <option key={code} value={code}>{title}</option>)}
        </select>
      ) : (
        <input type={type} name={name} value={value} autoComplete={field.autocomplete} onChange={e => onChange(e.target.value)} />
      )}
      {error && <small className="error">{error}</small>}
    </label>
  )
}
