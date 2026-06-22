import { useEffect } from 'react';
import { Chip, Paper, Typography, Box, IconButton } from '@mui/material';
import { Wifi, WifiOff, Trash2, Zap } from 'lucide-react';
import { getSocket } from '../socket/socketClient';
import { useStore } from '../store/useStore';
import type { Item } from '@beamup/shared';

const eventColor = (type: string) => {
  switch (type) {
    case 'created': return 'success';
    case 'updated': return 'info';
    case 'deleted': return 'error';
    case 'alert':   return 'warning';
    default:        return 'default';
  }
};

export const LiveFeed = () => {
  const { liveEvents, addLiveEvent, clearEvents, socketConnected, setSocketConnected } = useStore();

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect',    () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('item:created', (item: Item) => {
      addLiveEvent({ type: 'created', message: `New item created: ${item.name} (${item.sku})`, timestamp: new Date().toISOString(), item });
    });

    socket.on('item:updated', (item: Item) => {
      addLiveEvent({ type: 'updated', message: `Item updated: ${item.name} — qty: ${item.quantity}`, timestamp: new Date().toISOString(), item });
    });

    socket.on('item:deleted', ({ id }: { id: string }) => {
      addLiveEvent({ type: 'deleted', message: `Item deleted: ${id}`, timestamp: new Date().toISOString() });
    });

    socket.on('alert', (payload: { event: string; item?: Item }) => {
      addLiveEvent({ type: 'alert', message: `⚠️ ${payload.event}: ${payload.item?.name ?? ''}`, timestamp: new Date().toISOString() });
    });

    // Also listen to Kafka-forwarded inventory updates
    socket.on('inventory:update', (payload: { event: string; item?: Item }) => {
      addLiveEvent({ type: 'updated', message: `[Kafka] ${payload.event}`, timestamp: new Date().toISOString() });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('item:created');
      socket.off('item:updated');
      socket.off('item:deleted');
      socket.off('alert');
      socket.off('inventory:update');
    };
  }, [addLiveEvent, setSocketConnected]);

  return (
    <Paper elevation={2} className="p-4 h-full flex flex-col">
      <Box className="flex items-center justify-between mb-3">
        <Box className="flex items-center gap-2">
          <Zap size={18} />
          <Typography variant="h6" fontSize={15} fontWeight={600}>Live Feed</Typography>
          {socketConnected
            ? <Chip icon={<Wifi size={12} />} label="Connected" color="success" size="small" />
            : <Chip icon={<WifiOff size={12} />} label="Disconnected" color="error" size="small" />
          }
        </Box>
        <IconButton size="small" onClick={clearEvents} title="Clear">
          <Trash2 size={15} />
        </IconButton>
      </Box>

      <Box className="flex-1 overflow-y-auto space-y-2">
        {liveEvents.length === 0 && (
          <Typography variant="body2" color="text.secondary" className="text-center mt-8">
            Waiting for events...
          </Typography>
        )}
        {liveEvents.map((event) => (
          <Box key={event.id} className="flex items-start gap-2 py-1 border-b border-gray-100">
            <Chip label={event.type} color={eventColor(event.type) as 'success'} size="small" />
            <Box className="flex-1 min-w-0">
              <Typography variant="body2" noWrap>{event.message}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(event.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};
