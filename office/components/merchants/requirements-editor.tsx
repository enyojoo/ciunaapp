"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface KybField { key: string; label: string; type: string; required: boolean }
export interface KybDocument { kind: string; label: string; required: boolean; expires: boolean }
export interface KybRequirements { fields: KybField[]; documents: KybDocument[] }

const FIELD_TYPES = ["text", "number", "date", "country", "phone"]

export function RequirementsEditor({
  value, onChange, readOnly,
}: { value: KybRequirements; onChange: (v: KybRequirements) => void; readOnly?: boolean }) {
  const setField = (i: number, p: Partial<KybField>) =>
    onChange({ ...value, fields: value.fields.map((f, j) => (j === i ? { ...f, ...p } : f)) })
  const setDoc = (i: number, p: Partial<KybDocument>) =>
    onChange({ ...value, documents: value.documents.map((d, j) => (j === i ? { ...d, ...p } : d)) })

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Fields</h4>
          {!readOnly && (
            <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...value, fields: [...value.fields, { key: "", label: "", type: "text", required: true }] })}>
              <Plus className="mr-1 h-3.5 w-3.5" />Add field
            </Button>
          )}
        </div>
        {value.fields.length === 0 && <p className="text-xs text-muted-foreground">No fields.</p>}
        {value.fields.map((f, i) => (
          <div key={i} className="grid grid-cols-[1fr_1.4fr_7rem_auto_auto] items-center gap-2">
            <Input placeholder="key" value={f.key} disabled={readOnly} onChange={(e) => setField(i, { key: e.target.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_") })} aria-label="Field key" />
            <Input placeholder="Label" value={f.label} disabled={readOnly} onChange={(e) => setField(i, { label: e.target.value })} aria-label="Field label" />
            <Select value={f.type} onValueChange={(v) => setField(i, { type: v })} disabled={readOnly}>
              <SelectTrigger aria-label="Field type"><SelectValue /></SelectTrigger>
              <SelectContent>{FIELD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <label className="flex items-center gap-1.5 text-xs">
              <Checkbox checked={f.required} disabled={readOnly} onCheckedChange={(c) => setField(i, { required: c === true })} />Required
            </label>
            {!readOnly ? (
              <Button type="button" size="icon" variant="ghost" aria-label="Remove field" onClick={() => onChange({ ...value, fields: value.fields.filter((_, j) => j !== i) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : <span />}
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Documents</h4>
          {!readOnly && (
            <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...value, documents: [...value.documents, { kind: "", label: "", required: true, expires: false }] })}>
              <Plus className="mr-1 h-3.5 w-3.5" />Add document
            </Button>
          )}
        </div>
        {value.documents.length === 0 && <p className="text-xs text-muted-foreground">No documents.</p>}
        {value.documents.map((d, i) => (
          <div key={i} className="grid grid-cols-[1fr_1.4fr_auto_auto_auto] items-center gap-2">
            <Input placeholder="kind" value={d.kind} disabled={readOnly} onChange={(e) => setDoc(i, { kind: e.target.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_") })} aria-label="Document kind" />
            <Input placeholder="Label" value={d.label} disabled={readOnly} onChange={(e) => setDoc(i, { label: e.target.value })} aria-label="Document label" />
            <label className="flex items-center gap-1.5 text-xs">
              <Checkbox checked={d.required} disabled={readOnly} onCheckedChange={(c) => setDoc(i, { required: c === true })} />Required
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              <Checkbox checked={d.expires} disabled={readOnly} onCheckedChange={(c) => setDoc(i, { expires: c === true })} />Expires
            </label>
            {!readOnly ? (
              <Button type="button" size="icon" variant="ghost" aria-label="Remove document" onClick={() => onChange({ ...value, documents: value.documents.filter((_, j) => j !== i) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : <span />}
          </div>
        ))}
      </section>
    </div>
  )
}

export function validateRequirements(country: string, v: KybRequirements): string | null {
  if (!(country === "*" || /^[A-Za-z]{2}$/.test(country))) return "Country must be * or a 2-letter code."
  if (v.fields.length + v.documents.length === 0) return "Add at least one field or document."
  if (v.fields.some((f) => !f.key || !f.label)) return "Every field needs a key and a label."
  if (v.documents.some((d) => !d.kind || !d.label)) return "Every document needs a kind and a label."
  const dupe = (arr: string[]) => new Set(arr).size !== arr.length
  if (dupe(v.fields.map((f) => f.key))) return "Field keys must be unique."
  if (dupe(v.documents.map((d) => d.kind))) return "Document kinds must be unique."
  return null
}
