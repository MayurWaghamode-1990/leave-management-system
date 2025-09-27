import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  SxProps,
  Theme
} from '@mui/material';

interface Column {
  field: string;
  headerName: string;
  minWidth?: number;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  renderCell?: (value: any, row: any) => React.ReactNode;
  renderMobileCard?: (row: any) => React.ReactNode;
}

interface ResponsiveTableProps {
  columns: Column[];
  rows: any[];
  loading?: boolean;
  emptyMessage?: string;
  showMobileCards?: boolean;
  mobileCardRenderer?: (row: any, index: number) => React.ReactNode;
  sx?: SxProps<Theme>;
  getRowId?: (row: any) => string | number;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  rows,
  loading = false,
  emptyMessage = 'No data available',
  showMobileCards = true,
  mobileCardRenderer,
  sx,
  getRowId = (row, index) => row.id || index
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Filter columns based on screen size
  const visibleColumns = columns.filter(column => {
    if (isMobile && column.hideOnMobile) return false;
    if (isTablet && column.hideOnTablet) return false;
    return true;
  });

  // Default mobile card renderer
  const defaultMobileCardRenderer = (row: any, index: number) => (
    <Grid item xs={12} key={getRowId(row, index)}>
      <Card variant="outlined" sx={{ p: 2 }}>
        {columns.map((column) => {
          const value = row[column.field];
          if (value === undefined || value === null) return null;

          return (
            <Box key={column.field} sx={{ mb: 1 }}>
              <Typography variant="caption" color="textSecondary" component="span">
                {column.headerName}:{' '}
              </Typography>
              <Typography variant="body2" component="span">
                {column.renderCell ? column.renderCell(value, row) : value}
              </Typography>
            </Box>
          );
        })}
      </Card>
    </Grid>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (rows.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={sx}>
      {isMobile && showMobileCards ? (
        // Mobile Card Layout
        <Grid container spacing={2}>
          {rows.map((row, index) =>
            mobileCardRenderer
              ? mobileCardRenderer(row, index)
              : defaultMobileCardRenderer(row, index)
          )}
        </Grid>
      ) : (
        // Desktop/Tablet Table Layout
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {visibleColumns.map((column) => (
                  <TableCell
                    key={column.field}
                    sx={{
                      minWidth: column.minWidth,
                      fontWeight: 'bold'
                    }}
                  >
                    {column.headerName}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow
                  key={getRowId(row, index)}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {visibleColumns.map((column) => {
                    const value = row[column.field];
                    return (
                      <TableCell key={column.field}>
                        {column.renderCell ? column.renderCell(value, row) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ResponsiveTable;