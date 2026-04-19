import { useEffect, useState } from 'react';
import { Box, Button, Paper, List, ListItem, ListItemText, Typography, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

type Dispatch = {
  id: number;
  dispatch_number: string;
  status: string;
  created_at: string;
};

export default function DispatchBoard() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const navigate = useNavigate();
  const customerId = localStorage.getItem('selectedCustomerId') ?? '';

  const load = async () => {
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE}/dispatch?customerId=${customerId}`
    );
    setDispatches(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const createNew = async () => {
    const res = await axios.post(`${import.meta.env.VITE_API_BASE}/dispatch`, {
      customerId,
    });
    navigate(`/dispatch/${res.data.id}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Dispatches (Customer {customerId})
      </Typography>
      <Button variant="contained" startIcon={<AddIcon />} sx={{ mb: 2 }} onClick={createNew}>
        New Dispatch
      </Button>
      <Paper>
        <List>
          {dispatches.map(d => (
            <ListItem button key={d.id} onClick={() => navigate(`/dispatch/${d.id}`)}>
              <ListItemText
                primary={`#${d.dispatch_number} – ${d.status}`}
                secondary={new Date(d.created_at).toLocaleString()}
              />
              {d.status === 'COMPLETED' && (
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    // open PDF in a new tab; you will later implement a real endpoint
                    window.open(
                      `${import.meta.env.VITE_API_BASE}/dispatch/${d.id}/export-pdf`,
                      '_blank'
                    );
                  }}
                >
                  📄
                </IconButton>
              )}
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
