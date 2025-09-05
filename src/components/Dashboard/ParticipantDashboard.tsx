import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { BoothCodeModal } from '@/components/Modals/BoothCodeModal';
import { ProfileEditModal } from '@/components/Profile/ProfileEditModal';
import { Clock, MapPin, Trophy, Calendar, Smartphone, Lock, User } from 'lucide-react';
import { useData } from '@/context/DataContext';

interface ParticipantDashboardProps {
  user: any;
  onLogout: () => void;
  onUserUpdate?: (updatedUser: any) => void;
}

export const ParticipantDashboard = ({ user, onLogout, onUserUpdate }: ParticipantDashboardProps) => {
  const { booths, program, users, visitBooth, isLoading } = useData();
  const [timeToNext, setTimeToNext] = useState(0);
  const [selectedBooth, setSelectedBooth] = useState<{ id: number; name: string } | null>(null);
  
  // Get current user data from global state
  const currentUser = users.find(u => u.personalNumber === user.personalNumber);
  const visitedBooths = currentUser?.visitedBooths || [];
  const progress = booths.length > 0 ? (visitedBooths.length / booths.length) * 100 : 0;

  // Get next program event
  const getNextEvent = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    const currentTimeInSeconds = currentHour * 3600 + currentMinute * 60 + currentSecond;
    
    return program.find(event => {
      const [eventHour, eventMinute] = event.time.split(':').map(Number);
      const eventTimeInSeconds = eventHour * 3600 + eventMinute * 60;
      return eventTimeInSeconds > currentTimeInSeconds;
    });
  };

  // Calculate time to next program
  const calculateTimeToNext = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    const currentTimeInSeconds = currentHour * 3600 + currentMinute * 60 + currentSecond;
    
    const upcomingEvent = getNextEvent();
    
    if (upcomingEvent) {
      const [eventHour, eventMinute] = upcomingEvent.time.split(':').map(Number);
      const eventTimeInSeconds = eventHour * 3600 + eventMinute * 60;
      return eventTimeInSeconds - currentTimeInSeconds;
    }
    
    return 0;
  };

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeToNext();
      setTimeToNext(remaining);
    }, 1000);

    // Initialize with correct time immediately
    setTimeToNext(calculateTimeToNext());

    return () => clearInterval(timer);
  }, [program]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBoothVisit = (boothId: number, boothName: string) => {
    if (!visitedBooths.includes(boothId)) {
      setSelectedBooth({ id: boothId, name: boothName });
    }
  };

  const handleBoothSuccess = async (boothId: number) => {
    if (currentUser) {
      await visitBooth(currentUser.id, boothId);
      
      // Check if user completed all booths
      const newVisitedBooths = [...visitedBooths, boothId];
      if (newVisitedBooths.length === booths.length && booths.length > 0) {
        setTimeout(() => {
          alert('Gratulujeme, navštívil jsi všechny stánky na O2 Guru Summitu, nyní jsi ve slosování o super ceny!');
        }, 500);
      }
    }
    setSelectedBooth(null);
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
                <div className="flex items-center gap-2">
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
                </div>
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
            {/* Timer Card */}
            <Card className="bg-gradient-primary text-white col-span-1 sm:col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Do dalšího programu
                </CardTitle>
                <Clock className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">{formatTime(timeToNext)}</div>
                <p className="text-xs text-white/80">
                  {getNextEvent() ? `${getNextEvent()?.event} začíná v ${getNextEvent()?.time}` : 'Žádné další události'}
                </p>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Získané body
              </CardTitle>
              <MapPin className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{visitedBooths.length * 10}</div>
              <p className="text-xs text-muted-foreground">
                10 bodů za stánek
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="booths" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="booths" className="text-sm sm:text-base">Stánky</TabsTrigger>
            <TabsTrigger value="program" className="text-sm sm:text-base">Program</TabsTrigger>
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
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-sm sm:text-base leading-tight">{booth.name}</h3>
                            <div className="flex-shrink-0 ml-2">
                              {isVisited ? (
                                <Badge variant="secondary" className="text-xs">
                                  ✓ OK
                                </Badge>
                              ) : (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {booth.category}
                          </p>
                          {!isVisited && (
                            <p className="text-xs text-primary mt-1 font-medium">
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
    
    {/* Booth Code Modal */}
    <BoothCodeModal
      isOpen={selectedBooth !== null}
      onClose={handleCloseModal}
      onSuccess={handleBoothSuccess}
      boothName={selectedBooth?.name || ''}
      boothId={selectedBooth?.id || 0}
    />
  </>
  );
};