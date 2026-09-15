"use client";

import { AlertCircle, Download, Printer } from "lucide-react";
import type { ReactNode } from "react";

import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";

export function ReportShell({
  title,
  subtitle,
  toolbar,
  onDownloadCsv,
  csvPending = false,
  csvDisabled = false,
  onDownloadExcel,
  excelPending = false,
  isBalanced,
  imbalanceMessage = "This report does not balance. Totals come from the server — do not post until the ledger is investigated.",
  children,
}: {
  title: string;
  subtitle?: string;
  toolbar?: ReactNode;
  onDownloadCsv?: () => void;
  csvPending?: boolean;
  csvDisabled?: boolean;
  onDownloadExcel?: () => void;
  excelPending?: boolean;
  isBalanced?: boolean;
  imbalanceMessage?: string;
  children: ReactNode;
}) {
  return (
    <ListPage>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          onDownloadCsv || onDownloadExcel ? (
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="size-4" />
                Print
              </Button>
              {onDownloadCsv ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onDownloadCsv}
                  disabled={csvDisabled || csvPending}
                >
                  <Download className="size-4" />
                  Download CSV
                </Button>
              ) : null}
              {onDownloadExcel ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onDownloadExcel}
                  disabled={csvDisabled || excelPending}
                >
                  <Download className="size-4" />
                  Excel
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="print:hidden">
              <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="size-4" />
                Print
              </Button>
            </div>
          )
        }
      />
      {toolbar ? <DataTableToolbar className="print:hidden">{toolbar}</DataTableToolbar> : null}
      {isBalanced === false ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{imbalanceMessage}</AlertDescription>
        </Alert>
      ) : null}
      {children}
    </ListPage>
  );
}
