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
  category?: string;
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

interface LotterySettings {
  minimumPercentage: number; // Minimum percentage of booths to visit for lottery eligibility
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

interface Notification {
  id: number;
  title: string;
  message: string;
  targetAudience: 'all' | 'participants' | 'booth_staff';
  createdAt: string;
  createdBy: string;
  isActive: boolean;
}

export interface Banner {
  id: number;
  text: string;
  isActive: boolean;
  targetAudience: 'all' | 'participants' | 'booth_staff';
  color: 'blue-purple' | 'green-teal' | 'red-pink' | 'yellow-orange' | 'indigo-cyan';
  createdAt: string;
  createdBy: string;
}

interface DataContextType {
  users: User[];
  booths: Booth[];
  program: ProgramEvent[];
  codeTimeSettings: CodeTimeSettings;
  homePageTexts: HomePageTexts;
  lotterySettings: LotterySettings;
  winners: Winner[];
  discountedPhones: DiscountedPhone[];
  notifications: Notification[];
  banners: Banner[];
  banner: Banner | null; // Keep for backward compatibility
  isLoading: boolean;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setBooths: React.Dispatch<React.SetStateAction<Booth[]>>;
  setProgram: React.Dispatch<React.SetStateAction<ProgramEvent[]>>;
  setCodeTimeSettings: React.Dispatch<React.SetStateAction<CodeTimeSettings>>;
  setHomePageTexts: React.Dispatch<React.SetStateAction<HomePageTexts>>;
  setLotterySettings: React.Dispatch<React.SetStateAction<LotterySettings>>;
  setWinners: React.Dispatch<React.SetStateAction<Winner[]>>;
  setDiscountedPhones: React.Dispatch<React.SetStateAction<DiscountedPhone[]>>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setBanner: React.Dispatch<React.SetStateAction<Banner | null>>;
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
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  markNotificationAsRead: (notificationId: number, userId: number) => Promise<void>;
  updateBanner: (text: string, isActive: boolean, targetAudience?: 'all' | 'participants' | 'booth_staff', bannerId?: number) => Promise<void>;
  fetchAllBanners: () => Promise<Banner[]>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);




const initialUsers: User[] = [];

const initialBooths: Booth[] = [];

const initialProgram: ProgramEvent[] = [];

const initialWinners: Winner[] = [];

const initialDiscountedPhones: DiscountedPhone[] = [];

const initialNotifications: Notification[] = [];

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

const initialLotterySettings: LotterySettings = {
  minimumPercentage: 100 // Default to 100% (all booths required)
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
  const [lotterySettings, setLotterySettingsState] = useState<LotterySettings>(initialLotterySettings);
  const [winners, setWinnersState] = useState<Winner[]>([]);
  const [discountedPhones, setDiscountedPhones] = useState<DiscountedPhone[]>(initialDiscountedPhones);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);

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

  const setLotterySettings = async (updater: React.SetStateAction<LotterySettings>) => {
    setLotterySettingsState(prev => {
      const next = typeof updater === 'function' ? (updater as any)(prev) : updater;
      supabase.from('settings').upsert([{ key: 'lotterySettings', value: JSON.stringify(next) }]).then();
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
    console.log('👥 DataContext: Starting optimized fetchUsers...');
    const usersStartTime = Date.now();

    try {
      // Fetch all users (remove limit to get complete stats)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('id');

      if (usersError || !usersData) {
        console.error('❌ DataContext: Error fetching users:', usersError);
        return;
      }

      console.log(`👥 DataContext: Fetched ${usersData.length} users from database`);
      console.log('👥 DataContext: Sample user data:', usersData[0]); // Debug first user

      // For performance, fetch visit counts aggregated by user instead of all individual visits
      const { data: visitCountsData, error: visitCountsError } = await supabase
        .rpc('get_user_visit_counts'); // Try to use a stored procedure if available

      let visitsByUser: { [userId: number]: number } = {};

      if (visitCountsError) {
        console.warn('⚠️ DataContext: RPC not available, falling back to grouped query');

        // Fallback: Group visits by attendee_id and count them (set high limit to get all)
        const { data: visitsData, error: visitsError } = await supabase
          .from('visits')
          .select('attendee_id')
          .limit(10000); // Explicitly set high limit to override Supabase default of 1000

        if (!visitsError && visitsData) {
          visitsData.forEach((visit: any) => {
            visitsByUser[visit.attendee_id] = (visitsByUser[visit.attendee_id] || 0) + 1;
          });
          console.log(`👥 DataContext: Processed ${visitsData.length} visits into counts`);
          console.log('👥 DataContext: Sample visit counts:', Object.entries(visitsByUser).slice(0, 3)); // Debug first 3
        } else {
          console.warn('⚠️ DataContext: Could not fetch visit counts:', visitsError);
        }
      } else {
        // Use the RPC result
        visitCountsData?.forEach((count: any) => {
          visitsByUser[count.user_id] = count.visit_count;
        });
        console.log('👥 DataContext: Used RPC for visit counts');
      }

      // For detailed booth lists, fetch only for users with reasonable visit counts
      const usersNeedingDetails = usersData.filter((user: any) =>
        (visitsByUser[user.id] || 0) > 0 && (visitsByUser[user.id] || 0) < 50
      );

      const detailedVisits: { [userId: number]: number[] } = {};

      if (usersNeedingDetails.length > 0) {
        console.log(`👥 DataContext: Fetching detailed visits for ${usersNeedingDetails.length} users`);

        // Fetch detailed visits only for users who need them
        const userIds = usersNeedingDetails.map((u: any) => u.id);
        const { data: detailedVisitsData, error: detailedError } = await supabase
          .from('visits')
          .select('attendee_id, booth_id')
          .in('attendee_id', userIds);

        if (!detailedError && detailedVisitsData) {
          detailedVisitsData.forEach((visit: any) => {
            if (!detailedVisits[visit.attendee_id]) {
              detailedVisits[visit.attendee_id] = [];
            }
            detailedVisits[visit.attendee_id].push(visit.booth_id);
          });
        }
      }

      const boothCount = totalBooths || booths.length;

      const mappedUsers = usersData.map((user: any) => {
        const visitCount = visitsByUser[user.id] || 0;
        const visitedBooths = detailedVisits[user.id] || [];

        return {
          id: user.id,
          personalNumber: user.personalnumber,
          firstName: user.firstname,
          lastName: user.lastName,
          position: user.position,
          visits: visitCount,
          progress: boothCount > 0 ? Math.round((visitCount / boothCount) * 100) : 0,
          visitedBooths: visitedBooths, // Only detailed for users with reasonable counts
          profileImage: user.profileimage,
          password_hash: user.password_hash
        };
      });

      const endTime = Date.now();
      console.log(`👥 DataContext: Total optimized fetchUsers time: ${endTime - usersStartTime}ms`);
      console.log('👥 DataContext: Final user stats:', {
        totalUsers: mappedUsers.length,
        totalVisits: mappedUsers.reduce((sum, u) => sum + u.visits, 0),
        sampleUser: mappedUsers[0]
      });

      setUsersState(mappedUsers);
    } catch (error) {
      console.error('❌ DataContext: Unexpected error in fetchUsers:', error);
    }
  };

  const fetchBooths = async () => {
    console.log('🏪 DataContext: Starting fetchBooths with visit counts...');
    const startTime = Date.now();

    try {
      // Fetch booths with their visit counts using a single query
      const { data: boothsData, error: boothsError } = await supabase
        .from('booths')
        .select('*')
        .order('id');

      if (boothsError) {
        console.error('❌ DataContext: Error fetching booths:', boothsError);
        return;
      }

      console.log(`🏪 DataContext: Fetched ${boothsData?.length || 0} booths from database`);

      // Get visit counts for all booths
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('booth_id');

      const visitCounts: { [boothId: number]: number } = {};
      if (!visitsError && visitsData) {
        visitsData.forEach((visit: any) => {
          visitCounts[visit.booth_id] = (visitCounts[visit.booth_id] || 0) + 1;
        });
      } else if (visitsError) {
        console.warn('⚠️ DataContext: Could not fetch visits for booths:', visitsError);
      }

      console.log(`🏪 DataContext: Processed visit counts for ${Object.keys(visitCounts).length} booths`);

      const boothsWithVisits = (boothsData || []).map((booth: any) => ({
        ...booth,
        visits: visitCounts[booth.id] || 0
      }));

      const endTime = Date.now();
      console.log(`🏪 DataContext: Total fetchBooths time: ${endTime - startTime}ms`);

      setBooths(boothsWithVisits as any);
    } catch (error) {
      console.error('❌ DataContext: Unexpected error in fetchBooths:', error);
    }
  };

  const fetchProgram = async () => {
    const { data, error } = await supabase.from('program').select('*').order('time');
    if (!error && data) {
      setProgram(data as any);
    } else if (error) {
      console.error('❌ DataContext: Error fetching program:', error);
    }
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

  const fetchBanner = async () => {
    const startTime = Date.now();

    // Check authentication status
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      console.log({
        hasSession: !!sessionData?.session,
        userEmail: sessionData?.session?.user?.email || 'none',
        expiresAt: sessionData?.session?.expires_at ? new Date(sessionData.session.expires_at * 1000).toISOString() : 'none'
      });
    } catch (authError) {
      console.warn('⚠️ DataContext: Could not check auth session:', authError);
    }

    try {
      const { data, error } = await supabase.from('banner').select('*').eq('is_active', true);
      const fetchTime = Date.now() - startTime;

      if (error) {
        console.error('❌ DataContext: Supabase error fetching banners:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fetchTime: `${fetchTime}ms`
        });

        // Check for network-related errors
        if (error.message?.includes('Failed to fetch') || error.message?.includes('TypeError')) {
          console.error('🌐 DataContext: Network connectivity error - check internet connection or Supabase status');
          // Don't retry immediately for network errors
          return;
        } else if (error.message?.includes('timeout')) {
          console.error('⏰ DataContext: Timeout error - network may be slow or unreachable');
        } else {
          console.error('❌ DataContext: Database or authentication error:', error);
        }
        return;
      }

      if (data && data.length > 0) {
        const bannerData = data.map((banner: any) => ({
          id: banner.id,
          text: banner.text,
          isActive: banner.is_active,
          targetAudience: banner.target_audience || 'all',
          color: banner.color || 'blue-purple',
          createdAt: banner.created_at,
          createdBy: banner.created_by
        }));

        setBanners(bannerData);

        // For backward compatibility, set the first banner as the main banner
        if (bannerData.length > 0) {
          setBanner(bannerData[0]);
        }
      } else {
        setBanners([]);
        setBanner(null);
      }
    } catch (error: any) {
      const fetchTime = Date.now() - startTime;
      console.error('❌ DataContext: Unexpected error fetching banners:', {
        error: error.message || error,
        stack: error.stack,
        fetchTime: `${fetchTime}ms`
      });

      // Check for specific network errors
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        console.error('🌐 DataContext: Network connectivity error - check internet connection after network change');
      } else if (error.message?.includes('CORS')) {
        console.error('🚫 DataContext: CORS error - possible firewall or proxy blocking requests');
      } else if (error.message?.includes('DNS')) {
        console.error('🌍 DataContext: DNS resolution error - network configuration issue');
      }

      setBanners([]);
      setBanner(null);
    }
  };

  const fetchAllBanners = async () => {
    try {
      const { data, error } = await supabase.from('banner').select('*').order('created_at', { ascending: false });

      if (error) {
        console.error('❌ DataContext: Error fetching all banners:', error);
        return [];
      }

      if (data) {
        const mappedBanners = data.map((banner: any) => ({
          id: banner.id,
          text: banner.text,
          isActive: banner.is_active,
          targetAudience: banner.target_audience || 'all',
          color: banner.color || 'blue-purple',
          createdAt: banner.created_at,
          createdBy: banner.created_by
        }));
        return mappedBanners;
      } else {
        return [];
      }
    } catch (error) {
      console.error('❌ DataContext: Unexpected error fetching all banners:', error);
      return [];
    }
  };

  const fetchNotifications = async () => {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const mappedNotifications = data.map((notification: any) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        targetAudience: notification.target_audience,
        createdAt: notification.created_at,
        createdBy: notification.created_by,
        isActive: notification.is_active
      }));
      setNotifications(mappedNotifications);
    } else if (error) {
      console.error('❌ DataContext: Error fetching notifications:', error);
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
        setHomePageTextsState(parsedHomePage);
      }

      // Fetch lottery settings
      const { data: lotteryData, error: lotteryError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'lotterySettings')
        .single();

      if (!lotteryError && lotteryData?.value) {
        const parsedLottery = JSON.parse(lotteryData.value);
        setLotterySettingsState(parsedLottery);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Keep default values if fetch fails
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      console.log('🚀 DataContext: Starting data fetch...');
      const startTime = Date.now();

      try {
        console.log('📊 DataContext: Fetching booth count...');
        const { data: boothsData, error: boothsError } = await supabase.from('booths').select('*').order('id');
        if (boothsError) {
          console.error('❌ DataContext: Error fetching booth count:', boothsError);
          return;
        }
        const totalBooths = boothsData?.length || 0;
        console.log(`📊 DataContext: Found ${totalBooths} booths`);

        console.time('fetchBooths');
        await fetchBooths(); // Fetch booths first
        console.timeEnd('fetchBooths');

        console.time('fetchUsers');
        await fetchUsers(totalBooths); // Pass booth count to users
        console.timeEnd('fetchUsers');

        console.time('fetchProgram');
        await fetchProgram();
        console.timeEnd('fetchProgram');

        console.time('fetchNotifications');
        await fetchNotifications(); // Fetch notifications from database
        console.timeEnd('fetchNotifications');

        console.time('fetchBanner');
        await fetchBanner(); // Fetch banner from database
        console.timeEnd('fetchBanner');

        console.time('fetchWinners');
        await fetchWinners(); // Fetch winners from database
        console.timeEnd('fetchWinners');

        console.time('fetchDiscountedPhones');
        await fetchDiscountedPhones(); // Fetch discounted phones from database
        console.timeEnd('fetchDiscountedPhones');

        console.time('fetchSettings');
        await fetchSettings(); // Fetch settings from database
        console.timeEnd('fetchSettings');

        const totalTime = Date.now() - startTime;
        console.log(`✅ DataContext: All data fetched successfully in ${totalTime}ms`);
      } catch (error) {
        console.error('❌ DataContext: Unexpected error in fetchData:', error);
      } finally {
        console.log('🔄 DataContext: Setting isLoading to false');
        setIsLoading(false);
      }
    };
    fetchData();

    // Set up periodic banner check every 5 minutes (reduced frequency to avoid rate limits)
    let pollCount = 0;
    const bannerInterval = setInterval(() => {
      pollCount++;
      console.log(`📡 DataContext: Banner poll #${pollCount}`);
      fetchBanner();
    }, 300000); // Check every 5 minutes instead of 30 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(bannerInterval);
    };
  }, []);

  const visitBooth = async (userId: number, boothId: number) => {
    console.log(`🏪 DataContext: visitBooth called - userId: ${userId}, boothId: ${boothId}`);

    const targetBooth = booths.find(b => b.id === boothId);
    const targetUser = users.find(u => u.id === userId);

    if (!targetUser) {
      console.error('❌ DataContext: User not found for visitBooth');
      toast({ title: 'Uživatel nenalezen', description: 'Zkuste akci zopakovat.' });
      return;
    }
    if (!targetBooth) {
      console.error('❌ DataContext: Booth not found for visitBooth');
      toast({ title: 'Stánek nenalezen', description: 'Zkuste akci zopakovat.' });
      return;
    }

    try {
      console.log('💾 DataContext: Inserting visit into database...');
      // Try to insert new visit into database
      // If it already exists, the unique constraint will be violated
      const { error: insertError } = await supabase
        .from('visits')
        .insert([{
          booth_id: boothId,
          attendee_id: userId,
          created_at: new Date().toISOString()
        }]);

      if (insertError) {
        // Check if it's a unique constraint violation (user already visited this booth)
        if (insertError.code === '23505') { // PostgreSQL unique constraint violation
          console.log('⚠️ DataContext: User already visited this booth');
          toast({ title: 'Již navštíveno', description: 'Tento stánek jste již navštívili.' });
          return;
        }

        console.error('❌ DataContext: Error inserting visit:', insertError);
        toast({ title: 'Chyba při ukládání návštěvy', description: insertError.message });
        return;
      }

      console.log('✅ DataContext: Visit inserted successfully, updating local state...');

      // Update local state - add to user's visited booths
      setUsersState(prevUsers => {
        console.log('🔄 DataContext: setUsersState called with prevUsers length:', prevUsers.length);
        const updatedUsers = prevUsers.map(user => {
          if (user.id !== userId) return user;
          const already = user.visitedBooths.includes(boothId);
          if (already) {
            console.log('⚠️ DataContext: User already visited this booth');
            return user;
          }

          const newVisitedBooths = [...user.visitedBooths, boothId];
          const newProgress = booths.length > 0 ? Math.round((newVisitedBooths.length / booths.length) * 100) : 0;
          console.log(`📊 DataContext: Updated user progress: ${newProgress}% (${newVisitedBooths.length}/${booths.length})`);

          const updatedUser = {
            ...user,
            visitedBooths: newVisitedBooths,
            visits: user.visits + 1,
            progress: newProgress
          };
          console.log('👤 DataContext: Updated user:', updatedUser);
          return updatedUser;
        });
        console.log('🔄 DataContext: Returning updated users array with length:', updatedUsers.length);
        return updatedUsers;
      });

      // Update progress in database to keep it in sync
      const newVisitedBooths = [...targetUser.visitedBooths, boothId];
      const newProgress = booths.length > 0 ? Math.round((newVisitedBooths.length / booths.length) * 100) : 0;
      console.log('💾 DataContext: Updating user progress in database...');
      await supabase
        .from('users')
        .update({ progress: newProgress, visits: targetUser.visits + 1 })
        .eq('id', userId);

      // Update booth visit count in local state
      setBooths(prevBooths => {
        console.log('🏪 DataContext: Updating booth visit count for booth', boothId);
        const updatedBooths = prevBooths.map(booth => (
          booth.id === boothId ? { ...booth, visits: booth.visits + 1 } : booth
        ));
        const updatedBooth = updatedBooths.find(b => b.id === boothId);
        console.log('🏪 DataContext: Booth visit count updated to:', updatedBooth?.visits);
        return updatedBooths;
      });

      console.log('✅ DataContext: Booth visit completed successfully');
      toast({ title: 'Stánek navštíven!', description: 'Váš pokrok byl aktualizován.' });
    } catch (error) {
      console.error('❌ DataContext: Visit booth error:', error);
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
        // Don't return error for visits deletion - continue with local state reset
        console.warn('Could not delete visits from database, but continuing with local state reset');
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

  const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      const newNotification = {
        ...notification,
        createdAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          title: newNotification.title,
          message: newNotification.message,
          target_audience: newNotification.targetAudience,
          created_by: newNotification.createdBy,
          is_active: newNotification.isActive
        }])
        .select();

      if (error) {
        console.error('Error creating notification:', error);
        return;
      }

      if (data && data[0]) {
        const createdNotification: Notification = {
          id: data[0].id,
          title: data[0].title,
          message: data[0].message,
          targetAudience: data[0].target_audience,
          createdAt: data[0].created_at,
          createdBy: data[0].created_by,
          isActive: data[0].is_active
        };

        setNotifications(prev => [createdNotification, ...prev]);
      }
    } catch (error) {
      console.error('Create notification error:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: number, userId: number) => {
    try {
      // This would typically update a user_notifications table
      // For now, we'll just log it
    } catch (error) {
      console.error('Mark notification as read error:', error);
    }
  };

  const updateBanner = async (text: string, isActive: boolean, targetAudience: 'all' | 'participants' | 'booth_staff' = 'all', bannerId?: number) => {
    try {
      if (isActive && text.trim()) {
        // If we have a bannerId, use it to update the specific banner
        if (bannerId) {
          const { data, error } = await supabase
            .from('banner')
            .update({
              is_active: true,
              created_at: new Date().toISOString() // Update timestamp
            })
            .eq('id', bannerId)
            .select()
            .single();

          if (error) {
            console.error('❌ DataContext: Error reactivating banner by ID:', error);
            toast({ title: 'Chyba při reaktivaci banneru', description: error.message });
            return;
          }

          if (data) {
            const updatedBanner: Banner = {
              id: data.id,
              text: data.text,
              isActive: data.is_active,
              targetAudience: data.target_audience,
              color: data.color || 'blue-purple',
              createdAt: data.created_at,
              createdBy: data.created_by
            };

            // Update the banners array
            setBanners(prev => prev.map(b => b.id === bannerId ? updatedBanner : b));
            // For backward compatibility, set as main banner if it's the first one
            setBanner(updatedBanner);
            toast({ title: 'Banner aktivován', description: 'Banner byl úspěšně aktivován' });
          }
          return;
        }

        // Fallback: try to find existing banner with same text and target audience
        const { data: existingBanner, error: findError } = await supabase
          .from('banner')
          .select('*')
          .eq('text', text.trim())
          .eq('target_audience', targetAudience)
          .single();

        if (findError && findError.code !== 'PGRST116') {
          // Error other than "not found"
          console.error('❌ DataContext: Error finding existing banner:', findError);
          toast({ title: 'Chyba při hledání banneru', description: findError.message });
          return;
        }

        let result;
        if (existingBanner) {
          // Update existing banner to active
          const { data, error } = await supabase
            .from('banner')
            .update({
              is_active: true,
              created_at: new Date().toISOString() // Update timestamp
            })
            .eq('id', existingBanner.id)
            .select()
            .single();

          if (error) {
            console.error('❌ DataContext: Error reactivating banner:', error);
            toast({ title: 'Chyba při reaktivaci banneru', description: error.message });
            return;
          }
          result = data;
        } else {
          // Create new banner only if explicitly requested (no bannerId provided)
          const { data, error } = await supabase
            .from('banner')
            .insert([{
              text: text.trim(),
              is_active: true,
              target_audience: targetAudience,
              created_by: 'admin'
            }])
            .select()
            .single();

          if (error) {
            console.error('❌ DataContext: Error creating banner:', error);
            toast({ title: 'Chyba při vytváření banneru', description: error.message });
            return;
          }
          result = data;
        }

        if (result) {
          const updatedBanner: Banner = {
            id: result.id,
            text: result.text,
            isActive: result.is_active,
            targetAudience: result.target_audience,
            color: result.color || 'blue-purple',
            createdAt: result.created_at,
            createdBy: result.created_by
          };

          // Add to banners array
          setBanners(prev => [...prev, updatedBanner]);
          // For backward compatibility, set as main banner if it's the first one
          setBanner(updatedBanner);
          toast({ title: 'Banner aktivován', description: 'Banner byl úspěšně aktivován' });
        }
      } else {
        // Deactivate specific banner by ID if provided, otherwise by text and target audience
        let query = supabase.from('banner').update({ is_active: false });

        if (bannerId) {
          query = query.eq('id', bannerId);
        } else {
          query = query.eq('text', text.trim()).eq('target_audience', targetAudience);
        }

        const { error } = await query;

        if (error) {
          console.error('❌ DataContext: Error deactivating banner:', error);
          toast({ title: 'Chyba při deaktivaci banneru', description: error.message });
          return;
        }

        // Remove from banners array
        if (bannerId) {
          setBanners(prev => prev.filter(b => b.id !== bannerId));
        }
        // Refresh the active banner state
        await fetchBanner();
        toast({ title: 'Banner deaktivován', description: 'Banner byl úspěšně deaktivován' });
      }
    } catch (error) {
      console.error('❌ DataContext: Update banner error:', error);
      toast({ title: 'Chyba při aktualizaci banneru', description: 'Nastala neočekávaná chyba' });
    }
  };







  return (
    <DataContext.Provider value={{
      users,
      booths,
      program,
      codeTimeSettings,
      homePageTexts,
      lotterySettings,
      winners,
      discountedPhones,
      notifications,
      banners,
      banner,
      isLoading,
      setUsers,
      setBooths,
      setProgram,
      setCodeTimeSettings,
      setHomePageTexts,
      setLotterySettings,
      setWinners,
      setDiscountedPhones,
      setNotifications,
      setBanner,
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
      createNotification,
      markNotificationAsRead,
      updateBanner,
      fetchAllBanners,
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