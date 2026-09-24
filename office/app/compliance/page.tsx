"use client"

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Eye, User, Mail, Phone, Download, Check, X } from "lucide-react"
import { KYCSubmission } from "@/lib/kyc-service"
import { getIdTypeLabel } from "@/lib/country-id-types"
import { countryService, getCountryFlag } from "@/lib/country-service"
import { supabase } from "@/lib/supabase"
import { officeFetch } from "@/lib/api-client"
import { OfficeComplianceSkeleton } from "@/components/office-compliance-skeleton"
import { useOfficeData } from "@/hooks/use-office-data"
import {
  loadOfficeComplianceKycRows,
  getOfficeComplianceKycClientBootstrap,
  type OfficeComplianceKycUser,
} from "@/lib/office-compliance-cache"
import { OFFICE_UI_CACHE_TTL_MS } from "@/lib/office-ui-cache"

type ComplianceKycUser = OfficeComplianceKycUser

function submissionStatusActive(status?: string) {
  return status === "pending" || status === "in_review"
}

function getOverallRowSummary(row: ComplianceKycUser): { label: string; badgeClass: string } {
  const { identity: i, address: a } = row
  if (!i && !a) {
    return { label: "No submissions", badgeClass: "bg-gray-100 text-gray-700" }
  }
  if (i?.status === "rejected" || a?.status === "rejected") {
    return { label: "Rejected", badgeClass: "bg-red-100 text-red-800" }
  }
  if (i?.status === "approved" && a?.status === "approved") {
    return { label: "Verified", badgeClass: "bg-green-100 text-green-800" }
  }
  if (submissionStatusActive(i?.status) || submissionStatusActive(a?.status)) {
    return { label: "In review", badgeClass: "bg-yellow-100 text-yellow-800" }
  }
  if (i?.status === "approved" && !a) {
    return { label: "Address missing", badgeClass: "bg-gray-100 text-gray-800" }
  }
  if (!i && a?.status === "approved") {
    return { label: "Identity missing", badgeClass: "bg-gray-100 text-gray-800" }
  }
  return { label: "In progress", badgeClass: "bg-gray-100 text-gray-800" }
}

function rowMatchesStatusFilter(row: ComplianceKycUser, filter: string): boolean {
  const { identity: i, address: a } = row
  if (filter === "all") return true
  if (filter === "verified") return i?.status === "approved" && a?.status === "approved"
  if (filter === "rejected") return i?.status === "rejected" || a?.status === "rejected"
  if (filter === "in_review") {
    return submissionStatusActive(i?.status) || submissionStatusActive(a?.status)
  }
  if (filter === "pending") {
    return i?.status === "pending" || a?.status === "pending"
  }
  return true
}

export default function OfficeCompliancePage() {
  useOfficeData()
  const [bootstrapped, setBootstrapped] = useState(false)
  const [rows, setRows] = useState<ComplianceKycUser[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRow, setSelectedRow] = useState<ComplianceKycUser | null>(null)
  const [userDetailsDialogOpen, setUserDetailsDialogOpen] = useState(false)
  const [countries, setCountries] = useState<{ code: string; name: string; flag_emoji?: string }[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const [noticeDialog, setNoticeDialog] = useState<{
    open: boolean
    title: string
    message: string
    type: "success" | "error"
  }>({ open: false, title: "", message: "", type: "success" })

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null)
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">("approved")
  const [rejectionReason, setRejectionReason] = useState("")
  const [updating, setUpdating] = useState(false)

  const rowsRef = useRef(rows)
  rowsRef.current = rows
  const selectedUserIdRef = useRef<string | null>(null)
  selectedUserIdRef.current = selectedRow?.userId ?? null

  const loadData = useCallback(async (opts?: { showLoading?: boolean; force?: boolean }): Promise<ComplianceKycUser[]> => {
    const showLoading = opts?.showLoading !== false
    const force = Boolean(opts?.force)
    try {
      if (showLoading && rowsRef.current.length === 0) {
        setLoading(true)
      }

      const nextRows = await loadOfficeComplianceKycRows(OFFICE_UI_CACHE_TTL_MS, { force })
      setRows((prev) => {
        const prevStr = JSON.stringify(prev)
        const nextStr = JSON.stringify(nextRows)
        if (prevStr === nextStr) return prev
        return nextRows
      })
      return nextRows
    } catch (error) {
      console.error("Error loading compliance KYC:", error)
      setNoticeDialog({
        open: true,
        title: "Could not load KYC",
        message: error instanceof Error ? error.message : "Unknown error",
        type: "error",
      })
      return rowsRef.current.length > 0 ? rowsRef.current : []
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadCountries()
  }, [])

  useLayoutEffect(() => {
    let cancelled = false
    const { rows: bootRows, hasSnapshot } = getOfficeComplianceKycClientBootstrap()
    setRows(bootRows)
    const block = bootRows.length === 0 && !hasSnapshot
    setLoading(block)
    setBootstrapped(true)
    void (async () => {
      try {
        await loadData({ showLoading: block, force: false })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadData])

  useEffect(() => {
    const channel = supabase
      .channel("admin-compliance-kyc-submissions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kyc_submissions" },
        async () => {
          try {
            const updated = await loadData({ showLoading: false, force: true })
            const uid = selectedUserIdRef.current
            if (uid) {
              const next = updated.find((r) => r.userId === uid)
              if (next) setSelectedRow(next)
            }
          } catch (e) {
            console.error("Realtime KYC refresh failed:", e)
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("Admin compliance realtime error")
        }
      })

    channelRef.current = channel
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [loadData])

  const loadCountries = async () => {
    try {
      const data = await countryService.getAll()
      setCountries(data)
    } catch (error) {
      console.error("Error loading countries:", error)
    }
  }

  const handleViewFile = async (filePathOrUrl: string | null | undefined) => {
    if (!filePathOrUrl) return
    const isPath =
      filePathOrUrl.startsWith("identity/") || filePathOrUrl.startsWith("address/")
    if (isPath) {
      try {
        const response = await officeFetch(
          `/api/admin/kyc/documents?path=${encodeURIComponent(filePathOrUrl)}`
        )
        if (response.ok) {
          const data = await response.json()
          if (data.url) window.open(data.url, "_blank")
          else alert("No document URL returned.")
        } else {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          alert(`Failed to access document: ${errorData.error || response.statusText}`)
        }
      } catch (error: unknown) {
        alert(error instanceof Error ? error.message : "Failed to access document")
      }
    } else {
      window.open(filePathOrUrl, "_blank")
    }
  }

  const getSubmissionStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>
      case "in_review":
        return <Badge className="bg-yellow-100 text-yellow-700">In review</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700">Pending</Badge>
    }
  }

  const handleReviewSubmit = async () => {
    if (!selectedSubmission) return
    setUpdating(true)
    try {
      const response = await officeFetch("/api/admin/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          status: reviewStatus,
          rejectionReason: reviewStatus === "rejected" ? rejectionReason : undefined,
        }),
      })
      if (response.ok) {
        const updated = await loadData({ showLoading: false, force: true })
        if (selectedRow) {
          const next = updated.find((r) => r.userId === selectedRow.userId)
          if (next) setSelectedRow(next)
        }
        setReviewDialogOpen(false)
        setSelectedSubmission(null)
        setRejectionReason("")
      } else {
        const err = await response.json().catch(() => ({}))
        setNoticeDialog({
          open: true,
          title: "Update failed",
          message: err.error || "Could not update submission",
          type: "error",
        })
      }
    } catch (e) {
      setNoticeDialog({
        open: true,
        title: "Update failed",
        message: e instanceof Error ? e.message : "Unknown error",
        type: "error",
      })
    } finally {
      setUpdating(false)
    }
  }

  const openReview = (submission: KYCSubmission) => {
    setSelectedSubmission(submission)
    setReviewStatus("approved")
    setRejectionReason("")
    setReviewDialogOpen(true)
  }

  const getCountryName = (code?: string) => {
    if (!code) return "-"
    const country = countries.find((c) => c.code === code)
    const flag = country ? getCountryFlag(code) : ""
    return country ? `${flag} ${country.name}` : code
  }

  const displayName = (row: ComplianceKycUser) => {
    const n = [row.first_name, row.last_name].filter(Boolean).join(" ").trim()
    if (n) return n
    return row.email || row.userId
  }

  const filteredRows = rows.filter((row) => {
    if (!rowMatchesStatusFilter(row, statusFilter)) return false
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return (
      displayName(row).toLowerCase().includes(q) ||
      (row.email?.toLowerCase().includes(q) ?? false) ||
      row.userId.toLowerCase().includes(q)
    )
  })

  if (bootstrapped && loading && rows.length === 0) {
    return (
      <OfficeDashboardLayout>
        <OfficeComplianceSkeleton />
      </OfficeDashboardLayout>
    )
  }

  return (
    <OfficeDashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search and filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or user id..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] shrink-0">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified (both)</SelectItem>
                  <SelectItem value="in_review">In review / pending</SelectItem>
                  <SelectItem value="pending">Submission pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Overall</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        No KYC submissions match this filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => {
                      const o = getOverallRowSummary(row)
                      return (
                        <TableRow key={row.userId}>
                          <TableCell className="font-medium">{displayName(row)}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {row.email || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge className={o.badgeClass}>{o.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRow(row)
                                setUserDetailsDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={userDetailsDialogOpen} onOpenChange={setUserDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" key={selectedRow?.userId}>
            <DialogHeader>
              <DialogTitle>
                KYC — {selectedRow ? displayName(selectedRow) : ""}
              </DialogTitle>
              <DialogDescription className="text-left">
                User ID: {selectedRow?.userId}
                {selectedRow?.email ? ` · ${selectedRow.email}` : ""}
              </DialogDescription>
            </DialogHeader>
            {selectedRow && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <User className="h-4 w-4" />
                      <span>Name</span>
                    </div>
                    <p className="text-base font-medium">{displayName(selectedRow)}</p>
                  </div>
                  {selectedRow.email && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </div>
                      <p className="text-base">{selectedRow.email}</p>
                    </div>
                  )}
                  {selectedRow.phone && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Phone className="h-4 w-4" />
                        <span>Phone</span>
                      </div>
                      <p className="text-base">{selectedRow.phone}</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Send identity (Bitbanker)</h3>
                  {selectedRow.bitbanker?.formSnapshot ? (
                    <div className="bg-gradient-to-br from-orange-50/80 to-white border border-orange-100 rounded-xl p-4 shadow-sm space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={
                            selectedRow.bitbanker.isVerifiedForSbp
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {selectedRow.bitbanker.isVerifiedForSbp ? "Verified for Send" : "Not verified for Send"}
                        </Badge>
                        {selectedRow.bitbanker.submittedAt ? (
                          <span className="text-xs text-gray-500">
                            Submitted {new Date(selectedRow.bitbanker.submittedAt).toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {Object.entries(selectedRow.bitbanker.formSnapshot).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-gray-500 text-xs capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>{" "}
                            <span className="font-medium break-all">{value}</span>
                          </div>
                        ))}
                      </div>
                      {selectedRow.bitbanker.clientId ? (
                        <p className="text-xs text-gray-500">Client ID: {selectedRow.bitbanker.clientId}</p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-500">
                      No Bitbanker verification form on file
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Identity</h3>
                  {selectedRow.identity ? (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          {getSubmissionStatusBadge(selectedRow.identity.status)}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedRow.identity.id_document_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewFile(selectedRow.identity!.id_document_url)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              ID document
                            </Button>
                          )}
                          {selectedRow.identity.status !== "approved" &&
                            selectedRow.identity.status !== "rejected" && (
                              <Button variant="default" size="sm" onClick={() => openReview(selectedRow.identity!)}>
                                Review
                              </Button>
                            )}
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        {selectedRow.identity.full_name && (
                          <div>
                            <span className="text-gray-500 text-xs">Submitted name:</span>{" "}
                            <span className="font-medium">{selectedRow.identity.full_name}</span>
                          </div>
                        )}
                        {selectedRow.identity.date_of_birth && (
                          <div>
                            <span className="text-gray-500 text-xs">DOB:</span>{" "}
                            {new Date(selectedRow.identity.date_of_birth).toLocaleDateString()}
                          </div>
                        )}
                        {selectedRow.identity.country_code && (
                          <div>
                            <span className="text-gray-500 text-xs">Country:</span>{" "}
                            {getCountryName(selectedRow.identity.country_code)}
                          </div>
                        )}
                        {selectedRow.identity.id_type && (
                          <div>
                            <span className="text-gray-500 text-xs">ID type:</span>{" "}
                            {getIdTypeLabel(selectedRow.identity.id_type)}
                          </div>
                        )}
                        {selectedRow.identity.rejection_reason && (
                          <div className="text-red-700 text-xs">
                            Rejection: {selectedRow.identity.rejection_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-500">
                      No identity submission yet
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Address</h3>
                  {selectedRow.address ? (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          {getSubmissionStatusBadge(selectedRow.address.status)}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedRow.address.address_document_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewFile(selectedRow.address!.address_document_url)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Address document
                            </Button>
                          )}
                          {selectedRow.address.status !== "approved" &&
                            selectedRow.address.status !== "rejected" && (
                              <Button variant="default" size="sm" onClick={() => openReview(selectedRow.address!)}>
                                Review
                              </Button>
                            )}
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        {selectedRow.address.country_code && (
                          <div>
                            <span className="text-gray-500 text-xs">Country:</span>{" "}
                            {getCountryName(selectedRow.address.country_code)}
                          </div>
                        )}
                        {selectedRow.address.address && (
                          <div>
                            <span className="text-gray-500 text-xs">Address:</span>{" "}
                            {selectedRow.address.address}
                          </div>
                        )}
                        {selectedRow.address.document_type && (
                          <div>
                            <span className="text-gray-500 text-xs">Proof type:</span>{" "}
                            {selectedRow.address.document_type.replace(/_/g, " ")}
                          </div>
                        )}
                        {selectedRow.address.rejection_reason && (
                          <div className="text-red-700 text-xs">
                            Rejection: {selectedRow.address.rejection_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-500">
                      No address submission yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Review submission</DialogTitle>
              <DialogDescription>
                {selectedSubmission?.type === "identity" ? "Identity" : "Address"} verification
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Decision</Label>
                <div className="flex gap-2">
                  <Button
                    variant={reviewStatus === "approved" ? "default" : "outline"}
                    onClick={() => setReviewStatus("approved")}
                    className="flex-1"
                    type="button"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant={reviewStatus === "rejected" ? "default" : "outline"}
                    onClick={() => setReviewStatus("rejected")}
                    className="flex-1"
                    type="button"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
              {reviewStatus === "rejected" && (
                <div className="space-y-2">
                  <Label>Rejection reason</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason shown to operations / user comms as needed"
                    rows={3}
                  />
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReviewDialogOpen(false)
                    setSelectedSubmission(null)
                    setRejectionReason("")
                  }}
                  className="flex-1"
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReviewSubmit}
                  disabled={updating || (reviewStatus === "rejected" && !rejectionReason.trim())}
                  className="flex-1"
                  type="button"
                >
                  {updating ? "Saving…" : "Submit"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={noticeDialog.open}
          onOpenChange={(open) => setNoticeDialog({ ...noticeDialog, open })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle
                className={noticeDialog.type === "success" ? "text-green-600" : "text-red-600"}
              >
                {noticeDialog.title}
              </AlertDialogTitle>
              <AlertDialogDescription>{noticeDialog.message}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => setNoticeDialog({ ...noticeDialog, open: false })}
              >
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </OfficeDashboardLayout>
  )
}
