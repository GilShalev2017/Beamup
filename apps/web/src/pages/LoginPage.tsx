import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, Tabs, Tab, CircularProgress,
} from '@mui/material';
import { useAuthStore } from '../store/useAuthStore';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, isLoading, error, clearError } = useAuthStore();

  const [tab, setTab]           = useState<0 | 1>(0); // 0 = login, 1 = register
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      if (tab === 0) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate('/');
    } catch {
      // error is already set in the store
    }
  };

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card sx={{ width: 420, boxShadow: 4 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Typography variant="h5" fontWeight={700} mb={0.5} color="primary">
            Beamup
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Supply Chain Intelligence Platform
          </Typography>

          <Tabs value={tab} onChange={(_, v) => { setTab(v); clearError(); }} sx={{ mb: 3 }}>
            <Tab label="Sign In" />
            <Tab label="Register" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            {tab === 1 && (
              <TextField
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                size="small"
              />
            )}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              size="small"
              autoComplete="email"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              size="small"
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              sx={{ mt: 1, py: 1.2 }}
            >
              {isLoading
                ? <CircularProgress size={20} color="inherit" />
                : tab === 0 ? 'Sign In' : 'Create Account'
              }
            </Button>
          </Box>

          {/* Quick dev login hint */}
          {tab === 0 && (
            <Typography variant="caption" color="text.secondary" display="block" mt={2} textAlign="center">
              No account yet? Switch to Register to create one.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
