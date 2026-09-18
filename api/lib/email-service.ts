import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"
import { resolveAppUrl } from "@ciuna/shared"
import { emailTemplates } from "./email-templates"
import type {
  EmailData,
  EmailSendResult,
  EmailServiceConfig,
  HubTransactionEmailData,
  ReferralPayoutEmailData,
  TransactionEmailData,
  WelcomeEmailData,
} from "./email-types"

let sesClient: SESv2Client | null = null

function getSesClient(): SESv2Client {
  if (!sesClient) {
    const region = process.env.AWS_REGION
    if (!region) throw new Error("AWS_REGION environment variable is required")
    sesClient = new SESv2Client({ region })
  }
  return sesClient
}

export class EmailService {
  private config: EmailServiceConfig

  constructor(config?: Partial<EmailServiceConfig>) {
    this.config = {
      fromEmail: process.env.SES_FROM_EMAIL || "noreply@ciuna.com",
      fromName: process.env.SES_FROM_NAME || "Ciuna",
      replyTo: process.env.SES_REPLY_TO || "support@ciuna.com",
      ...config,
    }
  }

  async sendEmail(emailData: EmailData): Promise<EmailSendResult> {
    try {
      const template = emailTemplates[emailData.template]
      if (!template) {
        throw new Error(`Email template '${emailData.template}' not found`)
      }

      const subject =
        typeof template.subject === "function" ? template.subject(emailData.data) : template.subject
      const html = template.html(emailData.data)
      const text = template.text(emailData.data)

      const response = await getSesClient().send(
        new SendEmailCommand({
          FromEmailAddress: `${this.config.fromName} <${this.config.fromEmail}>`,
          Destination: { ToAddresses: [emailData.to] },
          ReplyToAddresses: this.config.replyTo ? [this.config.replyTo] : undefined,
          Content: {
            Simple: {
              Subject: { Data: subject, Charset: "UTF-8" },
              Body: {
                Html: { Data: html, Charset: "UTF-8" },
                Text: { Data: text, Charset: "UTF-8" },
              },
            },
          },
        }),
      )

      return {
        success: true,
        messageId: response.MessageId,
      }
    } catch (error) {
      console.error("Email sending failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async sendWelcomeEmail(userData: WelcomeEmailData): Promise<EmailSendResult> {
    return this.sendEmail({
      to: userData.email,
      template: "welcome",
      data: userData,
    })
  }

  async sendTransactionNotification(
    userEmail: string,
    transactionData: TransactionEmailData,
    status: "pending" | "processing" | "completed" | "failed" | "cancelled",
  ): Promise<EmailSendResult> {
    const templateMap = {
      pending: "transactionPending",
      processing: "transactionProcessing",
      completed: "transactionCompleted",
      failed: "transactionFailed",
      cancelled: "transactionCancelled",
    }
    const templateName = templateMap[status]
    if (!templateName) {
      throw new Error(`Invalid transaction status: ${status}`)
    }
    return this.sendEmail({
      to: userEmail,
      template: templateName,
      data: { ...transactionData, status },
    })
  }

  async sendTransactionPendingEmail(userEmail: string, transactionData: TransactionEmailData) {
    return this.sendTransactionNotification(userEmail, transactionData, "pending")
  }

  async sendTransactionProcessingEmail(userEmail: string, transactionData: TransactionEmailData) {
    return this.sendTransactionNotification(userEmail, transactionData, "processing")
  }

  async sendTransactionCompletedEmail(userEmail: string, transactionData: TransactionEmailData) {
    return this.sendTransactionNotification(userEmail, transactionData, "completed")
  }

  async sendTransactionFailedEmail(userEmail: string, transactionData: TransactionEmailData) {
    return this.sendTransactionNotification(userEmail, transactionData, "failed")
  }

  async sendTransactionCancelledEmail(userEmail: string, transactionData: TransactionEmailData) {
    return this.sendTransactionNotification(userEmail, transactionData, "cancelled")
  }

  async sendHubOrderStatusEmail(
    userEmail: string,
    data: HubTransactionEmailData,
    status: "pending" | "processing" | "completed" | "failed" | "cancelled",
  ): Promise<EmailSendResult> {
    const templateMap = {
      pending: "hubOrderPending",
      processing: "hubOrderProcessing",
      completed: "hubOrderCompleted",
      failed: "hubOrderFailed",
      cancelled: "hubOrderCancelled",
    } as const
    return this.sendEmail({
      to: userEmail,
      template: templateMap[status],
      data: { ...data, status },
    })
  }

  async sendReferralPayoutEmail(userEmail: string, data: ReferralPayoutEmailData): Promise<EmailSendResult> {
    const templateMap = {
      pending: "referralPayoutPending",
      completed: "referralPayoutCompleted",
      cancelled: "referralPayoutCancelled",
    } as const
    return this.sendEmail({
      to: userEmail,
      template: templateMap[data.status],
      data,
    })
  }

  async sendTestEmail(to: string): Promise<EmailSendResult> {
    const appUrl = resolveAppUrl()
    return this.sendEmail({
      to,
      template: "welcome",
      data: {
        firstName: "Test",
        lastName: "User",
        email: to,
        baseCurrency: "USD",
        dashboardUrl: `${appUrl}/hub`,
      },
    })
  }
}

export const emailService = new EmailService()

export const {
  sendWelcomeEmail,
  sendTransactionNotification,
  sendTransactionPendingEmail,
  sendTransactionProcessingEmail,
  sendTransactionCompletedEmail,
  sendTransactionFailedEmail,
  sendTransactionCancelledEmail,
  sendTestEmail,
} = emailService
