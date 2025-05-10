'use client';

import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import HomeTop from '@/components/home/homeTop';
import HomeSearch from '@/components/home/homeSearch';

export default function Home() {
    const { theme } = useTheme();

    return (
        <div className='w-fullflex flex-col items-center justify-start h-screen mx-auto'>
            <HomeTop />
            <HomeSearch />
        </div>
    );
}
