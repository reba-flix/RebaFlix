'use client'

const OPT_OUT_COOKIE = 'reba_analytics_optout'
const LEGACY_CHOICE_COOKIE = 'reba_analytics_consent'

function cookieValue(name: string) {
  return document.cookie.split('; ').find(value => value.startsWith(`${name}=`))?.slice(name.length + 1)
}

export function analyticsAllowed() {
  if (typeof window === 'undefined' || process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'true') return false
  const privacy = navigator as Navigator & { globalPrivacyControl?: boolean }
  return !privacy.globalPrivacyControl
    && navigator.doNotTrack !== '1'
    && cookieValue(OPT_OUT_COOKIE) !== '1'
    && cookieValue(LEGACY_CHOICE_COOKIE) !== 'no'
}

export function analyticsOptedOut() {
  if (typeof window === 'undefined') return false
  const privacy = navigator as Navigator & { globalPrivacyControl?: boolean }
  return privacy.globalPrivacyControl === true
    || navigator.doNotTrack === '1'
    || cookieValue(OPT_OUT_COOKIE) === '1'
    || cookieValue(LEGACY_CHOICE_COOKIE) === 'no'
}

export function setAnalyticsOptOut(optOut: boolean) {
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${OPT_OUT_COOKIE}=${optOut ? '1' : ''}; Path=/; SameSite=Lax; Max-Age=${optOut ? 60 * 60 * 24 * 180 : 0}${secure}`
  // Respect previous affirmative consent, but preserve a previous refusal as an objection.
  if (!optOut && cookieValue(LEGACY_CHOICE_COOKIE) === 'no') {
    document.cookie = `${LEGACY_CHOICE_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0${secure}`
  }
  window.dispatchEvent(new Event('reba-analytics-consent'))
}
