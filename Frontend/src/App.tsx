import { useAuth, AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { supabase } from './lib/supabase';

function AppContent() {
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error", error);
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-medical-50 to-teal-50 dark:from-[#0a1628] dark:via-[#0b1a2e] dark:to-[#0a1a28] flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          {/* Medical Loading Animation */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            {/* Outer pulse ring */}
            <div className="absolute inset-0 rounded-full border-2 border-medical-300/30 animate-ping" />
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-medical-500 border-r-teal-500 animate-spin" />
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-medical-500 to-teal-500 flex items-center justify-center shadow-medical">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19.14 14.634A5 5 0 0 0 17 5h-1.5A5.5 5.5 0 1 0 3 11.5" />
                  <path d="M12 12v9" />
                  <path d="m16 16-4-4-4 4" />
                </svg>
              </div>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm tracking-wide">Loading PharmaAI Research...</p>
          <div className="flex justify-center gap-1 mt-3">
            <div className="w-1.5 h-1.5 rounded-full bg-medical-400 animate-[blink_1.4s_infinite_both]" />
            <div className="w-1.5 h-1.5 rounded-full bg-medical-400 animate-[blink_1.4s_infinite_both_0.2s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-medical-400 animate-[blink_1.4s_infinite_both_0.4s]" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <Dashboard onLogout={handleLogout} />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
