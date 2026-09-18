// Email templates for all notification types

import {
  generateBaseEmailTemplate,
  generateHubOrderSummary,
  generateHubOrderSummaryPlain,
  generateTransactionDetails,
} from "./email-generator"
import type {
  EmailTemplate,
  HubTransactionEmailData,
  ReferralPayoutEmailData,
  TransactionEmailData,
  WelcomeEmailData,
} from "./email-types"
import { formatAmountPlain, formatExchangeRateForEmail } from "@/utils/currency"
import { tEmail } from "./i18n/server"

const APP_URL_DEFAULT = "https://app.ciuna.com"
const OFFICE_URL_DEFAULT = "https://bk.ciuna.com"

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || APP_URL_DEFAULT
}
function officeUrl() {
  return process.env.NEXT_PUBLIC_OFFICE_URL || OFFICE_URL_DEFAULT
}

/** Plain-text transaction detail lines (amounts, fee, logistics, rate, total). */
function formatTxEmailPlainMoneyLines(data: TransactionEmailData): string {
  const lng = data.locale
  const logisticsLine =
    (data.logisticsFee ?? 0) > 0
      ? `\n- ${tEmail("summary.logisticsFee", {}, lng)} ${formatAmountPlain(data.logisticsFee ?? 0)} ${data.sendCurrency}`
      : ""
  const totalLine =
    data.totalAmount != null
      ? `\n- ${tEmail("summary.totalPaid", {}, lng)} ${formatAmountPlain(data.totalAmount)} ${data.sendCurrency}`
      : ""
  return `- ${tEmail("summary.amount", {}, lng)} ${formatAmountPlain(data.sendAmount)} ${data.sendCurrency}
- ${tEmail("summary.receiving", {}, lng)} ${formatAmountPlain(data.receiveAmount)} ${data.receiveCurrency}
- ${tEmail("summary.rateUsed", {}, lng)} 1 ${data.sendCurrency} = ${formatExchangeRateForEmail(data.exchangeRate)} ${data.receiveCurrency}
- ${tEmail("summary.exchangeFee", {}, lng)} ${formatAmountPlain(data.fee)} ${data.sendCurrency}${logisticsLine}${totalLine}`
}

/** Pick completed subject based on hub fulfillment type. */
function hubCompletedSubject(data: HubTransactionEmailData): string {
  const key =
    data.fulfillmentType === "in_person"
      ? "hubOrder.completed.subjectInPerson"
      : "hubOrder.completed.subjectOnline"
  return tEmail(key, { productTitle: data.productTitle, transactionId: data.transactionId }, data.locale)
}

function hubHero(data: HubTransactionEmailData, statusKey: "pending" | "processing" | "completed"): string {
  const sub = data.pricingType === "fixed" ? "fixed" : "userInput"
  return tEmail(
    `hubOrder.${statusKey}.hero.${sub}`,
    {
      productTitle: data.productTitle,
      fundedAmount: formatAmountPlain(Number(data.fundedAmount) || 0),
      fundedCurrency: data.fundedCurrency,
    },
    data.locale,
  )
}

function hubFulfillment(data: HubTransactionEmailData, statusKey: "pending" | "processing" | "completed"): string {
  const sub = data.fulfillmentType === "in_person" ? "inPerson" : "online"
  return tEmail(
    `hubOrder.${statusKey}.fulfillment.${sub}`,
    {
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      deliveryAddressLine: data.deliveryAddressLine || "",
    },
    data.locale,
  )
}

export const emailTemplates: Record<string, EmailTemplate> = {
  // Welcome Email
  welcome: {
    subject: "Welcome to Ciuna! Let's get started",
    html: (data: WelcomeEmailData) => {
      const lng = data.locale
      const content = `
        <p class="welcome-text">
          ${tEmail("welcome.greeting", { firstName: data.firstName }, lng)}
        </p>

        <p class="confirmation-text">
          ${tEmail("welcome.intro", {}, lng)}
        </p>

        <p class="confirmation-text">
          ${tEmail("welcome.featuresLead", {}, lng)}
        </p>

        <ul style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 20px 0; padding-left: 20px;">
          <li><strong>${tEmail("welcome.featureSpeed", {}, lng)}</strong></li>
          <li>${tEmail("welcome.featureTracking", {}, lng)}</li>
          <li>${tEmail("welcome.featureRecipients", {}, lng)}</li>
          <li>${tEmail("welcome.featureRates", {}, lng)}</li>
        </ul>

        <div class="security-note">
          <h3>${tEmail("welcome.gettingStartedHeading", {}, lng)}</h3>
          <p>${tEmail("welcome.gettingStartedBody", {}, lng)}</p>
        </div>
      `

      return generateBaseEmailTemplate(
        tEmail("welcome.title", {}, lng),
        "",
        content,
        { text: tEmail("welcome.cta", {}, lng), url: data.dashboardUrl },
        lng,
      )
    },
    text: (data: WelcomeEmailData) => {
      const lng = data.locale
      return `
${tEmail("welcome.title", {}, lng)}

${tEmail("welcome.greeting", { firstName: data.firstName }, lng)}

${tEmail("welcome.intro", {}, lng)}

${tEmail("welcome.featuresLead", {}, lng)}
• ${tEmail("welcome.featureSpeed", {}, lng)}
• ${tEmail("welcome.featureTracking", {}, lng)}
• ${tEmail("welcome.featureRecipients", {}, lng)}
• ${tEmail("welcome.featureRates", {}, lng)}

${tEmail("welcome.gettingStartedHeading", {}, lng)}:
${tEmail("welcome.gettingStartedBody", {}, lng)}

${tEmail("welcome.cta", {}, lng)}: ${data.dashboardUrl}

${tEmail("common.needHelp", {}, lng)} ${tEmail("common.contactSupport", {}, lng).toLowerCase()}: support@ciuna.com

${tEmail("common.footerCopyright", { year: new Date().getFullYear() }, lng)}
    `
    },
  },

  // Transaction Pending
  transactionPending: {
    subject: (data: TransactionEmailData) =>
      tEmail("send.pending.subject", { transactionId: data.transactionId }, data.locale),
    html: (data: TransactionEmailData) => {
      const lng = data.locale
      const content = `
        <p class="confirmation-text">
          ${tEmail("send.pending.body", { recipientName: data.recipientName }, lng)}
        </p>

        ${generateTransactionDetails(data)}

        <div class="security-note">
          <h3>${tEmail("send.pending.nextHeading", {}, lng)}</h3>
          <p>${tEmail("send.pending.nextBody", {}, lng)}</p>
        </div>
      `

      return generateBaseEmailTemplate(
        tEmail("send.pending.title", {}, lng),
        "",
        content,
        {
          text: tEmail("send.pending.cta", {}, lng),
          url: `${appUrl()}/hub/orders/${data.transactionId.toLowerCase()}`,
        },
        lng,
      )
    },
    text: (data: TransactionEmailData) => {
      const lng = data.locale
      return `
${tEmail("send.pending.title", {}, lng)} - #${data.transactionId}

${tEmail("send.pending.body", { recipientName: data.recipientName }, lng)}

${tEmail("summary.heading", {}, lng)}:
- ${tEmail("summary.transactionId", {}, lng)} ${data.transactionId}
- ${tEmail("summary.recipient", {}, lng)} ${data.recipientName}
${formatTxEmailPlainMoneyLines(data)}
- ${tEmail("summary.status", {}, lng)} ${tEmail(`status.${data.status}`, {}, lng)}

${tEmail("send.pending.nextHeading", {}, lng)}:
${tEmail("send.pending.nextBody", {}, lng)}

${tEmail("send.pending.cta", {}, lng)}: ${appUrl()}/hub/orders/${data.transactionId.toLowerCase()}
    `
    },
  },

  // Transaction Processing
  transactionProcessing: {
    subject: (data: TransactionEmailData) =>
      tEmail("send.processing.subject", { transactionId: data.transactionId }, data.locale),
    html: (data: TransactionEmailData) => {
      const lng = data.locale
      const content = `
        <p class="confirmation-text">
          ${tEmail("send.processing.body", { recipientName: data.recipientName }, lng)}
        </p>

        ${generateTransactionDetails(data)}

        <div class="security-note">
          <h3>${tEmail("send.processing.nextHeading", {}, lng)}</h3>
          <p>${tEmail("send.processing.nextBody", {}, lng)}</p>
        </div>
      `

      return generateBaseEmailTemplate(
        tEmail("send.processing.title", {}, lng),
        "",
        content,
        {
          text: tEmail("send.processing.cta", {}, lng),
          url: `${appUrl()}/hub/orders/${data.transactionId.toLowerCase()}`,
        },
        lng,
      )
    },
    text: (data: TransactionEmailData) => {
      const lng = data.locale
      return `
${tEmail("send.processing.title", {}, lng)} - #${data.transactionId}

${tEmail("send.processing.body", { recipientName: data.recipientName }, lng)}

${tEmail("summary.heading", {}, lng)}:
- ${tEmail("summary.transactionId", {}, lng)} ${data.transactionId}
- ${tEmail("summary.recipient", {}, lng)} ${data.recipientName}
${formatTxEmailPlainMoneyLines(data)}
- ${tEmail("summary.status", {}, lng)} ${tEmail(`status.${data.status}`, {}, lng)}

${tEmail("send.processing.nextHeading", {}, lng)}:
${tEmail("send.processing.nextBody", {}, lng)}

${tEmail("send.processing.cta", {}, lng)}: ${appUrl()}/hub/orders/${data.transactionId.toLowerCase()}
    `
    },
  },

  // Transaction Completed
  transactionCompleted: {
    subject: (data: TransactionEmailData) =>
      tEmail("send.completed.subject", { transactionId: data.transactionId }, data.locale),
    html: (data: TransactionEmailData) => {
      const lng = data.locale
      const content = `
        <p class="confirmation-text">
          ${tEmail("send.completed.body", { recipientName: data.recipientName }, lng)}
        </p>

        ${generateTransactionDetails(data)}

        <div class="security-note">
          <h3>${tEmail("send.completed.nextHeading", {}, lng)}</h3>
          <p>${tEmail("send.completed.nextBody", {}, lng)}</p>
        </div>
      `

      return generateBaseEmailTemplate(
        tEmail("send.completed.title", {}, lng),
        "",
        content,
        {
          text: tEmail("send.completed.cta", {}, lng),
          url: `${appUrl()}/hub/orders/${data.transactionId.toLowerCase()}`,
        },
        lng,
      )
    },
    text: (data: TransactionEmailData) => {
      const lng = data.locale
      return `
${tEmail("send.completed.title", {}, lng)} - #${data.transactionId}

${tEmail("send.completed.body", { recipientName: data.recipientName }, lng)}

${tEmail("summary.heading", {}, lng)}:
- ${tEmail("summary.transactionId", {}, lng)} ${data.transactionId}
- ${tEmail("summary.recipient", {}, lng)} ${data.recipientName}
${formatTxEmailPlainMoneyLines(data)}
- ${tEmail("summary.status", {}, lng)} ${tEmail(`status.${data.status}`, {}, lng)}

${tEmail("send.completed.nextHeading", {}, lng)}:
${tEmail("send.completed.nextBody", {}, lng)}

${tEmail("send.completed.cta", {}, lng)}: ${appUrl()}/hub/orders/${data.transactionId.toLowerCase()}
    `
    },
  },

  // Transaction Failed
  transactionFailed: {
    subject: (data: TransactionEmailData) =>
      tEmail("send.failed.subject", { transactionId: data.transactionId }, data.locale),
    html: (data: TransactionEmailData) => {
      const lng = data.locale
      const body = data.failureReason
        ? tEmail("send.failed.bodyWithReason", { recipientName: data.recipientName, reason: data.failureReason }, lng)
        : tEmail("send.failed.bodyNoReason", { recipientName: data.recipientName }, lng)
      const content = `
        <p class="confirmation-text">
          ${body}
        </p>

        ${generateTransactionDetails(data)}

        <div class="security-note">
          <h3>${tEmail("send.failed.nextHeading", {}, lng)}</h3>
          <p>${tEmail("common.refundNote", {}, lng)}</p>
        </div>
      `

      return generateBaseEmailTemplate(
        tEmail("send.failed.title", {}, lng),
        "",
        content,
        { text: tEmail("send.failed.cta", {}, lng), url: `${appUrl()}/support` },
        lng,
      )
    },
    text: (data: TransactionEmailData) => {
      const lng = data.locale
      const body = data.failureReason
        ? tEmail("send.failed.bodyWithReason", { recipientName: data.recipientName, reason: data.failureReason }, lng)
        : tEmail("send.failed.bodyNoReason", { recipientName: data.recipientName }, lng)
      return `
${tEmail("send.failed.title", {}, lng)} - #${data.transactionId}

${body}

${tEmail("summary.heading", {}, lng)}:
- ${tEmail("summary.transactionId", {}, lng)} ${data.transactionId}
- ${tEmail("summary.recipient", {}, lng)} ${data.recipientName}
${formatTxEmailPlainMoneyLines(data)}
- ${tEmail("summary.status", {}, lng)} ${tEmail(`status.${data.status}`, {}, lng)}

${tEmail("send.failed.nextHeading", {}, lng)}:
${tEmail("common.refundNote", {}, lng)}

${tEmail("send.failed.cta", {}, lng)}: ${appUrl()}/support
    `
    },
  },

  // Transaction Cancelled
  transactionCancelled: {
    subject: (data: TransactionEmailData) =>
      tEmail("send.cancelled.subject", { transactionId: data.transactionId }, data.locale),
    html: (data: TransactionEmailData) => {
      const lng = data.locale
      const body = data.failureReason
        ? tEmail("send.cancelled.bodyWithReason", { recipientName: data.recipientName, reason: data.failureReason }, lng)
        : tEmail("send.cancelled.bodyNoReason", { recipientName: data.recipientName }, lng)
      const content = `
        <p class="confirmation-text">
          ${body}
        </p>

        ${generateTransactionDetails(data)}

        <div class="security-note">
          <h3>${tEmail("send.cancelled.refundHeading", {}, lng)}</h3>
          <p>${tEmail("common.refundNote", {}, lng)}</p>
        </div>
      `

      return generateBaseEmailTemplate(
        tEmail("send.cancelled.title", {}, lng),
        "",
        content,
        { text: tEmail("send.cancelled.cta", {}, lng), url: `${appUrl()}/send` },
        lng,
      )
    },
    text: (data: TransactionEmailData) => {
      const lng = data.locale
      const body = data.failureReason
        ? tEmail("send.cancelled.bodyWithReason", { recipientName: data.recipientName, reason: data.failureReason }, lng)
        : tEmail("send.cancelled.bodyNoReason", { recipientName: data.recipientName }, lng)
      return `
${tEmail("send.cancelled.title", {}, lng)} - #${data.transactionId}

${body}

${tEmail("summary.heading", {}, lng)}:
- ${tEmail("summary.transactionId", {}, lng)} ${data.transactionId}
- ${tEmail("summary.recipient", {}, lng)} ${data.recipientName}
${formatTxEmailPlainMoneyLines(data)}
- ${tEmail("summary.status", {}, lng)} ${tEmail(`status.${data.status}`, {}, lng)}

${tEmail("send.cancelled.refundHeading", {}, lng)}:
${tEmail("common.refundNote", {}, lng)}

${tEmail("send.cancelled.cta", {}, lng)}: ${appUrl()}/send
    `
    },
  },

  // Hub Order Pending
  hubOrderPending: {
    subject: (data: HubTransactionEmailData) =>
      tEmail(
        "hubOrder.pending.subject",
        { productTitle: data.productTitle, transactionId: data.transactionId },
        data.locale,
      ),
    html: (data: HubTransactionEmailData) => {
      const lng = data.locale
      const content = `
        <p class="confirmation-text">
          ${hubHero(data, "pending")}
        </p>
        <p class="confirmation-text">
          ${hubFulfillment(data, "pending")}
        </p>

        ${generateHubOrderSummary(data)}

        <div class="security-note">
          <h3>${tEmail("hubOrder.pending.nextHeading", {}, lng)}</h3>
          <p>${tEmail("hubOrder.pending.nextBody", {}, lng)}</p>
        </div>
      `
      return generateBaseEmailTemplate(
        tEmail("hubOrder.pending.title", {}, lng),
        "",
        content,
        {
          text: tEmail("hubOrder.pending.cta", {}, lng),
          url: `${appUrl()}/hub/orders/${data.transactionId.toLowerCase()}`,
        },
        lng,
      )
    },
    text: (data: HubTransactionEmailData) => {
      const lng = data.locale
      return `
${tEmail("hubOrder.pending.title", {}, lng)} - #${data.transactionId}

${hubHero(data, "pending")}

${hubFulfillment(data, "pending")}

${tEmail("summary.heading", {}, lng)}:
${generateHubOrderSummaryPlain(data)}

${tEmail("hubOrder.pending.nextHeading", {}, lng)}:
${tEmail("hubOrder.pending.nextBody", {}, lng)}

${tEmail("hubOrder.pending.cta", {}, lng)}: ${appUrl()}/hub/orders/${data.transactionId.toLowerCase()}
    `
    },
  },

  // Hub Order Processing
  hubOrderProcessing: {
    subject: (data: HubTransactionEmailData) =>
      tEmail(
        "hubOrder.processing.subject",
        { productTitle: data.productTitle, transactionId: data.transactionId },
        data.locale,
      ),
    html: (data: HubTransactionEmailData) => {
      const lng = data.locale
      const content = `
        <p class="confirmation-text">
          ${hubHero(data, "processing")}
        </p>
        <p class="confirmation-text">
          ${hubFulfillment(data, "processing")}
        </p>

        ${generateHubOrderSummary(data)}

        <div class="security-note">
          <h3>${tEmail("hubOrder.processing.nextHeading", {}, lng)}</h3>
          <p>${tEmail("hubOrder.processing.nextBody", {}, lng)}</p>
        </div>
      `
      return generateBaseEmailTemplate(
        tEmail("hubOrder.processing.title", {}, lng),
        "",
        content,
        {
          text: tEmail("hubOrder.processing.cta", {}, lng),
          url: `${appUrl()}/hub/orders/${data.transactionId.toLowerCase()}`,
        },
        lng,
      )
    },
    text: (data: HubTransactionEmailData) => {
      const lng = data.locale
      return `
${tEmail("hubOrder.processing.title", {}, lng)} - #${data.transactionId}

${hubHero(data, "processing")}

${hubFulfillment(data, "processing")}

${tEmail("summary.heading", {}, lng)}:
${generateHubOrderSummaryPlain(data)}

${tEmail("hubOrder.processing.nextHeading", {}, lng)}:
${tEmail("hubOrder.processing.nextBody", {}, lng)}

${tEmail("hubOrder.processing.cta", {}, lng)}: ${appUrl()}/hub/orders/${data.transactionId.toLowerCase()}
    `
    },
  },

  // Hub Order Completed
  hubOrderCompleted: {
    subject: (data: HubTransactionEmailData) => hubCompletedSubject(data),
    html: (data: HubTransactionEmailData) => {
      const lng = data.locale
      const content = `
        <p class="confirmation-text">
          ${hubHero(data, "completed")}
        </p>
        <p class="confirmation-text">
          ${hubFulfillment(data, "completed")}
        </p>

        ${generateHubOrderSummary(data)}

        <div class="security-note">
          <h3>${tEmail("hubOrder.completed.nextHeading", {}, lng)}</h3>
          <p>${tEmail("hubOrder.completed.nextBody", {}, lng)}</p>
        </div>
      `
      return generateBaseEmailTemplate(
        tEmail("hubOrder.completed.title", {}, lng),
        "",
        content,
        {
          text: tEmail("hubOrder.completed.cta", {}, lng),
          url: `${appUrl()}/hub/orders/${data.transactionId.toLowerCase()}`,
        },
        lng,
      )
    },
    text: (data: HubTransactionEmailData) => {
      const lng = data.locale
      return `
${tEmail("hubOrder.completed.title", {}, lng)} - #${data.transactionId}

${hubHero(data, "completed")}

${hubFulfillment(data, "completed")}

${tEmail("summary.heading", {}, lng)}:
${generateHubOrderSummaryPlain(data)}

${tEmail("hubOrder.completed.nextHeading", {}, lng)}:
${tEmail("hubOrder.completed.nextBody", {}, lng)}

${tEmail("hubOrder.completed.cta", {}, lng)}: ${appUrl()}/hub/orders/${data.transactionId.toLowerCase()}
    `
    },
  },

  // Hub Order Failed
  hubOrderFailed: {
    subject: (data: HubTransactionEmailData) =>
      tEmail(
        "hubOrder.failed.subject",
        { productTitle: data.productTitle, transactionId: data.transactionId },
        data.locale,
      ),
    html: (data: HubTransactionEmailData) => {
      const lng = data.locale
      const body = data.failureReason
        ? tEmail("hubOrder.failed.bodyWithReason", { productTitle: data.productTitle, reason: data.failureReason }, lng)
        : tEmail("hubOrder.failed.bodyNoReason", { productTitle: data.productTitle }, lng)
      const content = `
        <p class="confirmation-text">${body}</p>

        ${generateHubOrderSummary(data)}

        <div class="security-note">
          <h3>${tEmail("hubOrder.failed.nextHeading", {}, lng)}</h3>
          <p>${tEmail("common.refundNote", {}, lng)}</p>
        </div>
      `
      return generateBaseEmailTemplate(
        tEmail("hubOrder.failed.title", {}, lng),
        "",
        content,
        { text: tEmail("hubOrder.failed.cta", {}, lng), url: `${appUrl()}/support` },
        lng,
      )
    },
    text: (data: HubTransactionEmailData) => {
      const lng = data.locale
      const body = data.failureReason
        ? tEmail("hubOrder.failed.bodyWithReason", { productTitle: data.productTitle, reason: data.failureReason }, lng)
        : tEmail("hubOrder.failed.bodyNoReason", { productTitle: data.productTitle }, lng)
      return `
${tEmail("hubOrder.failed.title", {}, lng)} - #${data.transactionId}

${body}

${tEmail("summary.heading", {}, lng)}:
${generateHubOrderSummaryPlain(data)}

${tEmail("hubOrder.failed.nextHeading", {}, lng)}:
${tEmail("common.refundNote", {}, lng)}

${tEmail("hubOrder.failed.cta", {}, lng)}: ${appUrl()}/support
    `
    },
  },

  // Hub Order Cancelled
  hubOrderCancelled: {
    subject: (data: HubTransactionEmailData) =>
      tEmail(
        "hubOrder.cancelled.subject",
        { productTitle: data.productTitle, transactionId: data.transactionId },
        data.locale,
      ),
    html: (data: HubTransactionEmailData) => {
      const lng = data.locale
      const body = data.failureReason
        ? tEmail("hubOrder.cancelled.bodyWithReason", { productTitle: data.productTitle, reason: data.failureReason }, lng)
        : tEmail("hubOrder.cancelled.bodyNoReason", { productTitle: data.productTitle }, lng)
      const content = `
        <p class="confirmation-text">${body}</p>

        ${generateHubOrderSummary(data)}

        <div class="security-note">
          <h3>${tEmail("hubOrder.cancelled.refundHeading", {}, lng)}</h3>
          <p>${tEmail("common.refundNote", {}, lng)}</p>
        </div>
      `
      return generateBaseEmailTemplate(
        tEmail("hubOrder.cancelled.title", {}, lng),
        "",
        content,
        { text: tEmail("hubOrder.cancelled.cta", {}, lng), url: `${appUrl()}/hub` },
        lng,
      )
    },
    text: (data: HubTransactionEmailData) => {
      const lng = data.locale
      const body = data.failureReason
        ? tEmail("hubOrder.cancelled.bodyWithReason", { productTitle: data.productTitle, reason: data.failureReason }, lng)
        : tEmail("hubOrder.cancelled.bodyNoReason", { productTitle: data.productTitle }, lng)
      return `
${tEmail("hubOrder.cancelled.title", {}, lng)} - #${data.transactionId}

${body}

${tEmail("summary.heading", {}, lng)}:
${generateHubOrderSummaryPlain(data)}

${tEmail("hubOrder.cancelled.refundHeading", {}, lng)}:
${tEmail("common.refundNote", {}, lng)}

${tEmail("hubOrder.cancelled.cta", {}, lng)}: ${appUrl()}/hub
    `
    },
  },

  referralPayoutPending: {
    subject: (data: ReferralPayoutEmailData) => {
      const lng = data.locale
      if (data.payoutTransactionId) {
        return tEmail("referralPayout.pending.subjectWithTx", { payoutTransactionId: data.payoutTransactionId }, lng)
      }
      if (data.payoutRequestId) {
        return tEmail(
          "referralPayout.pending.subjectWithRequest",
          { requestIdShort: data.payoutRequestId.slice(0, 8) },
          lng,
        )
      }
      return tEmail("referralPayout.pending.subjectFallback", {}, lng)
    },
    html: (data: ReferralPayoutEmailData) => {
      const lng = data.locale
      const amt = `${data.currency} ${formatAmountPlain(data.amount)}`
      const ref = data.payoutTransactionId
        ? `<p class="confirmation-text" style="font-size:14px;color:#64748b;">${tEmail(
            "referralPayout.pending.referenceTx",
            { payoutTransactionId: data.payoutTransactionId },
            lng,
          )}</p>`
        : data.payoutRequestId
          ? `<p class="confirmation-text" style="font-size:14px;color:#64748b;">${tEmail(
              "referralPayout.pending.referenceRequest",
              { payoutRequestId: data.payoutRequestId },
              lng,
            )}</p>`
          : ""
      const content = `
        <p class="confirmation-text">
          ${tEmail("referralPayout.pending.body", {
            firstName: data.firstName,
            amount: amt,
            currency: "",
            recipientName: data.recipientName,
          }, lng)}
        </p>
        ${ref}
        <div class="security-note">
          <h3>${tEmail("referralPayout.pending.nextHeading", {}, lng)}</h3>
          <p>${tEmail("referralPayout.pending.nextBody", {}, lng)}</p>
        </div>
      `
      return generateBaseEmailTemplate(
        tEmail("referralPayout.pending.title", {}, lng),
        "",
        content,
        { text: tEmail("referralPayout.pending.cta", {}, lng), url: data.dashboardUrl },
        lng,
      )
    },
    text: (data: ReferralPayoutEmailData) => {
      const lng = data.locale
      const amt = `${data.currency} ${formatAmountPlain(data.amount)}`
      return `${tEmail("referralPayout.pending.title", {}, lng)}

${tEmail("referralPayout.pending.body", { firstName: data.firstName, amount: amt, currency: "", recipientName: data.recipientName }, lng)}
${
  data.payoutTransactionId
    ? tEmail("referralPayout.pending.referenceTx", { payoutTransactionId: data.payoutTransactionId }, lng) + "\n"
    : data.payoutRequestId
      ? tEmail("referralPayout.pending.referenceRequest", { payoutRequestId: data.payoutRequestId }, lng) + "\n"
      : ""
}
${tEmail("referralPayout.pending.cta", {}, lng)}: ${data.dashboardUrl}

${tEmail("common.footerCopyright", { year: new Date().getFullYear() }, lng)}`
    },
  },

  referralPayoutCompleted: {
    subject: (data: ReferralPayoutEmailData) =>
      tEmail(
        "referralPayout.completed.subject",
        { amount: formatAmountPlain(data.amount), currency: data.currency },
        data.locale,
      ),
    html: (data: ReferralPayoutEmailData) => {
      const lng = data.locale
      const amt = `${data.currency} ${formatAmountPlain(data.amount)}`
      const content = `
        <p class="confirmation-text">
          ${tEmail("referralPayout.completed.body", {
            firstName: data.firstName,
            amount: amt,
            currency: "",
            recipientName: data.recipientName,
          }, lng)}
        </p>
        ${
          data.linkedTransactionId
            ? `<p class="confirmation-text" style="font-size:14px;color:#64748b;">${tEmail(
                "referralPayout.completed.referenceTx",
                { linkedTransactionId: data.linkedTransactionId },
                lng,
              )}</p>`
            : ""
        }
      `
      return generateBaseEmailTemplate(
        tEmail("referralPayout.completed.title", {}, lng),
        "",
        content,
        { text: tEmail("referralPayout.completed.cta", {}, lng), url: data.dashboardUrl },
        lng,
      )
    },
    text: (data: ReferralPayoutEmailData) => {
      const lng = data.locale
      const amt = `${data.currency} ${formatAmountPlain(data.amount)}`
      return `${tEmail("referralPayout.completed.title", {}, lng)}

${tEmail("referralPayout.completed.body", { firstName: data.firstName, amount: amt, currency: "", recipientName: data.recipientName }, lng)}
${data.linkedTransactionId ? tEmail("referralPayout.completed.referenceTx", { linkedTransactionId: data.linkedTransactionId }, lng) + "\n" : ""}
${tEmail("referralPayout.completed.cta", {}, lng)}: ${data.dashboardUrl}

${tEmail("common.footerCopyright", { year: new Date().getFullYear() }, lng)}`
    },
  },

  referralPayoutCancelled: {
    subject: (data: ReferralPayoutEmailData) =>
      tEmail("referralPayout.cancelled.subject", {}, data.locale),
    html: (data: ReferralPayoutEmailData) => {
      const lng = data.locale
      const amt = `${data.currency} ${formatAmountPlain(data.amount)}`
      const content = `
        <p class="confirmation-text">
          ${tEmail("referralPayout.cancelled.body", {
            firstName: data.firstName,
            amount: amt,
            currency: "",
            recipientName: data.recipientName,
          }, lng)}
        </p>
      `
      return generateBaseEmailTemplate(
        tEmail("referralPayout.cancelled.title", {}, lng),
        "",
        content,
        { text: tEmail("referralPayout.cancelled.cta", {}, lng), url: data.dashboardUrl },
        lng,
      )
    },
    text: (data: ReferralPayoutEmailData) => {
      const lng = data.locale
      const amt = `${data.currency} ${formatAmountPlain(data.amount)}`
      return `${tEmail("referralPayout.cancelled.title", {}, lng)}

${tEmail("referralPayout.cancelled.body", { firstName: data.firstName, amount: amt, currency: "", recipientName: data.recipientName }, lng)}

${tEmail("referralPayout.cancelled.cta", {}, lng)}: ${data.dashboardUrl}

${tEmail("common.footerCopyright", { year: new Date().getFullYear() }, lng)}`
    },
  },

  // Admin Transaction Notification (send — English only)
  adminTransactionNotification: {
    subject: (data: any) => `New Transfer ${data.status === 'pending' ? 'Created' : 'Updated'} - #${data.transactionId}`,
    html: (data: any) => {
      const userName = data.userName && data.userName !== 'User' && data.userName !== 'Unknown' ? data.userName : 'a user'
      const content = `
        <p class="confirmation-text">
          ${data.status === 'pending' 
            ? `A new transaction has been created by ${userName} and requires your attention.` 
            : `A transaction status has been updated to ${data.status}. Please review the details below.`}
        </p>
      `

      return generateBaseEmailTemplate(
        data.status === 'pending' ? "New Transaction Created" : `Transaction ${data.status.toUpperCase()}`,
        "",
        content,
        {
          text: "View in Admin Dashboard",
          url: `${officeUrl()}/transactions`,
        },
        "en",
      )
    },
    text: (data: any) => {
      const userName = data.userName && data.userName !== 'User' && data.userName !== 'Unknown' ? data.userName : 'a user'
      return `
${data.status === 'pending' ? 'New Transaction Created' : `Transaction Status Updated to ${data.status.toUpperCase()}`} - #${data.transactionId}

${data.status === 'pending' 
  ? `A new transaction has been created by ${userName} and requires your attention.` 
  : `A transaction status has been updated to ${data.status}. Please review the details below.`}

View in Admin Dashboard: ${officeUrl()}/transactions

© ${new Date().getFullYear()} Ciuna. All rights reserved.
    `
    },
  },

  // Admin Hub Transaction Notification (English only)
  adminHubTransactionNotification: {
    subject: (data: any) => `Hub order ${data.status} - #${data.transactionId}`,
    html: (data: any) => {
      const userName = data.userName && data.userName !== 'User' && data.userName !== 'Unknown' ? data.userName : 'a user'
      const fulfillmentLine =
        data.fulfillmentType === "in_person"
          ? `In-person delivery to ${data.contactName || "-"}${data.deliveryAddressLine ? " at " + data.deliveryAddressLine : ""}`
          : `Online delivery to ${data.contactName || "-"}`
      const rateLine =
        data.sendCurrency === data.fundedCurrency
          ? ""
          : `<div class="detail-row"><span class="detail-label">Exchange rate: </span><span class="detail-value">1 ${data.sendCurrency} = ${formatExchangeRateForEmail(Number(data.exchangeRate) || 0)} ${data.fundedCurrency}</span></div>`
      const corridorLine =
        Number(data.corridorFee) > 0
          ? `<div class="detail-row"><span class="detail-label">Corridor fee: </span><span class="detail-value">${formatAmountPlain(Number(data.corridorFee))} ${data.sendCurrency}</span></div>`
          : ""
      const hubFeeLine =
        Number(data.hubFee) > 0
          ? `<div class="detail-row"><span class="detail-label">Hub fee: </span><span class="detail-value">${formatAmountPlain(Number(data.hubFee))} ${data.sendCurrency}</span></div>`
          : ""
      const content = `
        <p class="confirmation-text">
          ${
            data.status === "pending"
              ? `A new Hub order has been created by ${userName} and requires your attention.`
              : `A Hub order status has been updated to ${data.status}. Please review the details below.`
          }
        </p>
        <div class="transaction-details">
          <h3>Hub Order Details</h3>
          <div class="detail-row"><span class="detail-label">Transaction ID: </span><span class="detail-value">${data.transactionId}</span></div>
          <div class="detail-row"><span class="detail-label">User: </span><span class="detail-value">${userName} (${data.userEmail || "-"})</span></div>
          <div class="detail-row"><span class="detail-label">Product: </span><span class="detail-value">${data.productTitle || "-"}</span></div>
          <div class="detail-row"><span class="detail-label">Pricing: </span><span class="detail-value">${data.pricingType === "fixed" ? "Fixed price" : "User-entered amount"}</span></div>
          <div class="detail-row"><span class="detail-label">Funded amount: </span><span class="detail-value">${formatAmountPlain(Number(data.fundedAmount) || 0)} ${data.fundedCurrency}</span></div>
          ${rateLine}
          ${corridorLine}
          ${hubFeeLine}
          <div class="detail-row"><span class="detail-label">Total paid: </span><span class="detail-value">${formatAmountPlain(Number(data.totalAmount) || 0)} ${data.sendCurrency}</span></div>
          <div class="detail-row"><span class="detail-label">Fulfillment: </span><span class="detail-value">${fulfillmentLine}</span></div>
          <div class="detail-row"><span class="detail-label">Contact: </span><span class="detail-value">${data.contactPhone || "-"}</span></div>
          <div class="detail-row"><span class="detail-label">Status: </span><span class="detail-value"><span class="status-badge status-${data.status}">${String(data.status).toUpperCase()}</span></span></div>
        </div>
      `
      return generateBaseEmailTemplate(
        data.status === "pending" ? "New Hub Order Created" : `Hub Order ${String(data.status).toUpperCase()}`,
        "",
        content,
        { text: "View in Admin Dashboard", url: `${officeUrl()}/transactions` },
        "en",
      )
    },
    text: (data: any) => {
      const userName = data.userName && data.userName !== 'User' && data.userName !== 'Unknown' ? data.userName : 'a user'
      return `
Hub order ${data.status} - #${data.transactionId}

${data.status === "pending" ? "A new Hub order has been created" : "Hub order status updated"} by ${userName} (${data.userEmail || "-"})

Product: ${data.productTitle || "-"}
Pricing: ${data.pricingType === "fixed" ? "Fixed price" : "User-entered amount"}
Funded amount: ${formatAmountPlain(Number(data.fundedAmount) || 0)} ${data.fundedCurrency}
${data.sendCurrency === data.fundedCurrency ? "" : `Exchange rate: 1 ${data.sendCurrency} = ${formatExchangeRateForEmail(Number(data.exchangeRate) || 0)} ${data.fundedCurrency}\n`}${Number(data.corridorFee) > 0 ? `Corridor fee: ${formatAmountPlain(Number(data.corridorFee))} ${data.sendCurrency}\n` : ""}${Number(data.hubFee) > 0 ? `Hub fee: ${formatAmountPlain(Number(data.hubFee))} ${data.sendCurrency}\n` : ""}Total paid: ${formatAmountPlain(Number(data.totalAmount) || 0)} ${data.sendCurrency}
Fulfillment: ${data.fulfillmentType === "in_person" ? `In-person to ${data.contactName || "-"}${data.deliveryAddressLine ? " at " + data.deliveryAddressLine : ""}` : `Online to ${data.contactName || "-"}`}
Contact: ${data.contactPhone || "-"}

View in Admin Dashboard: ${officeUrl()}/transactions

© ${new Date().getFullYear()} Ciuna. All rights reserved.
    `
    },
  },
}
