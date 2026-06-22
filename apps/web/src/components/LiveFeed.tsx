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

    // Named handlers so socket.off() removes exactly these — not all listeners
    const onConnect    = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    const onCreated = (item: Item) =>
      addLiveEvent({ type: 'created', message: `New item: ${item.name} (${item.sku})`, timestamp: new Date().toISOString(), item });

    const onUpdated = (item: Item) =>
      addLiveEvent({ type: 'updated', message: `Updated: ${item.name} — qty: ${item.quantity}`, timestamp: new Date().toISOString(), item });

    const onDeleted = ({ id }: { id: string }) =>
      addLiveEvent({ type: 'deleted', message: `Deleted item: ${id}`, timestamp: new Date().toISOString() });

    const onAlert = (payload: { event: string; item?: Item }) =>
      addLiveEvent({ type: 'alert', message: `⚠️ ${payload.event}${payload.item?.name ? ': ' + payload.item.name : ''}`, timestamp: new Date().toISOString() });

    socket.on('connect',      onConnect);
    socket.on('disconnect',   onDisconnect);
    socket.on('item:created', onCreated);
    socket.on('item:updated', onUpdated);
    socket.on('item:deleted', onDeleted);
    socket.on('alert',        onAlert);

    return () => {
      // Pass exact handler reference — only removes THIS listener, not all listeners on the event
      socket.off('connect',      onConnect);
      socket.off('disconnect',   onDisconnect);
      socket.off('item:created', onCreated);
      socket.off('item:updated', onUpdated);
      socket.off('item:deleted', onDeleted);
      socket.off('alert',        onAlert);
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
