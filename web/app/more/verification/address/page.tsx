"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Check, AlertCircle } from "lucide-react"
import Link from "next/link"
import { AppPageHeader } from "@/components/layout/app-page-header"
import { useAuth } from "@/lib/auth-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { kycService, KYCSubmission } from "@/lib/kyc-service"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

export default function AddressVerificationPage() {
  const { t } = useTranslation("app")
  const { userProfile } = useAuth()
  
  // Initialize from cache synchronously to prevent flicker
  // Use cached data even if expired to prevent skeleton flash
  const getInitialSubmission = (): KYCSubmission | null => {
    if (typeof window === "undefined") return null
    if (!userProfile?.id) return null
    try {
      const cached = localStorage.getItem(`ciuna_kyc_submissions_${userProfile.id}`)
      if (!cached) return null
      const { value } = JSON.parse(cached)
      // Always return cached value if it exists (even if expired) to prevent flicker
      const submissions = value as KYCSubmission[]
      return submissions.find(s => s.type === "address") || null
    } catch {
      return null
    }
  }

  const initialSubmission = getInitialSubmission()
  const [submission, setSubmission] = useState<KYCSubmission | null>(initialSubmission)
  const [loading, setLoading] = useState(false)
  const [selectedDocumentType, setSelectedDocumentType] = useState<
    "registration" | "utility_bill" | "bank_statement" | ""
  >((initialSubmission?.document_type as "registration" | "utility_bill" | "bank_statement") || "")
  const [addressFile, setAddressFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!userProfile?.id) return

    const CACHE_KEY = `ciuna_kyc_submissions_${userProfile.id}`
    const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

    const getCachedSubmissions = (): KYCSubmission[] | null => {
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (!cached) return null
        const { value, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_TTL) {
          return value
        }
        localStorage.removeItem(CACHE_KEY)
        return null
      } catch {
        return null
      }
    }

    const setCachedSubmissions = (value: KYCSubmission[]) => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          value,
          timestamp: Date.now()
        }))
      } catch {}
    }

    // Check cache first
    const cachedSubmissions = getCachedSubmissions()
    
    // If we have cached data, it's already set in useState initializer
    // Just fetch in background to ensure we have latest data
    if (cachedSubmissions) {
      const addressSubmission = cachedSubmissions.find(s => s.type === "address")
      if (addressSubmission && !submission) {
        // Only update if submission wasn't already set from initializer
        setSubmission(addressSubmission)
        setSelectedDocumentType(
          (addressSubmission.document_type as "registration" | "utility_bill" | "bank_statement") || "",
        )
      }
      
      // Fetch in background to ensure we have latest data
      const loadSubmission = async () => {
        try {
          const submissions = await kycService.getByUserId(userProfile.id)
          const addressSubmission = submissions.find(s => s.type === "address")
          if (addressSubmission) {
            // Only update if data changed (prevent flickering)
            setSubmission(prev => {
              if (!prev || JSON.stringify(prev) !== JSON.stringify(addressSubmission)) {
                setSelectedDocumentType(
          (addressSubmission.document_type as "registration" | "utility_bill" | "bank_statement") || "",
        )
                return addressSubmission
              }
              return prev
            })
          } else if (submission) {
            // If submission was deleted, clear it
            setSubmission(null)
          }
          setCachedSubmissions(submissions)
        } catch (error) {
          console.error("Error loading submission:", error)
        }
      }
      loadSubmission()
      return
    }

    // No cache - load with loading state
    const loadSubmission = async () => {
      setLoading(true)
      try {
        const submissions = await kycService.getByUserId(userProfile.id)
        const addressSubmission = submissions.find(s => s.type === "address")
        if (addressSubmission) {
          setSubmission(addressSubmission)
          setSelectedDocumentType(
          (addressSubmission.document_type as "registration" | "utility_bill" | "bank_statement") || "",
        )
        } else {
          setSubmission(null)
        }
        setCachedSubmissions(submissions)
      } catch (error) {
        console.error("Error loading submission:", error)
      } finally {
        setLoading(false)
      }
    }

    loadSubmission()
  }, [userProfile?.id])

  const handleFileSelect = (file: File) => {
    setUploadError(null)

    if (file.size > 10 * 1024 * 1024) {
      setUploadError(t("verification.fileTooLarge"))
      return
    }

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      setUploadError(t("verification.fileTypeInvalid"))
      return
    }

    setAddressFile(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    setAddressFile(null)
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    if (!selectedDocumentType || !addressFile || !userProfile?.id) {
      setUploadError(t("verification.fillAllFields"))
      return
    }

    // Don't allow if already in review or approved
    if (submission && (submission.status === "in_review" || submission.status === "approved")) {
      setUploadError(t("verification.addressLocked"))
      return
    }

    setUploading(true)
    setUploadError(null)
    try {
      const newSubmission = await kycService.createAddressSubmission(userProfile.id, {
        document_type: selectedDocumentType,
        address_document_file: addressFile,
      })

      // Ensure status is in_review after upload
      if (newSubmission.status !== "in_review") {
        newSubmission.status = "in_review"
      }
      
      setSubmission(newSubmission)
      setAddressFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Update cache
      const CACHE_KEY = `ciuna_kyc_submissions_${userProfile.id}`
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        let submissions: KYCSubmission[] = []
        if (cached) {
          try {
            const { value } = JSON.parse(cached)
            submissions = value || []
          } catch {}
        }
        // Update or add address submission
        const existingIndex = submissions.findIndex(s => s.type === "address")
        if (existingIndex >= 0) {
          submissions[existingIndex] = newSubmission
        } else {
          submissions.push(newSubmission)
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          value: submissions,
          timestamp: Date.now()
        }))
      } catch {}
    } catch (error: any) {
      console.error("Error uploading address document:", error)
      setUploadError(error.message || t("verification.failedUploadDocument"))
    } finally {
      setUploading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            {t("verification.badgeDone")}
          </span>
        )
      case "in_review":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            {t("verification.badgeInReview")}
          </span>
        )
      case "rejected":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            {t("verification.badgeRejected")}
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {t("verification.badgePending")}
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <AppPageHeader title={t("verification.addressPageTitle")} backHref="/more/verification" />

        <div className="px-5 sm:px-6 py-6 max-w-2xl mx-auto">
          {loading && !submission ? (
            // Show loading skeleton while fetching
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ) : submission ? (
            // Show record view if submission exists
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">{t("verification.labelDocumentType")}</Label>
                    <p className="text-base text-gray-900 mt-1">
                      {submission.document_type === "registration"
                        ? t("verification.registration")
                        : submission.document_type === "utility_bill"
                          ? t("verification.utilityBill")
                          : submission.document_type === "bank_statement"
                            ? t("verification.bankStatement")
                            : "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">{t("verification.labelDocument")}</Label>
                    <p className="text-base text-gray-900 mt-1">
                      {submission.address_document_filename || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">{t("verification.labelStatus")}</Label>
                    <div className="mt-1">
                      {getStatusBadge(submission.status)}
                    </div>
                  </div>
                </div>
              </div>
              {submission.status === "in_review" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    {t("verification.addressInReview")}
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Show form view
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>{t("verification.labelDocumentType")}</Label>
                <Select
                  value={selectedDocumentType}
                  onValueChange={(value) =>
                    setSelectedDocumentType(value as "registration" | "utility_bill" | "bank_statement")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("verification.placeholderSelectDocType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registration">{t("verification.registration")}</SelectItem>
                    <SelectItem value="utility_bill">{t("verification.utilityBill")}</SelectItem>
                    <SelectItem value="bank_statement">{t("verification.bankStatement")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>{t("verification.labelAddressDocument")}</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                />

                {/* Upload Error Alert */}
                {uploadError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-red-700 font-medium">{t("verification.uploadErrorTitle")}</p>
                        <p className="text-xs text-red-600 mt-1">{uploadError}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUploadError(null)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                <div
                  onClick={handleUploadClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200",
                    isDragOver
                      ? "border-primary bg-primary/[0.06] shadow-sm ring-2 ring-primary/35"
                      : addressFile
                        ? "border-green-300 bg-green-50"
                        : uploadError
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 hover:border-primary/35",
                  )}
                >
                  <div className="flex items-center justify-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        addressFile
                          ? "bg-green-100"
                          : uploadError
                            ? "bg-red-100"
                            : isDragOver
                              ? "bg-accent"
                              : "bg-gray-100 group-hover:bg-primary/5"
                      }`}
                    >
                      {addressFile ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : uploadError ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Upload
                          className={`h-5 w-5 transition-colors ${
                            isDragOver ? "text-primary" : "text-gray-400"
                          }`}
                        />
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {addressFile
                          ? addressFile.name
                          : uploadError
                            ? t("verification.uploadFailed")
                            : t("verification.uploadAddressTitle")}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {addressFile
                          ? `${(addressFile.size / 1024 / 1024).toFixed(2)} MB`
                          : uploadError
                            ? t("verification.clickToTryAgain")
                            : t("verification.fileHint")}
                      </p>
                    </div>
                    {addressFile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFile()
                        }}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!selectedDocumentType || !addressFile || uploading}
                className="w-full"
              >
                {uploading ? t("verification.uploading") : t("verification.submit")}
              </Button>
            </div>
          )}
        </div>
      </div>
  )
}

