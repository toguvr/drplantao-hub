import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { toast } from 'react-toastify';
import { PrivateLayout } from '../../components/PrivateLayout';
import { useEnterprise } from '../../contexts/EnterpriseContext';
import api from '../../services/api';
import type { UserEnterprise } from '../../dtos';

const roleLabels: Record<string, string> = {
  org_admin: 'Admin',
  org_viewer: 'Visualizador',
};

export default function Users() {
  const { current } = useEnterprise();
  const [members, setMembers] = useState<UserEnterprise[]>([]);
  const [loading, setLoading] = useState(false);

  // modal adicionar
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'org_admin' | 'org_viewer'>('org_viewer');
  const [adding, setAdding] = useState(false);

  // modal editar role
  const [editItem, setEditItem] = useState<UserEnterprise | null>(null);
  const [editRole, setEditRole] = useState<'org_admin' | 'org_viewer'>('org_viewer');

  // confirmar remoção
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    if (!current?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/userEnterprise/by-enterprise/${current.id}`);
      setMembers(res.data);
    } catch {
      toast.error('Erro ao buscar membros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [current?.id]);

  const handleAdd = async () => {
    if (!newEmail || !current?.id) return;
    setAdding(true);
    try {
      // Busca user por email
      const userRes = await api.get(`/users?email=${encodeURIComponent(newEmail)}`);
      const user = Array.isArray(userRes.data) ? userRes.data[0] : userRes.data;
      if (!user?.id) {
        toast.error('Usuário não encontrado.');
        return;
      }

      await api.post('/userEnterprise', {
        user_id: user.id,
        enterprise_id: current.id,
        role: newRole,
      });

      toast.success('Usuário adicionado à organização!');
      setAddOpen(false);
      setNewEmail('');
      setNewRole('org_viewer');
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erro ao adicionar usuário.';
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  const handleEditRole = async () => {
    if (!editItem) return;
    try {
      await api.patch(`/userEnterprise/${editItem.id}/role`, { role: editRole });
      toast.success('Permissão atualizada!');
      setEditItem(null);
      load();
    } catch {
      toast.error('Erro ao atualizar permissão.');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/userEnterprise/${deleteId}`);
      toast.success('Usuário removido da organização.');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Erro ao remover usuário.');
    }
  };

  return (
    <PrivateLayout>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Usuários
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {current?.title}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
          Adicionar Usuário
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
                {['', 'Nome', 'E-mail', 'Permissão', 'Desde', 'Ações'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: '#475569' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Nenhum membro cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                members.map(m => (
                  <TableRow key={m.id} hover>
                    <TableCell sx={{ width: 48 }}>
                      <Avatar src={m.user?.avatar_url} sx={{ width: 32, height: 32, fontSize: 13 }}>
                        {m.user?.name?.[0]}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{m.user?.name || '—'}</TableCell>
                    <TableCell>{m.user?.email || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={roleLabels[m.role] || m.role}
                        size="small"
                        sx={{
                          fontSize: 11,
                          bgcolor: m.role === 'org_admin' ? '#e8f5ee' : '#f1f5f9',
                          color: m.role === 'org_admin' ? '#1a6b4a' : '#475569',
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>
                      {new Date(m.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Alterar permissão">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditItem(m);
                            setEditRole(m.role);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remover da organização">
                        <IconButton
                          size="small"
                          sx={{ color: '#dc2626' }}
                          onClick={() => setDeleteId(m.id)}
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

      {/* Modal adicionar */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={600}>Adicionar Usuário</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="E-mail do usuário"
            size="small"
            fullWidth
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
          />
          <Select
            size="small"
            value={newRole}
            onChange={e => setNewRole(e.target.value as 'org_admin' | 'org_viewer')}
          >
            <MenuItem value="org_viewer">Visualizador</MenuItem>
            <MenuItem value="org_admin">Admin</MenuItem>
          </Select>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setAddOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={adding}
            startIcon={adding ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal editar role */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={600}>Alterar Permissão</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Typography fontSize={13} color="text.secondary" mb={2}>
            {editItem?.user?.name}
          </Typography>
          <Select
            size="small"
            fullWidth
            value={editRole}
            onChange={e => setEditRole(e.target.value as 'org_admin' | 'org_viewer')}
          >
            <MenuItem value="org_viewer">Visualizador</MenuItem>
            <MenuItem value="org_admin">Admin</MenuItem>
          </Select>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setEditItem(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditRole}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmar remoção */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs">
        <DialogTitle fontWeight={600}>Remover usuário?</DialogTitle>
        <DialogContent>
          <Typography fontSize={14} color="text.secondary">
            O usuário perderá acesso a esta organização.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </PrivateLayout>
  );
}
