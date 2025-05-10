import './globals.css';
import Cabecalho from '@/components/header/Cabecalho';
import { ThemeProvider } from '@/context/ThemeContext';
import Home from '@/app/home/page';

export const metadata = {
  title: 'Wipes',
  description: 'Your Rust wipe tracker!',
};

export default function RootLayout() {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body>
        <ThemeProvider>
          <Cabecalho></Cabecalho>
          <Home></Home>
        </ThemeProvider>
      </body>
    </html>
  );
}
