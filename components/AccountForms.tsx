'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { api } from '@/lib/api'
import { toPath } from '@/lib/links'
import type { AccountData } from '@/lib/types'
import { CheckoutField } from './CheckoutField'
import { useNotice } from './Notice'

/** Posts one of the site's account forms; a refusal comes back as a message per field. */
function useAccountForm() {
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState<string | null>(null)

  const send = async (action: string, body: Record<string, unknown>) => {
    setBusy(true); setErrors({}); setFailure(null)
    const result = await api<{ message?: string; redirect?: string }>(`/api/account/${action}`, body)
    setBusy(false)
    if (!result.ok) { setErrors(result.errors); setFailure(result.message ?? 'Something went wrong.') }
    return result
  }

  return { busy, errors, failure, send }
}

/** A visitor: sign in (or ask for a password link), or sign up when the shop takes sign-ups. */
export function SignInForms({ data, accountPath }: { data: AccountData; accountPath: string }) {
  const router = useRouter()
  const notify = useNotice()
  const signIn = useAccountForm()
  const signUp = useAccountForm()
  const [login, setLogin] = useState({ email: '', password: '', remember: true })
  const [forgot, setForgot] = useState(false)
  const [account, setAccount] = useState({ name: '', email: '', password: '', password_confirmation: '' })

  const submitSignIn = async (event: FormEvent) => {
    event.preventDefault()
    if (forgot) {
      const result = await signIn.send('lost-password', { email: login.email, page: accountPath })
      if (result.ok) { setForgot(false); notify(result.message ?? 'If that address has an account, a link to choose a new password is on its way.') }
      return
    }
    const result = await signIn.send('login', login)
    if (result.ok) { notify('Welcome back.'); router.refresh() }
  }

  const submitSignUp = async (event: FormEvent) => {
    event.preventDefault()
    const result = await signUp.send('register', account)
    if (result.ok) { notify(result.message ?? 'Your account has been created.'); router.refresh() }
  }

  return (
    <div className="gate">
      <div className="gate-words">
        <p className="eyebrow">My account</p>
        <h1>Welcome, traveller.</h1>
        <p className="lede">Sign in to follow your orders and keep your addresses for next time.</p>
      </div>
      <div className="gate-forms">
        <form className="card account-form" noValidate onSubmit={submitSignIn}>
          <h2>{forgot ? 'Lost your password?' : 'Sign in'}</h2>
          {signIn.failure && <p className="failure" role="alert">{signIn.failure}</p>}
          <label className={`field${signIn.errors.email || signIn.errors.login ? ' invalid' : ''}`}>
            <span className="label">Email address</span>
            <input type="email" autoComplete="username" value={login.email} onChange={e => setLogin(l => ({ ...l, email: e.target.value }))} required />
          </label>
          {!forgot && (
            <label className={`field${signIn.errors.password ? ' invalid' : ''}`}>
              <span className="label">Password</span>
              <input type="password" autoComplete="current-password" value={login.password} onChange={e => setLogin(l => ({ ...l, password: e.target.value }))} required />
            </label>
          )}
          {!forgot
            ? <label className="check"><input type="checkbox" checked={login.remember} onChange={e => setLogin(l => ({ ...l, remember: e.target.checked }))} /><span>Remember me</span></label>
            : <p className="muted">We will send a link to choose a new one.</p>}
          <div className="form-actions">
            <button type="submit" className="button" disabled={signIn.busy}>{forgot ? 'Send the link' : 'Sign in'}</button>
            <button type="button" className="link-button" onClick={() => setForgot(f => !f)}>{forgot ? '← Back to sign in' : 'Lost your password?'}</button>
          </div>
        </form>

        {data.urls.register && (
          <form className="card account-form" noValidate onSubmit={submitSignUp}>
            <h2>New here?</h2>
            {signUp.failure && <p className="failure" role="alert">{signUp.failure}</p>}
            <label className={`field${signUp.errors.name ? ' invalid' : ''}`}><span className="label">Your name</span><input type="text" autoComplete="name" value={account.name} onChange={e => setAccount(a => ({ ...a, name: e.target.value }))} />{signUp.errors.name && <small className="error">{signUp.errors.name}</small>}</label>
            <label className={`field${signUp.errors.email ? ' invalid' : ''}`}><span className="label">Email address</span><input type="email" autoComplete="email" value={account.email} onChange={e => setAccount(a => ({ ...a, email: e.target.value }))} />{signUp.errors.email && <small className="error">{signUp.errors.email}</small>}</label>
            <label className={`field${signUp.errors.password ? ' invalid' : ''}`}><span className="label">Password</span><input type="password" autoComplete="new-password" value={account.password} onChange={e => setAccount(a => ({ ...a, password: e.target.value }))} />{signUp.errors.password && <small className="error">{signUp.errors.password}</small>}</label>
            <label className="field"><span className="label">Repeat the password</span><input type="password" autoComplete="new-password" value={account.password_confirmation} onChange={e => setAccount(a => ({ ...a, password_confirmation: e.target.value }))} /></label>
            <div className="form-actions"><button type="submit" className="button ghost" disabled={signUp.busy}>Create an account</button></div>
          </form>
        )}
      </div>
    </div>
  )
}

export function SignOutButton() {
  const router = useRouter()
  const notify = useNotice()
  const [busy, setBusy] = useState(false)

  return (
    <button type="button" className="nav-item out" disabled={busy} onClick={async () => {
      setBusy(true)
      await api('/api/account/logout', {})
      notify('You are signed out.')
      router.push('/')
      router.refresh()
    }}>Sign out</button>
  )
}

export function AddressForm({ data }: { data: AccountData }) {
  const router = useRouter()
  const notify = useNotice()
  const type = data.type ?? 'billing'
  const [form, setForm] = useState<Record<string, string>>({ ...(data.values ?? {}) })
  const { busy, errors, failure, send } = useAccountForm()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const result = await send('address', { ...form, type })
    if (result.ok) { notify(result.message ?? 'Address changed successfully.'); router.push(toPath(data.urls.address ?? '/my-account/')) }
  }

  return (
    <form noValidate onSubmit={submit}>
      <h2>{data.title}</h2>
      {failure && Object.keys(errors).length === 0 && <p className="failure" role="alert">{failure}</p>}
      <div className="fields">
        {Object.entries(data.fields ?? {}).map(([name, field]) => (
          <CheckoutField key={name} name={name} field={field} value={form[name] ?? ''} onChange={value => setForm(f => ({ ...f, [name]: value }))}
            country={form[`${type}_country`] ?? ''} countries={data.countries} states={data.states} statesOptional={data.statesOptional} labels={data.addressLabels} error={errors[name]} />
        ))}
      </div>
      <div className="form-actions"><button type="submit" className="button" disabled={busy}>Save address</button></div>
    </form>
  )
}

export function DetailsForm({ data }: { data: AccountData }) {
  const router = useRouter()
  const notify = useNotice()
  const values = data.values ?? {}
  const [form, setForm] = useState({ first_name: values.first_name ?? '', last_name: values.last_name ?? '', display_name: values.display_name ?? '', email: values.email ?? '', password_current: '', password: '', password_confirmation: '' })
  const { busy, errors, failure, send } = useAccountForm()
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => setForm(f => ({ ...f, [key]: event.target.value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const result = await send('details', form)
    if (result.ok) { setForm(f => ({ ...f, password_current: '', password: '', password_confirmation: '' })); notify(result.message ?? 'Account details changed successfully.'); router.refresh() }
  }

  const field = (key: keyof typeof form, label: string, type = 'text', autoComplete?: string, wide = false, hint?: string) => (
    <label className={`field${wide ? ' wide' : ''}${errors[key] ? ' invalid' : ''}`}>
      <span className="label">{label}</span>
      <input type={type} autoComplete={autoComplete} value={form[key]} onChange={set(key)} />
      {hint && <small className="muted">{hint}</small>}
      {errors[key] && <small className="error">{errors[key]}</small>}
    </label>
  )

  return (
    <form noValidate onSubmit={submit}>
      <h2>Account details</h2>
      {failure && Object.keys(errors).length === 0 && <p className="failure" role="alert">{failure}</p>}
      <div className="fields">
        {field('first_name', 'First name', 'text', 'given-name')}
        {field('last_name', 'Last name', 'text', 'family-name')}
        {field('display_name', 'Display name', 'text', 'nickname', true, 'This is how your name appears in reviews.')}
        {field('email', 'Email address', 'email', 'email', true)}
      </div>
      <h3>Change the password</h3>
      <div className="fields">
        {field('password_current', 'Current password (leave blank to keep it)', 'password', 'current-password', true)}
        {field('password', 'New password', 'password', 'new-password')}
        {field('password_confirmation', 'Repeat the new password', 'password', 'new-password')}
      </div>
      <div className="form-actions"><button type="submit" className="button" disabled={busy}>Save changes</button></div>
    </form>
  )
}
