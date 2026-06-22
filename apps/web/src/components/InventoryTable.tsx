import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, CircularProgress, Typography, Box,
  Button, TextField, MenuItem, InputAdornment,
} from '@mui/material';
import { Minus, Plus, Trash2, Pencil, Search, PackagePlus, X } from 'lucide-react';
import { useItems, useAdjustQuantity, useDeleteItem, useCreateItem, useUpdateItem } from '../hooks/useItems';
import { ItemFormModal } from './ItemFormModal';
import type { Item } from '@beamup/shared';

const statusColor = (status: string): 'success' | 'warning' | 'error' | 'info' => {
  switch (status) {
    case 'in_stock':     return 'success';
    case 'low_stock':    return 'warning';
    case 'out_of_stock': return 'error';
    case 'in_transit':   return 'info';
    default:             return 'info';
  }
};

const STATUSES   = ['', 'in_stock', 'low_stock', 'out_of_stock', 'in_transit'];
const CATEGORIES = ['', 'Electronics', 'Machinery', 'Packaging', 'Energy', 'Raw Materials', 'Other'];

export const InventoryTable = () => {
  // ─── Filters ────────────────────────────────────────────────────────────
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('');
  const [status,   setStatus]   = useState('');

  // ─── Modal state ────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem,   setEditItem]   = useState<Item | null>(null);

  // ─── Data & mutations ───────────────────────────────────────────────────
  const { data, isLoading, isError } = useItems({
    search:   search   || undefined,
    category: category || undefined,
    status:   status   || undefined,
  });
  const adjust     = useAdjustQuantity();
  const deleteItem = useDeleteItem();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();

  const clearFilters = () => { setSearch(''); setCategory(''); setStatus(''); };
  const hasFilters   = search || category || status;

  if (isLoading) return <Box className="flex justify-center p-8"><CircularProgress /></Box>;
  if (isError)   return <Typography color="error">Failed to load inventory.</Typography>;

  const items = data?.items ?? [];

  return (
    <Box>
      {/* ─── Toolbar ──────────────────────────────────────────────────────── */}
      <Box className="flex flex-wrap items-center gap-3 mb-3">
        <TextField
          size="small"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 220 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={15} /></InputAdornment>,
          }}
        />

        <TextField select size="small" label="Category" value={category}
          onChange={(e) => setCategory(e.target.value)} sx={{ width: 160 }}>
          {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c || 'All categories'}</MenuItem>)}
        </TextField>

        <TextField select size="small" label="Status" value={status}
          onChange={(e) => setStatus(e.target.value)} sx={{ width: 160 }}>
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All statuses'}</MenuItem>
          ))}
        </TextField>

        {hasFilters && (
          <IconButton size="small" onClick={clearFilters} title="Clear filters">
            <X size={15} />
          </IconButton>
        )}

        <Box flexGrow={1} />

        <Typography variant="body2" color="text.secondary">
          {data?.total ?? 0} items
        </Typography>

        <Button variant="contained" size="small" startIcon={<PackagePlus size={15} />}
          onClick={() => setCreateOpen(true)}>
          New Item
        </Button>
      </Box>

      {/* ─── Table ────────────────────────────────────────────────────────── */}
      <TableContainer component={Paper} elevation={2}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              {['SKU', 'Name', 'Category', 'Warehouse', 'Qty', 'Status', 'Price', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 13 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id?.toString()} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{item.sku}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.warehouseId}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{item.quantity}</TableCell>
                <TableCell>
                  <Chip label={item.status.replace(/_/g, ' ')} color={statusColor(item.status)} size="small" />
                </TableCell>
                <TableCell>${item.price.toFixed(2)}</TableCell>
                <TableCell>
                  <Box className="flex gap-1">
                    <IconButton size="small" color="primary" title="Edit"
                      onClick={() => setEditItem(item)}>
                      <Pencil size={14} />
                    </IconButton>
                    <IconButton size="small" color="success" title="Add 10 units"
                      onClick={() => adjust.mutate({ id: item._id!.toString(), delta: 10 })}>
                      <Plus size={14} />
                    </IconButton>
                    <IconButton size="small" color="warning" title="Remove 10 units"
                      onClick={() => adjust.mutate({ id: item._id!.toString(), delta: -10 })}>
                      <Minus size={14} />
                    </IconButton>
                    <IconButton size="small" color="error" title="Delete"
                      onClick={() => { if (confirm(`Delete ${item.name}?`)) deleteItem.mutate(item._id!.toString()); }}>
                      <Trash2 size={14} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" py={2}>
                    {hasFilters ? 'No items match your filters.' : 'No items yet — create one!'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ─── Modals ───────────────────────────────────────────────────────── */}
      <ItemFormModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSubmit={(data) => createItem.mutateAsync(data)}
        isLoading={createItem.isPending}
      />

      <ItemFormModal
        open={!!editItem}
        mode="edit"
        initial={editItem ?? undefined}
        onClose={() => setEditItem(null)}
        onSubmit={(data) => updateItem.mutateAsync({ id: editItem!._id!.toString(), data })}
        isLoading={updateItem.isPending}
      />
    </Box>
  );
};
