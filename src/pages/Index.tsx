import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { LoginForm } from '@/components/Auth/LoginForm';
import { ParticipantDashboard } from '@/components/Dashboard/ParticipantDashboard';
import { BoothDashboard } from '@/components/Dashboard/BoothDashboard';
import { AdminDashboard } from '@/components/Dashboard/AdminDashboard';
import heroImage from '@/assets/hero-summit.jpg';

const Index = () => {
  const { user, login, logout, isLoading } = useAuth();
  const { homePageTexts, registerParticipant, loginParticipant, isLoading: dataLoading } = useData();

  const handleLogin = async (userType: 'participant' | 'booth' | 'admin', credentials: any) => {
    if (userType === 'participant') {
      // Handle participant registration/login through DataContext
      const pn = credentials.personalNumber;
      const pwd = credentials.password;
      const isRegistering = credentials.firstName && credentials.lastName;
      
      if (isRegistering) {
        // Registration flow
        const success = await registerParticipant({
          personalNumber: pn,
          firstName: credentials.firstName,
          lastName: credentials.lastName,
          position: credentials.position || '',
          password: pwd
        });
        
        if (success) {
          // Login after successful registration
          const loggedInUser = await loginParticipant(pn, pwd);
          if (loggedInUser) {
            // Set user in AuthContext manually
            const authUser = {
              id: `participant-${pn}`,
              personalNumber: pn,
              firstName: loggedInUser.firstName,
              lastName: loggedInUser.lastName,
              type: 'participant' as const,
              position: loggedInUser.position,
            };
            // Save to localStorage and set user state
            localStorage.setItem('authUser', JSON.stringify(authUser));
            window.location.reload(); // Force refresh to load user
            return true;
          }
        }
        return false;
      } else {
        // Login flow
        const loggedInUser = await loginParticipant(pn, pwd);
        if (loggedInUser) {
          // Set user in AuthContext manually
          const authUser = {
            id: `participant-${pn}`,
            personalNumber: pn,
            firstName: loggedInUser.firstName,
            lastName: loggedInUser.lastName,
            type: 'participant' as const,
            position: loggedInUser.position,
          };
          // Save to localStorage and set user state
          localStorage.setItem('authUser', JSON.stringify(authUser));
          window.location.reload(); // Force refresh to load user
          return true;
        }
        return false;
      }
    }
    
    // For booth/admin, use original auth logic
    const success = await login(userType, credentials);
    return success;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-pulse-soft">
            <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4"></div>
          </div>
          <p className="text-lg text-muted-foreground">Načítání...</p>
        </div>
      </div>
    );
  }

  // Show loading state while data is being fetched
  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-pulse-soft">
            <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4"></div>
          </div>
          <p className="text-lg text-muted-foreground">Načítání dat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        {/* Hero Section */}
        <div className="relative h-96 overflow-hidden">
          <img
            src={heroImage}
            alt="O2 Guru Summit 2025"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 flex items-center justify-center px-4 py-32">
            <div className="text-center text-white animate-fade-in">
              <h1 className="text-5xl font-bold mb-4">{homePageTexts.title}</h1>
              <p className="text-xl opacity-90">
                {homePageTexts.subtitle}
              </p>
              <p className="text-lg opacity-75 mt-2">
                {homePageTexts.description}
              </p>
            </div>
          </div>
        </div>

        {/* Login Section */}
        <div className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {homePageTexts.loginTitle}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {homePageTexts.loginDescription}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 animate-slide-up">
                <div className="bg-white rounded-lg p-6 shadow-card">
                  <h3 className="text-xl font-semibold text-primary mb-3">
                    {homePageTexts.benefitsTitle}
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    {homePageTexts.benefits.map((benefit, index) => (
                      <li key={index}>• {benefit}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-card">
                  <h3 className="text-xl font-semibold text-secondary mb-3">
                    {homePageTexts.prizesTitle}
                  </h3>
                  <p className="text-muted-foreground">
                    {homePageTexts.prizesDescription}
                  </p>
                </div>
              </div>

              <div className="animate-slide-up">
                <LoginForm onLogin={handleLogin} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Debug: log current user
  console.log('Current user:', user);

  // Route to appropriate dashboard based on user type
  if (user.type === 'participant') {
    try {
      return <ParticipantDashboard 
        user={user} 
        onLogout={logout} 
        onUserUpdate={() => {
          console.log('User update called');
        }}
      />;
    } catch (error) {
      console.error('ParticipantDashboard error:', error);
      return <div className="p-4">Chyba v ParticipantDashboard: {String(error)}</div>;
    }
  }

  if (user.type === 'booth') {
    try {
      return <BoothDashboard />;
    } catch (error) {
      console.error('BoothDashboard error:', error);
      return <div className="p-4">Chyba v BoothDashboard: {String(error)}</div>;
    }
  }

  if (user.type === 'admin') {
    try {
      return <AdminDashboard />;
    } catch (error) {
      console.error('AdminDashboard error:', error);
      return <div className="p-4">Chyba v AdminDashboard: {String(error)}</div>;
    }
  }

  return <div className="p-4">Neznámý typ uživatele: {user.type}</div>;
};

export default Index;
