import { Box, Container, Typography, Grid, Button, Chip } from '@mui/material';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InventoryTable } from '../components/InventoryTable';
import { LiveFeed } from '../components/LiveFeed';
import { AgentPanel } from '../components/AgentPanel';
import { useAuthStore } from '../store/useAuthStore';

export const HomePage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
  <Container maxWidth="xl" className="py-6">
    <Box className="flex items-start justify-between mb-6">
      <Box>
        <Typography variant="h4" fontWeight={700} color="primary">
          Beamup Supply Chain
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time inventory intelligence dashboard
        </Typography>
      </Box>
      <Box className="flex items-center gap-2">
        {user && <Chip label={`${user.name} · ${user.role}`} size="small" />}
        <Button
          size="small"
          variant="outlined"
          startIcon={<LogOut size={14} />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
    </Box>

    <Grid container spacing={3}>
      {/* Inventory table — 9/12 */}
      <Grid item xs={12} lg={9}>
        <InventoryTable />
      </Grid>

      {/* Right sidebar — Live Feed + Agent Panel */}
      <Grid item xs={12} lg={3}>
        <Box className="flex flex-col gap-3">
          <LiveFeed />
          <AgentPanel />
        </Box>
      </Grid>
    </Grid>
  </Container>
  );
};
