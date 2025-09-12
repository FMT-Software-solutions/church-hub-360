import { ThemeProvider } from 'next-themes';
import { AppRouter } from './router/AppRouter';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AppRouter />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
