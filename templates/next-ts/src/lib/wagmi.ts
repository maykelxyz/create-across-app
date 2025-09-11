import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { SUPPORTED_CHAINS } from "./across";
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export const config = getDefaultConfig({
  appName: "__APP_NAME__",
  projectId: "YOUR_PROJECT_ID",
  chains: SUPPORTED_CHAINS,
  ssr: true,
});
