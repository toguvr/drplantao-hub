import { Box } from '@mui/material';
import { Sidebar } from '../Sidebar';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function PrivateLayout({ children }: Props) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{ flex: 1, p: 3, overflowY: 'auto' }}
      >
        {children}
      </Box>
    </Box>
  );
}
