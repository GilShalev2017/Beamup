import { useState } from 'react';
import {
  Paper, Typography, Box, TextField, Button, CircularProgress,
  Alert, Chip, Divider, MenuItem,
} from '@mui/material';
import { Bot, Play, Zap } from 'lucide-react';
import { apiClient } from '../api/client';

interface AgentResult {
  result: string;
  toolCalls: string[];
}

// Preset prompts that exercise each tool
const PRESETS = [
  { label: 'Check WH-NY-01 stock',      prompt: 'Check the inventory status at warehouse WH-NY-01 and tell me what you find.' },
  { label: 'Restock low items',          prompt: 'Check warehouse WH-NY-01 and trigger a restock for any SKU that looks low.' },
  { label: 'Flag anomaly on SKU-003',    prompt: 'Flag an anomaly of type "shrinkage" on item SKU-003 with a note: units missing during last audit.' },
  { label: 'Full triage WH-LA-01',       prompt: 'Triage warehouse WH-LA-01: check inventory, restock anything critically low, and flag any anomalies you detect.' },
];

export const AgentPanel = () => {
  const [prompt,    setPrompt]    = useState('');
  const [result,    setResult]    = useState<AgentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const runAgent = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await apiClient.post('/agent/run', { userMessage: prompt });
      setResult(data.data);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAlert = async (event: string) => {
    try {
      await apiClient.post('/test/alert', { event, itemName: 'Demo Item' });
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  return (
    <Paper elevation={2} className="p-4 flex flex-col gap-4">
      {/* Header */}
      <Box className="flex items-center gap-2">
        <Bot size={18} />
        <Typography variant="h6" fontSize={15} fontWeight={600}>AI Agent</Typography>
        <Chip label="GPT-4o" size="small" color="secondary" />
      </Box>

      {/* Preset prompts */}
      <Box>
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          Quick presets (exercises each tool):
        </Typography>
        <Box className="flex flex-wrap gap-1">
          {PRESETS.map((p) => (
            <Chip
              key={p.label}
              label={p.label}
              size="small"
              variant="outlined"
              clickable
              onClick={() => setPrompt(p.prompt)}
            />
          ))}
        </Box>
      </Box>

      {/* Prompt input */}
      <TextField
        multiline
        rows={3}
        size="small"
        fullWidth
        label="Agent prompt"
        placeholder="Tell the agent what to do..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <Button
        variant="contained"
        startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : <Play size={14} />}
        onClick={runAgent}
        disabled={isLoading || !prompt.trim()}
      >
        {isLoading ? 'Agent running...' : 'Run Agent'}
      </Button>

      {/* Error */}
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {/* Result */}
      {result && (
        <Box>
          {result.toolCalls.length > 0 && (
            <>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Tools called ({result.toolCalls.length}):
              </Typography>
              <Box className="flex flex-col gap-1 mt-1 mb-2">
                {result.toolCalls.map((tc, i) => (
                  <Chip key={i} label={tc} size="small" color="info" variant="outlined"
                    sx={{ fontFamily: 'monospace', fontSize: 11, height: 'auto', py: 0.5,
                          '& .MuiChip-label': { whiteSpace: 'normal', wordBreak: 'break-all' } }}
                  />
                ))}
              </Box>
              <Divider sx={{ mb: 2 }} />
            </>
          )}
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Agent response:
          </Typography>
          <Typography variant="body2" mt={0.5} sx={{ whiteSpace: 'pre-wrap' }}>
            {result.result}
          </Typography>
        </Box>
      )}

      {/* Alert simulation */}
      <Divider />
      <Box>
        <Box className="flex items-center gap-1 mb-2">
          <Zap size={14} />
          <Typography variant="caption" fontWeight={600}>Simulate Alert</Typography>
        </Box>
        <Box className="flex flex-wrap gap-1">
          {['LOW_STOCK_ALERT', 'OUT_OF_STOCK_ALERT', 'ANOMALY_DETECTED'].map((ev) => (
            <Chip
              key={ev}
              label={ev.replace(/_/g, ' ')}
              size="small"
              color="warning"
              variant="outlined"
              clickable
              onClick={() => simulateAlert(ev)}
            />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          Fires the event through Kafka → consumer → LiveFeed.
        </Typography>
      </Box>
    </Paper>
  );
};
