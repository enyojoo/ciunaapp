import Constants from "expo-constants"

/** True when running inside the Expo Go app. */
export const isExpoGo = Constants.appOwnership === "expo"
