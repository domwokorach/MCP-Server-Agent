import type { ReactNode } from "react";
import { Card, CardContent } from "./card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export interface ResponsiveTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: ResponsiveTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  mobileTitle: (row: T) => ReactNode;
}

export function ResponsiveTable<T>({ columns, rows, getRowKey, mobileTitle }: ResponsiveTableProps<T>) {
  return (
    <>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
          </TableHeader>
          <TableBody>
              {rows.map((row) => (
                <TableRow key={getRowKey(row)}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      <div className="space-y-3 sm:hidden">
        {rows.map((row) => (
          <Card key={getRowKey(row)} className="rounded-xl border border-border py-0 shadow-none">
            <CardContent className="space-y-2 px-4 py-4">
              <p className="font-medium">{mobileTitle(row)}</p>
              {columns
                .filter((col) => !col.hideOnMobile)
                .map((col) => (
                  <div key={col.key} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-xs text-muted-foreground">{col.header}</span>
                    <span className="min-w-0 text-right">{col.render(row)}</span>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
