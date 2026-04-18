import { useEffect, useState, useCallback } from 'react';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventNoteIcon from '@mui/icons-material/EventNote';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SpeedIcon from '@mui/icons-material/Speed';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { PrivateLayout } from '../../components/PrivateLayout';
import { useEnterprise } from '../../contexts/EnterpriseContext';
import api from '../../services/api';
import type { EnterpriseHub, HospitalSummary } from '../../dtos';

// ─── helpers ─────────────────────────────────────────────────────────────────

const BRL = (v: number, compact = false) =>
  v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: compact ? 0 : 2,
  });

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function labelFromKey(key: string) {
  const [y, m] = key.split('-');
  return `${MONTHS_PT[Number(m) - 1]} ${y}`;
}

function addMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return toMonthKey(d);
}

// ─── KPI card principal ───────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon,
  iconBg,
  iconColor,
  highlight,
  tooltip,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  highlight?: 'positive' | 'negative' | 'neutral';
  tooltip?: string;
}) {
  const valueColor =
    highlight === 'positive'
      ? '#1a6b4a'
      : highlight === 'negative'
      ? '#dc2626'
      : 'text.primary';

  return (
    <Tooltip title={tooltip ?? ''} placement="top" arrow>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          border: '1px solid #e8eef2',
          borderRadius: 3,
          height: '100%',
          transition: 'box-shadow 0.15s',
          '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.07)' },
        }}
      >
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography fontSize={11} color="text.secondary" fontWeight={500} mb={0.5} textTransform="uppercase" letterSpacing={0.5}>
              {label}
            </Typography>
            <Typography fontSize={22} fontWeight={700} color={valueColor} lineHeight={1.2}>
              {value}
            </Typography>
            {sub && (
              <Typography fontSize={11} color="text.secondary" mt={0.5}>
                {sub}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              ml: 1,
            }}
          >
            <Box sx={{ color: iconColor, display: 'flex' }}>{icon}</Box>
          </Box>
        </Box>
      </Paper>
    </Tooltip>
  );
}

// ─── Hospital card ────────────────────────────────────────────────────────────

function HospitalCard({ hospital }: { hospital: HospitalSummary }) {
  const navigate = useNavigate();
  const balance = hospital.month_income - hospital.month_outcome;
  const isPositive = balance >= 0;
  const margin =
    hospital.month_income > 0
      ? ((balance / hospital.month_income) * 100).toFixed(1)
      : null;

  return (
    <Paper
      elevation={0}
      onClick={() => navigate(`/hospitais/${hospital.id}`)}
      sx={{
        p: 2,
        border: '1px solid #e8eef2',
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        '&:hover': {
          borderColor: '#1a6b4a',
          boxShadow: '0 2px 8px rgba(26,107,74,0.12)',
        },
      }}
    >
      <Avatar
        src={hospital.logo_url ?? undefined}
        variant="rounded"
        sx={{ width: 44, height: 44, bgcolor: '#e8f5ee', flexShrink: 0 }}
      >
        <LocalHospitalIcon sx={{ color: '#1a6b4a', fontSize: 22 }} />
      </Avatar>

      <Box flex={1} overflow="hidden">
        <Typography fontSize={14} fontWeight={600} noWrap>
          {hospital.name}
        </Typography>
        <Typography fontSize={12} color="text.secondary" noWrap>
          {[hospital.cidade, hospital.uf].filter(Boolean).join(' – ')}
        </Typography>
      </Box>

      {/* plantões do mês */}
      <Box textAlign="center" sx={{ display: { xs: 'none', sm: 'block' } }}>
        <Typography fontSize={13} fontWeight={600}>
          {hospital.month_appointments}
        </Typography>
        <Typography fontSize={10} color="text.secondary">
          plantões
        </Typography>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, display: { xs: 'none', sm: 'flex' } }} />

      {/* saldo do mês */}
      <Box textAlign="right" flexShrink={0}>
        <Typography fontSize={13} fontWeight={700} color={isPositive ? '#1a6b4a' : '#dc2626'}>
          {isPositive ? '+' : ''}{BRL(balance, true)}
        </Typography>
        {margin !== null && (
          <Chip
            label={`${isPositive ? '+' : ''}${margin}%`}
            size="small"
            sx={{
              height: 18,
              fontSize: 10,
              fontWeight: 600,
              bgcolor: isPositive ? '#e8f5ee' : '#fff5f5',
              color: isPositive ? '#1a6b4a' : '#dc2626',
              mt: 0.3,
            }}
          />
        )}
      </Box>
    </Paper>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { current } = useEnterprise();

  const [monthKey, setMonthKey] = useState(() => toMonthKey(new Date()));
  const [hub, setHub] = useState<EnterpriseHub | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!current?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/enterprise/${current.id}/hub?month=${monthKey}`);
      setHub(res.data);
    } catch {
      toast.error('Erro ao carregar dashboard.');
    } finally {
      setLoading(false);
    }
  }, [current?.id, monthKey]);

  useEffect(() => { load(); }, [load]);

  // KPIs derivados
  const balance = hub ? hub.month_income - hub.month_outcome : 0;
  const margin =
    hub && hub.month_income > 0
      ? ((balance / hub.month_income) * 100).toFixed(1)
      : null;
  const isCurrentMonth = monthKey === toMonthKey(new Date());

  return (
    <PrivateLayout>
      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            {current?.title || 'Dashboard'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visão consolidada da organização
          </Typography>
        </Box>

        {/* navegador de mês */}
        <Box display="flex" alignItems="center" gap={0.5}>
          <IconButton size="small" onClick={() => setMonthKey(k => addMonth(k, -1))}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Box
            sx={{
              px: 2,
              py: 0.5,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              minWidth: 160,
              textAlign: 'center',
            }}
          >
            <Typography fontSize={14} fontWeight={600}>
              {labelFromKey(monthKey)}
            </Typography>
            {isCurrentMonth && (
              <Typography fontSize={10} color="text.secondary">
                mês atual
              </Typography>
            )}
          </Box>
          <IconButton
            size="small"
            onClick={() => setMonthKey(k => addMonth(k, 1))}
            disabled={isCurrentMonth}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {loading || !hub ? (
        <Box display="flex" justifyContent="center" pt={8}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* ── KPIs linha 1: financeiros do mês ──────────────────────── */}
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label="Receita do mês"
                value={BRL(hub.month_income, true)}
                icon={<TrendingUpIcon fontSize="small" />}
                iconBg="#e8f5ee"
                iconColor="#1a6b4a"
                highlight="positive"
                tooltip="Total de receitas lançadas no período"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label="Custo do mês"
                value={BRL(hub.month_outcome, true)}
                icon={<TrendingDownIcon fontSize="small" />}
                iconBg="#fff5f5"
                iconColor="#dc2626"
                highlight="negative"
                tooltip="Total de custos lançados no período"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label="Saldo do mês"
                value={`${balance >= 0 ? '+' : ''}${BRL(balance, true)}`}
                sub={margin !== null ? `margem líquida ${balance >= 0 ? '+' : ''}${margin}%` : undefined}
                icon={<AccountBalanceIcon fontSize="small" />}
                iconBg={balance >= 0 ? '#e8f5ee' : '#fff5f5'}
                iconColor={balance >= 0 ? '#1a6b4a' : '#dc2626'}
                highlight={balance >= 0 ? 'positive' : 'negative'}
                tooltip="Receita menos custo no período"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label="Plantões no mês"
                value={hub.month_appointments.toLocaleString('pt-BR')}
                icon={<EventNoteIcon fontSize="small" />}
                iconBg="#e3f2fd"
                iconColor="#1565c0"
                tooltip="Total de plantões com data no período"
              />
            </Grid>
          </Grid>

          {/* ── KPIs linha 2: operacionais ────────────────────────────── */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label="Médicos ativos"
                value={hub.active_doctors}
                sub="com plantão no período"
                icon={<PeopleAltIcon fontSize="small" />}
                iconBg="#f3e5f5"
                iconColor="#7b1fa2"
                tooltip="Médicos distintos com ao menos 1 plantão no mês"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label="Custo médio / plantão"
                value={BRL(hub.avg_cost_per_appointment, true)}
                sub="sobre custo total do mês"
                icon={<SpeedIcon fontSize="small" />}
                iconBg="#fff8e1"
                iconColor="#f57f17"
                tooltip="Custo total do mês dividido pelo número de plantões"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label="Hospitais"
                value={hub.hospitals_count}
                sub="na organização"
                icon={<LocalHospitalIcon fontSize="small" />}
                iconBg="#e8f5ee"
                iconColor="#1a6b4a"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label="Plantões (total histórico)"
                value={hub.total_appointments.toLocaleString('pt-BR')}
                sub="desde o início"
                icon={<EventNoteIcon fontSize="small" />}
                iconBg="#f5f5f5"
                iconColor="#757575"
                highlight="neutral"
              />
            </Grid>
          </Grid>

          {/* ── Lista de hospitais ─────────────────────────────────────── */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Typography fontSize={15} fontWeight={600}>
              Hospitais da Organização
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              Saldo = receita − custo em {labelFromKey(monthKey)}
            </Typography>
          </Box>

          <Box display="flex" flexDirection="column" gap={1.5}>
            {hub.hospitals.length === 0 ? (
              <Typography color="text.secondary" fontSize={13}>
                Nenhum hospital vinculado a esta organização.
              </Typography>
            ) : (
              [...hub.hospitals]
                .sort(
                  (a, b) =>
                    b.month_income - b.month_outcome - (a.month_income - a.month_outcome),
                )
                .map(h => <HospitalCard key={h.id} hospital={h} />)
            )}
          </Box>
        </>
      )}
    </PrivateLayout>
  );
}
