'use client'

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { Protection } from '@/lib/types'

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}

type Win = Window & { turnstile?: TurnstileApi; __turnstileLoading?: Promise<TurnstileApi> }

function loadTurnstile(): Promise<TurnstileApi> {
  const w = window as Win
  if (w.turnstile) return Promise.resolve(w.turnstile)
  w.__turnstileLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => resolve(w.turnstile!)
    script.onerror = () => reject(new Error('Turnstile did not load.'))
    document.head.appendChild(script)
  })
  return w.__turnstileLoading
}

export interface TurnstileHandle { reset: () => void }

/**
 * Cloudflare Turnstile, drawn where the site's form asks for it. The theme's hostname has to be
 * among the widget's hostnames in Cloudflare; the always-pass test key works anywhere.
 */
export const Turnstile = forwardRef<TurnstileHandle, { siteKey: string; onToken: (token: string) => void }>(function Turnstile({ siteKey, onToken }, ref) {
  const box = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)
  const callback = useRef(onToken)
  callback.current = onToken

  useEffect(() => {
    let gone = false
    loadTurnstile().then(api => {
      if (gone || !box.current) return
      widget.current = api.render(box.current, {
        'sitekey': siteKey,
        'theme': 'auto',
        'callback': (token: string) => callback.current(token),
        'expired-callback': () => callback.current(''),
        'error-callback': () => callback.current(''),
      })
    })
    return () => {
      gone = true
      const api = (window as Win).turnstile
      if (widget.current && api) api.remove(widget.current)
    }
  }, [siteKey])

  useImperativeHandle(ref, () => ({
    reset: () => {
      callback.current('')
      const api = (window as Win).turnstile
      if (widget.current && api) api.reset(widget.current)
    },
  }))

  return <div ref={box} className="turnstile" />
})

/**
 * The spam protection a form came with: the hidden fields to send along and the Turnstile token,
 * once the widget gave one. Without a protection module the page sends none.
 */
export function useProtection(protection: Protection | null | undefined) {
  const [token, setToken] = useState('')
  const fields = useMemo(() => () => ({
    ...(protection?.honeypot ? { [protection.honeypot.nameFieldName]: '', [protection.honeypot.validFromFieldName]: protection.honeypot.encryptedValidFrom } : {}),
    ...(protection?.turnstile ? { 'cf-turnstile-response': token } : {}),
  }), [protection, token])
  const ready = !protection?.turnstile || token !== ''
  return { token, setToken, fields, ready }
}
