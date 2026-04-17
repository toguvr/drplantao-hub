import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Divider,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEnterprise } from '../../contexts/EnterpriseContext';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'Hospitais', icon: <LocalHospitalIcon />, path: '/hospitais' },
  { label: 'Usuários', icon: <PeopleIcon />, path: '/usuarios' },
  { label: 'Financeiro', icon: <AttachMoneyIcon />, path: '/financeiro' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { enterprises, current, setCurrent } = useEnterprise();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: '#0f3d29',
          color: '#fff',
        },
      }}
    >
      {/* Logo / Header */}
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Typography
          variant="h6"
          fontWeight={700}
          color="#fff"
          letterSpacing={-0.5}
        >
          Dr. Plantão
        </Typography>
        <Typography variant="caption" color="rgba(255,255,255,0.5)">
          Hub
        </Typography>
      </Box>

      {/* Seletor de organização */}
      {enterprises.length > 1 && (
        <Box sx={{ px: 2, pb: 1 }}>
          <FormControl fullWidth size="small">
            <Select
              value={current?.id || ''}
              onChange={e => {
                const found = enterprises.find(
                  ue => ue.enterprise.id === e.target.value,
                );
                if (found) setCurrent(found.enterprise);
              }}
              sx={{
                color: '#fff',
                '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                '.MuiSvgIcon-root': { color: '#fff' },
                fontSize: 13,
              }}
            >
              {enterprises.map(ue => (
                <MenuItem key={ue.enterprise.id} value={ue.enterprise.id}>
                  {ue.enterprise.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {enterprises.length === 1 && current && (
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Typography
            fontSize={12}
            color="rgba(255,255,255,0.7)"
            fontWeight={500}
          >
            {current.title}
          </Typography>
        </Box>
      )}

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 2 }} />

      {/* Nav */}
      <List sx={{ px: 1, pt: 1, flex: 1 }}>
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                bgcolor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 2 }} />

      {/* User footer */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          src={user?.avatar_url}
          sx={{ width: 32, height: 32, fontSize: 13 }}
        >
          {user?.name?.[0]}
        </Avatar>
        <Box flex={1} overflow="hidden">
          <Typography fontSize={12} fontWeight={600} color="#fff" noWrap>
            {user?.name}
          </Typography>
          <Typography fontSize={10} color="rgba(255,255,255,0.5)" noWrap>
            {user?.email}
          </Typography>
        </Box>
        <LogoutIcon
          sx={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
          onClick={signOut}
        />
      </Box>
    </Drawer>
  );
}
