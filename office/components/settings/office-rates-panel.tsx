"use client"

import { useMemo, useState } from "react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, MoreHorizontal, Edit, Pause, Trash2, Loader2, X, TrendingUp } from "lucide-react"
import { useOfficeData } from "@/hooks/use-office-data"
import { officeDataStore } from "@/lib/office-data-store"
import { OfficeRatesTabSkeleton } from "@/components/office-rates-skeleton"

export type OfficeRatesPanelProps = {
  /** Matches other settings tabs: wait until `loadAllData` finishes before showing live data. */
  settingsBootComplete: boolean
}

export function OfficeRatesPanel({ settingsBootComplete }: OfficeRatesPanelProps) {
  const { data, loading } = useOfficeData()
  const [selectedCurrency, setSelectedCurrency] = useState<any>(null)
  const [isEditingRates, setIsEditingRates] = useState(false)
  const [isAddingCurrency, setIsAddingCurrency] = useState(false)
  const [newCurrencyData, setNewCurrencyData] = useState({
    code: "",
    name: "",
    symbol: "",
    flag_svg: "",
    can_send: true,
    can_receive: true,
  })
  const [rateUpdates, setRateUpdates] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [currencySettings, setCurrencySettings] = useState({
    can_send: true,
    can_receive: true,
  })
  const [receiveCompletionTimer, setReceiveCompletionTimer] = useState({ hours: 1, minutes: 0, seconds: 0 })

  const secondsToTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return { hours, minutes, seconds }
  }

  const timeToSeconds = (hours: number, minutes: number, seconds: number) =>
    hours * 3600 + minutes * 60 + seconds

  const optionalReceiveBound = (raw: string | undefined): number | null => {
    if (raw == null || String(raw).trim() === "") return null
    const n = Number.parseFloat(raw)
    return Number.isFinite(n) ? n : null
  }

  const currencies = data?.currencies ?? []
  const exchangeRates = data?.exchangeRates ?? []

  /** Latest row touch on `exchange_rates` (cron rate-sync / office edits) — matches pre–settings-UX subtitle behavior. */
  const lastRatesUpdateAt = useMemo(() => {
    let maxMs = 0
    for (const r of exchangeRates) {
      const raw = r.updated_at ?? r.created_at
      if (raw == null) continue
      const t = new Date(raw as string).getTime()
      if (Number.isFinite(t) && t > maxMs) maxMs = t
    }
    return maxMs > 0 ? new Date(maxMs) : null
  }, [exchangeRates])

  const showSkeleton = !settingsBootComplete || (loading && !data)

  const handleAddCurrency = async () => {
    try {
      setSaving(true)

      const currencyData = {
        code: newCurrencyData.code.toUpperCase(),
        name: newCurrencyData.name,
        symbol: newCurrencyData.symbol,
        flag_svg:
          newCurrencyData.flag_svg ||
          `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32"><rect width="32" height="32" fill="#ccc"/></svg>`,
        status: "active",
        can_send: newCurrencyData.can_send ?? true,
        can_receive: newCurrencyData.can_receive ?? true,
      }

      const newCurrency = await officeDataStore.addCurrency(currencyData)

      // Create default exchange rates for the new currency
      const existingCurrencies = currencies.filter((c) => c.code !== newCurrencyData.code.toUpperCase())
      const newRates = []

      // Add rates FROM new currency TO existing currencies
      for (const currency of existingCurrencies) {
        newRates.push({
          from_currency: newCurrencyData.code.toUpperCase(),
          to_currency: currency.code,
          rate: 1,
          fee_type: "free",
          fee_amount: 0,
          min_amount: 10,
          max_amount: 1000000,
          logistics_fee_type: "free",
          logistics_fee_amount: 0,
          status: "active",
        })
      }

      // Add rates FROM existing currencies TO new currency
      for (const currency of existingCurrencies) {
        newRates.push({
          from_currency: currency.code,
          to_currency: newCurrencyData.code.toUpperCase(),
          rate: 1,
          fee_type: "free",
          fee_amount: 0,
          min_amount: 10,
          max_amount: 1000000,
          logistics_fee_type: "free",
          logistics_fee_amount: 0,
          status: "active",
        })
      }

      if (newRates.length > 0) {
        await officeDataStore.updateExchangeRates(newRates)
      }

      setNewCurrencyData({ code: "", name: "", symbol: "", flag_svg: "", can_send: true, can_receive: true })
      setIsAddingCurrency(false)
    } catch (error) {
      console.error("Error adding currency:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleEditRates = (currency: any) => {
    setSelectedCurrency(currency)
    const currencyRates = exchangeRates.filter((rate) => rate.from_currency === currency.code)
    const updates: any = {}

    currencyRates.forEach((rate: any) => {
      updates[rate.to_currency] = {
        rate: rate.rate.toString(),
        feeType: rate.fee_type,
        feeAmount: rate.fee_amount.toString(),
        minAmount: (rate.min_amount || 0).toString(),
        maxAmount: (rate.max_amount || 1000000).toString(),
        bankReceiveMin: rate.bank_receive_min != null ? String(rate.bank_receive_min) : "",
        bankReceiveMax: rate.bank_receive_max != null ? String(rate.bank_receive_max) : "",
        cashReceiveMin: rate.cash_receive_min != null ? String(rate.cash_receive_min) : "",
        cashReceiveMax: rate.cash_receive_max != null ? String(rate.cash_receive_max) : "",
        logisticsFeeType: rate.logistics_fee_type ?? "free",
        logisticsFeeAmount: (rate.logistics_fee_amount ?? 0).toString(),
      }
    })

    setRateUpdates(updates)
    setCurrencySettings({
      can_send: currency.can_send ?? true,
      can_receive: currency.can_receive ?? true,
    })
    setReceiveCompletionTimer(secondsToTime(currency.receive_completion_timer_seconds ?? 3600))
    setIsEditingRates(true)
  }

  const handleSaveRates = async () => {
    try {
      setSaving(true)
      const updates = []

      for (const [toCurrency, rateData] of Object.entries(rateUpdates)) {
        const rateInfo = rateData as any
        const existingRate = exchangeRates.find(
          (r) => r.from_currency === selectedCurrency.code && r.to_currency === toCurrency,
        )
        const metadata =
          existingRate?.metadata && typeof existingRate.metadata === "object" && !Array.isArray(existingRate.metadata)
            ? { ...(existingRate.metadata as Record<string, unknown>) }
            : ({} as Record<string, unknown>)

        updates.push({
          from_currency: selectedCurrency.code,
          to_currency: toCurrency,
          rate: Number.parseFloat(rateInfo.rate),
          fee_type: rateInfo.feeType,
          fee_amount: Number.parseFloat(rateInfo.feeAmount || "0"),
          min_amount: Number.parseFloat(rateInfo.minAmount || "0"),
          max_amount: Number.parseFloat(rateInfo.maxAmount || "1000000"),
          bank_receive_min: optionalReceiveBound(rateInfo.bankReceiveMin),
          bank_receive_max: optionalReceiveBound(rateInfo.bankReceiveMax),
          cash_receive_min: optionalReceiveBound(rateInfo.cashReceiveMin),
          cash_receive_max: optionalReceiveBound(rateInfo.cashReceiveMax),
          logistics_fee_type: rateInfo.logisticsFeeType ?? "free",
          logistics_fee_amount: Number.parseFloat(rateInfo.logisticsFeeAmount || "0"),
          metadata,
          status: "active",
          updated_at: new Date().toISOString(),
        })
      }

      if (updates.length > 0) {
        await officeDataStore.updateExchangeRates(updates)
      }

      // Update currency send/receive settings
      if (selectedCurrency) {
        await officeDataStore.updateCurrency(selectedCurrency.id, {
          can_send: currencySettings.can_send,
          can_receive: currencySettings.can_receive,
          receive_completion_timer_seconds: timeToSeconds(
            receiveCompletionTimer.hours,
            receiveCompletionTimer.minutes,
            receiveCompletionTimer.seconds,
          ),
        })
      }

      setIsEditingRates(false)
      setSelectedCurrency(null)
      setRateUpdates({})
      setCurrencySettings({ can_send: true, can_receive: true })
      setReceiveCompletionTimer({ hours: 1, minutes: 0, seconds: 0 })
    } catch (error) {
      console.error("Error saving rates:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleSuspendCurrency = async (currencyId: string) => {
    try {
      const currency = currencies.find((c) => c.id === currencyId)
      if (!currency) return

      const newStatus = currency.status === "active" ? "suspended" : "active"
      await officeDataStore.updateCurrencyStatus(currencyId, newStatus)
    } catch (error) {
      console.error("Error updating currency status:", error)
    }
  }

  const handleDeleteCurrency = async (currencyId: string) => {
    if (currencies.length <= 2) {
      return
    }

    if (!confirm("Are you sure you want to delete this currency? This will also delete all related exchange rates.")) {
      return
    }

    try {
      await officeDataStore.deleteCurrency(currencyId)
    } catch (error) {
      console.error("Error deleting currency:", error)
    }
  }

  const updateRateField = (toCurrency: string, field: string, value: string) => {
    setRateUpdates((prev: any) => ({
      ...prev,
      [toCurrency]: {
        ...prev[toCurrency],
        [field]: value,
      },
    }))
  }

  const getCurrencyRates = (currencyCode: string) => {
    return exchangeRates.filter((rate) => rate.from_currency === currencyCode)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{'Currencies & exchange rates'}</CardTitle>
        <CardDescription>
          <span className="block text-xs tabular-nums text-gray-500">
            Last update:{" "}
            <span className="font-medium text-gray-900">
              {lastRatesUpdateAt
                ? lastRatesUpdateAt.toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "—"}
            </span>
          </span>
        </CardDescription>
        <CardAction>
          <Dialog open={isAddingCurrency} onOpenChange={setIsAddingCurrency}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" disabled={!settingsBootComplete}>
                <Plus className="h-4 w-4 mr-2" />
                Add Currency
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Currency</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currencyCode">Currency Code *</Label>
                  <Input
                    id="currencyCode"
                    value={newCurrencyData.code}
                    onChange={(e) => setNewCurrencyData({ ...newCurrencyData, code: e.target.value })}
                    placeholder="e.g., USD"
                    maxLength={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencyName">Currency Name *</Label>
                  <Input
                    id="currencyName"
                    value={newCurrencyData.name}
                    onChange={(e) => setNewCurrencyData({ ...newCurrencyData, name: e.target.value })}
                    placeholder="e.g., US Dollar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencySymbol">Currency Symbol *</Label>
                  <Input
                    id="currencySymbol"
                    value={newCurrencyData.symbol}
                    onChange={(e) => setNewCurrencyData({ ...newCurrencyData, symbol: e.target.value })}
                    placeholder="e.g., $"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencyFlag">Flag SVG (Optional)</Label>
                  <Input
                    id="currencyFlag"
                    value={newCurrencyData.flag_svg}
                    onChange={(e) => setNewCurrencyData({ ...newCurrencyData, flag_svg: e.target.value })}
                    placeholder="SVG code for flag"
                  />
                </div>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canSend"
                      checked={newCurrencyData.can_send}
                      onCheckedChange={(checked) =>
                        setNewCurrencyData({ ...newCurrencyData, can_send: checked as boolean })
                      }
                    />
                    <Label htmlFor="canSend" className="font-normal cursor-pointer">
                      Can Send
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canReceive"
                      checked={newCurrencyData.can_receive}
                      onCheckedChange={(checked) =>
                        setNewCurrencyData({ ...newCurrencyData, can_receive: checked as boolean })
                      }
                    />
                    <Label htmlFor="canReceive" className="font-normal cursor-pointer">
                      Can Receive
                    </Label>
                  </div>
                </div>
                <Button
                  onClick={handleAddCurrency}
                  disabled={!newCurrencyData.code || !newCurrencyData.name || !newCurrencyData.symbol || saving}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Currency
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-6 p-0 px-6 pb-6">
        {showSkeleton ? (
          <OfficeRatesTabSkeleton />
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Currency</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currencies.map((currency) => (
                  <TableRow key={currency.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div dangerouslySetInnerHTML={{ __html: currency.flag_svg }} />
                        <span className="font-medium">{currency.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{currency.code}</TableCell>
                    <TableCell className="font-medium">{currency.symbol}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          currency.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }
                      >
                        {currency.status === "active" ? "Active" : "Suspended"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditRates(currency)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Rates
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSuspendCurrency(currency.id)}>
                            <Pause className="h-4 w-4 mr-2" />
                            {currency.status === "active" ? "Suspend" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteCurrency(currency.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>

            {!showSkeleton && currencies.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <TrendingUp className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p>No currencies yet</p>
                <p className="mt-1 text-sm text-gray-400">Add a currency to configure exchange rates.</p>
              </div>
            ) : null}

            {/* Edit Rates Dialog */}
            <Dialog open={isEditingRates} onOpenChange={setIsEditingRates}>
          <DialogContent
            hideClose
            className="max-w-4xl max-h-[80vh] [&_input[type=number]]:[-moz-appearance:textfield] [&_input[type=number]::-webkit-inner-spin-button]:appearance-none [&_input[type=number]::-webkit-outer-spin-button]:appearance-none [&_input]:focus-visible:ring-0 [&_input]:focus-visible:ring-offset-0 [&_input]:focus-visible:border-primary [&_select]:focus-visible:ring-0 [&_select]:focus-visible:ring-offset-0 [&_select]:focus-visible:outline-none [&_select]:focus-visible:border-primary"
          >
            <DialogHeader className="flex flex-row flex-nowrap items-center gap-3 space-y-0 overflow-x-auto border-b pb-4 text-left [scrollbar-width:thin]">
              <DialogTitle className="m-0 min-w-0 flex-1 truncate text-base font-semibold leading-tight">
                Edit Exchange Rates - {selectedCurrency?.name} ({selectedCurrency?.code})
              </DialogTitle>
              <div className="flex shrink-0 items-center gap-2">
                <Checkbox
                  id="editCanSend"
                  checked={currencySettings.can_send}
                  onCheckedChange={(checked) =>
                    setCurrencySettings({ ...currencySettings, can_send: checked as boolean })
                  }
                />
                <Label htmlFor="editCanSend" className="cursor-pointer text-sm font-normal whitespace-nowrap">
                  Can Send
                </Label>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Checkbox
                  id="editCanReceive"
                  checked={currencySettings.can_receive}
                  onCheckedChange={(checked) =>
                    setCurrencySettings({ ...currencySettings, can_receive: checked as boolean })
                  }
                />
                <Label htmlFor="editCanReceive" className="cursor-pointer text-sm font-normal whitespace-nowrap">
                  Can Receive
                </Label>
              </div>
              <div className="flex shrink-0 items-end gap-1.5 border-l pl-3">
                <div className="grid w-11 shrink-0 gap-0.5">
                  <Label htmlFor="rateTimerHours" className="text-[10px] font-medium uppercase text-gray-500">
                    H
                  </Label>
                  <Input
                    id="rateTimerHours"
                    type="number"
                    min={0}
                    className="h-8 px-1.5 text-center text-sm tabular-nums"
                    value={receiveCompletionTimer.hours}
                    onChange={(e) =>
                      setReceiveCompletionTimer({
                        ...receiveCompletionTimer,
                        hours: Math.max(0, Number.parseInt(e.target.value, 10) || 0),
                      })
                    }
                  />
                </div>
                <div className="grid w-11 shrink-0 gap-0.5">
                  <Label htmlFor="rateTimerMinutes" className="text-[10px] font-medium uppercase text-gray-500">
                    M
                  </Label>
                  <Input
                    id="rateTimerMinutes"
                    type="number"
                    min={0}
                    max={59}
                    className="h-8 px-1.5 text-center text-sm tabular-nums"
                    value={receiveCompletionTimer.minutes}
                    onChange={(e) =>
                      setReceiveCompletionTimer({
                        ...receiveCompletionTimer,
                        minutes: Math.max(0, Math.min(59, Number.parseInt(e.target.value, 10) || 0)),
                      })
                    }
                  />
                </div>
                <div className="grid w-11 shrink-0 gap-0.5">
                  <Label htmlFor="rateTimerSeconds" className="text-[10px] font-medium uppercase text-gray-500">
                    S
                  </Label>
                  <Input
                    id="rateTimerSeconds"
                    type="number"
                    min={0}
                    max={59}
                    className="h-8 px-1.5 text-center text-sm tabular-nums"
                    value={receiveCompletionTimer.seconds}
                    onChange={(e) =>
                      setReceiveCompletionTimer({
                        ...receiveCompletionTimer,
                        seconds: Math.max(0, Math.min(59, Number.parseInt(e.target.value, 10) || 0)),
                      })
                    }
                  />
                </div>
              </div>
              <DialogClose className="shrink-0 rounded-sm p-1.5 text-gray-500 opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </DialogHeader>
            <div className="space-y-6">
              <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
                {getCurrencyRates(selectedCurrency?.code || "").map((rate: any) => (
                  <div key={rate.to_currency} className="office-panel-card">
                    <div className="flex items-center gap-2 text-lg font-medium">
                      <span>{selectedCurrency.code}</span>
                      <span>→</span>
                      <span>{rate.to_currency}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label>Exchange Rate</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={rateUpdates[rate.to_currency]?.rate || rate.rate}
                          onChange={(e) => updateRateField(rate.to_currency, "rate", e.target.value)}
                          placeholder="0.0000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Fee Type</Label>
                        <select
                          value={rateUpdates[rate.to_currency]?.feeType || rate.fee_type}
                          onChange={(e) => updateRateField(rate.to_currency, "feeType", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="free">Free</option>
                          <option value="fixed">Fixed Amount</option>
                          <option value="percentage">Percentage</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Fee Amount{" "}
                          {(rateUpdates[rate.to_currency]?.feeType || rate.fee_type) === "percentage"
                            ? "(%)"
                            : `(${selectedCurrency.code})`}
                        </Label>
                        <Input
                          type="number"
                          step={
                            (rateUpdates[rate.to_currency]?.feeType || rate.fee_type) === "percentage" ? "0.1" : "0.01"
                          }
                          value={rateUpdates[rate.to_currency]?.feeAmount || rate.fee_amount}
                          onChange={(e) => updateRateField(rate.to_currency, "feeAmount", e.target.value)}
                          placeholder={
                            (rateUpdates[rate.to_currency]?.feeType || rate.fee_type) === "percentage" ? "1.5" : "10.00"
                          }
                          disabled={(rateUpdates[rate.to_currency]?.feeType || rate.fee_type) === "free"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Min Amount ({selectedCurrency.code})</Label>
                        <Input
                          type="number"
                          step="1"
                          value={rateUpdates[rate.to_currency]?.minAmount || rate.min_amount || 0}
                          onChange={(e) => updateRateField(rate.to_currency, "minAmount", e.target.value)}
                          placeholder="100"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Max Amount ({selectedCurrency.code})</Label>
                        <Input
                          type="number"
                          step="1"
                          value={rateUpdates[rate.to_currency]?.maxAmount || rate.max_amount || 1000000}
                          onChange={(e) => updateRateField(rate.to_currency, "maxAmount", e.target.value)}
                          placeholder="1000000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Bank receive min ({rate.to_currency})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={rateUpdates[rate.to_currency]?.bankReceiveMin ?? ""}
                          onChange={(e) => updateRateField(rate.to_currency, "bankReceiveMin", e.target.value)}
                          placeholder="optional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bank receive max ({rate.to_currency})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={rateUpdates[rate.to_currency]?.bankReceiveMax ?? ""}
                          onChange={(e) => updateRateField(rate.to_currency, "bankReceiveMax", e.target.value)}
                          placeholder="optional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cash receive min ({rate.to_currency})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={rateUpdates[rate.to_currency]?.cashReceiveMin ?? ""}
                          onChange={(e) => updateRateField(rate.to_currency, "cashReceiveMin", e.target.value)}
                          placeholder="optional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cash receive max ({rate.to_currency})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={rateUpdates[rate.to_currency]?.cashReceiveMax ?? ""}
                          onChange={(e) => updateRateField(rate.to_currency, "cashReceiveMax", e.target.value)}
                          placeholder="optional"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Logistics fee type</Label>
                        <select
                          value={rateUpdates[rate.to_currency]?.logisticsFeeType || "free"}
                          onChange={(e) => updateRateField(rate.to_currency, "logisticsFeeType", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="free">Free</option>
                          <option value="fixed">Fixed ({rate.to_currency})</option>
                          <option value="percentage">Percentage (%)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Logistics fee amount{" "}
                          {(rateUpdates[rate.to_currency]?.logisticsFeeType || "free") === "percentage"
                            ? "(%)"
                            : `(${rate.to_currency})`}
                        </Label>
                        <Input
                          type="number"
                          step={
                            (rateUpdates[rate.to_currency]?.logisticsFeeType || "free") === "percentage"
                              ? "0.1"
                              : "0.01"
                          }
                          value={
                            rateUpdates[rate.to_currency]?.logisticsFeeAmount ??
                            (rate.logistics_fee_amount ?? 0).toString()
                          }
                          onChange={(e) => updateRateField(rate.to_currency, "logisticsFeeAmount", e.target.value)}
                          disabled={(rateUpdates[rate.to_currency]?.logisticsFeeType || "free") === "free"}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingRates(false)
                    setReceiveCompletionTimer({ hours: 1, minutes: 0, seconds: 0 })
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveRates}
                  className="bg-primary hover:bg-primary/90"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
            </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  )
}
