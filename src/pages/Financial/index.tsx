import { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { toast } from 'react-toastify';
import { PrivateLayout } from '../../components/PrivateLayout';
import { useEnterprise } from '../../contexts/EnterpriseContext';
import api from '../../services/api';
import type { FinancialData } from '../../dtos';

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Financial() {
  const { current } = useEnterprise();
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const load = async () => {
    if (!current?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/enterprise/${current.id}/financial`, {
        params: { month },
      });
      setData(res.data);
    } catch {
      toast.error('Erro ao carregar financeiro.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [current?.id, month]);

  return (
    <PrivateLayout>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Financeiro
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {current?.title}
          </Typography>
        </Box>
        <TextField
          type="month"
          size="small"
          value={month}
          onChange={e => setMonth(e.target.value)}
          sx={{ width: 160 }}
        />
      </Box>

      {loading || !data ? (
        <Box display="flex" justifyContent="center" pt={6}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Totalizadores */}
          <Box display="flex" gap={2} mb={3}>
            {[
              { label: 'Receita Total', value: data.totals.income, color: '#1a6b4a' },
              { label: 'Custo Total', value: data.totals.outcome, color: '#dc2626' },
              {
                label: 'Saldo',
                value: data.totals.income - data.totals.outcome,
                color:
                  data.totals.income - data.totals.outcome >= 0 ? '#1a6b4a' : '#dc2626',
              },
            ].map(card => (
              <Paper
                key={card.label}
                elevation={0}
                sx={{ flex: 1, p: 2.5, border: '1px solid #e8eef2', borderRadius: 3 }}
              >
                <Typography fontSize={12} color="text.secondary" fontWeight={500} mb={0.5}>
                  {card.label}
                </Typography>
                <Typography fontSize={22} fontWeight={700} color={card.color}>
                  {fmt(card.value)}
                </Typography>
              </Paper>
            ))}
          </Box>

          {/* Tabela por hospital */}
          <Paper elevation={0} sx={{ border: '1px solid #e8eef2' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  {['Hospital', 'Receita', 'Custo', 'Saldo'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: '#475569' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Sem dados para o período selecionado
                    </TableCell>
                  </TableRow>
                ) : (
                  data.rows.map(row => {
                    const balance = row.income - row.outcome;
                    return (
                      <TableRow key={row.hospital_id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{row.hospital_name}</TableCell>
                        <TableCell sx={{ color: '#1a6b4a' }}>{fmt(row.income)}</TableCell>
                        <TableCell sx={{ color: '#dc2626' }}>{fmt(row.outcome)}</TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            color: balance >= 0 ? '#1a6b4a' : '#dc2626',
                          }}
                        >
                          {balance >= 0 ? '+' : ''}
                          {fmt(balance)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </PrivateLayout>
  );
}
