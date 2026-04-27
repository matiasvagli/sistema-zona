import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RefineContext } from "@/components/RefineContext";
import { AntdRegistry } from "@ant-design/nextjs-registry";

const inter = Inter({ subsets: ["latin"] });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sistema de Gestión - Zona",
  description: "Gestión de Publicidad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AntdRegistry>
          <RefineContext>{children}</RefineContext>
        </AntdRegistry>
      </body>
    </html>
  );
}
