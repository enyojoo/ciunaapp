// Type-level usage examples for the shared primitives (compiled by `tsc -p packages/ui-web`; not exported).
import * as React from "react"
import { AgeSla, Chip, DataTable, DueTimer, FileDrop, NoAccess, ProgressBar, RatingStars, ReasonDialog, SidePanel, Stepper } from "./index"

type Row = { id: string; name: string; total: number }

export function Examples() {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <NoAccess title="No access" reason="Ask the owner to grant this permission." backHref="/" backLabel="Back to home" />
      <FileDrop onFiles={(files) => void files.length} state="idle" />
      <DueTimer dueAt={new Date().toISOString()} />
      <RatingStars value={4.6} count={12} />
      <ProgressBar value={3} max={5} label="Profile" valueText="3 of 5" />
      <Chip tone="success">Live</Chip>
      <Stepper steps={[{ key: "a", label: "A" }, { key: "b", label: "B" }]} current={0} />
      <DataTable<Row> columns={[{ key: "n", header: "Name", cell: (r) => r.name }, { key: "t", header: "Total", align: "right", cell: (r) => r.total }]} rows={[]} rowKey={(r) => r.id} onRowClick={(r) => void r.id} />
      <SidePanel open={open} onOpenChange={setOpen} title="Details">Body</SidePanel>
      <ReasonDialog open={open} onOpenChange={setOpen} title="Reject" reasons={["Blurry"]} confirmLabel="Reject" onConfirm={(reason) => void reason} />
      <AgeSla since={Date.now() - 600_000} limitMinutes={5} />
    </>
  )
}
