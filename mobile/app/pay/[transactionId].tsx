import { Redirect, useLocalSearchParams } from "expo-router"
export default function ResumePayment() {
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>()
  return <Redirect href={{ pathname: "/orders/[id]", params: { id: transactionId } }} />
}
