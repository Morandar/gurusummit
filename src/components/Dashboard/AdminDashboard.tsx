import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Users, Building, Calendar, BarChart3, Download, RotateCcw, Plus, Edit, Trash2, Trophy, User, Image, Eye, Smartphone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LotteryWheel } from './LotteryWheel';
import { WinnersModal } from './WinnersModal';
import { ImageUploadModal } from '@/components/Modals/ImageUploadModal';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export const AdminDashboard = () => {
  const { logout } = useAuth();
  const {
    users, booths, program, codeTimeSettings, homePageTexts, winners, discountedPhones,
    setUsers, setBooths, setProgram, setCodeTimeSettings, setHomePageTexts, setDiscountedPhones,
    resetAllProgress, removeUserProfileImage, addUserByAdmin
  } = useData();
  const isLoading = false; // Temporary fix for TS cache issue
  const { toast } = useToast();
  const [timeToNext, setTimeToNext] = useState(0);
  const [isLotteryOpen, setIsLotteryOpen] = useState(false);
  const [isWinnersOpen, setIsWinnersOpen] = useState(false);
  const [imageUploadModal, setImageUploadModal] = useState<{ open: boolean; type: 'booth' | 'user'; id: number; title: string; currentImage?: string } | null>(null);

  // Dialog states
  const [editUserDialog, setEditUserDialog] = useState({ open: false, user: null });
  const [editBoothDialog, setEditBoothDialog] = useState({ open: false, booth: null });
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [addBoothDialog, setAddBoothDialog] = useState(false);
  const [addEventDialog, setAddEventDialog] = useState(false);
  const [editEventDialog, setEditEventDialog] = useState({ open: false, event: null });
  const [editPhoneDialog, setEditPhoneDialog] = useState({ open: false, phone: null });
  const [addPhoneDialog, setAddPhoneDialog] = useState(false);

  // Form states
  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', personalNumber: '', position: '' });
  const [boothForm, setBoothForm] = useState({ name: '', code: '', login: '', category: '', password: '', logo: '' });
  const [eventForm, setEventForm] = useState({ time: '', event: '', duration: 30 });
  const [phoneForm, setPhoneForm] = useState({
    manufacturerName: '',
    phoneModel: '',
    manufacturerLogo: '',
    phoneImage: '',
    originalPrice: 0,
    discountedPrice: 0,
    description: ''
  });
  
  // Local draft state for homepage texts
  const [homePageTextsDraft, setHomePageTextsDraft] = useState(homePageTexts);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Calculate real-time stats
  const stats = {
    totalUsers: users.length,
    totalVisits: users.reduce((sum, user) => sum + user.visits, 0),
    averageProgress: users.length > 0 ? Math.round(users.reduce((sum, user) => sum + user.progress, 0) / users.length) : 0,
    activeBooths: booths.length
  };

  // Calculate time to next program
  const calculateTimeToNext = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    const currentTimeInSeconds = currentHour * 3600 + currentMinute * 60 + currentSecond;
    
    const upcomingEvent = program.find(event => {
      const [eventHour, eventMinute] = event.time.split(':').map(Number);
      const eventTimeInSeconds = eventHour * 3600 + eventMinute * 60;
      return eventTimeInSeconds > currentTimeInSeconds;
    });
    
    if (upcomingEvent) {
      const [eventHour, eventMinute] = upcomingEvent.time.split(':').map(Number);
      const eventTimeInSeconds = eventHour * 3600 + eventMinute * 60;
      return eventTimeInSeconds - currentTimeInSeconds;
    }
    
    return 0;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeToNext();
      setTimeToNext(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sync draft state when homePageTexts changes from external source
  useEffect(() => {
    setHomePageTextsDraft(homePageTexts);
    setHasUnsavedChanges(false);
  }, [homePageTexts]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Export functions
  const downloadCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportUsers = () => {
    // Remove sensitive data from export
    const safeUsers = users.map(user => {
      const { password_hash, ...safeData } = user;
      return safeData;
    });
    
    downloadCSV(safeUsers, 'uzivatele.csv');
    toast({
      title: 'Export dokončen',
      description: 'CSV soubor s uživateli byl stažen (bez hesel)',
    });
  };

  const handleExportBooths = () => {
    downloadCSV(booths, 'stanky.csv');
    toast({
      title: 'Export dokončen',
      description: 'CSV soubor se stánky byl stažen',
    });
  };

  const handleResetProgress = () => {
    resetAllProgress();
    toast({
      title: 'Reset dokončen',
      description: 'Pokrok všech účastníků byl vynulován',
    });
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      // Delete from Supabase first
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) {
        toast({
          title: 'Chyba při mazání',
          description: error.message,
        });
        return;
      }
      
      // Update local state only if database delete succeeded
      setUsers(prev => prev.filter(user => user.id !== userId));
      toast({
        title: 'Účastník smazán',
        description: 'Účastník byl úspěšně odstraněn',
      });
    } catch (error) {
      console.error('Delete user error:', error);
      toast({
        title: 'Chyba při mazání',
        description: 'Nastala neočekávaná chyba',
      });
    }
  };

  const handleDeleteBooth = async (boothId: number) => {
    try {
      // Delete from Supabase first
      const { error } = await supabase.from('booths').delete().eq('id', boothId);
      if (error) {
        toast({
          title: 'Chyba při mazání stánku',
          description: error.message,
        });
        return;
      }
      
      // Update local state only if database delete succeeded
      setBooths(prev => prev.filter(booth => booth.id !== boothId));
      toast({
        title: 'Stánek smazán',
        description: 'Stánek byl úspěšně odstraněn',
      });
    } catch (error) {
      console.error('Delete booth error:', error);
      toast({
        title: 'Chyba při mazání stánku',
        description: 'Nastala neočekávaná chyba',
      });
    }
  };

  // CRUD handlers
  const handleEditUser = (user: any) => {
    setUserForm({ firstName: user.firstName, lastName: user.lastName, personalNumber: user.personalNumber, position: user.position });
    setEditUserDialog({ open: true, user });
  };

  const handleEditPhone = (phone: any) => {
    setPhoneForm({
      manufacturerName: phone.manufacturerName,
      phoneModel: phone.phoneModel,
      manufacturerLogo: phone.manufacturerLogo || '',
      phoneImage: phone.phoneImage || '',
      originalPrice: phone.originalPrice,
      discountedPrice: phone.discountedPrice,
      description: phone.description || ''
    });
    setEditPhoneDialog({ open: true, phone });
  };

  const handleEditBooth = (booth: any) => {
    setBoothForm({ 
      name: booth.name, 
      code: booth.code, 
      login: booth.login, 
      category: booth.category || '',
      password: booth.password || '',
      logo: booth.logo || ''
    });
    setEditBoothDialog({ open: true, booth });
  };

  const handleEditEvent = (event: any) => {
    setEventForm({ time: event.time, event: event.event, duration: event.duration });
    setEditEventDialog({ open: true, event });
  };

  const handleSaveUser = async () => {
    try {
      if (editUserDialog.user) {
        // Update existing user in Supabase
        const { error } = await supabase
          .from('users')
          .update({
            personalnumber: userForm.personalNumber,
            firstname: userForm.firstName,
            lastname: userForm.lastName,
            position: userForm.position
          })
          .eq('id', editUserDialog.user.id);

        if (error) {
          toast({ title: 'Chyba při úpravě', description: error.message });
          return;
        }

        // Update local state only if database update succeeded
        setUsers(prev => prev.map(user => 
          user.id === editUserDialog.user.id 
            ? { ...user, ...userForm }
            : user
        ));
        toast({ title: 'Účastník upraven', description: 'Změny byly uloženy' });
      } else {
        // Create new user using addUserByAdmin from DataContext
        const success = await addUserByAdmin({
          personalNumber: userForm.personalNumber,
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          position: userForm.position
        });
        
        if (!success) {
          return; // Error handling is done in addUserByAdmin
        }
      }
      
      setEditUserDialog({ open: false, user: null });
      setAddUserDialog(false);
      setUserForm({ firstName: '', lastName: '', personalNumber: '', position: '' });
    } catch (error) {
      console.error('Save user error:', error);
      toast({ title: 'Chyba při ukládání', description: 'Nastala neočekávaná chyba' });
    }
  };

  const handleSaveBooth = async () => {
    try {
      if (editBoothDialog.booth) {
        // Update existing booth in Supabase
        const { error } = await supabase
          .from('booths')
          .update({
            name: boothForm.name,
            code: boothForm.code,
            login: boothForm.login,
            category: boothForm.category || null,
            password: boothForm.password || null,
            logo: boothForm.logo || null
          })
          .eq('id', editBoothDialog.booth.id);

        if (error) {
          toast({ title: 'Chyba při úpravě stánku', description: error.message });
          return;
        }

        // Update local state only if database update succeeded
        setBooths(prev => prev.map(booth => 
          booth.id === editBoothDialog.booth.id 
            ? { ...booth, ...boothForm }
            : booth
        ));
        toast({ title: 'Stánek upraven', description: 'Změny byly uloženy' });
      } else {
        // Create new booth
        const { data, error } = await supabase.from('booths').insert([{ ...boothForm, visits: 0 }]).select();
        if (error) {
          toast({ title: 'Chyba při vytváření stánku', description: error.message });
          return;
        }
        
        // Update local state with new booth
        if (data && data[0]) {
          setBooths(prev => [...prev, { ...boothForm, id: data[0].id, visits: 0 }]);
          toast({ title: 'Stánek přidán', description: 'Nový stánek byl vytvořen' });
        }
      }
      
      setEditBoothDialog({ open: false, booth: null });
      setAddBoothDialog(false);
      setBoothForm({ name: '', code: '', login: '', category: '', password: '', logo: '' });
    } catch (error) {
      console.error('Save booth error:', error);
      toast({ title: 'Chyba při ukládání stánku', description: 'Nastala neočekávaná chyba' });
    }
  };

  const handleSaveEvent = async () => {
    try {
      if (editEventDialog.event) {
        // Update existing event in Supabase
        const { error } = await supabase
          .from('program')
          .update({
            time: eventForm.time,
            event: eventForm.event,
            duration: eventForm.duration
          })
          .eq('id', editEventDialog.event.id);

        if (error) {
          toast({ title: 'Chyba při úpravě události', description: error.message });
          return;
        }

        // Update local state only if database update succeeded
        setProgram(prev => prev.map(item =>
          item.id === editEventDialog.event.id
            ? { ...item, ...eventForm }
            : item
        ));
        toast({ title: 'Událost upravena', description: 'Změny byly uloženy' });
      } else {
        // Generate new ID for the event (since program table doesn't have auto-increment)
        const newId = program.length > 0 ? Math.max(...program.map(p => p.id)) + 1 : 1;

        // Create new event in Supabase with explicit ID
        const { data, error } = await supabase
          .from('program')
          .insert([{
            id: newId,
            time: eventForm.time,
            event: eventForm.event,
            duration: eventForm.duration
          }])
          .select();

        if (error) {
          toast({ title: 'Chyba při vytváření události', description: error.message });
          return;
        }

        // Update local state with new event
        if (data && data[0]) {
          setProgram(prev => [...prev, {
            id: data[0].id,
            time: data[0].time,
            event: data[0].event,
            duration: data[0].duration
          }].sort((a, b) =>
            a.time.localeCompare(b.time)
          ));
          toast({ title: 'Událost přidána', description: 'Nová událost byla vytvořena' });
        }
      }

      setEditEventDialog({ open: false, event: null });
      setAddEventDialog(false);
      setEventForm({ time: '', event: '', duration: 30 });
    } catch (error) {
      console.error('Save event error:', error);
      toast({ title: 'Chyba při ukládání události', description: 'Nastala neočekávaná chyba' });
    }
  };

  const handleSavePhone = async () => {
    try {
      if (editPhoneDialog.phone) {
        // Update existing phone in Supabase
        const { error } = await supabase
          .from('discounted_phones')
          .update({
            manufacturer_name: phoneForm.manufacturerName,
            phone_model: phoneForm.phoneModel,
            manufacturer_logo: phoneForm.manufacturerLogo || null,
            phone_image: phoneForm.phoneImage || null,
            original_price: phoneForm.originalPrice,
            discounted_price: phoneForm.discountedPrice,
            description: phoneForm.description || null
          })
          .eq('id', editPhoneDialog.phone.id);

        if (error) {
          toast({ title: 'Chyba při úpravě telefonu', description: error.message });
          return;
        }

        // Update local state only if database update succeeded
        setDiscountedPhones(prev => prev.map(phone =>
          phone.id === editPhoneDialog.phone.id
            ? { ...phone, ...phoneForm }
            : phone
        ));
        toast({ title: 'Telefon upraven', description: 'Změny byly uloženy' });
      } else {
        // Create new phone
        const { data, error } = await supabase
          .from('discounted_phones')
          .insert([{
            manufacturer_name: phoneForm.manufacturerName,
            phone_model: phoneForm.phoneModel,
            manufacturer_logo: phoneForm.manufacturerLogo || null,
            phone_image: phoneForm.phoneImage || null,
            original_price: phoneForm.originalPrice,
            discounted_price: phoneForm.discountedPrice,
            description: phoneForm.description || null
          }])
          .select();

        if (error) {
          toast({ title: 'Chyba při vytváření telefonu', description: error.message });
          return;
        }

        // Update local state with new phone
        if (data && data[0]) {
          const newPhone = {
            id: data[0].id,
            manufacturerName: data[0].manufacturer_name,
            phoneModel: data[0].phone_model,
            manufacturerLogo: data[0].manufacturer_logo,
            phoneImage: data[0].phone_image,
            originalPrice: data[0].original_price,
            discountedPrice: data[0].discounted_price,
            description: data[0].description
          };
          setDiscountedPhones(prev => [...prev, newPhone]);
          toast({ title: 'Telefon přidán', description: 'Nový telefon byl vytvořen' });
        }
      }

      setEditPhoneDialog({ open: false, phone: null });
      setAddPhoneDialog(false);
      setPhoneForm({
        manufacturerName: '',
        phoneModel: '',
        manufacturerLogo: '',
        phoneImage: '',
        originalPrice: 0,
        discountedPrice: 0,
        description: ''
      });
    } catch (error) {
      console.error('Save phone error:', error);
      toast({ title: 'Chyba při ukládání telefonu', description: 'Nastala neočekávaná chyba' });
    }
  };

  const handleDeletePhone = async (phoneId: number) => {
    try {
      // Delete from Supabase first
      const { error } = await supabase.from('discounted_phones').delete().eq('id', phoneId);
      if (error) {
        toast({
          title: 'Chyba při mazání telefonu',
          description: error.message,
        });
        return;
      }

      // Update local state only if database delete succeeded
      setDiscountedPhones(prev => prev.filter(phone => phone.id !== phoneId));
      toast({
        title: 'Telefon smazán',
        description: 'Telefon byl úspěšně odstraněn',
      });
    } catch (error) {
      console.error('Delete phone error:', error);
      toast({
        title: 'Chyba při mazání telefonu',
        description: 'Nastala neočekávaná chyba',
      });
    }
  };

  const handleImageUpload = async (imageUrl: string) => {
    try {
      if (imageUploadModal?.type === 'booth') {
        // Update booth logo in Supabase
        const { error } = await supabase
          .from('booths')
          .update({ logo: imageUrl })
          .eq('id', imageUploadModal.id);

        if (error) {
          toast({ title: 'Chyba při nahrávání loga', description: error.message });
          return;
        }

        // Update local state only if database update succeeded
        setBooths(prev => prev.map(booth => 
          booth.id === imageUploadModal.id 
            ? { ...booth, logo: imageUrl }
            : booth
        ));
        toast({ title: 'Logo přidáno', description: 'Logo stánku bylo úspěšně nahráno' });
      } else if (imageUploadModal?.type === 'user') {
        // Update user profile image in Supabase
        const { error } = await supabase
          .from('users')
          .update({ profileimage: imageUrl })
          .eq('id', imageUploadModal.id);

        if (error) {
          toast({ title: 'Chyba při nahrávání obrázku', description: error.message });
          return;
        }

        // Update local state only if database update succeeded
        setUsers(prev => prev.map(user => 
          user.id === imageUploadModal.id 
            ? { ...user, profileImage: imageUrl }
            : user
        ));
        toast({ title: 'Profilový obrázek nahrán', description: 'Profilový obrázek byl úspěšně nahrán' });
      }
      
      setImageUploadModal(null);
    } catch (error) {
      console.error('Image upload error:', error);
      toast({ title: 'Chyba při ukládání obrázku', description: 'Nastala neočekávaná chyba' });
    }
  };

  const handleRemoveUserImage = (userId: number) => {
    removeUserProfileImage(userId);
    toast({ title: 'Obrázek odstraněn', description: 'Profilový obrázek byl odstraněn' });
  };

  // Update draft texts and mark as unsaved
  const updateHomePageTextsDraft = (updates: Partial<typeof homePageTexts>) => {
    setHomePageTextsDraft(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  // Save homepage texts
  const handleSaveHomePageTexts = async () => {
    try {
      // Update context state which will sync to database
      setHomePageTexts(homePageTextsDraft);
      setHasUnsavedChanges(false);
      
      toast({
        title: 'Texty uloženy',
        description: 'Změny textů úvodní stránky byly úspěšně uloženy',
      });
    } catch (error) {
      console.error('Save homepage texts error:', error);
      toast({
        title: 'Chyba při ukládání',
        description: 'Nastala chyba při ukládání textů',
        variant: 'destructive'
      });
    }
  };

  // Show loading if data is still loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse-soft">
            <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4"></div>
          </div>
          <h2 className="text-xl font-semibold text-primary mb-2">Načítání dat...</h2>
          <p className="text-muted-foreground">Připravujeme admin dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">O2 Guru Summit 2025</p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Odhlásit
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-sm text-muted-foreground">Účastníků</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.totalVisits}</div>
              <p className="text-sm text-muted-foreground">Návštěv</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.averageProgress}%</div>
              <p className="text-sm text-muted-foreground">Průměrný pokrok</p>
              <Progress value={stats.averageProgress} className="w-full mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Building className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.activeBooths}</div>
              <p className="text-sm text-muted-foreground">Aktivních stánků</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
           <TabsList className="grid w-full grid-cols-6">
             <TabsTrigger value="users">Účastníci</TabsTrigger>
             <TabsTrigger value="booths">Stánky</TabsTrigger>
             <TabsTrigger value="program">Program</TabsTrigger>
             <TabsTrigger value="phones">Zlevněné telefony</TabsTrigger>
             <TabsTrigger value="settings">Nastavení</TabsTrigger>
             <TabsTrigger value="actions">Akce</TabsTrigger>
           </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Správa účastníků</h3>
              <div className="space-x-2">
                <Button onClick={handleExportUsers} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={() => setAddUserDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Přidat účastníka
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-4">Profil</th>
                        <th className="text-left p-4">Jméno</th>
                        <th className="text-left p-4">Příjmení</th>
                        <th className="text-left p-4">Osobní číslo</th>
                        <th className="text-left p-4">Pozice</th>
                        <th className="text-left p-4">Návštěvy</th>
                        <th className="text-left p-4">Pokrok</th>
                        <th className="text-left p-4">Akce</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.profileImage} />
                                <AvatarFallback>
                                  {user.firstName && user.lastName ? 
                                    `${user.firstName[0]}${user.lastName[0]}` : 
                                    <User className="h-5 w-5" />
                                  }
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setImageUploadModal({
                                    open: true,
                                    type: 'user',
                                    id: user.id,
                                    title: `Nahrát profilový obrázek - ${user.firstName} ${user.lastName}`,
                                    currentImage: user.profileImage
                                  })}
                                >
                                  <Image className="h-4 w-4" />
                                </Button>
                                {user.profileImage && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Smazat profilový obrázek?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Opravdu chcete smazat profilový obrázek uživatele {user.firstName} {user.lastName}?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Zrušit</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemoveUserImage(user.id)}>
                                          Smazat
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-medium">{user.firstName}</td>
                          <td className="p-4">{user.lastName}</td>
                          <td className="p-4">{user.personalNumber}</td>
                          <td className="p-4">{user.position}</td>
                          <td className="p-4">
                            <Badge variant="secondary">{user.visits}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Progress value={user.progress} className="w-16" />
                              <span className="text-sm">{user.progress}%</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                                <Edit className="h-4 w-4 mr-1" />
                                Upravit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Smazat
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Smazat účastníka?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Opravdu chcete smazat účastníka {user.firstName} {user.lastName}? Tato akce je nevratná.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Zrušit</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                      Smazat
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Booths Tab */}
          <TabsContent value="booths" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Správa stánků</h3>
              <div className="space-x-2">
                <Button onClick={handleExportBooths} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={() => setAddBoothDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Přidat stánek
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {booths.map((booth) => (
                <Card key={booth.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {booth.logo ? (
                        <img 
                          src={booth.logo} 
                          alt={`${booth.name} logo`}
                          className="w-12 h-12 object-contain rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Building className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{booth.name}</CardTitle>
                        <CardDescription>Stánek #{booth.id}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Logo:</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setImageUploadModal({
                            open: true,
                            type: 'booth',
                            id: booth.id,
                            title: `Nahrát logo - ${booth.name}`,
                            currentImage: booth.logo
                          })}
                        >
                          <Image className="h-4 w-4 mr-1" />
                          {booth.logo ? 'Změnit' : 'Přidat'}
                        </Button>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Kód:</span>
                        <span className="font-mono">{booth.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Login:</span>
                        <span className="font-mono">{booth.login}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Heslo:</span>
                        <span className="font-mono">{booth.password || 'Nenastaveno'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Návštěvy:</span>
                        <Badge variant="secondary">{booth.visits}</Badge>
                      </div>
                      <div className="pt-2 space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditBooth(booth)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Upravit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Smazat
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Smazat stánek?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Opravdu chcete smazat stánek {booth.name}? Tato akce je nevratná.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Zrušit</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteBooth(booth.id)}>
                                Smazat
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Program Tab */}
          <TabsContent value="program" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Správa programu</h3>
              <Button onClick={() => setAddEventDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Přidat událost
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Do dalšího bodu programu: {formatTime(timeToNext)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {program.map((item) => {
                    const now = new Date();
                    const currentTime = now.getHours() * 60 + now.getMinutes();
                    const itemTime = parseInt(item.time.split(':')[0]) * 60 + parseInt(item.time.split(':')[1]);
                    const itemEndTime = itemTime + item.duration;
                    const isActive = currentTime >= itemTime && currentTime < itemEndTime;
                    const isPast = currentTime >= itemEndTime;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          isActive 
                            ? 'bg-primary/10 border border-primary/20' 
                            : isPast 
                            ? 'bg-muted/30' 
                            : 'bg-card border'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <Badge variant={isActive ? 'default' : isPast ? 'secondary' : 'outline'}>
                            {item.time}
                          </Badge>
                          <div>
                            <div className={`font-medium ${isPast ? 'line-through text-muted-foreground' : ''}`}>
                              {item.event}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.duration} minut
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isActive && (
                            <Badge className="bg-secondary">Probíhá</Badge>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleEditEvent(item)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Upravit
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Phones Tab */}
          <TabsContent value="phones" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Správa zlevněných telefonů</h3>
              <Button onClick={() => setAddPhoneDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Přidat telefon
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {discountedPhones.map((phone) => (
                <Card key={phone.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {phone.phoneImage ? (
                        <img
                          src={phone.phoneImage}
                          alt={phone.phoneModel}
                          className="w-12 h-12 object-contain rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Smartphone className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{phone.phoneModel}</CardTitle>
                        <CardDescription>{phone.manufacturerName}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Původní cena:</span>
                        <span className="font-medium line-through">{phone.originalPrice.toLocaleString()} Kč</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Zlevněná cena:</span>
                        <span className="font-bold text-green-600">{phone.discountedPrice.toLocaleString()} Kč</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Úspora:</span>
                        <Badge variant="secondary">
                          {((phone.originalPrice - phone.discountedPrice) / phone.originalPrice * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      {phone.description && (
                        <div className="pt-2">
                          <span className="text-sm text-muted-foreground">Popis:</span>
                          <p className="text-sm mt-1">{phone.description}</p>
                        </div>
                      )}
                      <div className="pt-2 space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditPhone(phone)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Upravit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Smazat
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Smazat telefon?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Opravdu chcete smazat telefon {phone.phoneModel}? Tato akce je nevratná.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Zrušit</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePhone(phone.id)}>
                                Smazat
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {discountedPhones.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Žádné zlevněné telefony
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Začněte přidáním prvního zlevněného telefonu.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Časové omezení kódů</CardTitle>
                <CardDescription>
                  Nastavte časové okno pro zadávání kódů stánků
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={codeTimeSettings.enabled}
                    onCheckedChange={(checked) => 
                      setCodeTimeSettings(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Label>Povolit časové omezení</Label>
                </div>
                
                {codeTimeSettings.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Čas od</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={codeTimeSettings.startTime}
                        onChange={(e) => 
                          setCodeTimeSettings(prev => ({ ...prev, startTime: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">Čas do</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={codeTimeSettings.endTime}
                        onChange={(e) => 
                          setCodeTimeSettings(prev => ({ ...prev, endTime: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Texty úvodní stránky</CardTitle>
                <CardDescription>
                  Upravte texty zobrazované na přihlašovací stránce
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Hlavní nadpis</Label>
                  <Input
                    id="title"
                    value={homePageTextsDraft.title}
                    onChange={(e) => 
                      updateHomePageTextsDraft({ title: e.target.value })
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="subtitle">Podnadpis</Label>
                  <Input
                    id="subtitle"
                    value={homePageTextsDraft.subtitle}
                    onChange={(e) => 
                      updateHomePageTextsDraft({ subtitle: e.target.value })
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Popis</Label>
                  <Input
                    id="description"
                    value={homePageTextsDraft.description}
                    onChange={(e) =>
                      updateHomePageTextsDraft({ description: e.target.value })
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="loginTitle">Nadpis přihlašovací sekce</Label>
                  <Input
                    id="loginTitle"
                    value={homePageTextsDraft.loginTitle}
                    onChange={(e) =>
                      updateHomePageTextsDraft({ loginTitle: e.target.value })
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="loginDescription">Popis přihlašovací sekce</Label>
                  <Textarea
                    id="loginDescription"
                    value={homePageTextsDraft.loginDescription}
                    onChange={(e) =>
                      updateHomePageTextsDraft({ loginDescription: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="benefitsTitle">Nadpis výhod</Label>
                  <Input
                    id="benefitsTitle"
                    value={homePageTextsDraft.benefitsTitle}
                    onChange={(e) =>
                      updateHomePageTextsDraft({ benefitsTitle: e.target.value })
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="benefits">Výhody (jedna na řádek)</Label>
                  <Textarea
                    id="benefits"
                    value={homePageTextsDraft.benefits.join('\n')}
                    onChange={(e) => 
                      updateHomePageTextsDraft({ 
                        benefits: e.target.value.split('\n').filter(b => b.trim()) 
                      })
                    }
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="prizesTitle">Nadpis cen</Label>
                  <Input
                    id="prizesTitle"
                    value={homePageTextsDraft.prizesTitle}
                    onChange={(e) => 
                      updateHomePageTextsDraft({ prizesTitle: e.target.value })
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="prizesDescription">Popis cen</Label>
                  <Textarea
                    id="prizesDescription"
                    value={homePageTextsDraft.prizesDescription}
                    onChange={(e) => 
                      updateHomePageTextsDraft({ prizesDescription: e.target.value })
                    }
                  />
                </div>

                {/* Save button */}
                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSaveHomePageTexts}
                    disabled={!hasUnsavedChanges}
                    className="w-full"
                  >
                    {hasUnsavedChanges ? 'Uložit změny' : 'Vše uloženo'}
                  </Button>
                  {hasUnsavedChanges && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      Máte neuložené změny
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <h3 className="text-lg font-semibold">Správcovské akce</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Reset pokroku</CardTitle>
                  <CardDescription>
                    Vynuluje pokrok všech účastníků a návštěvy stánků
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Vynulovat pokrok
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Vynulovat pokrok?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Opravdu chcete vynulovat pokrok všech účastníků a návštěvy stánků? Tato akce je nevratná.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Zrušit</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetProgress}>
                          Vynulovat
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Export všech dat</CardTitle>
                  <CardDescription>
                    Stáhne kompletní export všech uživatelů a statistik
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleExportUsers}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Stáhnout vše
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Losování o ceny
                  </CardTitle>
                  <CardDescription>
                    Kolo štěstí pro účastníky se 100% pokrokem
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    onClick={() => setIsLotteryOpen(true)}
                    className="w-full bg-gradient-primary text-white hover:opacity-90"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Spustit losování
                  </Button>
                  <Button 
                    onClick={() => setIsWinnersOpen(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Vylosovaní výherci ({winners.length})
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={editUserDialog.open} onOpenChange={(open) => setEditUserDialog({ open, user: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upravit účastníka</DialogTitle>
              <DialogDescription>Změňte údaje účastníka</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">Jméno</Label>
                <Input
                  id="firstName"
                  value={userForm.firstName}
                  onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">Příjmení</Label>
                <Input
                  id="lastName"
                  value={userForm.lastName}
                  onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="personalNumber" className="text-right">Osobní číslo</Label>
                <Input
                  id="personalNumber"
                  value={userForm.personalNumber}
                  onChange={(e) => setUserForm(prev => ({ ...prev, personalNumber: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="position" className="text-right">Pozice</Label>
                <Input
                  id="position"
                  value={userForm.position}
                  onChange={(e) => setUserForm(prev => ({ ...prev, position: e.target.value }))}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditUserDialog({ open: false, user: null })}>
                Zrušit
              </Button>
              <Button onClick={handleSaveUser}>Uložit změny</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add User Dialog */}
        <Dialog open={addUserDialog} onOpenChange={setAddUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Přidat účastníka</DialogTitle>
              <DialogDescription>Vytvořte nového účastníka</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-firstName" className="text-right">Jméno</Label>
                <Input
                  id="add-firstName"
                  value={userForm.firstName}
                  onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-lastName" className="text-right">Příjmení</Label>
                <Input
                  id="add-lastName"
                  value={userForm.lastName}
                  onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-personalNumber" className="text-right">Osobní číslo</Label>
                <Input
                  id="add-personalNumber"
                  value={userForm.personalNumber}
                  onChange={(e) => setUserForm(prev => ({ ...prev, personalNumber: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-position" className="text-right">Pozice</Label>
                <Input
                  id="add-position"
                  value={userForm.position}
                  onChange={(e) => setUserForm(prev => ({ ...prev, position: e.target.value }))}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddUserDialog(false)}>
                Zrušit
              </Button>
              <Button onClick={handleSaveUser}>Přidat účastníka</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Booth Dialog */}
        <Dialog open={editBoothDialog.open} onOpenChange={(open) => setEditBoothDialog({ open, booth: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upravit stánek</DialogTitle>
              <DialogDescription>Změňte údaje stánku</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="booth-name" className="text-right">Název</Label>
                <Input
                  id="booth-name"
                  value={boothForm.name}
                  onChange={(e) => setBoothForm(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="booth-code" className="text-right">Kód</Label>
                <Input
                  id="booth-code"
                  value={boothForm.code}
                  onChange={(e) => setBoothForm(prev => ({ ...prev, code: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="booth-login" className="text-right">Login</Label>
                <Input
                  id="booth-login"
                  value={boothForm.login}
                  onChange={(e) => setBoothForm(prev => ({ ...prev, login: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="booth-password" className="text-right">Heslo</Label>
                <Input
                  id="booth-password"
                  type="text"
                  value={boothForm.password}
                  onChange={(e) => setBoothForm(prev => ({ ...prev, password: e.target.value }))}
                  className="col-span-3"
                  placeholder="Zadejte heslo pro stánek"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditBoothDialog({ open: false, booth: null })}>
                Zrušit
              </Button>
              <Button onClick={handleSaveBooth}>Uložit změny</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Booth Dialog */}
        <Dialog open={addBoothDialog} onOpenChange={setAddBoothDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Přidat stánek</DialogTitle>
              <DialogDescription>Vytvořte nový stánek</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-booth-name" className="text-right">Název</Label>
                <Input
                  id="add-booth-name"
                  value={boothForm.name}
                  onChange={(e) => setBoothForm(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-booth-code" className="text-right">Kód</Label>
                <Input
                  id="add-booth-code"
                  value={boothForm.code}
                  onChange={(e) => setBoothForm(prev => ({ ...prev, code: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-booth-login" className="text-right">Login</Label>
                <Input
                  id="add-booth-login"
                  value={boothForm.login}
                  onChange={(e) => setBoothForm(prev => ({ ...prev, login: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-booth-password" className="text-right">Heslo</Label>
                <Input
                  id="add-booth-password"
                  type="text"
                  value={boothForm.password}
                  onChange={(e) => setBoothForm(prev => ({ ...prev, password: e.target.value }))}
                  className="col-span-3"
                  placeholder="Zadejte heslo pro stánek"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddBoothDialog(false)}>
                Zrušit
              </Button>
              <Button onClick={handleSaveBooth}>Přidat stánek</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog open={editEventDialog.open} onOpenChange={(open) => setEditEventDialog({ open, event: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upravit událost</DialogTitle>
              <DialogDescription>Změňte údaje události</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="event-time" className="text-right">Čas</Label>
                <Input
                  id="event-time"
                  type="time"
                  value={eventForm.time}
                  onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="event-name" className="text-right">Událost</Label>
                <Input
                  id="event-name"
                  value={eventForm.event}
                  onChange={(e) => setEventForm(prev => ({ ...prev, event: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="event-duration" className="text-right">Trvání (min)</Label>
                <Input
                  id="event-duration"
                  type="number"
                  value={eventForm.duration}
                  onChange={(e) => setEventForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditEventDialog({ open: false, event: null })}>
                Zrušit
              </Button>
              <Button onClick={handleSaveEvent}>Uložit změny</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Event Dialog */}
        <Dialog open={addEventDialog} onOpenChange={setAddEventDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Přidat událost</DialogTitle>
              <DialogDescription>Vytvořte novou událost v programu</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-event-time" className="text-right">Čas</Label>
                <Input
                  id="add-event-time"
                  type="time"
                  value={eventForm.time}
                  onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-event-name" className="text-right">Událost</Label>
                <Input
                  id="add-event-name"
                  value={eventForm.event}
                  onChange={(e) => setEventForm(prev => ({ ...prev, event: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-event-duration" className="text-right">Trvání (min)</Label>
                <Input
                  id="add-event-duration"
                  type="number"
                  value={eventForm.duration}
                  onChange={(e) => setEventForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddEventDialog(false)}>
                Zrušit
              </Button>
              <Button onClick={handleSaveEvent}>Přidat událost</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Phone Dialog */}
      <Dialog open={editPhoneDialog.open} onOpenChange={(open) => setEditPhoneDialog({ open, phone: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upravit telefon</DialogTitle>
            <DialogDescription>Změňte údaje zlevněného telefonu</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone-manufacturer" className="text-right">Výrobce</Label>
              <Input
                id="phone-manufacturer"
                value={phoneForm.manufacturerName}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, manufacturerName: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone-model" className="text-right">Model</Label>
              <Input
                id="phone-model"
                value={phoneForm.phoneModel}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, phoneModel: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone-logo" className="text-right">Logo výrobce</Label>
              <Input
                id="phone-logo"
                value={phoneForm.manufacturerLogo}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, manufacturerLogo: e.target.value }))}
                className="col-span-3"
                placeholder="URL obrázku loga"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone-image" className="text-right">Obrázek telefonu</Label>
              <Input
                id="phone-image"
                value={phoneForm.phoneImage}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, phoneImage: e.target.value }))}
                className="col-span-3"
                placeholder="URL obrázku telefonu"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="original-price" className="text-right">Původní cena (Kč)</Label>
              <Input
                id="original-price"
                type="number"
                value={phoneForm.originalPrice}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, originalPrice: parseInt(e.target.value) || 0 }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="discounted-price" className="text-right">Zlevněná cena (Kč)</Label>
              <Input
                id="discounted-price"
                type="number"
                value={phoneForm.discountedPrice}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, discountedPrice: parseInt(e.target.value) || 0 }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone-description" className="text-right">Popis</Label>
              <Textarea
                id="phone-description"
                value={phoneForm.description}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPhoneDialog({ open: false, phone: null })}>
              Zrušit
            </Button>
            <Button onClick={handleSavePhone}>Uložit změny</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Phone Dialog */}
      <Dialog open={addPhoneDialog} onOpenChange={setAddPhoneDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Přidat zlevněný telefon</DialogTitle>
            <DialogDescription>Vytvořte nový zlevněný telefon</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-phone-manufacturer" className="text-right">Výrobce</Label>
              <Input
                id="add-phone-manufacturer"
                value={phoneForm.manufacturerName}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, manufacturerName: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-phone-model" className="text-right">Model</Label>
              <Input
                id="add-phone-model"
                value={phoneForm.phoneModel}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, phoneModel: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-phone-logo" className="text-right">Logo výrobce</Label>
              <Input
                id="add-phone-logo"
                value={phoneForm.manufacturerLogo}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, manufacturerLogo: e.target.value }))}
                className="col-span-3"
                placeholder="URL obrázku loga"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-phone-image" className="text-right">Obrázek telefonu</Label>
              <Input
                id="add-phone-image"
                value={phoneForm.phoneImage}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, phoneImage: e.target.value }))}
                className="col-span-3"
                placeholder="URL obrázku telefonu"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-original-price" className="text-right">Původní cena (Kč)</Label>
              <Input
                id="add-original-price"
                type="number"
                value={phoneForm.originalPrice}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, originalPrice: parseInt(e.target.value) || 0 }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-discounted-price" className="text-right">Zlevněná cena (Kč)</Label>
              <Input
                id="add-discounted-price"
                type="number"
                value={phoneForm.discountedPrice}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, discountedPrice: parseInt(e.target.value) || 0 }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-phone-description" className="text-right">Popis</Label>
              <Textarea
                id="add-phone-description"
                value={phoneForm.description}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPhoneDialog(false)}>
              Zrušit
            </Button>
            <Button onClick={handleSavePhone}>Přidat telefon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LotteryWheel
        isOpen={isLotteryOpen}
        onClose={() => setIsLotteryOpen(false)}
      />

      <WinnersModal
        isOpen={isWinnersOpen}
        onClose={() => setIsWinnersOpen(false)}
      />

      {imageUploadModal && (
        <ImageUploadModal
          isOpen={imageUploadModal.open}
          onClose={() => setImageUploadModal(null)}
          onImageSelect={handleImageUpload}
          title={imageUploadModal.title}
          currentImage={imageUploadModal.currentImage}
        />
      )}
    </div>
  );
};