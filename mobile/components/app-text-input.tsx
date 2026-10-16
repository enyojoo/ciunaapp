import { forwardRef } from "react"
import { Platform, TextInput, type TextInputProps, type TextStyle } from "react-native"
import { colors } from "@/lib/theme"

const webInputReset =
  Platform.OS === "web"
    ? ({
        outlineStyle: "none",
        outlineWidth: 0,
        boxShadow: "none",
      } as unknown as TextStyle)
    : null

/** TextInput with browser default focus chrome removed on web (use container focus ring instead). */
export const AppTextInput = forwardRef<TextInput, TextInputProps>(function AppTextInput(props, ref) {
  return (
    <TextInput
      ref={ref}
      {...props}
      selectionColor={props.selectionColor ?? colors.primary}
      style={[webInputReset, props.style]}
    />
  )
})
