import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventNoteIcon from '@mui/icons-material/EventNote';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { PrivateLayout } from '../../components/PrivateLayout';
import { useEnterprise } from '../../contexts/EnterpriseContext';
import api from '../../services/api';
import type { EnterpriseHub, HospitalSummary } from '../../dtos';

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
    <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #e8eef2', borderRadius: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography fontSize={12} color="text.secondary" fontWeight={500} mb={0.5}>
            {label}
          </Typography>
          <Typography fontSize={22} fontWeight={700} color="text.primary">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 44,
            height: 44,
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

function HospitalCard({ hospital }: { hospital: HospitalSummary }) {
  const navigate = useNavigate();
  const balance = hospital.total_income - hospital.total_outcome;

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
        '&:hover': { borderColor: '#1a6b4a', boxShadow: '0 2px 8px rgba(26,107,74,0.12)' },
      }}
    >
      <Avatar
        src={hospital.logo_url}
        variant="rounded"
        sx={{ width: 44, height: 44, bgcolor: '#e8f5ee' }}
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
      <Box textAlign="right">
        <Typography fontSize={13} fontWeight={600} color={balance >= 0 ? '#1a6b4a' : '#dc2626'}>
          {balance >= 0 ? '+' : ''}
          {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </Typography>
        <Typography fontSize={11} color="text.secondary">
          {hospital.total_appointments} plantões
        </Typography>
      </Box>
    </Paper>
  );
}

export default function Dashboard() {
  const { current } = useEnterprise();
  const [hub, setHub] = useState<EnterpriseHub | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!current?.id) return;

    const load = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/enterprise/${current.id}/hub`);
        setHub(response.data);
      } catch {
        toast.error('Erro ao carregar dashboard.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [current?.id]);

  return (
    <PrivateLayout>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} color="text.primary">
          {current?.title || 'Dashboard'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Visão consolidada da organização
        </Typography>
      </Box>

      {loading || !hub ? (
        <Box display="flex" justifyContent="center" pt={6}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* KPIs */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                label="Hospitais"
                value={hub.hospitals_count}
                icon={<LocalHospitalIcon sx={{ color: '#1a6b4a', fontSize: 22 }} />}
                color="#e8f5ee"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                label="Total de Plantões"
                value={hub.total_appointments.toLocaleString('pt-BR')}
                icon={<EventNoteIcon sx={{ color: '#2196f3', fontSize: 22 }} />}
                color="#e3f2fd"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                label="Receita Total"
                value={hub.total_income.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 0,
                })}
                icon={<TrendingUpIcon sx={{ color: '#1a6b4a', fontSize: 22 }} />}
                color="#e8f5ee"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                label="Custo Total"
                value={hub.total_outcome.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 0,
                })}
                icon={<TrendingDownIcon sx={{ color: '#dc2626', fontSize: 22 }} />}
                color="#fff5f5"
              />
            </Grid>
          </Grid>

          {/* Hospitais */}
          <Typography fontSize={16} fontWeight={600} mb={2}>
            Hospitais da Organização
          </Typography>
          <Box display="flex" flexDirection="column" gap={1.5}>
            {hub.hospitals.length === 0 ? (
              <Typography color="text.secondary" fontSize={13}>
                Nenhum hospital vinculado a esta organização.
              </Typography>
            ) : (
              hub.hospitals.map(h => <HospitalCard key={h.id} hospital={h} />)
            )}
          </Box>
        </>
      )}
    </PrivateLayout>
  );
}
