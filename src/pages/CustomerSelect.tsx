import { useEffect, useState } from 'react';
import { Box, Button, MenuItem, Select, Typography, Paper } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

type Customer = { id: number; name: string; code: string };

export default function CustomerSelect() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<number | ''>('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_BASE}/customers`).then(res => setCustomers(res.data));
  }, []);

  const handleProceed = () => {
    if (selected) {
      // store the customer's ID for later calls (simple approach)
      localStorage.setItem('selectedCustomerId', String(selected));
      navigate('/dispatches');
    }
  };

  return (
    <Box display="flex" justifyContent="center" mt={8}>
      <Paper sx={{ p: 4, width: 360 }}>
        <Typography variant="h6" gutterBottom>
          Select Customer
        </Typography>
        <Select
          fullWidth
          displayEmpty
          value={selected}
          onChange={e => setSelected(Number(e.target.value))}
        >
          <MenuItem disabled value="">
            -- Choose a customer --
          </MenuItem>
          {customers.map(c => (
            <MenuItem key={c.id} value={c.id}>
              {c.name} ({c.code})
            </MenuItem>
          ))}
        </Select>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          disabled={!selected}
          onClick={handleProceed}
        >
          Continue
        </Button>
      </Paper>
    </Box>
  );
}
