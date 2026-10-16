/** Seller alert copy. Short, plain, one action. English is the fallback for any missing language. */
export type AlertKind = "order_new" | "booking_new" | "payout_update" | "merchant_status"
type Lang = "en" | "ru" | "fr" | "es" | "zh" | "pt"
export const ALERT_LANGS: Lang[] = ["en", "ru", "fr", "es", "zh", "pt"]

const T: Record<Lang, Record<string, string>> = {
  en: { order_new: "New order {id}", order_new_body: "{amount} · {title}. Accept it to start.", booking_new: "New booking request {id}", booking_new_body: "{title}{when}. Accept or decline.", payout_approved: "Payout approved", payout_approved_body: "Your payout of {amount} was approved and will be sent soon.", payout_paid: "Payout sent", payout_paid_body: "{net} was sent to your account. Reference: {ref}.", payout_rejected: "Payout rejected", payout_rejected_body: "Your payout of {amount} was rejected: {reason}. The money is back in your balance.", ms_live: "You are approved", ms_live_body: "{name} is live on Ciuna. You can publish listings now.", ms_rejected: "Your application needs changes", ms_rejected_body: "{reason}", ms_suspended: "Your business is suspended", ms_suspended_body: "{reason}", open: "Open in Ciuna Seller", footer: "You get this because you work on {name}. Change alerts in Settings." },
  ru: { order_new: "Новый заказ {id}", order_new_body: "{amount} · {title}. Примите его, чтобы начать.", booking_new: "Новая заявка на бронирование {id}", booking_new_body: "{title}{when}. Примите или отклоните.", payout_approved: "Выплата одобрена", payout_approved_body: "Выплата на {amount} одобрена и скоро будет отправлена.", payout_paid: "Выплата отправлена", payout_paid_body: "{net} отправлено на ваш счёт. Референс: {ref}.", payout_rejected: "Выплата отклонена", payout_rejected_body: "Выплата на {amount} отклонена: {reason}. Деньги вернулись на ваш баланс.", ms_live: "Ваш бизнес одобрен", ms_live_body: "{name} опубликован в Ciuna. Теперь можно публиковать позиции.", ms_rejected: "Заявку нужно доработать", ms_rejected_body: "{reason}", ms_suspended: "Ваш бизнес заблокирован", ms_suspended_body: "{reason}", open: "Открыть Ciuna Seller", footer: "Вы получаете это, потому что работаете с {name}. Уведомления настраиваются в разделе «Настройки»." },
  fr: { order_new: "Nouvelle commande {id}", order_new_body: "{amount} · {title}. Acceptez-la pour commencer.", booking_new: "Nouvelle demande de réservation {id}", booking_new_body: "{title}{when}. Acceptez ou refusez.", payout_approved: "Versement approuvé", payout_approved_body: "Votre versement de {amount} est approuvé et sera envoyé bientôt.", payout_paid: "Versement envoyé", payout_paid_body: "{net} a été envoyé sur votre compte. Référence : {ref}.", payout_rejected: "Versement refusé", payout_rejected_body: "Votre versement de {amount} a été refusé : {reason}. L'argent est revenu sur votre solde.", ms_live: "Votre entreprise est approuvée", ms_live_body: "{name} est en ligne sur Ciuna. Vous pouvez publier vos offres.", ms_rejected: "Votre dossier doit être modifié", ms_rejected_body: "{reason}", ms_suspended: "Votre entreprise est suspendue", ms_suspended_body: "{reason}", open: "Ouvrir Ciuna Seller", footer: "Vous recevez ceci car vous travaillez sur {name}. Réglez les alertes dans Paramètres." },
  es: { order_new: "Nuevo pedido {id}", order_new_body: "{amount} · {title}. Acéptalo para empezar.", booking_new: "Nueva solicitud de reserva {id}", booking_new_body: "{title}{when}. Acepta o rechaza.", payout_approved: "Pago aprobado", payout_approved_body: "Tu pago de {amount} fue aprobado y se enviará pronto.", payout_paid: "Pago enviado", payout_paid_body: "Se enviaron {net} a tu cuenta. Referencia: {ref}.", payout_rejected: "Pago rechazado", payout_rejected_body: "Tu pago de {amount} fue rechazado: {reason}. El dinero volvió a tu saldo.", ms_live: "Tu negocio está aprobado", ms_live_body: "{name} ya está en Ciuna. Ya puedes publicar tus ofertas.", ms_rejected: "Tu solicitud necesita cambios", ms_rejected_body: "{reason}", ms_suspended: "Tu negocio está suspendido", ms_suspended_body: "{reason}", open: "Abrir Ciuna Seller", footer: "Recibes esto porque trabajas en {name}. Cambia las alertas en Ajustes." },
  zh: { order_new: "新订单 {id}", order_new_body: "{amount} · {title}。请接单开始处理。", booking_new: "新的预约请求 {id}", booking_new_body: "{title}{when}。请接受或拒绝。", payout_approved: "提现已批准", payout_approved_body: "您的 {amount} 提现已批准，即将发出。", payout_paid: "提现已发出", payout_paid_body: "{net} 已发送到您的账户。参考号：{ref}。", payout_rejected: "提现被拒绝", payout_rejected_body: "您的 {amount} 提现被拒绝：{reason}。款项已退回您的余额。", ms_live: "您的企业已通过审核", ms_live_body: "{name} 已在 Ciuna 上线，现在可以发布商品或服务。", ms_rejected: "您的申请需要修改", ms_rejected_body: "{reason}", ms_suspended: "您的企业已被停用", ms_suspended_body: "{reason}", open: "打开 Ciuna Seller", footer: "您收到此通知是因为您在管理 {name}。可在设置中调整提醒。" },
  pt: { order_new: "Novo pedido {id}", order_new_body: "{amount} · {title}. Aceite para começar.", booking_new: "Nova solicitação de reserva {id}", booking_new_body: "{title}{when}. Aceite ou recuse.", payout_approved: "Repasse aprovado", payout_approved_body: "Seu repasse de {amount} foi aprovado e será enviado em breve.", payout_paid: "Repasse enviado", payout_paid_body: "{net} foi enviado para sua conta. Referência: {ref}.", payout_rejected: "Repasse recusado", payout_rejected_body: "Seu repasse de {amount} foi recusado: {reason}. O dinheiro voltou para o seu saldo.", ms_live: "Seu negócio foi aprovado", ms_live_body: "{name} está no ar na Ciuna. Você já pode publicar suas ofertas.", ms_rejected: "Sua solicitação precisa de ajustes", ms_rejected_body: "{reason}", ms_suspended: "Seu negócio foi suspenso", ms_suspended_body: "{reason}", open: "Abrir Ciuna Seller", footer: "Você recebe isto porque trabalha em {name}. Altere os alertas em Configurações." },
}

const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "")
const pick = (lang: string): Lang => (ALERT_LANGS.includes(lang as Lang) ? (lang as Lang) : "en")

import { formatMoneyDisplay } from "@ciuna/shared"

export function renderAlert(kind: AlertKind, payload: Record<string, any>, opts: { lang: string; merchantName: string; portalUrl: string }) {
  const l = pick(opts.lang)
  const t = (k: string) => T[l][k] ?? T.en[k] ?? k
  let title = "", body = "", path = "/"
  const money = (v: unknown, c: unknown) => formatMoneyDisplay(v as any, c as any, { breakdown: true })
  if (kind === "order_new") {
    title = fill(t("order_new"), { id: payload.publicId })
    body = fill(t("order_new_body"), { amount: money(payload.amount, payload.currency), title: payload.title || "" })
    path = `/orders/${payload.orderId}`
  } else if (kind === "booking_new") {
    const when = payload.slotStart ? ` · ${new Date(payload.slotStart).toISOString().replace("T", " ").slice(0, 16)} UTC` : ""
    title = fill(t("booking_new"), { id: payload.publicId })
    body = fill(t("booking_new_body"), { title: payload.title || "", when })
    path = `/bookings/${payload.orderId}`
  } else if (kind === "payout_update") {
    const s = payload.status as "approved" | "paid" | "rejected"
    title = t(`payout_${s}`)
    body = fill(t(`payout_${s}_body`), { amount: money(payload.amount, payload.currency), net: money(payload.net, payload.currency), ref: payload.reference || "", reason: payload.reason || "" })
    path = "/earnings/payouts"
  } else {
    const s = payload.status as "live" | "rejected" | "suspended"
    title = t(`ms_${s}`)
    body = fill(t(`ms_${s}_body`), { name: payload.name || opts.merchantName, reason: payload.reason || "" })
    path = s === "live" ? "/" : "/setup"
  }
  const url = `${opts.portalUrl.replace(/\/+$/, "")}${path}`
  const footer = fill(t("footer"), { name: opts.merchantName })
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111827"><h1 style="font-size:20px;margin:0 0 8px">${esc(title)}</h1><p style="font-size:16px;line-height:1.5;color:#52596B;margin:0 0 20px">${esc(body)}</p><a href="${esc(url)}" style="display:inline-block;background:#F97316;color:#111827;font-weight:600;padding:12px 20px;border-radius:12px;text-decoration:none">${esc(t("open"))}</a><p style="font-size:13px;color:#52596B;margin:24px 0 0">${esc(footer)}</p></div>`
  return { title, body, url, openLabel: t("open"), footer, html, text: `${title}\n${body}\n${url}\n\n${footer}` }
}
