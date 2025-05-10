'use client';

import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

export default function HomeTop() {
  const { theme } = useTheme();

  const inputStyles = {
    backgroundColor: "var(--background)",
    color: "var(--text)",
  };

  return (
    <div className="bg-[var(--background)] mt-24 w-full flex justify-start items-center flex-col">

      <div className="flex justify-center items-center flex-row">
        <Image
          src="/assets/logomay.png"
          alt="Logo"
          width={400}
          height={50}
          style={{ marginTop: '30px' }}
        />
      </div>

      <h2 className="text-[var(--text)] text-xl mt-4 transition-colors duration-300">
        May Que Que Isso apostas!
      </h2>
    </div>
  );
}