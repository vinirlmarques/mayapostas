'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function Main() {
  // set theme based on local storage, if not set, use prefers-dark-scheme
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      document.documentElement.setAttribute('data-theme', storedTheme);
    } else {
      const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDarkScheme ? 'dark' : 'light');
    }
  }
    , []);
  redirect('/home');
  return null;
}
