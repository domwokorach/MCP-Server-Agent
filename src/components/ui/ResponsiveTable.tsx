import type { ReactNode } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

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
      <Box sx={{ display: { xs: "none", sm: "block" } }}>
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.key} align={col.align ?? "left"}>
                    {col.header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={getRowKey(row)} hover>
                  {columns.map((col) => (
                    <TableCell key={col.key} align={col.align ?? "left"}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Stack spacing={1.5} sx={{ display: { xs: "flex", sm: "none" } }}>
        {rows.map((row) => (
          <Card key={getRowKey(row)} sx={{ p: 2, borderRadius: "var(--radius-md)" }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2">{mobileTitle(row)}</Typography>
              {columns
                .filter((col) => !col.hideOnMobile)
                .map((col) => (
                  <Stack
                    key={col.key}
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>
                      {col.header}
                    </Typography>
                    <Box sx={{ textAlign: "right" }}>{col.render(row)}</Box>
                  </Stack>
                ))}
            </Stack>
          </Card>
        ))}
      </Stack>
    </>
  );
}
