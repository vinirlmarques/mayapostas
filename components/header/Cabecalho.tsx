'use client';
import MenuItem from './MenuItem';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useTheme } from '@/context/ThemeContext';

export default function Cabecalho() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="h-2/24 fixed left-0 top-0 z-50 flex w-full items-center justify-between bg-[#2c2c2c] text-[var(--text-header)] pl-5 pr-5 md:pl-10 transition-colors duration-300">
      <div className="ml-10 hidden w-full items-center justify-center space-x-20 md:flex">
        <MenuItem title="Meus jogos" href="/home" />
        <MenuItem title="Futúros módulos" href="/upload" />
      </div>
    </div>
  );
}