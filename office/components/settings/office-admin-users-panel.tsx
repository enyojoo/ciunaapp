"use client"

import { useState } from "react"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { officeFetch } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { SUPER_ADMIN_ROLE } from "@/lib/admin-role"

const ASSIGNABLE_ROLES = ["ops", "support", "finance", "compliance", "super_admin"]

export type AdminUserRow = {
  id: string
  email: string
  name: string | null
  role: string
  status: string | null
  created_at: string | null
}

function formatAdminRole(role: string): string {
  if (role === SUPER_ADMIN_ROLE) return "Super admin"
  if (role === "admin") return "Admin"
  return role
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

function formatAdminStatus(status: string | null): string {
  if (status == null || status === "") return "—"
  const s = status.toLowerCase()
  if (s === "active") return "Active"
  if (s === "inactive") return "Inactive"
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function AdminUsersTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Skeleton className="h-4 w-36" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-44" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="w-[100px]">
              <Skeleton className="h-4 w-8" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-24 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export type OfficeAdminUsersPanelProps = {
  settingsBootComplete: boolean
  adminUsers: AdminUserRow[]
  onReloadAdminUsers: () => Promise<void>
}

export function OfficeAdminUsersPanel({
  settingsBootComplete,
  adminUsers,
  onReloadAdminUsers,
}: OfficeAdminUsersPanelProps) {
  const { user } = useAuth()
  const [actionSaving, setActionSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("ops")

  const showSkeleton = !settingsBootComplete
  const showEmpty = settingsBootComplete && adminUsers.length === 0
  const showTable = settingsBootComplete && adminUsers.length > 0

  const handleCreate = async () => {
    setActionSaving(true)
    try {
      const res = await officeFetch("/api/admin/admin-users", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), name: name.trim(), role }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(j?.error || "Failed to add admin")
        return
      }
      setOpen(false)
      setEmail("")
      setName("")
      await onReloadAdminUsers()
    } finally {
      setActionSaving(false)
    }
  }

  const handleRole = async (id: string, next: string) => {
    setActionSaving(true)
    try {
      const res = await officeFetch(`/api/admin/admin-users/${id}`, { method: "PATCH", body: JSON.stringify({ role: next }) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) alert(j?.error || "Failed to change role")
      await onReloadAdminUsers()
    } finally {
      setActionSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this admin user? They will no longer be able to sign in to Office.")) return
    setActionSaving(true)
    try {
      const res = await officeFetch(`/api/admin/admin-users/${id}`, { method: "DELETE" })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(j?.error || "Failed to deactivate")
        return
      }
      await onReloadAdminUsers()
    } finally {
      setActionSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Office administrators</CardTitle>
        <CardAction>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" disabled={!settingsBootComplete}>
                <Plus className="h-4 w-4 mr-2" />
                Add admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite admin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-name">Display name</Label>
                  <Input
                    id="admin-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-role">Role</Label>
                  <select
                    id="admin-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    {ASSIGNABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {formatAdminRole(r)}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={actionSaving || !email.trim()}
                  onClick={() => void handleCreate()}
                >
                  {actionSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Send invite
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardAction>
      </CardHeader>
      <CardContent>
        {showSkeleton ? <AdminUsersTableSkeleton /> : null}

        {showTable ? (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((r) => {
                  const displayName = r.name?.trim() || "—"
                  return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{displayName}</TableCell>
                    <TableCell className="text-muted-foreground">{r.email}</TableCell>
                    <TableCell>
                      {r.status === "active" && r.id !== user?.id ? (
                        <select
                          aria-label={`Role for ${r.email}`}
                          value={ASSIGNABLE_ROLES.includes(r.role) ? r.role : "ops"}
                          disabled={actionSaving}
                          onChange={(e) => void handleRole(r.id, e.target.value)}
                          className="h-8 rounded-md border bg-background px-2 text-sm"
                        >
                          {ASSIGNABLE_ROLES.map((x) => (
                            <option key={x} value={x}>
                              {formatAdminRole(x)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge variant={r.role === SUPER_ADMIN_ROLE ? "default" : "secondary"}>{formatAdminRole(r.role)}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          r.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {formatAdminStatus(r.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.status === "active" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          disabled={actionSaving || r.id === user?.id}
                          onClick={() => void handleDelete(r.id)}
                          title={r.id === user?.id ? "Cannot deactivate yourself" : undefined}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : null}

        {showEmpty ? (
          <div className="py-8 text-center text-gray-500">
            <p>No admin users yet</p>
            <p className="mt-1 text-sm text-gray-400">Invite someone to grant Office access.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
