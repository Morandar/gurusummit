import { useState, useEffect, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { BoothCodeModal } from '@/components/Modals/BoothCodeModal';
import { ProfileEditModal } from '@/components/Profile/ProfileEditModal';
import { ScrollingBanner } from '@/components/ScrollingBanner';
import { Clock, MapPin, Trophy, Calendar, Smartphone, Lock, User, DollarSign, Award, Bell, Presentation, Coffee, Wrench, Users2 } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { supabase } from '@/lib/supabase';

interface ParticipantDashboardProps {
  user: any;
  onLogout: () => void;
  onUserUpdate?: (updatedUser: any) => void;
}

export const ParticipantDashboard = ({ user, onLogout, onUserUpdate }: ParticipantDashboardProps) => {
  const { booths, program, users, isLoading, discountedPhones, banners, banner, finalSettings } = useData();
  const [timeToNext, setTimeToNext] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedBooth, setSelectedBooth] = useState<{ id: number; name: string } | null>(null);
  const [finalScores, setFinalScores] = useState<Record<string, number>>({});
  const [finalVoteSubmitted, setFinalVoteSubmitted] = useState(false);
  const [finalVoteLoading, setFinalVoteLoading] = useState(false);
  
  // Get current user data from global state
  const currentUser = users.find(u => u.personalNumber === user.personalNumber);
  const visitedBooths = currentUser?.visitedBooths || [];
  const progress = booths.length > 0 ? (visitedBooths.length / booths.length) * 100 : 0;

  const finalTop10Users = useMemo(() => {
    const list = finalSettings?.top10PersonalNumbers || [];
    return list
      .map(personalNumber => users.find(u => String(u.personalNumber) === String(personalNumber)))
      .filter(Boolean) as any[];
  }, [finalSettings, users]);

  const isFinalist = useMemo(() => {
    if (!currentUser) return false;
    return finalTop10Users.some(u => String(u.personalNumber) === String(currentUser.personalNumber));
  }, [finalTop10Users, currentUser]);

  useEffect(() => {
    const loadFinalVote = async () => {
      if (!finalSettings?.enabled || !currentUser) return;
      const { data, error } = await supabase
        .from('final_votes')
        .select('scores')
        .eq('voter_id', currentUser.id)
        .maybeSingle();
      if (error) {
        console.error('Error loading final vote:', error);
        return;
      }
      if (data?.scores) {
        setFinalVoteSubmitted(true);
        try {
          setFinalScores(data.scores as Record<string, number>);
        } catch {
          // ignore parsing errors
        }
      }
    };
    loadFinalVote();
  }, [finalSettings, currentUser]);

  const handleFinalRankSelect = (personalNumber: string, rank: number) => {
    setFinalScores(prev => {
      const next = { ...prev };
      // Ensure rank is unique: remove it from anyone else
      Object.keys(next).forEach(key => {
        if (next[key] === rank) {
          delete next[key];
        }
      });
      next[personalNumber] = rank;
      return next;
    });
  };

  const handleSubmitFinalVotes = async () => {
    if (!currentUser) return;
    if (finalVoteSubmitted) return;
    const missing = finalTop10Users.filter(u => finalScores[String(u.personalNumber)] == null);
    if (missing.length > 0) {
      alert('Vyplňte pořadí pro všech 10 účastníků (1–10).');
      return;
    }
    const usedRanks = new Set(Object.values(finalScores));
    if (usedRanks.size !== 10) {
      alert('Každé pořadí 1–10 lze použít jen jednou.');
      return;
    }
    setFinalVoteLoading(true);
    const { error } = await supabase.from('final_votes').insert([{
      voter_id: currentUser.id,
      scores: finalScores,
      created_at: new Date().toISOString()
    }]);
    setFinalVoteLoading(false);
    if (error) {
      alert(`Chyba při odeslání hlasů: ${error.message}`);
      return;
    }
    setFinalVoteSubmitted(true);
  };

  // Get current program events (what's happening now) - can return multiple overlapping events
  const getCurrentEvents = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return program.filter(event => {
      const [eventHour, eventMinute] = event.time.split(':').map(Number);
      const eventStartTime = eventHour * 60 + eventMinute;
      const eventEndTime = eventStartTime + event.duration;
      return currentTime >= eventStartTime && currentTime < eventEndTime;
    });
  };

  // Get next program event
  const getNextEvent = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return program.find(event => {
      const [eventHour, eventMinute] = event.time.split(':').map(Number);
      const eventStartTime = eventHour * 60 + eventMinute;
      return eventStartTime > currentTime;
    });
  };

  // Calculate time remaining for current event (uses the first current event)
  const calculateTimeRemaining = () => {
    const currentEvents = getCurrentEvents();
    if (currentEvents.length === 0) return 0;

    const currentEvent = currentEvents[0]; // Use first event for time remaining
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [eventHour, eventMinute] = currentEvent.time.split(':').map(Number);
    const eventStartTime = eventHour * 60 + eventMinute;
    const eventEndTime = eventStartTime + currentEvent.duration;

    return Math.max(0, eventEndTime - currentTime);
  };

  // Calculate time to next program (in seconds)
  const calculateTimeToNext = () => {
    const nextEvent = getNextEvent();
    if (!nextEvent) return 0;

    const now = new Date();
    const currentTimeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const [eventHour, eventMinute] = nextEvent.time.split(':').map(Number);
    const eventStartTimeInSeconds = eventHour * 3600 + eventMinute * 60;

    return Math.max(0, eventStartTimeInSeconds - currentTimeInSeconds);
  };

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeToNext();
      const remainingCurrent = calculateTimeRemaining();
      setTimeToNext(remaining);
      setTimeRemaining(remainingCurrent);
    }, 1000);

    // Initialize with correct time immediately
    setTimeToNext(calculateTimeToNext());
    setTimeRemaining(calculateTimeRemaining());

    return () => clearInterval(timer);
  }, [program]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const calculateEventEndTime = (event: any) => {
    const [startHour, startMinute] = event.time.split(':').map(Number);
    const endMinute = startMinute + event.duration;
    const endHour = startHour + Math.floor(endMinute / 60);
    const finalMinute = endMinute % 60;
    return `${endHour.toString().padStart(2, '0')}:${finalMinute.toString().padStart(2, '0')}`;
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'lecture':
        return { icon: Presentation, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
      case 'break':
        return { icon: Coffee, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
      case 'workshop':
        return { icon: Wrench, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' };
      case 'networking':
        return { icon: Users2, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
      case 'ceremony':
        return { icon: Award, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
      default:
        return { icon: Calendar, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
    }
  };


  const handleBoothVisit = (boothId: number, boothName: string) => {
    const status = currentUser?.boothAnswers?.[boothId];
    if (status !== 'correct' && status !== 'wrong') {
      setSelectedBooth({ id: boothId, name: boothName });
    }
  };

  const handleBoothSuccess = async (boothId: number, visitResult: 'created' | 'pending' | 'answered' | 'error') => {
    if (!currentUser) return;
    if (visitResult === 'created') {
      // No-op for now; points update happens via DataContext state
    }
  };

  const handleCloseModal = () => {
    setSelectedBooth(null);
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
          <p className="text-muted-foreground">Připravujeme váš dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-subtle">
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Smartphone className="h-6 w-6 text-primary mr-2" />
                <h1 className="text-lg sm:text-xl font-bold text-primary">O2 Guru Summit 2025</h1>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser?.profileImage} />
                  <AvatarFallback className="text-xs">
                    {user.firstName && user.lastName ?
                      `${user.firstName[0]}${user.lastName[0]}` :
                      <User className="h-4 w-4" />
                    }
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  {user.firstName} {user.lastName}
                </span>
                {onUserUpdate && (
                  <ProfileEditModal user={user} onUserUpdate={onUserUpdate} />
                )}
                <Button variant="outline" size="sm" onClick={onLogout}>
                  Odhlásit
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Scrolling Banner */}
        {banners && banners.length > 0 && (
          <ScrollingBanner banners={banners} />
        )}

        {/* Current Events Progress Bar */}
        {getCurrentEvents().length > 0 && (
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-y border-primary/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-secondary animate-pulse">
                      ŽIVĚ
                    </Badge>
                    <span className="text-sm font-medium text-primary">
                      Právě probíhá ({getCurrentEvents().length} {getCurrentEvents().length === 1 ? 'událost' : 'události'})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {getCurrentEvents().map((event, index) => {
                      const categoryInfo = getCategoryInfo(event.category || 'lecture');
                      const CategoryIcon = categoryInfo.icon;
                      const isFirstEvent = index === 0;

                      return (
                        <div key={event.id} className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${categoryInfo.bgColor}`}>
                            <CategoryIcon className={`h-4 w-4 ${categoryInfo.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm sm:text-base text-primary">
                              {event.event}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {event.time} - {calculateEventEndTime(event)} • {event.duration} minut
                              {isFirstEvent && ` • Zbývá ${formatTimeHours(timeRemaining)}`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
            {/* Program Status Card */}
            <Card className="bg-gradient-primary text-white col-span-1 sm:col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Do dalšího programu
                </CardTitle>
                <Clock className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold mb-1">{formatTime(timeToNext)}</div>
                {getNextEvent() ? (
                  <div className="space-y-1">
                    <p className="text-xs text-white/90 font-medium">
                      {getNextEvent()?.event}
                    </p>
                    <p className="text-xs text-white/80">
                      začíná v {getNextEvent()?.time}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-white/80">
                    Žádné další události
                  </p>
                )}
              </CardContent>
            </Card>

          {/* Progress Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pokrok návštěv
              </CardTitle>
              <Trophy className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{visitedBooths.length}/{booths.length}</div>
              <Progress value={progress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {progress.toFixed(0)}% stánků navštíveno
              </p>
            </CardContent>
          </Card>

          {/* Points Card */}
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                TOP Body
              </CardTitle>
              <Award className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">
                {currentUser?.points ?? 0}
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Body získáte pouze za správné odpovědi (1 bod za každou správnou odpověď)
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="booths" className="space-y-4">
           <TabsList className={`grid w-full h-12 ${finalSettings?.enabled ? 'grid-cols-4' : 'grid-cols-3'}`}>
             <TabsTrigger value="booths" className="text-sm sm:text-base">Stánky</TabsTrigger>
             <TabsTrigger value="program" className="text-sm sm:text-base">Program</TabsTrigger>
             <TabsTrigger value="phones" className="text-sm sm:text-base">Zlevněné telefony</TabsTrigger>
             {finalSettings?.enabled && (
               <TabsTrigger value="final" className="text-sm sm:text-base">Finale</TabsTrigger>
             )}
           </TabsList>

          <TabsContent value="booths" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <MapPin className="h-5 w-5 text-secondary" />
                  Stánky na summitu
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Klepněte na stánek a zadejte heslo pro získání bodů
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {booths.map((booth) => {
                    const isVisited = visitedBooths.includes(booth.id);
                    const status = currentUser?.boothAnswers?.[booth.id];
                    return (
                      <Card
                        key={booth.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          isVisited
                            ? 'bg-secondary/10 border-secondary shadow-md'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => handleBoothVisit(booth.id, booth.name)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            {booth.logo ? (
                              <img
                                src={booth.logo}
                                alt={`${booth.name} logo`}
                                className="w-10 h-10 object-contain rounded-lg bg-white border"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h3 className="font-medium text-sm sm:text-base leading-tight truncate">{booth.name}</h3>
                                <div className="flex-shrink-0 ml-2">
                                  {status === 'correct' ? (
                                    <Badge variant="secondary" className="text-xs">
                                      ✓ OK
                                    </Badge>
                                  ) : status === 'wrong' ? (
                                    <Badge variant="destructive" className="text-xs">
                                      ✕ FAIL
                                    </Badge>
                                  ) : isVisited ? (
                                    <Badge variant="outline" className="text-xs">
                                      Čeká
                                    </Badge>
                                  ) : (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                {booth.category}
                              </p>
                            </div>
                          </div>
                          {!isVisited && (
                            <p className="text-xs text-primary font-medium">
                              Klepněte pro zadání kódu
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="program" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Calendar className="h-5 w-5 text-primary" />
                  Program summitu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {program.map((item) => {
                    const now = new Date();
                    const currentTime = now.getHours() * 60 + now.getMinutes();
                    const itemTime = parseInt(item.time.split(':')[0]) * 60 + parseInt(item.time.split(':')[1]);
                    const itemEndTime = itemTime + item.duration;
                    const isActive = currentTime >= itemTime && currentTime < itemEndTime;
                    const isPast = currentTime >= itemEndTime;

                    const categoryInfo = getCategoryInfo(item.category || 'lecture');
                    const CategoryIcon = categoryInfo.icon;


                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary/10 border border-primary/20'
                            : isPast
                            ? 'bg-muted/30'
                            : `${categoryInfo.bgColor} ${categoryInfo.borderColor} border`
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <Badge variant={isActive ? 'default' : isPast ? 'secondary' : 'outline'}>
                            {item.time}
                          </Badge>
                          <div className={`p-2 rounded-full ${categoryInfo.bgColor}`}>
                            <CategoryIcon className={`h-4 w-4 ${categoryInfo.color}`} />
                          </div>
                          <div>
                            <div className={`font-medium ${isPast ? 'line-through text-muted-foreground' : ''}`}>
                              {item.event}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.duration} minut • {item.category === 'lecture' ? 'Přednáška' :
                                                    item.category === 'break' ? 'Pauza' :
                                                    item.category === 'workshop' ? 'Workshop' :
                                                    item.category === 'networking' ? 'Networking' :
                                                    item.category === 'ceremony' ? 'Ceremoniál' : 'Událost'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isActive && (
                            <Badge className="bg-secondary">Probíhá</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Smartphone className="h-5 w-5 text-primary" />
                  Zlevněné telefony
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Speciální nabídka zlevněných telefonů pro účastníky summitu
                </p>
              </CardHeader>
              <CardContent>
                {discountedPhones.length === 0 ? (
                  <div className="text-center py-8">
                    <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      Žádné zlevněné telefony
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      V současné době nejsou k dispozici žádné zlevněné telefony.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {discountedPhones.map((phone) => (
                      <Card key={phone.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-[4/3] relative bg-muted">
                          {phone.phoneImage ? (
                            <img
                              src={phone.phoneImage}
                              alt={phone.phoneModel}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Smartphone className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          {phone.manufacturerLogo && (
                            <div className="absolute top-2 left-2 bg-white/90 rounded-full p-1">
                              <img
                                src={phone.manufacturerLogo}
                                alt={phone.manufacturerName}
                                className="w-8 h-8 object-contain"
                              />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div>
                              <h3 className="font-semibold text-sm">{phone.phoneModel}</h3>
                              <p className="text-xs text-muted-foreground">{phone.manufacturerName}</p>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm line-through text-muted-foreground">
                                  {phone.originalPrice.toLocaleString()} Kč
                                </span>
                                <span className="text-lg font-bold text-green-600">
                                  {phone.discountedPrice.toLocaleString()} Kč
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-green-600">
                              <DollarSign className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                Úspora {((phone.originalPrice - phone.discountedPrice) / phone.originalPrice * 100).toFixed(0)}%
                              </span>
                            </div>
                            {phone.description && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {phone.description}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {finalSettings?.enabled && (
            <TabsContent value="final" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Award className="h-5 w-5 text-yellow-600" />
                    Finále TOP10
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Seřaďte TOP10 podle vašeho pořadí (1 = nejlepší, 10 = nejhorší). Každé číslo lze použít jen jednou.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {finalTop10Users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">TOP10 zatím není nastaveno.</p>
                  ) : isFinalist ? (
                    <p className="text-sm text-muted-foreground">Účastníci TOP10 nemohou hlasovat.</p>
                  ) : (
                    <div className="space-y-3">
                      {finalTop10Users.map((u, idx) => (
                        <div key={`final-${u.id}`} className="flex flex-col sm:flex-row sm:items-center gap-3 border rounded-md p-3">
                          <div className="w-6 text-sm text-muted-foreground">{idx + 1}.</div>
                          <div className="flex-1">
                            <div className="font-medium text-sm sm:text-base">{u.firstName} {u.lastName}</div>
                            <div className="text-xs text-muted-foreground">{u.personalNumber}</div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(rank => {
                              const selected = finalScores[String(u.personalNumber)] === rank;
                              return (
                                <Button
                                  key={`${u.personalNumber}-${rank}`}
                                  type="button"
                                  variant={selected ? 'default' : 'outline'}
                                  size="sm"
                                  disabled={finalVoteSubmitted}
                                  onClick={() => handleFinalRankSelect(String(u.personalNumber), rank)}
                                >
                                  {rank}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmitFinalVotes}
                      disabled={finalVoteSubmitted || finalVoteLoading || finalTop10Users.length !== 10 || isFinalist}
                    >
                      {finalVoteSubmitted ? 'Hlas odeslán' : finalVoteLoading ? 'Odesílám…' : 'Odeslat hodnocení'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
    
    {/* Booth Code Modal */}
    {selectedBooth && currentUser && (
      <BoothCodeModal
        isOpen={selectedBooth !== null}
        onClose={handleCloseModal}
        onSuccess={handleBoothSuccess}
        boothName={selectedBooth?.name || ''}
        boothId={selectedBooth?.id || 0}
        userId={currentUser.id}
        visitStatus={currentUser.boothAnswers?.[selectedBooth.id]}
      />
    )}
  </>
  );
};
