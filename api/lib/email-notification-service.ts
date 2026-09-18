// Simple, working email notification service

import { createServerClient } from './supabase'
import { emailService } from './email-service'
import type { EmailLocale, HubTransactionEmailData, TransactionEmailData } from './email-types'

export type { TransactionEmailData }

type HubSnapshot = {
  productTitle?: string
  productPricingType?: "fixed" | "user_input"
  fundedAmount?: number
  fundedCurrency?: string
  feePercent?: number | null
  hubFeeAmount?: number
  corridorFeeAmount?: number
  contactName?: string
  contactPhone?: string
  fulfillmentType?: "online" | "in_person"
  deliveryAddressLine?: string | null
  formAnswers?: Record<string, unknown>
}

function normalizeLocale(value: unknown): EmailLocale {
  const v = typeof value === 'string' ? value.toLowerCase() : ''
  return (['en', 'ru', 'fr', 'es'] as const).includes(v as EmailLocale) ? (v as EmailLocale) : 'en'
}

function isHubTransaction(tx: { transaction_source?: string | null; type?: string | null }): boolean {
  return tx.transaction_source === 'hub' || tx.type === 'hub'
}

function buildHubEmailDataFromRow(
  transaction: any,
  locale: EmailLocale,
  normalizedStatus: HubTransactionEmailData['status'],
): HubTransactionEmailData {
  const snapshot: HubSnapshot = (transaction.hub_snapshot as HubSnapshot) || {}
  return {
    transactionId: String(transaction.transaction_id),
    status: normalizedStatus,
    sendAmount: Number(transaction.send_amount) || 0,
    sendCurrency: String(transaction.send_currency || ''),
    fundedAmount: Number(snapshot.fundedAmount ?? transaction.receive_amount ?? 0) || 0,
    fundedCurrency: String(snapshot.fundedCurrency ?? transaction.receive_currency ?? ''),
    exchangeRate: Number(transaction.exchange_rate) || 0,
    corridorFee: Number(snapshot.corridorFeeAmount ?? transaction.fee_amount ?? 0) || 0,
    hubFee: Number(snapshot.hubFeeAmount ?? transaction.hub_fee_amount ?? 0) || 0,
    totalAmount: Number(transaction.total_amount) || 0,
    productTitle: String(snapshot.productTitle || 'Hub order'),
    pricingType: snapshot.productPricingType === 'user_input' ? 'user_input' : 'fixed',
    fulfillmentType: snapshot.fulfillmentType === 'in_person' ? 'in_person' : 'online',
    contactName: String(snapshot.contactName || ''),
    contactPhone: String(snapshot.contactPhone || transaction.delivery_phone || ''),
    deliveryAddressLine:
      snapshot.deliveryAddressLine != null
        ? String(snapshot.deliveryAddressLine)
        : (transaction.delivery_address_line as string | null) || null,
    failureReason: transaction.failure_reason || undefined,
    createdAt: String(transaction.created_at || new Date().toISOString()),
    updatedAt: String(transaction.updated_at || transaction.created_at || new Date().toISOString()),
    locale,
  }
}

export class EmailNotificationService {
  /**
   * Send transaction status email notification. Branches on `transaction_source`:
   * Hub rows go through `hubOrder*` templates, everything else keeps existing send flow.
   */
  static async sendTransactionStatusEmail(
    transactionId: string,
    status: string,
  ): Promise<void> {
    const normalizedStatus = status.trim().toLowerCase() as TransactionEmailData['status']
    console.log('Sending email for transaction:', transactionId, 'status:', normalizedStatus)

    try {
      let supabase
      try {
        supabase = createServerClient()
      } catch (clientError) {
        console.error('Failed to create Supabase client:', clientError)
        return
      }

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_id', transactionId)
        .single()

      if (transactionError) {
        console.error('Transaction query error:', transactionError)
        throw new Error(`Transaction query failed: ${transactionError.message}`)
      }

      if (!transaction) {
        console.error('Transaction not found for ID:', transactionId)
        throw new Error(`Transaction not found for ID: ${transactionId}`)
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, preferred_language')
        .eq('id', transaction.user_id)
        .single()

      if (userError || !user?.email) {
        console.error('User not found:', userError)
        throw new Error(`User not found or no email: ${userError?.message || 'No email address'}`)
      }

      const locale = normalizeLocale(user.preferred_language)

      if (isHubTransaction(transaction)) {
        const hubData = buildHubEmailDataFromRow(transaction, locale, normalizedStatus)
        const result = await emailService.sendHubOrderStatusEmail(user.email, hubData, normalizedStatus)
        if (result.success) {
          console.log('Hub order email sent successfully!', result.messageId)
        } else {
          console.error('Hub order email sending failed:', result.error)
        }
        return
      }

      let recipientName = 'Unknown'
      if (transaction.recipient_id) {
        const { data: recipient } = await supabase
          .from('recipients')
          .select('full_name')
          .eq('id', transaction.recipient_id)
          .single()
        recipientName = recipient?.full_name || 'Unknown'
      } else if (transaction.fulfillment_type === 'cash_hand') {
        recipientName =
          (transaction.delivery_address_line as string | null)?.trim() || 'Cash delivery'
      }

      const emailData: TransactionEmailData = {
        transactionId: transaction.transaction_id,
        recipientName,
        sendAmount: transaction.send_amount,
        sendCurrency: transaction.send_currency,
        receiveAmount: transaction.receive_amount,
        receiveCurrency: transaction.receive_currency,
        exchangeRate: transaction.exchange_rate,
        fee: transaction.fee_amount,
        logisticsFee: transaction.logistics_fee_amount ?? 0,
        totalAmount: transaction.total_amount,
        fulfillmentType: transaction.fulfillment_type,
        status: normalizedStatus,
        failureReason: transaction.failure_reason,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
        locale,
      }

      let result
      if (normalizedStatus === 'completed') {
        result = await emailService.sendTransactionCompletedEmail(user.email, emailData)
      } else if (normalizedStatus === 'processing') {
        result = await emailService.sendTransactionProcessingEmail(user.email, emailData)
      } else if (normalizedStatus === 'pending') {
        result = await emailService.sendTransactionPendingEmail(user.email, emailData)
      } else if (normalizedStatus === 'failed') {
        result = await emailService.sendTransactionFailedEmail(user.email, emailData)
      } else if (normalizedStatus === 'cancelled') {
        result = await emailService.sendTransactionCancelledEmail(user.email, emailData)
      } else {
        console.log('Unknown status:', normalizedStatus)
        return
      }

      if (result.success) {
        console.log('Email sent successfully!', result.messageId)
      } else {
        console.error('Email sending failed:', result.error)
      }
    } catch (error) {
      console.error('Error sending email:', error)
    }
  }

  /**
   * Send crypto receive transaction status email notification
   */
  static async sendCryptoReceiveTransactionEmail(
    transactionId: string,
    status: string
  ): Promise<void> {
    console.log('Sending email for crypto receive transaction:', transactionId, 'status:', status)

    try {
      const supabase = createServerClient()

      const { data: transaction, error: transactionError } = await supabase
        .from('crypto_receive_transactions')
        .select(`
          *,
          crypto_wallet:crypto_wallets(*, recipient:recipients(*)),
          user:users(first_name, last_name, email, preferred_language)
        `)
        .eq('transaction_id', transactionId)
        .single()

      if (transactionError || !transaction) {
        console.error('Crypto receive transaction not found:', transactionError)
        return
      }

      const userEmail = transaction.user?.email
      if (!userEmail) {
        console.error('User email not found')
        return
      }
      const locale = normalizeLocale(transaction.user?.preferred_language)

      let emailStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' = 'processing'
      if (status === 'deposited') {
        emailStatus = 'completed'
      } else if (status === 'failed') {
        emailStatus = 'failed'
      } else if (status === 'pending') {
        emailStatus = 'pending'
      }

      const emailData: TransactionEmailData = {
        transactionId: transaction.transaction_id,
        recipientName: transaction.crypto_wallet?.recipient?.full_name || 'Your Account',
        sendAmount: transaction.crypto_amount,
        sendCurrency: transaction.crypto_currency,
        receiveAmount: transaction.fiat_amount,
        receiveCurrency: transaction.fiat_currency,
        exchangeRate: transaction.exchange_rate,
        fee: 0,
        status: emailStatus,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
        locale,
      }

      let result
      if (status === 'deposited') {
        result = await emailService.sendTransactionCompletedEmail(userEmail, emailData)
      } else if (status === 'converting' || status === 'converted' || status === 'confirmed') {
        result = await emailService.sendTransactionProcessingEmail(userEmail, emailData)
      } else if (status === 'pending') {
        result = await emailService.sendTransactionPendingEmail(userEmail, emailData)
      } else if (status === 'failed') {
        result = await emailService.sendTransactionFailedEmail(userEmail, emailData)
      } else {
        console.log('Unknown crypto receive status:', status)
        return
      }

      if (result.success) {
        console.log('Crypto receive email sent successfully!', result.messageId)
      } else {
        console.error('Crypto receive email sending failed:', result.error)
      }
    } catch (error) {
      console.error('Error sending crypto receive email:', error)
    }
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(
    userEmail: string,
    firstName: string,
    locale: EmailLocale = 'en',
  ): Promise<void> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.ciuna.com'
      const result = await emailService.sendWelcomeEmail({
        firstName,
        lastName: '',
        email: userEmail,
        baseCurrency: 'USD',
        dashboardUrl: `${appUrl}/hub`,
        locale,
      })

      if (result.success) {
        console.log('Welcome email sent to:', userEmail)
      } else {
        console.error('Welcome email failed:', result.error)
      }
    } catch (error) {
      console.error('Error sending welcome email:', error)
    }
  }

  /**
   * Send admin notification email for transaction events.
   * Branches Hub rows to `adminHubTransactionNotification`.
   */
  static async sendAdminTransactionNotification(
    transactionId: string,
    status: string
  ): Promise<void> {
    const normalizedStatus = status.trim().toLowerCase()
    console.log('Sending admin notification for transaction:', transactionId, 'status:', normalizedStatus)

    try {
      let supabase
      try {
        supabase = createServerClient()
      } catch (clientError) {
        console.error('Failed to create Supabase client:', clientError)
        return
      }

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_id', transactionId)
        .single()

      if (transactionError) {
        console.error('Transaction query error:', transactionError)
        throw new Error(`Transaction query failed: ${transactionError.message}`)
      }

      if (!transaction) {
        console.error('Transaction not found for ID:', transactionId)
        throw new Error(`Transaction not found for ID: ${transactionId}`)
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', transaction.user_id)
        .single()

      if (userError || !user?.email) {
        console.error('User not found:', userError)
        throw new Error(`User not found or no email: ${userError?.message || 'No email address'}`)
      }

      const adminNotifyEmail =
        process.env.ADMIN_TRANSACTION_NOTIFICATION_EMAIL?.trim() || 'enyo@ciuna.com'

      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown'

      if (isHubTransaction(transaction)) {
        const snapshot: HubSnapshot = (transaction.hub_snapshot as HubSnapshot) || {}
        const adminHubData = {
          transactionId: transaction.transaction_id,
          status: normalizedStatus,
          userId: transaction.user_id,
          userEmail: user.email,
          userName,
          productTitle: snapshot.productTitle || 'Hub order',
          pricingType: snapshot.productPricingType || 'fixed',
          fundedAmount: Number(snapshot.fundedAmount ?? transaction.receive_amount ?? 0) || 0,
          fundedCurrency: String(snapshot.fundedCurrency ?? transaction.receive_currency ?? ''),
          sendAmount: Number(transaction.send_amount) || 0,
          sendCurrency: String(transaction.send_currency || ''),
          exchangeRate: Number(transaction.exchange_rate) || 0,
          corridorFee: Number(snapshot.corridorFeeAmount ?? transaction.fee_amount ?? 0) || 0,
          hubFee: Number(snapshot.hubFeeAmount ?? transaction.hub_fee_amount ?? 0) || 0,
          totalAmount: Number(transaction.total_amount) || 0,
          fulfillmentType: snapshot.fulfillmentType === 'in_person' ? 'in_person' : 'online',
          contactName: snapshot.contactName || '',
          contactPhone: snapshot.contactPhone || transaction.delivery_phone || '',
          deliveryAddressLine:
            snapshot.deliveryAddressLine != null
              ? String(snapshot.deliveryAddressLine)
              : (transaction.delivery_address_line as string | null) || null,
          createdAt: transaction.created_at,
          updatedAt: transaction.updated_at,
          failureReason: transaction.failure_reason,
        }
        const result = await emailService.sendEmail({
          to: adminNotifyEmail,
          template: 'adminHubTransactionNotification',
          data: adminHubData,
        })
        if (result.success) {
          console.log('Admin Hub notification email sent!', result.messageId)
        } else {
          console.error('Admin Hub notification email failed:', result.error)
        }
        return
      }

      let recipientName = 'Unknown'
      if (transaction.recipient_id) {
        const { data: recipient } = await supabase
          .from('recipients')
          .select('full_name')
          .eq('id', transaction.recipient_id)
          .single()
        recipientName = recipient?.full_name || 'Unknown'
      } else if (transaction.fulfillment_type === 'cash_hand') {
        recipientName =
          (transaction.delivery_address_line as string | null)?.trim() || 'Cash delivery'
      }

      const adminEmailData = {
        transactionId: transaction.transaction_id,
        status: normalizedStatus,
        sendAmount: transaction.send_amount,
        sendCurrency: transaction.send_currency,
        receiveAmount: transaction.receive_amount,
        receiveCurrency: transaction.receive_currency,
        exchangeRate: transaction.exchange_rate,
        fee: transaction.fee_amount,
        logisticsFee: transaction.logistics_fee_amount ?? 0,
        totalAmount: transaction.total_amount,
        fulfillmentType: transaction.fulfillment_type,
        recipientName,
        userId: transaction.user_id,
        userEmail: user.email,
        userName,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
        failureReason: transaction.failure_reason,
      }

      const result = await emailService.sendEmail({
        to: adminNotifyEmail,
        template: 'adminTransactionNotification',
        data: adminEmailData,
      })

      if (result.success) {
        console.log('Admin notification email sent successfully!', result.messageId)
      } else {
        console.error('Admin notification email sending failed:', result.error)
      }
    } catch (error) {
      console.error('Error sending admin notification email:', error)
    }
  }

  /**
   * Referral payout lifecycle (`referralPayoutPending` / `referralPayoutCompleted` / `referralPayoutCancelled`).
   * Used from POST /api/referrals/payout-request (pending) and admin complete/cancel routes.
   * Admin notification for new payout requests still uses `sendAdminTransactionNotification` (transaction id).
   */
  static async sendReferralPayoutStatusEmail(
    payoutRequestId: string,
    status: "pending" | "completed" | "cancelled",
    linkedTransactionId?: string,
  ): Promise<void> {
    try {
      const supabase = createServerClient()
      const { data: pay, error } = await supabase
        .from("referral_payout_requests")
        .select(
          `
          id,
          amount,
          currency,
          payout_transaction_id,
          recipient:recipients(full_name),
          user:users(email, first_name, preferred_language)
        `,
        )
        .eq("id", payoutRequestId)
        .single()

      if (error || !pay) {
        console.error("sendReferralPayoutStatusEmail: payout not found", error)
        return
      }

      const user = pay.user as { email?: string; first_name?: string; preferred_language?: string | null } | null
      const rec = pay.recipient as { full_name?: string } | { full_name?: string }[] | null
      const recipientName = Array.isArray(rec) ? rec[0]?.full_name : rec?.full_name

      if (!user?.email) {
        console.error("sendReferralPayoutStatusEmail: missing user email")
        return
      }
      const locale = normalizeLocale(user.preferred_language)

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.ciuna.com"
      const dashboardUrl =
        status === "completed" ? `${appUrl}/transactions` : `${appUrl}/more/referrals`

      const payoutTxnId =
        typeof pay.payout_transaction_id === "string" && pay.payout_transaction_id.trim()
          ? pay.payout_transaction_id.trim()
          : undefined

      const result = await emailService.sendReferralPayoutEmail(user.email, {
        firstName: user.first_name || "there",
        amount: Number(pay.amount),
        currency: pay.currency as string,
        recipientName: recipientName || "Recipient",
        status,
        payoutRequestId: payoutRequestId,
        payoutTransactionId: payoutTxnId,
        linkedTransactionId: status === "completed" ? linkedTransactionId : undefined,
        dashboardUrl,
        locale,
      })

      if (result.success) {
        console.log("Referral payout status email sent:", result.messageId)
      } else {
        console.error("Referral payout status email failed:", result.error)
      }
    } catch (e) {
      console.error("sendReferralPayoutStatusEmail:", e)
    }
  }
}
