import './globals.css';
import { AppProvider } from './context/AppContext';

export const metadata = {
  title: 'MODÉ — The world is your runway',
  description: 'Curated fashion for every version of you.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
