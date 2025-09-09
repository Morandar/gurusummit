import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

interface StoredUser {
  personalNumber: string;
  firstName?: string;
  lastName?: string;
  position?: string;
}

interface StoredBooth {
  id: string | number;
  login?: string;
  password?: string;
}

interface StoredData {
  users: StoredUser[];
  booths: StoredBooth[];
}



interface User {
  id: string;
  personalNumber: string;
  firstName?: string;
  lastName?: string;
  type: 'participant' | 'booth' | 'admin';
  position?: string;
  boothId?: number | string;
}

interface AuthContextType {
  user: User | null;
  login: (userType: 'participant' | 'booth' | 'admin', credentials: any) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  // Po načtení stránky načti session ze Supabase a nastav uživatele, pokud je session platná
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    const checkSession = async () => {
      setIsLoading(true);
      
      // First check for user in localStorage (participants and booths)
      try {
        const storedUser = localStorage.getItem('authUser');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && (parsedUser.type === 'participant' || parsedUser.type === 'booth')) {
            setUser(parsedUser);
            // Store in window for DataContext access
            (window as any).__authUser = parsedUser;
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('authUser');
      }
      
      // Then check Supabase session for admin/booth users
      const { data, error } = await supabase.auth.getSession();
      const session = data?.session;
      if (session && session.user) {
        // Rozlišení typu uživatele podle emailu (admin) nebo jiných údajů
        if (session.user.email === 'admin@o2.cz') {
          setUser({
            id: 'admin',
            personalNumber: session.user.email,
            type: 'admin',
          });
        } else {
          // Pokud byste chtěli podporovat i další typy uživatelů, zde je místo pro rozšíření
          setUser({
            id: session.user.id,
            personalNumber: session.user.email || '',
            type: 'participant',
          });
        }
        // Nastav timeout na 60 minut (3600000 ms)
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          logout();
        }, 60 * 60 * 1000);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };
    checkSession();
    // Při unmountu zruš timeout
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);



  const login = async (userType: 'participant' | 'booth' | 'admin', credentials: any): Promise<boolean> => {
    try {
      const pn = String(credentials?.personalNumber ?? '').trim();
      const username = String(credentials?.login ?? credentials?.username ?? credentials?.email ?? pn).trim();
      const pwd = String(credentials?.password ?? '').trim();

      if (userType === 'admin') {
        // Allow only the designated admin account
        if (username !== 'admin@o2.cz') {
          return false;
        }
        const { data, error } = await supabase.auth.signInWithPassword({
          email: username,
          password: pwd,
        });
        if (error || !data.session) return false;
        setUser({ id: 'admin', personalNumber: username, type: 'admin' });
        return true;
      }

      if (userType === 'booth') {
        const loginInput = String(credentials?.login ?? credentials?.personalNumber ?? '').trim();
        const pwd = String(credentials?.password ?? '').trim();

        const { data: booth, error } = await supabase
          .from('booths')
          .select('id, login, password, name, code, visits')
          .eq('login', loginInput)
          .eq('password', pwd)
          .single();

        if (error || !booth) {
          return false;
        }

        const boothUser: User = {
          id: `booth-${booth.id}`,
          personalNumber: booth.login,
          type: 'booth',
          boothId: Number(booth.id),
        };

        setUser(boothUser);
        // Store booth user in localStorage and window for persistence
        localStorage.setItem('authUser', JSON.stringify(boothUser));
        (window as any).__authUser = boothUser;
        return true;
      }

      if (userType === 'participant') {
        // Najdi uživatele v Supabase
        const { data: foundUser, error } = await supabase
          .from('users')
          .select('personalnumber, firstname, lastname, position, password_hash')
          .eq('personalnumber', pn)
          .maybeSingle();

        if (!foundUser) {
          // Not found → optionally create below if names provided
        } else {
          const storedHash = (foundUser as any).password_hash as string | null | undefined;
          if (typeof storedHash === 'string' && storedHash.length > 0) {
            const ok = bcrypt.compareSync(pwd, storedHash);
            if (!ok) {
              return false;
            }
          }
          const participantUser: User = {
            id: `participant-${pn}`,
            personalNumber: pn,
            firstName: (foundUser as any).firstname,
            lastName: (foundUser as any).lastname,
            type: 'participant',
            position: (foundUser as any).position,
          };
          setUser(participantUser);
          // Store participant user in localStorage and window
          localStorage.setItem('authUser', JSON.stringify(participantUser));
          (window as any).__authUser = participantUser;
          return true;
        }

        // Registration path: require names for first-time creation
        const firstName = String(credentials?.firstName || '').trim();
        const lastName = String(credentials?.lastName || '').trim();
        const position = String(credentials?.position || '').trim() || undefined;

        if (firstName && lastName && pn) {
          // Založ nového uživatele v Supabase a získej zpět vložená data
          const { data: inserted, error: insertError } = await supabase
            .from('users')
            .insert([
              { personalnumber: pn, firstname: firstName, lastname: lastName, position },
            ])
            .select()
            .single();
          if (insertError) return false;

          const participantUser: User = {
            id: `participant-${inserted?.personalnumber || pn}`,
            personalNumber: inserted?.personalnumber || pn,
            firstName: inserted?.firstname || firstName,
            lastName: inserted?.lastname || lastName,
            type: 'participant',
            position: inserted?.position || position,
          };
          setUser(participantUser);
          // Store participant user in localStorage and window
          localStorage.setItem('authUser', JSON.stringify(participantUser));
          (window as any).__authUser = participantUser;
          return true;
        }

        return false;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    // Clear localStorage for participant users
    localStorage.removeItem('authUser');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}