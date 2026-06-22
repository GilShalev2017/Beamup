import { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, MenuItem, CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import type { Item } from '@beamup/shared';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Item>) => Promise<void>;
  initial?: Partial<Item>;
  mode: 'create' | 'edit';
  isLoading?: boolean;
}

const CATEGORIES = ['Electronics', 'Machinery', 'Packaging', 'Energy', 'Raw Materials', 'Other'];
const WAREHOUSES = ['WH-NY-01', 'WH-LA-01', 'WH-CHI-01', 'WH-MIA-01'];

type FormValues = {
  sku: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  warehouseId: string;
  price: number;
  tags: string;
};

export const ItemFormModal = ({ open, onClose, onSubmit, initial, mode, isLoading }: Props) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      sku:         initial?.sku         ?? '',
      name:        initial?.name        ?? '',
      description: initial?.description ?? '',
      category:    initial?.category    ?? 'Electronics',
      quantity:    initial?.quantity    ?? 0,
      warehouseId: initial?.warehouseId ?? 'WH-NY-01',
      price:       initial?.price       ?? 0,
      tags:        initial?.tags?.join(', ') ?? '',
    },
  });

  // Reset form when initial values change (edit mode)
  useEffect(() => {
    reset({
      sku:         initial?.sku         ?? '',
      name:        initial?.name        ?? '',
      description: initial?.description ?? '',
      category:    initial?.category    ?? 'Electronics',
      quantity:    initial?.quantity    ?? 0,
      warehouseId: initial?.warehouseId ?? 'WH-NY-01',
      price:       initial?.price       ?? 0,
      tags:        initial?.tags?.join(', ') ?? '',
    });
  }, [initial, reset]);

  const handleFormSubmit = async (values: FormValues) => {
    await onSubmit({
      ...values,
      quantity: Number(values.quantity),
      price:    Number(values.price),
      tags:     values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'create' ? 'Create New Item' : 'Edit Item'}</DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={6}>
            <Controller name="sku" control={control} rules={{ required: 'SKU is required' }}
              render={({ field }) => (
                <TextField {...field} label="SKU" fullWidth size="small"
                  error={!!errors.sku} helperText={errors.sku?.message}
                  disabled={mode === 'edit'} // SKU is immutable after creation
                />
              )}
            />
          </Grid>
          <Grid item xs={6}>
            <Controller name="name" control={control} rules={{ required: 'Name is required' }}
              render={({ field }) => (
                <TextField {...field} label="Name" fullWidth size="small"
                  error={!!errors.name} helperText={errors.name?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller name="description" control={control}
              render={({ field }) => (
                <TextField {...field} label="Description" fullWidth size="small" multiline rows={2} />
              )}
            />
          </Grid>
          <Grid item xs={6}>
            <Controller name="category" control={control}
              render={({ field }) => (
                <TextField {...field} label="Category" select fullWidth size="small">
                  {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              )}
            />
          </Grid>
          <Grid item xs={6}>
            <Controller name="warehouseId" control={control}
              render={({ field }) => (
                <TextField {...field} label="Warehouse" select fullWidth size="small">
                  {WAREHOUSES.map((w) => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              )}
            />
          </Grid>
          <Grid item xs={6}>
            <Controller name="quantity" control={control} rules={{ min: { value: 0, message: 'Min 0' } }}
              render={({ field }) => (
                <TextField {...field} label="Quantity" type="number" fullWidth size="small"
                  error={!!errors.quantity} helperText={errors.quantity?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={6}>
            <Controller name="price" control={control} rules={{ min: { value: 0, message: 'Min 0' } }}
              render={({ field }) => (
                <TextField {...field} label="Price ($)" type="number" fullWidth size="small"
                  error={!!errors.price} helperText={errors.price?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller name="tags" control={control}
              render={({ field }) => (
                <TextField {...field} label="Tags (comma separated)" fullWidth size="small"
                  placeholder="sensor, iot, rfid"
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(handleFormSubmit)} disabled={isLoading}>
          {isLoading ? <CircularProgress size={18} color="inherit" /> : mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
