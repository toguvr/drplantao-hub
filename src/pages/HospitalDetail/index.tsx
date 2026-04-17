import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PrivateLayout } from '../../components/PrivateLayout';
import { useEnterprise } from '../../contexts/EnterpriseContext';
import api from '../../services/api';
import type { HospitalDetail } from '../../dtos';

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function KPICard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Paper elevation={0} sx={{ p: 2, border: '1px solid #e8eef2', borderRadius: 3, flex: 1 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography fontSize={11} color="text.secondary" fontWeight={500} mb={0.5}>
            {label}
          </Typography>
          <Typography fontSize={20} fontWeight={700}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </Paper>
  );
}

export default function HospitalDetail() {
  const { id: hospital_id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { current } = useEnterprise();

  const [data, setData] = useState<HospitalDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const load = async (selectedMonth: string) => {
    if (!current?.id || !hospital_id) return;
    setLoading(true);
    try {
      const res = await api.get(
        `/enterprise/${current.id}/hospitals/${hospital_id}/detail`,
        { params: { month: selectedMonth } },
      );
      setData(res.data);
    } catch {
      toast.error('Erro ao carregar detalhes do hospital.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(month);
  }, [current?.id, hospital_id, month]);

  if (loading && !data) {
    return (
      <PrivateLayout>
        <Box display="flex" justifyContent="center" pt={8}>
          <CircularProgress />
        </Box>
      </PrivateLayout>
    );
  }

  const hospital = data?.hospital;
  const kpis = data?.kpis;

  return (
    <PrivateLayout>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1.5} mb={3}>
        <Box
          sx={{ cursor: 'pointer', color: 'text.secondary', display: 'flex' }}
          onClick={() => navigate(-1)}
        >
          <ArrowBackIcon fontSize="small" />
        </Box>
        <Avatar
          src={hospital?.logo_url || undefined}
          variant="rounded"
          sx={{ width: 40, height: 40, bgcolor: '#e8f5ee' }}
        >
          <LocalHospitalIcon sx={{ color: '#1a6b4a', fontSize: 20 }} />
        </Avatar>
        <Box flex={1}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            {hospital?.name ?? '—'}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            {[hospital?.cidade, hospital?.uf].filter(Boolean).join(' – ')}
          </Typography>
        </Box>

        {/* Seletor de mês */}
        <TextField
          type="month"
          size="small"
          value={month}
          onChange={e => setMonth(e.target.value)}
          sx={{ width: 150 }}
        />
      </Box>

      {/* KPIs */}
      {kpis && (
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <KPICard
            label="Plantões no mês"
            value={kpis.total_appointments_month.toLocaleString('pt-BR')}
            icon={<EventNoteIcon sx={{ color: '#2196f3', fontSize: 20 }} />}
            color="#e3f2fd"
          />
          <KPICard
            label="Total de plantões"
            value={kpis.total_appointments_all.toLocaleString('pt-BR')}
            icon={<EventNoteIcon sx={{ color: '#7c3aed', fontSize: 20 }} />}
            color="#f3e8ff"
          />
          <KPICard
            label="Médicos vinculados"
            value={kpis.active_doctors}
            icon={<PeopleIcon sx={{ color: '#1a6b4a', fontSize: 20 }} />}
            color="#e8f5ee"
          />
          <KPICard
            label="Receita no mês"
            value={fmt(kpis.income_month)}
            icon={<TrendingUpIcon sx={{ color: '#1a6b4a', fontSize: 20 }} />}
            color="#e8f5ee"
          />
          <KPICard
            label="Custo no mês"
            value={fmt(kpis.outcome_month)}
            icon={<TrendingDownIcon sx={{ color: '#dc2626', fontSize: 20 }} />}
            color="#fff5f5"
          />
        </Box>
      )}

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, borderBottom: '1px solid #e8eef2' }}
      >
        <Tab label="Plantões Recentes" sx={{ fontSize: 13, textTransform: 'none' }} />
        <Tab label="Médicos" sx={{ fontSize: 13, textTransform: 'none' }} />
        <Tab label="Informações" sx={{ fontSize: 13, textTransform: 'none' }} />
      </Tabs>

      {/* Tab 0 — Plantões recentes */}
      {tab === 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #e8eef2' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  {['Data', 'Título', 'Especialidade', 'Médico', 'Duração', 'Valor'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#475569' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {!data?.recent_appointments.length ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: 13 }}>
                      Nenhum plantão encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recent_appointments.map(a => (
                    <TableRow key={a.id} hover>
                      <TableCell sx={{ fontSize: 12 }}>
                        {new Date(a.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 500 }}>
                        {a.title}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        {a.expertise_name ?? '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        {a.doctor_name ?? (
                          <Typography fontSize={11} color="text.secondary">
                            Sem médico
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{a.duration}h</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{fmt(a.total_price)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}

      {/* Tab 1 — Médicos */}
      {tab === 1 && (
        <Paper elevation={0} sx={{ border: '1px solid #e8eef2' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                {['', 'Nome', 'E-mail', 'Tipo'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#475569' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!data?.doctors.length ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: 13 }}>
                    Nenhum médico vinculado
                  </TableCell>
                </TableRow>
              ) : (
                data.doctors.map(d => (
                  <TableRow key={d.id} hover>
                    <TableCell sx={{ width: 44 }}>
                      <Avatar src={d.avatar_url || undefined} sx={{ width: 30, height: 30, fontSize: 12 }}>
                        {d.name[0]}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 13 }}>{d.name}</TableCell>
                    <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{d.email}</TableCell>
                    <TableCell>
                      {d.admin ? (
                        <Tooltip title="Administrador">
                          <Chip
                            icon={<AdminPanelSettingsIcon sx={{ fontSize: '14px !important' }} />}
                            label="Admin"
                            size="small"
                            sx={{ fontSize: 10, bgcolor: '#e8f5ee', color: '#1a6b4a', fontWeight: 600 }}
                          />
                        </Tooltip>
                      ) : (
                        <Chip
                          label="Médico"
                          size="small"
                          sx={{ fontSize: 10, bgcolor: '#f1f5f9', color: '#475569' }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Tab 2 — Informações */}
      {tab === 2 && hospital && (
        <Paper elevation={0} sx={{ border: '1px solid #e8eef2', p: 3 }}>
          <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}
            gap={2}
          >
            {[
              { label: 'Taxa Admin', value: `${hospital.adminFee}%` },
              { label: 'Imposto', value: `${hospital.tax}%` },
              { label: 'Mín. horas', value: hospital.min_hours ? `${hospital.min_hours}h` : '—' },
              { label: 'Tolerância', value: `${hospital.min_tolerance}min` },
              { label: 'CEP', value: hospital.cep || '—' },
              { label: 'Endereço', value: [hospital.logradouro, hospital.numero, hospital.complemento].filter(Boolean).join(', ') || '—' },
              { label: 'Bairro', value: hospital.bairro || '—' },
              { label: 'Cidade / UF', value: [hospital.cidade, hospital.uf].filter(Boolean).join(' / ') || '—' },
              { label: 'Latitude', value: hospital.latitude || '—' },
              { label: 'Longitude', value: hospital.longitude || '—' },
            ].map(item => (
              <Box key={item.label}>
                <Typography fontSize={11} color="text.secondary" fontWeight={500}>
                  {item.label}
                </Typography>
                <Typography fontSize={14} fontWeight={500} mt={0.3}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </PrivateLayout>
  );
}
