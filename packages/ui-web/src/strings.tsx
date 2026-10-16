"use client"
import * as React from "react"

/** Words the shared components render themselves. Apps provide translations; English is the default. */
export interface UiStrings { required: string; close: string; defaultLabel: string }
const Ctx = React.createContext<UiStrings>({ required: "Required", close: "Close", defaultLabel: "default" })
export const UiStringsProvider = Ctx.Provider
export const useUiStrings = () => React.useContext(Ctx)
