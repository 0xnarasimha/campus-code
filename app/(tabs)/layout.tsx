import { AppShell } from "@/components/AppShell";

export default function TabsLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
