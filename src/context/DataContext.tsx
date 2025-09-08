import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  personalNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  visits: number;
  progress: number;
  visitedBooths: number[];
  profileImage?: string;
  password_hash?: string;
}

interface Winner {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  personalNumber: string;
  position: string;
  profileImage?: string;
  wonAt: string;
}

interface Booth {
  id: number;
  name: string;
  code: string;
  login: string;
  visits: number;
  category?: string;
  password?: string;
  logo?: string;
}

interface ProgramEvent {
  id: number;
  time: string;
  event: string;
  duration: number;
}

interface CodeTimeSettings {
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface HomePageTexts {
  title: string;
  subtitle: string;
  description: string;
  loginTitle: string;
  loginDescription: string;
  benefitsTitle: string;
  benefits: string[];
  prizesTitle: string;
  prizesDescription: string;
}

interface DiscountedPhone {
  id: number;
  manufacturerName: string;
  phoneModel: string;
  manufacturerLogo?: string;
  phoneImage?: string;
  originalPrice: number;
  discountedPrice: number;
  description?: string;
}

interface DataContextType {
  users: User[];
  booths: Booth[];
  program: ProgramEvent[];
  codeTimeSettings: CodeTimeSettings;
  homePageTexts: HomePageTexts;
  winners: Winner[];
  discountedPhones: DiscountedPhone[];
  isLoading: boolean;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setBooths: React.Dispatch<React.SetStateAction<Booth[]>>;
  setProgram: React.Dispatch<React.SetStateAction<ProgramEvent[]>>;
  setCodeTimeSettings: React.Dispatch<React.SetStateAction<CodeTimeSettings>>;
  setHomePageTexts: React.Dispatch<React.SetStateAction<HomePageTexts>>;
  setWinners: React.Dispatch<React.SetStateAction<Winner[]>>;
  setDiscountedPhones: React.Dispatch<React.SetStateAction<DiscountedPhone[]>>;
  visitBooth: (userId: number, boothId: number) => Promise<void>;
  getUserProgress: (userId: number) => number;
  resetAllProgress: () => void;
  isCodeEntryAllowed: () => boolean;
  addWinner: (user: User) => Promise<void>;
  resetLottery: () => Promise<void>;
  removeUserProfileImage: (userId: number) => void;
  registerParticipant: (userData: Omit<User, 'id' | 'progress' | 'visits' | 'visitedBooths' | 'password_hash'> & { password: string }) => Promise<boolean>;
  loginParticipant: (personalNumber: string, password: string) => Promise<User | null>;
  addUserByAdmin: (userData: { personalNumber: string; firstName: string; lastName: string; position: string; password?: string }) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);




const initialUsers: User[] = [];

const initialBooths: Booth[] = [];

const initialProgram: ProgramEvent[] = [];

const initialWinners: Winner[] = [];

const initialDiscountedPhones: DiscountedPhone[] = [];

const initialCodeTimeSettings: CodeTimeSettings = {
  startTime: '09:00',
  endTime: '17:00',
  enabled: false
};

const initialHomePageTexts: HomePageTexts = {
  title: 'O2 Guru Summit 2025',
  subtitle: 'Nejdůležitější technologický event roku',
  description: 'Sbírejte body návštěvou stánků a získejte hodnotné ceny',
  loginTitle: 'Přihlaste se do aplikace',
  loginDescription: 'Získejte přístup k interaktivní mapě stánků, sledujte svůj pokrok a nezmeškejte žádnou část programu.',
  benefitsTitle: '🎯 Co vás čeká?',
  benefits: [
    '17 interaktivních stánků s nejnovějšími technologiemi',
    'Sběr bodů za návštěvy stánků',
    'Živý program s časovačem',
    'Hodnotné ceny pro nejaktivnější účastníky'
  ],
  prizesTitle: '🏆 Soutěžte o ceny',
  prizesDescription: 'Navštivte všechny stánky a získejte šanci vyhrát nejnovější technologie a exkluzivní O2 produkty.'
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  
  // Initialize state as empty, will be filled from Supabase
  const [users, setUsersState] = useState<User[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [program, setProgramState] = useState<ProgramEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Přidání uživatele adminem: pouze základní pole, heslo volitelné
  const addUserByAdmin = async (userData: { personalNumber: string; firstName: string; lastName: string; position: string; password?: string }) => {
    try {
      let password_hash: string | undefined = undefined;
      if (userData.password && userData.password.length > 0) {
        const salt = bcrypt.genSaltSync(10);
        password_hash = bcrypt.hashSync(userData.password, salt);
      }
      const newUser: any = {
        personalnumber: userData.personalNumber,
        firstname: userData.firstName,
        lastname: userData.lastName,
        position: userData.position,
        profileimage: null,
        ...(password_hash && { password_hash })
      };
      const { data, error } = await supabase.from('users').insert([newUser]).select();
      if (error) {
        toast({ title: 'Chyba při přidání uživatele', description: error.message });
        return false;
      }
      let newId: number | undefined = undefined;
      if (data && Array.isArray(data) && data.length > 0 && data[0]?.id) {
        newId = data[0].id;
      }
      setUsers(prev => [
        ...prev,
        {
          id: newId,
          personalNumber: userData.personalNumber,
          firstName: userData.firstName,
          lastName: userData.lastName,
          position: userData.position,
          password_hash: password_hash,
          profileImage: null,
          visits: 0,
          progress: 0,
          visitedBooths: [],
        }
      ]);
      toast({ title: 'Uživatel přidán', description: 'Nový účastník byl vytvořen.' });
      return true;
    } catch (e: any) {
      toast({ title: 'Chyba při přidání uživatele', description: e.message });
      return false;
    }
  };
  const [codeTimeSettings, setCodeTimeSettingsState] = useState<CodeTimeSettings>(initialCodeTimeSettings);
  const [homePageTexts, setHomePageTextsState] = useState<HomePageTexts>(initialHomePageTexts);
  const [winners, setWinnersState] = useState<Winner[]>([]);
  const [discountedPhones, setDiscountedPhones] = useState<DiscountedPhone[]>(initialDiscountedPhones);

  // Registrace účastníka: hashování hesla a uložení do DB
  const registerParticipant = async (userData: Omit<User, 'id' | 'progress' | 'visits' | 'visitedBooths' | 'password_hash'> & { password: string }) => {
    try {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(userData.password, salt);
      const newUser = {
        personalnumber: userData.personalNumber,
        firstname: userData.firstName,
        lastname: userData.lastName,
        position: userData.position,
        password_hash: hash,
        profileimage: userData.profileImage || null
      };
      const { data, error } = await supabase.from('users').insert([newUser]).select();
      if (error) {
        toast({ title: 'Chyba registrace', description: error.message });
        return false;
      }
      let newId: number | undefined = undefined;
      if (data && Array.isArray(data) && data.length > 0 && data[0]?.id) {
        newId = data[0].id;
      }
      setUsers(prev => [
        ...prev,
        {
          id: newId,
          personalNumber: userData.personalNumber,
          firstName: userData.firstName,
          lastName: userData.lastName,
          position: userData.position,
          password_hash: hash,
          profileImage: userData.profileImage || null,
          visits: 0,
          progress: 0,
          visitedBooths: [],
        }
      ]);
      toast({ title: 'Registrace úspěšná', description: 'Můžete se přihlásit.' });
      return true;
    } catch (e: any) {
      toast({ title: 'Chyba registrace', description: e.message });
      return false;
    }
  };

  // Přihlášení účastníka: ověření hesla
  const loginParticipant = async (personalNumber: string, password: string) => {
    const { data, error } = await supabase.from('users').select('*').eq('personalnumber', personalNumber).single();
    if (error || !data) {
      toast({ title: 'Chyba přihlášení', description: 'Uživatel nenalezen.' });
      return null;
    }
    if (!data.password_hash || !bcrypt.compareSync(password, data.password_hash)) {
      toast({ title: 'Chyba přihlášení', description: 'Nesprávné heslo.' });
      return null;
    }
    toast({ title: 'Přihlášení úspěšné', description: `Vítejte, ${data.firstname}!` });
    return {
      id: data.id,
      personalNumber: data.personalnumber,
      firstName: data.firstname,
      lastName: data.lastname,
      position: data.position,
      visits: data.visits || 0,
      progress: data.progress || 0,
      visitedBooths: data.visitedbooths || [],
      profileImage: data.profileimage,
      password_hash: data.password_hash
    };
  };

  // --- Local state setters (do not automatically sync to Supabase) ---
  const setUsers = (updater: React.SetStateAction<User[]>) => {
    setUsersState(updater);
  };

  const setProgram = async (updater: React.SetStateAction<ProgramEvent[]>) => {
    setProgramState(prev => {
      const next = typeof updater === 'function' ? (updater as any)(prev) : updater;
      supabase.from('program').upsert(next).then();
      return next;
    });
  };

  const setCodeTimeSettings = async (updater: React.SetStateAction<CodeTimeSettings>) => {
    setCodeTimeSettingsState(prev => {
      const next = typeof updater === 'function' ? (updater as any)(prev) : updater;
      // Uložíme do tabulky settings, klíč: 'codeTimeSettings'
      supabase.from('settings').upsert([{ key: 'codeTimeSettings', value: JSON.stringify(next) }]).then();
      return next;
    });
  };

  const setHomePageTexts = async (updater: React.SetStateAction<HomePageTexts>) => {
    setHomePageTextsState(prev => {
      const next = typeof updater === 'function' ? (updater as any)(prev) : updater;
      supabase.from('settings').upsert([{ key: 'homePageTexts', value: JSON.stringify(next) }]).then();
      return next;
    });
  };

  const setWinners = async (updater: React.SetStateAction<Winner[]>) => {
    setWinnersState(prev => {
      const next = typeof updater === 'function' ? (updater as any)(prev) : updater;
      supabase.from('winners').upsert(next).then();
      return next;
    });
  };


  // --- Supabase fetchers ---
  const fetchUsers = async (totalBooths?: number) => {
    const { data, error } = await supabase.from('users').select('*').order('id');
    if (!error && data) {
      console.log('Fetched users from DB:', data); // Debug log to see actual structure
      const mappedUsers = await Promise.all(data.map(async (user: any) => {
        // Get user's visits from visits table
        const { data: userVisits } = await supabase
          .from('visits')
          .select('booth_id')
          .eq('attendee_id', user.id);
        
        const visitedBooths = userVisits?.map((visit: any) => visit.booth_id) || [];
        const boothCount = totalBooths || booths.length;
        
        return {
          id: user.id,
          personalNumber: user.personalnumber,
          firstName: user.firstname,
          lastName: user.lastname,
          position: user.position,
          // Calculate from actual visits table
          visits: visitedBooths.length,
          progress: boothCount > 0 ? Math.round((visitedBooths.length / boothCount) * 100) : 0,
          visitedBooths: visitedBooths,
          profileImage: user.profileimage,
          password_hash: user.password_hash
        };
      }));
      setUsersState(mappedUsers);
    } else if (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchBooths = async () => {
    const { data, error } = await supabase.from('booths').select('*').order('id');
    if (!error && data) {
      // Calculate visits for each booth from visits table
      const boothsWithVisits = await Promise.all(data.map(async (booth: any) => {
        const { count } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('booth_id', booth.id);
        
        return {
          ...booth,
          visits: count || 0
        };
      }));
      
      setBooths(boothsWithVisits as any);
    }
  };

  const fetchProgram = async () => {
    const { data, error } = await supabase.from('program').select('*').order('time');
    if (!error && data) setProgram(data as any);
  };

  const fetchWinners = async () => {
    const { data, error } = await supabase.from('winners').select('*').order('wonat', { ascending: false });
    if (!error && data) {
      const mappedWinners = data.map((winner: any) => {
        // Get profile image from users if available
        const user = users.find(u => u.id === winner.userid);
        return {
          id: winner.id,
          userId: winner.userid,
          firstName: winner.firstname,
          lastName: winner.lastname,
          personalNumber: winner.personalnumber,
          position: winner.position,
          profileImage: user?.profileImage, // Get from users data
          wonAt: winner.wonat
        };
      });
      setWinnersState(mappedWinners);
    } else if (error) {
      console.error('Error fetching winners:', error);
    }
  };

  const fetchDiscountedPhones = async () => {
    const { data, error } = await supabase.from('discounted_phones').select('*').order('id');
    if (!error && data) {
      const mappedPhones = data.map((phone: any) => ({
        id: phone.id,
        manufacturerName: phone.manufacturer_name,
        phoneModel: phone.phone_model,
        manufacturerLogo: phone.manufacturer_logo,
        phoneImage: phone.phone_image,
        originalPrice: phone.original_price,
        discountedPrice: phone.discounted_price,
        description: phone.description
      }));
      setDiscountedPhones(mappedPhones);
    } else if (error) {
      console.error('Error fetching discounted phones:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      // Fetch code time settings
      const { data: codeTimeData, error: codeTimeError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'codeTimeSettings')
        .single();

      if (!codeTimeError && codeTimeData?.value) {
        const parsedCodeTime = JSON.parse(codeTimeData.value);
        setCodeTimeSettingsState(parsedCodeTime);
      }

      // Fetch home page texts
      const { data: homePageData, error: homePageError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'homePageTexts')
        .single();

      if (!homePageError && homePageData?.value) {
        const parsedHomePage = JSON.parse(homePageData.value);
        console.log('🔄 DataContext: Fetched homePageTexts from Supabase:', parsedHomePage);
        setHomePageTextsState(parsedHomePage);
      } else {
        console.log('⚠️ DataContext: No homePageTexts found in Supabase, using defaults');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Keep default values if fetch fails
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      console.log('🚀 DataContext: Starting data fetch...');
      try {
        const { data: boothsData } = await supabase.from('booths').select('*').order('id');
        const totalBooths = boothsData?.length || 0;
        
        await fetchBooths(); // Fetch booths first
        await fetchUsers(totalBooths); // Pass booth count to users
        await fetchProgram();
        await fetchWinners(); // Fetch winners from database
        await fetchDiscountedPhones(); // Fetch discounted phones from database
        await fetchSettings(); // Fetch settings from database
        console.log('✅ DataContext: All data fetched successfully');
      } catch (error) {
        console.error('❌ DataContext: Error fetching data:', error);
      } finally {
        console.log('🏁 DataContext: Setting isLoading to false');
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const visitBooth = async (userId: number, boothId: number) => {
    const targetBooth = booths.find(b => b.id === boothId);
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      toast({ title: 'Uživatel nenalezen', description: 'Zkuste akci zopakovat.' });
      return;
    }
    if (!targetBooth) {
      toast({ title: 'Stánek nenalezen', description: 'Zkuste akci zopakovat.' });
      return;
    }

    try {
      // Temporarily use admin auth for database operations to bypass RLS
      const currentSession = await supabase.auth.getSession();
      
      // Check if user already visited this booth in database
      const { data: existingVisit, error: checkError } = await supabase
        .from('visits')
        .select('id')
        .eq('booth_id', boothId)
        .eq('attendee_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // Error other than "not found"
        console.error('Error checking visit:', checkError);
        toast({ title: 'Chyba při kontrole návštěvy', description: checkError.message });
        return;
      }

      if (existingVisit) {
        toast({ title: 'Již navštíveno', description: 'Tento stánek jste již navštívili.' });
        return;
      }

      // Insert new visit into database
      const { error: insertError } = await supabase
        .from('visits')
        .insert([{
          booth_id: boothId,
          attendee_id: userId,
          created_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('Error inserting visit:', insertError);
        toast({ title: 'Chyba při ukládání návštěvy', description: insertError.message });
        return;
      }

      // Update local state - add to user's visited booths
      setUsers(prevUsers => prevUsers.map(user => {
        if (user.id !== userId) return user;
        const already = user.visitedBooths.includes(boothId);
        if (already) return user; // shouldn't happen, but safety check
        
        const newVisitedBooths = [...user.visitedBooths, boothId];
        const newProgress = booths.length > 0 ? Math.round((newVisitedBooths.length / booths.length) * 100) : 0;
        return {
          ...user,
          visitedBooths: newVisitedBooths,
          visits: user.visits + 1,
          progress: newProgress
        };
      }));

      // Update booth visit count in local state  
      setBooths(prevBooths => prevBooths.map(booth => (
        booth.id === boothId ? { ...booth, visits: booth.visits + 1 } : booth
      )));

      toast({ title: 'Stánek navštíven!', description: 'Váš pokrok byl aktualizován.' });
    } catch (error) {
      console.error('Visit booth error:', error);
      toast({ title: 'Chyba při návštěvě stánku', description: 'Nastala neočekávaná chyba.' });
    }
  };

  const getUserProgress = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user?.progress || 0;
  };

  const resetAllProgress = async () => {
    try {
      // Delete all visits from Supabase
      const { error: visitsError } = await supabase
        .from('visits')
        .delete()
        .neq('id', 0); // Delete all rows
        
      if (visitsError) {
        console.error('Error resetting visits:', visitsError);
        toast({ title: 'Chyba při resetování návštěv', description: visitsError.message });
        return;
      }

      // Update local state - clear all user progress
      setUsers(prevUsers =>
        prevUsers.map(user => ({
          ...user,
          visits: 0,
          progress: 0,
          visitedBooths: []
        }))
      );

      // Update local state - reset booth visit counts
      setBooths(prevBooths =>
        prevBooths.map(booth => ({
          ...booth,
          visits: 0
        }))
      );

      toast({ title: 'Pokrok resetován', description: 'Všechny návštěvy byly smazány' });
    } catch (error) {
      console.error('Reset progress error:', error);
      toast({ title: 'Chyba při resetování pokroku', description: 'Nastala neočekávaná chyba' });
    }
  };

  const isCodeEntryAllowed = () => {
    if (!codeTimeSettings.enabled) return true;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return currentTime >= codeTimeSettings.startTime && currentTime <= codeTimeSettings.endTime;
  };

  const addWinner = async (user: User) => {
    try {
      // Generate explicit ID for winners table
      const winnerId = Date.now(); // Use timestamp as unique ID
      
      // Insert directly to Supabase to get proper ID (without profile image)
      const { data, error } = await supabase
        .from('winners')
        .insert([{
          id: winnerId,
          userid: user.id,
          firstname: user.firstName,
          lastname: user.lastName,
          personalnumber: user.personalNumber,
          position: user.position,
          wonat: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding winner:', error);
        toast({ title: 'Chyba při přidání výherce', description: error.message });
        return;
      }

      // Update local state with database result
      if (data) {
        const newWinner: Winner = {
          id: data.id,
          userId: data.userid,
          firstName: data.firstname,
          lastName: data.lastname,
          personalNumber: data.personalnumber,
          position: data.position,
          profileImage: user.profileImage, // Keep from original user data
          wonAt: data.wonat
        };
        setWinnersState(prev => [...prev, newWinner]);
      }
    } catch (error) {
      console.error('Add winner error:', error);
      toast({ title: 'Chyba při přidání výherce', description: 'Nastala neočekávaná chyba' });
    }
  };

  const resetLottery = async () => {
    try {
      // Delete all winners from database
      const { error } = await supabase.from('winners').delete().neq('id', 0); // Delete all rows
      
      if (error) {
        console.error('Error resetting lottery:', error);
        toast({ title: 'Chyba při resetování losování', description: error.message });
        return;
      }

      // Clear local state
      setWinnersState([]);
      toast({ title: 'Losování resetováno', description: 'Všichni výherci byli odstraněni' });
    } catch (error) {
      console.error('Reset lottery error:', error);
      toast({ title: 'Chyba při resetování losování', description: 'Nastala neočekávaná chyba' });
    }
  };

  const removeUserProfileImage = async (userId: number) => {
    try {
      // Update user in Supabase database
      const { error } = await supabase
        .from('users')
        .update({ profileimage: null })
        .eq('id', userId);

      if (error) {
        console.error('Error removing profile image:', error);
        toast({ title: 'Chyba při odstraňování profilového obrázku', description: error.message });
        return;
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, profileImage: undefined }
            : user
        )
      );

      toast({ title: 'Profilový obrázek odstraněn', description: 'Změny byly uloženy' });
    } catch (error) {
      console.error('Remove profile image error:', error);
      toast({ title: 'Chyba při odstraňování profilového obrázku', description: 'Nastala neočekávaná chyba' });
    }
  };


  useEffect(() => {
    setUsers(prev => prev.map(u => {
      const prog = booths.length > 0 ? Math.round((u.visitedBooths.length / booths.length) * 100) : 0;
      return { ...u, progress: prog };
    }));
  }, [booths.length]);






  return (
    <DataContext.Provider value={{
      users,
      booths,
      program,
      codeTimeSettings,
      homePageTexts,
      winners,
      discountedPhones,
      isLoading,
      setUsers,
      setBooths,
      setProgram,
      setCodeTimeSettings,
      setHomePageTexts,
      setWinners,
      setDiscountedPhones,
      visitBooth,
      getUserProgress,
      resetAllProgress,
      isCodeEntryAllowed,
      addWinner,
      resetLottery,
      removeUserProfileImage,
      registerParticipant,
      loginParticipant,
      addUserByAdmin,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};