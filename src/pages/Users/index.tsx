import { useEffect, useMemo, useState } from 'react';
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
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { toast } from 'react-toastify';
import { PrivateLayout } from '../../components/PrivateLayout';
import { useEnterprise } from '../../contexts/EnterpriseContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import type { UserEnterprise } from '../../dtos';

// ─── Tokens ──────────────────────────────────────────────────────────────────

const C = {
  green: '#1a6b4a',
  greenSoft: '#e8f5ee',
  blue: '#1565c0',
  blueSoft: '#e3f2fd',
  red: '#dc2626',
  border: '#e8eef2',
  borderSoft: '#f1f5f9',
  textMuted: '#64748b',
  surface: '#ffffff',
};

type Role = 'org_admin' | 'org_viewer';

const ROLE_META: Record<Role, {
  label: string; tag: string; description: string;
  bg: string; fg: string; Icon: typeof VerifiedUserIcon;
}> = {
  org_admin: {
    label: 'Admin',
    tag: 'Administrador da organização',
    description: 'Pode editar a organização, gerenciar hospitais e adicionar/remover membros.',
    bg: C.greenSoft,
    fg: C.green,
    Icon: VerifiedUserIcon,
  },
  org_viewer: {
    label: 'Visualizador',
    tag: 'Acesso somente leitura',
    description: 'Visualiza dados consolidados e detalhe dos hospitais. Não altera nada.',
    bg: C.blueSoft,
    fg: C.blue,
    Icon: VisibilityIcon,
  },
};

// ─── Role chip / Role card ──────────────────────────────────────────────────

function RoleChip({ role }: { role: string }) {
  const meta = ROLE_META[role as Role];
  if (!meta) {
    return <Chip size="small" label={role} />;
  }
  const { Icon } = meta;
  return (
    <Chip
      size="small"
      icon={<Icon sx={{ fontSize: 14 }} />}
      label={meta.label}
      sx={{
        height: 24,
        fontSize: 11,
        fontWeight: 600,
        bgcolor: meta.bg,
        color: meta.fg,
        '& .MuiChip-icon': { ml: 0.75, color: meta.fg },
      }}
    />
  );
}

function RoleCard({
  role,
  selected,
  onSelect,
}: {
  role: Role;
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = ROLE_META[role];
  const { Icon } = meta;
  return (
    <Paper
      elevation={0}
      onClick={onSelect}
      sx={{
        p: 1.75,
        border: `1.5px solid ${selected ? meta.fg : C.border}`,
        bgcolor: selected ? meta.bg : C.surface,
        borderRadius: 2,
        cursor: 'pointer',
        display: 'flex',
        gap: 1.5,
        alignItems: 'flex-start',
        transition: 'border-color 0.12s, background 0.12s',
        '&:hover': { borderColor: meta.fg },
      }}
    >
      <Box
        sx={{
          width: 32, height: 32, borderRadius: '50%',
          bgcolor: meta.bg, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 18, color: meta.fg }} />
      </Box>
      <Box flex={1}>
        <Typography fontSize={13} fontWeight={700} color="text.primary">
          {meta.label}
        </Typography>
        <Typography fontSize={11} color="text.secondary" lineHeight={1.4} mt={0.25}>
          {meta.description}
        </Typography>
      </Box>
    </Paper>
  );
}

// ─── Member row ─────────────────────────────────────────────────────────────

function MemberRow({
  member,
  isCurrentUser,
  onChangeRole,
  onRemove,
}: {
  member: UserEnterprise;
  isCurrentUser: boolean;
  onChangeRole: () => void;
  onRemove: () => void;
}) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: `1px solid ${C.border}`,
        borderRadius: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        transition: 'border-color 0.12s, box-shadow 0.12s',
        '&:hover': {
          borderColor: '#cbd5e1',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        },
      }}
    >
      <Avatar
        src={member.user?.avatar_url ?? undefined}
        sx={{ width: 42, height: 42, fontSize: 14, fontWeight: 600 }}
      >
        {member.user?.name?.[0]?.toUpperCase()}
      </Avatar>

      <Box flex={1} minWidth={0}>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Typography fontSize={14} fontWeight={600} noWrap>
            {member.user?.name || '—'}
          </Typography>
          {isCurrentUser && (
            <Chip
              label="você"
              size="small"
              sx={{
                height: 18,
                fontSize: 10,
                fontWeight: 600,
                bgcolor: C.borderSoft,
                color: C.textMuted,
              }}
            />
          )}
        </Box>
        <Typography fontSize={12} color="text.secondary" noWrap>
          {member.user?.email || '—'}
        </Typography>
      </Box>

      <Box display="flex" alignItems="center" gap={2} flexShrink={0}>
        <RoleChip role={member.role} />
        <Typography fontSize={11} color="text.secondary" sx={{ display: { xs: 'none', md: 'block' }, minWidth: 80, textAlign: 'right' }}>
          desde {new Date(member.created_at).toLocaleDateString('pt-BR')}
        </Typography>
        <IconButton
          size="small"
          onClick={e => setAnchor(e.currentTarget)}
          disabled={isCurrentUser}
          sx={{ color: isCurrentUser ? '#cbd5e1' : 'inherit' }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={anchor}
          open={!!anchor}
          onClose={() => setAnchor(null)}
          PaperProps={{ sx: { minWidth: 180 } }}
        >
          <MenuItem onClick={() => { setAnchor(null); onChangeRole(); }}>
            <VerifiedUserIcon sx={{ fontSize: 16, mr: 1.25, color: C.textMuted }} />
            <Typography fontSize={13}>Alterar permissão</Typography>
          </MenuItem>
          <MenuItem onClick={() => { setAnchor(null); onRemove(); }} sx={{ color: C.red }}>
            <PersonOffIcon sx={{ fontSize: 16, mr: 1.25 }} />
            <Typography fontSize={13}>Remover da organização</Typography>
          </MenuItem>
        </Menu>
      </Box>
    </Paper>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ onAdd, hasFilter }: { onAdd: () => void; hasFilter: boolean }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 5, textAlign: 'center',
        border: `1px dashed ${C.border}`, borderRadius: 3,
      }}
    >
      <GroupAddIcon sx={{ fontSize: 40, color: C.textMuted, mb: 1 }} />
      <Typography fontSize={15} fontWeight={600}>
        {hasFilter ? 'Nenhum membro encontrado' : 'Nenhum membro nesta organização'}
      </Typography>
      <Typography fontSize={12} color="text.secondary" mb={hasFilter ? 0 : 2}>
        {hasFilter
          ? 'Tente ajustar a busca.'
          : 'Convide colegas para colaborar com a gestão.'}
      </Typography>
      {!hasFilter && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
          Adicionar primeiro usuário
        </Button>
      )}
    </Paper>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Users() {
  const { current } = useEnterprise();
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState<UserEnterprise[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // modal adicionar
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('org_viewer');
  const [adding, setAdding] = useState(false);

  // modal editar role
  const [editItem, setEditItem] = useState<UserEnterprise | null>(null);
  const [editRole, setEditRole] = useState<Role>('org_viewer');
  const [savingRole, setSavingRole] = useState(false);

  // remover
  const [deleteItem, setDeleteItem] = useState<UserEnterprise | null>(null);
  const [removing, setRemoving] = useState(false);

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

  useEffect(() => { load(); }, [current?.id]);

  // filtra + ordena (admins primeiro, depois alfabético)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const arr = q
      ? members.filter(m =>
          (m.user?.name || '').toLowerCase().includes(q) ||
          (m.user?.email || '').toLowerCase().includes(q),
        )
      : [...members];

    arr.sort((a, b) => {
      if (a.role !== b.role) return a.role === 'org_admin' ? -1 : 1;
      return (a.user?.name || '').localeCompare(b.user?.name || '');
    });
    return arr;
  }, [members, search]);

  const handleAdd = async () => {
    if (!newEmail || !current?.id) return;
    setAdding(true);
    try {
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
      toast.success('Usuário adicionado!');
      setAddOpen(false);
      setNewEmail('');
      setNewRole('org_viewer');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao adicionar.');
    } finally {
      setAdding(false);
    }
  };

  const handleEditRole = async () => {
    if (!editItem) return;
    setSavingRole(true);
    try {
      await api.patch(`/userEnterprise/${editItem.id}/role`, { role: editRole });
      toast.success('Permissão atualizada!');
      setEditItem(null);
      load();
    } catch {
      toast.error('Erro ao atualizar permissão.');
    } finally {
      setSavingRole(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setRemoving(true);
    try {
      await api.delete(`/userEnterprise/${deleteItem.id}`);
      toast.success('Usuário removido.');
      setDeleteItem(null);
      load();
    } catch {
      toast.error('Erro ao remover.');
    } finally {
      setRemoving(false);
    }
  };

  const adminCount = useMemo(
    () => members.filter(m => m.role === 'org_admin').length,
    [members],
  );

  return (
    <PrivateLayout>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2.5} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Membros
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {current?.title} · {members.length} {members.length === 1 ? 'membro' : 'membros'}
            {adminCount > 0 && (
              <> · {adminCount} {adminCount === 1 ? 'admin' : 'admins'}</>
            )}
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            size="small"
            placeholder="Buscar por nome ou e-mail"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ minWidth: { sm: 280 }, bgcolor: C.surface }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: C.textMuted }} />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            Adicionar
          </Button>
        </Stack>
      </Box>

      {/* Lista */}
      {loading ? (
        <Stack spacing={1.25}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={74} />
          ))}
        </Stack>
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={() => setAddOpen(true)} hasFilter={!!search} />
      ) : (
        <Stack spacing={1.25}>
          {filtered.map(m => (
            <MemberRow
              key={m.id}
              member={m}
              isCurrentUser={m.user?.id === currentUser?.id}
              onChangeRole={() => {
                setEditItem(m);
                setEditRole(m.role as Role);
              }}
              onRemove={() => setDeleteItem(m)}
            />
          ))}
        </Stack>
      )}

      {/* Modal adicionar */}
      <Dialog open={addOpen} onClose={() => !adding && setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Adicionar membro</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="E-mail do usuário"
            size="small"
            fullWidth
            type="email"
            placeholder="usuario@exemplo.com.br"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            autoFocus
          />
          <Box>
            <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={1}>
              PERMISSÃO
            </Typography>
            <Stack spacing={1}>
              <RoleCard
                role="org_admin"
                selected={newRole === 'org_admin'}
                onSelect={() => setNewRole('org_admin')}
              />
              <RoleCard
                role="org_viewer"
                selected={newRole === 'org_viewer'}
                onSelect={() => setNewRole('org_viewer')}
              />
            </Stack>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setAddOpen(false)} disabled={adding}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={adding || !newEmail}
            startIcon={adding ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal alterar permissão */}
      <Dialog open={!!editItem} onClose={() => !savingRole && setEditItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Alterar permissão</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              src={editItem?.user?.avatar_url ?? undefined}
              sx={{ width: 36, height: 36, fontSize: 14, fontWeight: 600 }}
            >
              {editItem?.user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography fontSize={13} fontWeight={600}>
                {editItem?.user?.name}
              </Typography>
              <Typography fontSize={11} color="text.secondary">
                {editItem?.user?.email}
              </Typography>
            </Box>
          </Box>
          <Stack spacing={1}>
            <RoleCard
              role="org_admin"
              selected={editRole === 'org_admin'}
              onSelect={() => setEditRole('org_admin')}
            />
            <RoleCard
              role="org_viewer"
              selected={editRole === 'org_viewer'}
              onSelect={() => setEditRole('org_viewer')}
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setEditItem(null)} disabled={savingRole}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleEditRole}
            disabled={savingRole || editRole === editItem?.role}
            startIcon={savingRole ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmar remoção */}
      <Dialog open={!!deleteItem} onClose={() => !removing && setDeleteItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Remover da organização?</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Avatar
              src={deleteItem?.user?.avatar_url ?? undefined}
              sx={{ width: 36, height: 36, fontSize: 14, fontWeight: 600 }}
            >
              {deleteItem?.user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography fontSize={13} fontWeight={600}>
                {deleteItem?.user?.name}
              </Typography>
              <Typography fontSize={11} color="text.secondary">
                {deleteItem?.user?.email}
              </Typography>
            </Box>
          </Box>
          <Typography fontSize={13} color="text.secondary">
            O usuário perderá acesso aos dados desta organização. Essa ação pode ser revertida adicionando-o novamente.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteItem(null)} disabled={removing}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={removing}
            startIcon={removing ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </PrivateLayout>
  );
}
