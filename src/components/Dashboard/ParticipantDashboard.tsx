import { useState, useEffect } from 'react';
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
import { Clock, MapPin, Trophy, Calendar, Smartphone, Lock, User, DollarSign, Star, Award, Bell, Presentation, Coffee, Wrench, Users2 } from 'lucide-react';
import { useData } from '@/context/DataContext';

interface ParticipantDashboardProps {
  user: any;
  onLogout: () => void;
  onUserUpdate?: (updatedUser: any) => void;
}

export const ParticipantDashboard = ({ user, onLogout, onUserUpdate }: ParticipantDashboardProps) => {
  const { booths, program, users, visitBooth, isLoading, discountedPhones, notifications, markNotificationAsRead } = useData();
  const [timeToNext, setTimeToNext] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedBooth, setSelectedBooth] = useState<{ id: number; name: string } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Get current user data from global state
  const currentUser = users.find(u => u.personalNumber === user.personalNumber);
  const visitedBooths = currentUser?.visitedBooths || [];
  const progress = booths.length > 0 ? (visitedBooths.length / booths.length) * 100 : 0;

  // Get current program event (what's happening now)
  const getCurrentEvent = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return program.find(event => {
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

  // Calculate time remaining for current event
  const calculateTimeRemaining = () => {
    const currentEvent = getCurrentEvent();
    if (!currentEvent) return 0;

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

  // Filter notifications for participants (exclude booth_staff only notifications)
  const userNotifications = notifications.filter(notification =>
    notification.targetAudience === 'all' || notification.targetAudience === 'participants'
  );

  const unreadNotificationsCount = userNotifications.filter(n => n.isActive && !n.isRead).length;

  // Debug logs for notifications
  console.log('🔔 ParticipantDashboard: Total notifications:', notifications.length);
  console.log('👤 ParticipantDashboard: Filtered user notifications:', userNotifications.length);
  console.log('📬 ParticipantDashboard: Unread notifications count:', unreadNotificationsCount);

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
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative cursor-pointer">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={currentUser?.profileImage} />
                        <AvatarFallback className="text-xs">
                          {user.firstName && user.lastName ?
                            `${user.firstName[0]}${user.lastName[0]}` :
                            <User className="h-4 w-4" />
                          }
                        </AvatarFallback>
                      </Avatar>
                      {unreadNotificationsCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                        </span>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">Upozornění</h3>
                      <p className="text-sm text-muted-foreground">
                        {unreadNotificationsCount > 0
                          ? `${unreadNotificationsCount} nových upozornění`
                          : 'Žádná nová upozornění'
                        }
                      </p>
                    </div>
                    <ScrollArea className="h-80">
                      {userNotifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Žádná upozornění</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {userNotifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 hover:bg-muted/50 cursor-pointer ${notification.isRead ? 'opacity-75' : ''}`}
                              onClick={() => {
                                if (!notification.isRead && currentUser) {
                                  markNotificationAsRead(notification.id, currentUser.id);
                                }
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notification.isRead ? 'bg-gray-400' : 'bg-blue-500'}`}></div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm">{notification.title}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {new Date(notification.createdAt).toLocaleString('cs-CZ')}
                                    {notification.isRead && <span className="ml-2 text-xs">(přečteno)</span>}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
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

          {/* Lottery Status Card */}
          <Card className={progress === 100 ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {progress === 100 ? 'Slosování o ceny' : 'Status slosování'}
              </CardTitle>
              {progress === 100 ? (
                <Award className="h-4 w-4 text-yellow-600" />
              ) : (
                <Trophy className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              {progress === 100 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="text-lg font-bold text-yellow-700">Jsem ve slosování!</span>
                  </div>
                  <p className="text-xs text-yellow-600 font-medium">
                    Gratulujeme! Dokončil jsi všechny stánky.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xl sm:text-2xl font-bold text-muted-foreground">
                    Nejsem ve slosování
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dokonči všechny stánky pro účast v losování
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="booths" className="space-y-4">
           <TabsList className="grid w-full grid-cols-3 h-12">
             <TabsTrigger value="booths" className="text-sm sm:text-base">Stánky</TabsTrigger>
             <TabsTrigger value="program" className="text-sm sm:text-base">Program</TabsTrigger>
             <TabsTrigger value="phones" className="text-sm sm:text-base">Zlevněné telefony</TabsTrigger>
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
                                  {isVisited ? (
                                    <Badge variant="secondary" className="text-xs">
                                      ✓ OK
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

                    // Debug log for program categories
                    console.log('📅 ParticipantDashboard: Program item:', item.event, 'Category:', item.category, 'CategoryInfo:', categoryInfo);

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