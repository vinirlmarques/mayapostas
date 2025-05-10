'use client';

import './globals.css';
import Cabecalho from '@/components/header/Cabecalho';
import { ThemeProvider } from '@/context/ThemeContext';
import Home from '@/app/home/page';
import { useState, useEffect } from 'react';
import { metadata } from '@/app/metadata';  // Importe o arquivo de metadata

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Solicita a senha assim que a página for carregada
    const password = prompt('Digite a senha para acessar o site');
    if (password === 'flamengo') {
      setIsAuthenticated(true);
    } else {
      alert('Senha incorreta');
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body>
        <ThemeProvider>
          {isAuthenticated ? (
            <>
              <Cabecalho />
              <Home />
            </>
          ) : null}
        </ThemeProvider>
      </body>
    </html>
  );
}
