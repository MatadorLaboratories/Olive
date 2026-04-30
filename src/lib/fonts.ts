import { Fraunces, Inter } from "next/font/google";

/**
 * Fraunces — display serif. Variable, optical-size aware, expressive.
 * Used for hero headlines, section heads, brand voice moments.
 * "soft" + "wonk" variation axes give it the warm, slightly playful Olive feel.
 */
export const fontDisplay = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  // Variable-font axes — when these are set, weight is loaded as the full
  // variable axis and individual weights cannot be enumerated.
  axes: ["SOFT", "WONK", "opsz"],
});

/**
 * Inter — UI sans-serif. Body copy, navigation, forms, admin.
 */
export const fontSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
});

export const fontVariables = `${fontDisplay.variable} ${fontSans.variable}`;
