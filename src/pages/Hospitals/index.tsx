import { useEffect, useState, ChangeEvent } from 'react';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { toast } from 'react-toastify';
import { PrivateLayout } from '../../components/PrivateLayout';
import { useEnterprise } from '../../contexts/EnterpriseContext';
import api from '../../services/api';
import type { Hospital } from '../../dtos';

type FormState = Partial<Hospital> & { [key: string]: any };

export default function Hospitals() {
  const { current } = useEnterprise();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState<FormState>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    if (!current?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/enterprise/${current.id}/hospitals`);
      setHospitals(res.data);
    } catch {
      toast.error('Erro ao buscar hospitais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [current?.id]);

  const openCreate = () => {
    setForm({ enterprise_id: current?.id });
    setMode('create');
    setDrawerOpen(true);
  };

  const openEdit = (h: Hospital) => {
    setForm({ ...h });
    setMode('edit');
    setDrawerOpen(true);
  };

  const getCep = async () => {
    if (!form.cep || String(form.cep).replace(/\D/g, '').length < 8) return;
    try {
      const res = await axios.get(
        `https://viacep.com.br/ws/${String(form.cep).replace(/\D/g, '')}/json/`,
      );
      const { bairro, complemento, localidade, logradouro, uf } = res.data;
      setForm(prev => ({ ...prev, bairro, complemento, cidade: localidade, logradouro, uf }));
    } catch {}
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (mode === 'create') {
        await api.post('/hospital', { ...form, enterprise_id: current?.id });
        toast.success('Hospital criado!');
      } else {
        await api.put('/hospital', { ...form, hospital_id: form.id });
        toast.success('Hospital atualizado!');
      }
      setDrawerOpen(false);
      load();
    } catch {
      toast.error('Erro ao salvar hospital.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await api.delete(`/hospital/${deleteId}`);
      toast.success('Hospital excluído.');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Erro ao excluir hospital.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: string) => ({
    value: form[key] ?? '',
    onChange: (e: ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <PrivateLayout>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Hospitais
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {current?.title}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Adicionar Hospital
        </Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e8eef2' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                {['Logo', 'Nome', 'Cidade / UF', 'Taxa Admin', 'Min. Horas', 'Ações'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: '#475569' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {hospitals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Nenhum hospital cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                hospitals.map(h => (
                  <TableRow key={h.id} hover>
                    <TableCell>
                      <Avatar src={h.logo_url} variant="rounded" sx={{ width: 36, height: 36 }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{h.name}</TableCell>
                    <TableCell>
                      {[h.cidade, h.uf].filter(Boolean).join(' / ') || '—'}
                    </TableCell>
                    <TableCell>{h.adminFee != null ? `${h.adminFee}%` : '—'}</TableCell>
                    <TableCell>{h.min_hours != null ? `${h.min_hours}h` : '—'}</TableCell>
                    <TableCell>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => openEdit(h)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton
                          size="small"
                          sx={{ color: '#dc2626' }}
                          onClick={() => setDeleteId(h.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Modal criar/editar */}
      <Dialog open={drawerOpen} onClose={() => setDrawerOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={600}>
          {mode === 'create' ? 'Novo Hospital' : 'Editar Hospital'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Nome do hospital" size="small" fullWidth {...field('name')} />
          <Box display="flex" gap={2}>
            <TextField label="Mín. horas" size="small" type="number" fullWidth {...field('min_hours')} />
            <TextField label="Tolerância (min)" size="small" type="number" fullWidth {...field('min_tolerance')} />
          </Box>
          <Box display="flex" gap={2}>
            <TextField label="Taxa admin (%)" size="small" type="number" fullWidth {...field('adminFee')} />
            <TextField label="Imposto (%)" size="small" type="number" fullWidth {...field('tax')} />
          </Box>
          <TextField
            label="CEP"
            size="small"
            fullWidth
            {...field('cep')}
            onBlur={getCep}
          />
          <TextField label="Rua" size="small" fullWidth {...field('logradouro')} />
          <Box display="flex" gap={2}>
            <TextField label="Número" size="small" fullWidth {...field('numero')} />
            <TextField label="Complemento" size="small" fullWidth {...field('complemento')} />
          </Box>
          <TextField label="Bairro" size="small" fullWidth {...field('bairro')} />
          <Box display="flex" gap={2}>
            <TextField label="Cidade" size="small" fullWidth {...field('cidade')} />
            <TextField label="UF" size="small" sx={{ maxWidth: 80 }} {...field('uf')} />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setDrawerOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmar exclusão */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs">
        <DialogTitle fontWeight={600}>Excluir hospital?</DialogTitle>
        <DialogContent>
          <Typography fontSize={14} color="text.secondary">
            Essa ação é irreversível.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={loading}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </PrivateLayout>
  );
}
