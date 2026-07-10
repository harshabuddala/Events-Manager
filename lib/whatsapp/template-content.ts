/**
 * Canonical, locked-down content for the two WhatsApp templates.
 *
 * These are the only strings the WhatsApp integration ever sends through
 * `sendIdCardMessage` / `sendReportMessage`. The admin cannot edit them from
 * the UI — they are baked into code so all deployments stay consistent and
 * align 1:1 with what's approved in Meta Business Manager / Twilio Content.
 *
 * To change the wording, edit this file, update the approved template in
 * Meta, and re-deploy.
 *
 * Both templates use a button-based UX:
 *   - Body has a short greeting + 1-2 variables.
 *   - A single URL button points at a public route on the app
 *     (`{APP_URL}/r/{qrToken}`), which already exists in the codebase
 *     (it redirects to /scan/{qrToken} — the registration / ID card / report view).
 *   - Variable {{1}} is the body variable (e.g. parentName).
 *   - Variable {{2}} is the qrToken used to build the button URL.
 *
 * In Meta Business Manager, when creating the template, set:
 *   - Header: None
 *   - Body: <copy below>
 *   - Buttons → Add button → Call-to-action → Type: URL
 *       Text: "Get ID Card" (registration) or "View Report" (report)
 *       URL:  https://YOUR_APP_URL/r/{{2}}   ← the `{{2}}` here is the qrToken
 *   - Footer: (optional)
 */
export const REGISTRATION_TEMPLATE_BODY = `Hi {{1}} 👋

Thank you for registering for Edunura Events.`

export const REGISTRATION_TEMPLATE_FOOTER = ''

export const REGISTRATION_TEMPLATE_BUTTON_TEXT = 'Get ID Card'

export const REGISTRATION_TEMPLATE_BUTTON_URL_PATTERN = '{APP_URL}/r/{qrToken}'

export const REPORT_TEMPLATE_BODY = `Hi {{1}} 👋

Your child's assessment report for Edunura Events is ready.`

export const REPORT_TEMPLATE_FOOTER = ''

export const REPORT_TEMPLATE_BUTTON_TEXT = 'View Report'

export const REPORT_TEMPLATE_BUTTON_URL_PATTERN = '{APP_URL}/r/{qrToken}'

/** Variable order — must match the {{1}}…{{N}} placeholders in the body above. */
export const REGISTRATION_TEMPLATE_FIELDS = ['parentName', 'qrToken'] as const

export const REPORT_TEMPLATE_FIELDS = ['parentName', 'qrToken'] as const
