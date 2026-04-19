import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useIdleTimer } from '../hooks/useIdleTimer';
import CameraScanner from '../components/CameraScanner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type Dispatch = {
  id: number;
  dispatch_number: string;
  total_schedule_bins: number;
  smg_qty: number;
  bin_qty: number;
  status?: string;
  supply_quantity?: number;
  ref_product_code?: string;
  ref_case_pack?: number;
  ref_supply_date?: string;
  ref_schedule_sent_date?: string;
  ref_schedule_number?: string;
};

export default function DispatchScreen() {
  const { id } = useParams(); // dispatch id from URL
  const navigate = useNavigate();
  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [binInput, setBinInput] = useState('');
  const [pickInput, setPickInput] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [showBin, setShowBin] = useState(true); // UI toggle

  // -------------------------------------------------------------
  // Fetch dispatch data (includes already‑scanned bins/picks)
  const loadDispatch = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE}/dispatch/${id}`);
      setDispatch(res.data.dispatch);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispatch();
  }, [id]);

  // -------------------------------------------------------------
  // Idle timeout (10 min) → hard logout
  useIdleTimer(() => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }, 10 * 60 * 1000);

  // -------------------------------------------------------------
  // Bin handling
  const handleBinSubmit = async () => {
    if (!binInput.trim()) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE}/dispatch/${id}/scan-bin`, {
        rawQr: binInput.trim(),
      });
      setDispatch(res.data);
      setMessage({ type: 'success', text: 'Bin accepted' });
      setBinInput('');
      setShowBin(false); // next step = pick
    } catch (err: any) {
      const txt = err.response?.data?.message || 'Bin scan failed';
      setMessage({ type: 'error', text: txt });
      setBinInput(''); // clear on error, per spec
    }
  };

  // -------------------------------------------------------------
  // Pick handling
  const handlePickSubmit = async () => {
    if (!pickInput.trim()) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE}/dispatch/${id}/scan-pick`, {
        rawQr: pickInput.trim(),
      });
      setDispatch(res.data);
      setMessage({ type: 'success', text: 'Pick accepted' });
      setPickInput('');
      setShowBin(true); // go back to next bin
    } catch (err: any) {
      const txt = err.response?.data?.message || 'Pick scan failed';
      setMessage({ type: 'error', text: txt });
      setPickInput(''); // clear on error
    }
  };

  // -------------------------------------------------------------
  // Complete dispatch
  const handleComplete = async () => {
    await axios.post(`${import.meta.env.VITE_API_BASE}/dispatch/${id}/complete`);
    navigate('/dispatches');
  };

  // -------------------------------------------------------------
  // PDF export (client‑side)
  const exportPDF = async () => {
    const element = document.getElementById('pdf-content')!;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`dispatch_${dispatch?.dispatch_number}.pdf`);
  };

  // -------------------------------------------------------------
  // Render
  if (loading || !dispatch) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  const progressText = `${dispatch.smg_qty}/${dispatch.total_schedule_bins}`;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Dispatch #{dispatch.dispatch_number}
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography>
          Product: <strong>{dispatch.ref_product_code ?? '—'}</strong> | Case Pack:{' '}
          <strong>{dispatch.ref_case_pack ?? '—'}</strong> | Total Bins:{' '}
          <strong>{dispatch.total_schedule_bins ?? '—'}</strong>
        </Typography>
        <Typography>
          SMG Qty: <strong>{dispatch.smg_qty}</strong> | Bin Qty:{' '}
          <strong>{dispatch.bin_qty}</strong>
        </Typography>
        <Typography>Progress: {progressText}</Typography>
          {dispatch.ref_schedule_number && (
            <Typography>
              Schedule No: <strong>{dispatch.ref_schedule_number}</strong>
            </Typography>
          )}
         {dispatch.ref_supply_date && (
          <Typography>
            Nagare Time: <strong>{dispatch.ref_supply_date}</strong>
          </Typography>
            )}
          {dispatch.ref_schedule_sent_date && (
          <Typography>
            Schedule Sent Dt: <strong>{dispatch.ref_schedule_sent_date}</strong>
          </Typography>
          )}
      </Paper>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {/* ------------- Bin input ------------- */}
      {showBin && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1">Scan Bin QR</Typography>
          <Box display="flex" alignItems="center">
            <TextField
              fullWidth
              placeholder="Paste / scan bin QR"
              value={binInput}
              onChange={e => setBinInput(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') handleBinSubmit();
              }}
            />
            <IconButton onClick={() => setBinInput('')}>
              <ClearIcon />
            </IconButton>
          </Box>

          {/* Optional camera scanner – shows only on devices with a camera */}
          <Box mt={2}>
            <CameraScanner onScan={txt => setBinInput(txt)} />
          </Box>
        </Paper>
      )}

      {/* ------------- Pick input ------------- */}
      {!showBin && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1">Scan Pick‑list QR</Typography>
          <Box display="flex" alignItems="center">
            <TextField
              fullWidth
              placeholder="Paste / scan pick QR"
              value={pickInput}
              onChange={e => setPickInput(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') handlePickSubmit();
              }}
            />
            <IconButton onClick={() => setPickInput('')}>
              <ClearIcon />
            </IconButton>
          </Box>

          {/* Optional camera scanner for picks */}
          <Box mt={2}>
            <CameraScanner onScan={txt => setPickInput(txt)} />
          </Box>
        </Paper>
      )}

      {/* Completion button – appears only when the counters match */}
      {dispatch.smg_qty === dispatch.total_schedule_bins &&
        dispatch.bin_qty === dispatch.total_schedule_bins && (
          <Button variant="contained" color="success" onClick={handleComplete}>
            Complete Dispatch
          </Button>
        )}

      {/* PDF export – appears after completion */}
      {dispatch.status === 'COMPLETED' && (
        <Button variant="outlined" sx={{ ml: 2 }} onClick={exportPDF}>
          Export PDF
        </Button>
      )}

      {/* Hidden printable area – used for PDF generation */}
      <div id="pdf-content" style={{ display: 'none' }}>
        <h1>Dispatch #{dispatch.dispatch_number}</h1>
        <p>Customer ID: {localStorage.getItem('selectedCustomerId')}</p>
        <p>Product Code: {dispatch.ref_product_code}</p>
        <p>Supply Quantity: {dispatch.supply_quantity}</p>
        <p>Total Schedule Bins: {dispatch.total_schedule_bins}</p>
        {/* You could also render a table of bins/picks here */}
      </div>
    </Box>
  );
}
