// Email template generator using the provided design system

import { formatAmountPlain, formatExchangeRateForEmail } from "@/utils/currency"
import { SEO_EMAIL_LOGO_DARK_URL, SEO_EMAIL_LOGO_LIGHT_URL } from "./seo"
import { formatEmailDate, tEmail, type EmailLocale } from "./i18n/server"
import type { HubTransactionEmailData, TransactionEmailData } from "./email-types"

export function generateBaseEmailTemplate(
  title: string,
  subtitle: string,
  content: string,
  ctaButton?: { text: string; url: string },
  lng?: EmailLocale | string | null,
): string {
  const logoAlt = tEmail("common.logoAlt", {}, lng)
  const needHelp = tEmail("common.needHelp", {}, lng)
  const contactSupport = tEmail("common.contactSupport", {}, lng)
  const contactMailto = tEmail("common.contactSupportMailto", {}, lng)
  const year = new Date().getFullYear()
  const copyright = tEmail("common.footerCopyright", { year }, lng)
  const accountNote = tEmail("common.footerAccountNote", {}, lng)

  return `
<!DOCTYPE html>
<html lang="${(lng as string) || "en"}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Ciuna</title>
    <style>
        /* Reset styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #ffffff;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        
        .email-header {
            background: #ffffff;
            padding: 40px 30px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .logo {
            max-width: 120px;
            height: auto;
            margin: 0 auto 20px auto;
            display: block;
        }
        
        .logo-dark {
            display: none;
        }
        
        .email-title {
            color: #F97316;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .email-subtitle {
            color: #4a5568;
            font-size: 16px;
            font-weight: 400;
        }
        
        .email-body {
            padding: 40px 30px;
        }
        
        .welcome-text {
            font-size: 18px;
            color: #1a202c;
            margin-bottom: 20px;
            font-weight: 500;
        }
        
        .confirmation-text {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #F97316 0%, #ea580c 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(249, 115, 22, 0.4);
        }
        
        .security-note {
            background-color: #f7fafc;
            border-left: 4px solid #F97316;
            padding: 20px;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .security-note h3 {
            color: #2d3748;
            font-size: 18px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .security-note p {
            color: #4a5568;
            font-size: 16px;
            margin: 0;
        }
        
        .email-footer {
            background-color: #ffffff;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
            color: #718096;
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        .footer-links {
            margin: 20px 0;
        }
        
        .footer-links a {
            color: #F97316;
            text-decoration: none;
            margin: 0 15px;
            font-size: 14px;
        }
        
        .footer-links a:hover {
            text-decoration: underline;
        }
        
        .company-info {
            color: #a0aec0;
            font-size: 12px;
            margin-top: 20px;
        }
        
        .transaction-details {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .transaction-details h3 {
            color: #2d3748;
            font-size: 18px;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 4px 0;
            font-size: 16px;
        }
        
        .detail-label {
            color: #4a5568;
            font-weight: 500;
            font-size: 16px;
        }
        
        .detail-value {
            color: #1a202c;
            font-weight: 600;
            font-size: 16px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-pending {
            background-color: #fef3c7;
            color: #92400e;
        }
        
        .status-processing {
            background-color: #dbeafe;
            color: #1e40af;
        }
        
        .status-completed {
            background-color: #d1fae5;
            color: #065f46;
        }
        
        .status-failed {
            background-color: #fee2e2;
            color: #991b1b;
        }
        
        .status-cancelled {
            background-color: #f3f4f6;
            color: #374151;
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            body {
                background-color: #0a0a0a;
                color: #e5e5e5;
            }
            
            .email-container {
                background-color: #1a1a1a;
                border-color: #333333;
            }
            
            .email-header {
                background: #1a1a1a;
                border-bottom-color: #333333;
            }
            
            .logo-light {
                display: none !important;
            }
            
            .logo-dark {
                display: block !important;
            }
            
            .email-title {
                color: #F97316;
            }
            
            .email-subtitle {
                color: #999999;
            }
            
            .welcome-text {
                color: #ffffff;
            }
            
            .confirmation-text {
                color: #e5e5e5;
            }
            
            .security-note {
                background-color: #2a2a2a;
                border-left-color: #F97316;
            }
            
            .security-note h3 {
                color: #ffffff;
            }
            
            .security-note p {
                color: #e5e5e5;
            }
            
            .email-footer {
                background-color: #1a1a1a;
                border-top-color: #333333;
            }
            
            .footer-text {
                color: #999999;
            }
            
            .footer-links a {
                color: #F97316;
            }
            
            .company-info {
                color: #666666;
            }
            
            .transaction-details {
                background-color: #2a2a2a;
                border-color: #333333;
            }
            
            .transaction-details h3 {
                color: #ffffff;
            }
            
            .detail-label {
                color: #999999;
            }
            
            .detail-value {
                color: #ffffff;
            }
            
            .cta-button {
                color: #ffffff !important;
            }
        }
        
        /* Mobile responsiveness */
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            
            .email-header {
                padding: 30px 20px;
            }
            
            .email-title {
                font-size: 24px;
            }
            
            .email-body {
                padding: 30px 20px;
            }
            
            .welcome-text {
                font-size: 16px;
            }
            
            .confirmation-text {
                font-size: 15px;
            }
            
            .cta-button {
                display: block;
                width: 100%;
                padding: 18px 20px;
                font-size: 16px;
            }
            
            .email-footer {
                padding: 25px 20px;
            }
            
            .footer-links a {
                display: block;
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            <img src="${SEO_EMAIL_LOGO_LIGHT_URL}" alt="${logoAlt}" class="logo logo-light" width="120" style="max-width:120px;height:auto;">
            <img src="${SEO_EMAIL_LOGO_DARK_URL}" alt="${logoAlt}" class="logo logo-dark" width="120" style="max-width:120px;height:auto;">
            <h1 class="email-title">${title}</h1>
            ${subtitle ? `<p class="email-subtitle">${subtitle}</p>` : ''}
        </div>
        
        <!-- Body -->
        <div class="email-body">
            ${content}
            
            ${ctaButton ? `
            <div style="text-align: center;">
                <a href="${ctaButton.url}" class="cta-button">${ctaButton.text}</a>
            </div>
            ` : ''}
        </div>
        
        <!-- Footer -->
        <div class="email-footer">
            <p class="footer-text">
                ${needHelp}
            </p>
            
            <div class="footer-links">
                <a href="${contactMailto}">${contactSupport}</a>
            </div>
            
            <p class="company-info">
                ${copyright}<br>
                ${accountNote}
            </p>
        </div>
    </div>
</body>
</html>
  `
}

export function generateTransactionDetails(data: TransactionEmailData): string {
  const lng = data.locale
  const sendAmt = formatAmountPlain(Number(data.sendAmount) || 0)
  const recvAmt = formatAmountPlain(Number(data.receiveAmount) || 0)
  const rateStr = formatExchangeRateForEmail(Number(data.exchangeRate) || 0)
  const feeStr = formatAmountPlain(Number(data.fee) || 0)
  const logStr = formatAmountPlain(Number(data.logisticsFee) || 0)
  const totalStr =
    data.totalAmount != null ? formatAmountPlain(Number(data.totalAmount) || 0) : null
  const statusWord = tEmail(`status.${data.status}`, {}, lng)
  const dateStr = formatEmailDate(data.createdAt, lng)

  return `
    <div class="transaction-details">
      <h3>${tEmail("summary.heading", {}, lng)}</h3>
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.transactionId", {}, lng)} </span>
        <span class="detail-value">${data.transactionId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.recipient", {}, lng)} </span>
        <span class="detail-value">${data.recipientName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.amount", {}, lng)} </span>
        <span class="detail-value">${sendAmt} ${data.sendCurrency}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.receiving", {}, lng)} </span>
        <span class="detail-value">${recvAmt} ${data.receiveCurrency}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.rateUsed", {}, lng)} </span>
        <span class="detail-value">1 ${data.sendCurrency} = ${rateStr} ${data.receiveCurrency}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.exchangeFee", {}, lng)} </span>
        <span class="detail-value">${feeStr} ${data.sendCurrency}</span>
      </div>
      ${
        (data.logisticsFee ?? 0) > 0
          ? `
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.logisticsFee", {}, lng)} </span>
        <span class="detail-value">${logStr} ${data.sendCurrency}</span>
      </div>`
          : ""
      }
      ${
        totalStr != null
          ? `
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.totalPaid", {}, lng)} </span>
        <span class="detail-value">${totalStr} ${data.sendCurrency}</span>
      </div>`
          : ""
      }
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.status", {}, lng)} </span>
        <span class="detail-value">
          <span class="status-badge status-${data.status}">${statusWord}</span>
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.date", {}, lng)} </span>
        <span class="detail-value">${dateStr}</span>
      </div>
    </div>
  `
}

/** Hub order summary block — mirrors the in-app Order summary on /hub/orders/[id]. */
export function generateHubOrderSummary(data: HubTransactionEmailData): string {
  const lng = data.locale
  const sameCurrency = data.sendCurrency === data.fundedCurrency
  const sendAmt = formatAmountPlain(Number(data.sendAmount) || 0)
  const fundedAmt = formatAmountPlain(Number(data.fundedAmount) || 0)
  const rateStr = formatExchangeRateForEmail(Number(data.exchangeRate) || 0)
  const corridor = Number(data.corridorFee) || 0
  const hubFee = Number(data.hubFee) || 0
  const totalStr = formatAmountPlain(Number(data.totalAmount) || 0)
  const typeLabel =
    data.pricingType === "fixed"
      ? tEmail("summary.typeFixed", {}, lng)
      : tEmail("summary.typeUserInput", {}, lng)
  const fulfillmentLine =
    data.fulfillmentType === "in_person"
      ? tEmail("summary.fulfillmentInPersonValue", { contactName: data.contactName }, lng)
      : tEmail("summary.fulfillmentOnlineValue", { contactName: data.contactName }, lng)
  const statusWord = tEmail(`status.${data.status}`, {}, lng)
  const dateStr = formatEmailDate(data.createdAt, lng)

  return `
    <div class="transaction-details">
      <h3>${tEmail("summary.heading", {}, lng)}</h3>
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.transactionId", {}, lng)} </span>
        <span class="detail-value">${data.transactionId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.order", {}, lng)} </span>
        <span class="detail-value">${data.productTitle}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.type", {}, lng)} </span>
        <span class="detail-value">${typeLabel}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.fundedAmount", {}, lng)} </span>
        <span class="detail-value">${fundedAmt} ${data.fundedCurrency}</span>
      </div>
      ${
        sameCurrency
          ? ""
          : `
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.exchangeRate", {}, lng)} </span>
        <span class="detail-value">1 ${data.sendCurrency} = ${rateStr} ${data.fundedCurrency}</span>
      </div>`
      }
      ${
        corridor > 0
          ? `
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.corridorFee", {}, lng)} </span>
        <span class="detail-value">${formatAmountPlain(corridor)} ${data.sendCurrency}</span>
      </div>`
          : ""
      }
      ${
        hubFee > 0
          ? `
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.hubFee", {}, lng)} </span>
        <span class="detail-value">${formatAmountPlain(hubFee)} ${data.sendCurrency}</span>
      </div>`
          : ""
      }
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.totalPaid", {}, lng)} </span>
        <span class="detail-value">${totalStr} ${data.sendCurrency} (${sendAmt} ${data.sendCurrency})</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.fulfillment", {}, lng)} </span>
        <span class="detail-value">${fulfillmentLine}</span>
      </div>
      ${
        data.fulfillmentType === "in_person" && data.deliveryAddressLine
          ? `
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.deliveryAddress", {}, lng)} </span>
        <span class="detail-value">${data.deliveryAddressLine}</span>
      </div>`
          : ""
      }
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.contact", {}, lng)} </span>
        <span class="detail-value">${data.contactPhone}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.status", {}, lng)} </span>
        <span class="detail-value">
          <span class="status-badge status-${data.status}">${statusWord}</span>
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${tEmail("summary.date", {}, lng)} </span>
        <span class="detail-value">${dateStr}</span>
      </div>
    </div>
  `
}

/** Plain-text Hub order summary (for text body). */
export function generateHubOrderSummaryPlain(data: HubTransactionEmailData): string {
  const lng = data.locale
  const sameCurrency = data.sendCurrency === data.fundedCurrency
  const sendAmt = formatAmountPlain(Number(data.sendAmount) || 0)
  const fundedAmt = formatAmountPlain(Number(data.fundedAmount) || 0)
  const rateStr = formatExchangeRateForEmail(Number(data.exchangeRate) || 0)
  const corridor = Number(data.corridorFee) || 0
  const hubFee = Number(data.hubFee) || 0
  const totalStr = formatAmountPlain(Number(data.totalAmount) || 0)
  const typeLabel =
    data.pricingType === "fixed"
      ? tEmail("summary.typeFixed", {}, lng)
      : tEmail("summary.typeUserInput", {}, lng)

  const lines: string[] = [
    `- ${tEmail("summary.transactionId", {}, lng)} ${data.transactionId}`,
    `- ${tEmail("summary.order", {}, lng)} ${data.productTitle}`,
    `- ${tEmail("summary.type", {}, lng)} ${typeLabel}`,
    `- ${tEmail("summary.fundedAmount", {}, lng)} ${fundedAmt} ${data.fundedCurrency}`,
  ]
  if (!sameCurrency) {
    lines.push(`- ${tEmail("summary.exchangeRate", {}, lng)} 1 ${data.sendCurrency} = ${rateStr} ${data.fundedCurrency}`)
  }
  if (corridor > 0) {
    lines.push(`- ${tEmail("summary.corridorFee", {}, lng)} ${formatAmountPlain(corridor)} ${data.sendCurrency}`)
  }
  if (hubFee > 0) {
    lines.push(`- ${tEmail("summary.hubFee", {}, lng)} ${formatAmountPlain(hubFee)} ${data.sendCurrency}`)
  }
  lines.push(`- ${tEmail("summary.totalPaid", {}, lng)} ${totalStr} ${data.sendCurrency} (${sendAmt} ${data.sendCurrency})`)
  if (data.fulfillmentType === "in_person" && data.deliveryAddressLine) {
    lines.push(`- ${tEmail("summary.deliveryAddress", {}, lng)} ${data.deliveryAddressLine}`)
  }
  lines.push(`- ${tEmail("summary.contact", {}, lng)} ${data.contactPhone}`)
  lines.push(`- ${tEmail("summary.status", {}, lng)} ${tEmail(`status.${data.status}`, {}, lng)}`)
  return lines.join("\n")
}

export function generateFooter(): string {
  return `
    <p class="footer-text">
      Need help? We're here for you!
    </p>
    
    <div class="footer-links">
      <a href="mailto:support@ciuna.com">Contact Support</a>
    </div>
    
    <p class="company-info">
      © ${new Date().getFullYear()} Ciuna. All rights reserved.<br>
      You received this email because you have a Ciuna account.
    </p>
  `
}
