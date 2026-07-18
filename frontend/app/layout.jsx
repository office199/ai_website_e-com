import './globals.css';
import { AppProvider } from './context/AppContext';
import SmoothScroll from './components/SmoothScroll';

export const metadata = {
  title: 'MODÉ — The world is your runway',
  description: 'Curated fashion for every version of you.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll>
          <AppProvider>
            {children}
          </AppProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
