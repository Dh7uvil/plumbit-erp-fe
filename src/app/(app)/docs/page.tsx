import type { Metadata } from "next";

import { DocsHomeScreen } from "@/modules/documentation/components/docs-home-screen";

export const metadata: Metadata = {
  title: "Documentation",
};

export default function DocsHomePage() {
  return <DocsHomeScreen />;
}
