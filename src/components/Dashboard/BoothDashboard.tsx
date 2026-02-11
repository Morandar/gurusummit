
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, Users, Trophy, Clock, BarChart3, KeyRound, Presentation, Coffee, Wrench, Users2, Award, Bell, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { ScrollingBanner } from '@/components/ScrollingBanner';
import { QRCodeCanvas } from 'qrcode.react';

export const BoothDashboard = () => {
  const { user, logout } = useAuth();
  const { booths, program, users, banners, banner } = useData();
  const isLoading = false; // Temporary fix for TS cache issue
  // Pokud toast používáte, importujte useToast
  // import { useToast } from '@/hooks/use-toast';
  // const { toast } = useToast();

  // CRUD functions removed for now to fix TS errors






  const boothIdNum = Number(user?.boothId);
  const loginName = String(user?.personalNumber || '').trim();

  // Zobraz stánek pouze z contextu (Supabase)
  const displayBooth = useMemo(() => {
    const byId = booths.find(b => Number((b as any).id) === boothIdNum);
    if (byId) return byId as any;

    const byLogin = booths.find(b => String((b as any).login || '').trim() === loginName);
    if (byLogin) return byLogin as any;

    return null;
  }, [booths, boothIdNum, loginName]);

  const boothCode: string | undefined = (displayBooth as any)?.code;
  const boothName: string = String((displayBooth as any)?.name || '').trim() || String((displayBooth as any)?.login || '').trim() || 'Stánek';
  const boothLogo: string | undefined = (displayBooth as any)?.logo;
  const visitors: number = Number((displayBooth as any)?.visits || 0);

  const isMissingBooth = !isLoading && !displayBooth;

  const ranking = useMemo(() => {
    if (!displayBooth || booths.length === 0) return 0;
    
    // Sort booths by visits in descending order
    const sorted = [...booths].sort((a: any, b: any) => Number(b.visits || 0) - Number(a.visits || 0));
    
    // Find current booth's visits
    const currentBoothVisits = Number((displayBooth as any)?.visits || 0);
    
    // Count how many booths have more visits (proper ranking with ties)
    const boothsWithMoreVisits = sorted.filter((booth: any) => Number(booth.visits || 0) > currentBoothVisits).length;
    
    // Ranking is 1-based, so add 1
    return boothsWithMoreVisits + 1;
  }, [booths, displayBooth]);

  const [timeToNext, setTimeToNext] = useState(0);
  const [nextEventName, setNextEventName] = useState('');

  useEffect(() => {
    const calc = () => {
      if (!Array.isArray(program) || program.length === 0) return { sec: 0, name: '' };
      const now = new Date();
      const currentSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const upcoming = program
        .map((e: any) => {
          const [h, m] = String(e.time || '').split(':').map((n: string) => Number(n) || 0);
          return { name: String(e.event || ''), sec: h * 3600 + m * 60 };
        })
        .filter(e => e.sec > currentSec)
        .sort((a, b) => a.sec - b.sec)[0];
      return upcoming ? { sec: Math.max(0, upcoming.sec - currentSec), name: upcoming.name } : { sec: 0, name: '' };
    };
    const tick = () => {
      const { sec, name } = calc();
      setTimeToNext(sec);
      setNextEventName(name);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [program]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
        return { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
    }
  };


  useEffect(() => {
    const onFocus = () => {
      // TODO: Fetch last booth id from Supabase if needed
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Show loading if data is still loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse-soft">
            <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4"></div>
          </div>
          <h2 className="text-xl font-semibold text-primary mb-2">Načítání dat...</h2>
          <p className="text-muted-foreground">Připravujeme stánek dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
           <div>
             <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><BarChart3 className="h-5 w-5" /> {boothName}</h1>
             <p className="text-muted-foreground">Přihlášený stánek</p>
           </div>
           <div className="flex items-center gap-4">
             <Avatar className="h-8 w-8">
               <AvatarFallback className="text-xs">
                 {user?.firstName && user?.lastName ?
                   `${user.firstName[0]}${user.lastName[0]}` :
                   <User className="h-4 w-4" />
                 }
               </AvatarFallback>
             </Avatar>
             <Button variant="outline" onClick={logout} className="gap-2">
               <LogOut className="h-4 w-4" /> Odhlásit
             </Button>
           </div>
         </div>

       {/* Scrolling Banner */}
       {banners && banners.length > 0 && (
         <ScrollingBanner banners={banners} />
       )}

       <Tabs defaultValue="code" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="code" className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Kód stánku</TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Statistiky</TabsTrigger>
            <TabsTrigger value="program" className="flex items-center gap-2"><Clock className="h-4 w-4" /> Program</TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="space-y-6">
            <Card className="border-primary/20 bg-card">
              <CardHeader className="text-center">
                {boothLogo && (
                  <div className="flex justify-center">
                    <img 
                      src={boothLogo} 
                      alt={`${boothName} logo`}
                      className="max-w-32 max-h-32 object-contain rounded-lg"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="text-center">
                <div className="p-8 bg-primary/5 rounded-lg border border-primary/20 mb-6">
                  {isLoading ? (
                    <div className="flex flex-col items-center">
                      <div className="w-32 h-32 bg-muted animate-pulse rounded mb-4" />
                      <div className="text-4xl font-mono font-bold text-muted-foreground">LOADING…</div>
                    </div>
                  ) : isMissingBooth ? (
                    <div className="space-y-3">
                      <div className="text-2xl font-semibold text-destructive">Stánek nenalezen</div>
                      <p className="text-sm text-muted-foreground">Uživatel není přiřazen ke stánku nebo byl stánek smazán. Odhlaste se a zkuste to znovu.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-6">
                      <div className="text-6xl font-mono font-bold">
                        {boothCode ? (
                          <span className="text-primary">{boothCode}</span>
                        ) : (
                          <span className="text-muted-foreground">Kód není nastaven</span>
                        )}
                      </div>
                      {boothCode && (
                        <div className="rounded-lg border border-border bg-white p-3">
                          <QRCodeCanvas value={boothCode} size={220} />
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">Tento kód zadávají účastníci do své aplikace</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <Card>
                     <CardContent className="p-4 text-center">
                       <Users className="h-8 w-8 text-secondary mx-auto mb-2" />
                       <div className="text-2xl font-bold">{visitors}</div>
                       <p className="text-sm text-muted-foreground">Návštěvníků</p>
                     </CardContent>
                   </Card>
                   <Card>
                     <CardContent className="p-4 text-center">
                       <User className="h-8 w-8 text-primary mx-auto mb-2" />
                       <div className="text-2xl font-bold">{users.length}</div>
                       <p className="text-sm text-muted-foreground">Celkem účastníků</p>
                     </CardContent>
                   </Card>
                   <Card>
                     <CardContent className="p-4 text-center">
                       <Trophy className="h-8 w-8 text-accent mx-auto mb-2" />
                       <div className="text-2xl font-bold">#{ranking || '-'}</div>
                       <p className="text-sm text-muted-foreground">Umístění</p>
                     </CardContent>
                   </Card>
                 </div>

                 {/* Visitor Progress Summary */}
                 <Card className="mt-4">
                   <CardContent className="p-4">
                     <div className="text-center">
                       <div className="text-lg font-semibold mb-2">
                         <span className="text-primary text-2xl">{visitors}</span>
                         <span className="text-muted-foreground"> z </span>
                         <span className="text-foreground text-2xl">{users.length}</span>
                         <span className="text-muted-foreground"> účastníků navštívilo váš stánek</span>
                       </div>
                       <Progress
                         value={users.length > 0 ? Math.min((visitors / users.length) * 100, 100) : 0}
                         className="w-full mt-3"
                       />
                       <p className="text-sm text-muted-foreground mt-2">
                         {users.length > 0 ? Math.round(Math.min((visitors / users.length) * 100, 100)) : 0}% z celkových účastníků
                       </p>
                       {users.length > visitors && (
                         <p className="text-sm text-orange-600 mt-1">
                           Zbývá navštívit: {users.length - visitors} účastníků
                         </p>
                       )}
                       {users.length === visitors && visitors > 0 && (
                         <p className="text-sm text-green-600 mt-1">
                           🎉 Všichni účastníci vás už navštívili!
                         </p>
                       )}
                     </div>
                   </CardContent>
                 </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-secondary" /> Návštěvnost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{visitors}</div>
                  <p className="text-sm text-muted-foreground mb-2">z {users.length} registrovaných účastníků</p>
                  <div className="text-lg font-semibold text-primary mb-4">
                    {visitors} / {users.length} účastníků
                  </div>
                  <Progress value={users.length > 0 ? Math.min((visitors / users.length) * 100, 100) : 0} className="w-full" />
                  <p className="text-xs text-muted-foreground mt-2">{users.length > 0 ? Math.round(Math.min((visitors / users.length) * 100, 100)) : 0}% návštěvnosti</p>
                  {users.length > visitors && (
                    <p className="text-sm text-orange-600 mt-2">
                      Zbývá: {users.length - visitors} účastníků
                    </p>
                  )}
                  {users.length === visitors && visitors > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      🎉 Kompletní návštěvnost!
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-accent" /> Žebříček</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">#{ranking || '-'}</div>
                  <p className="text-sm text-muted-foreground">místo z {booths.length} stánků</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Žebříček stánků</CardTitle>
                <CardDescription>Aktuální pořadí podle návštěvnosti</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {booths.length > 0 ? (
                    [...booths]
                      .sort((a: any, b: any) => Number(b.visits || 0) - Number(a.visits || 0))
                      .map((booth: any, index: number) => (
                        <div
                          key={booth.id ?? index}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            Number(booth.id) === Number((displayBooth as any)?.id)
                              ? 'bg-secondary/20 border border-secondary/30'
                              : 'bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant={index < 3 ? 'default' : 'secondary'} className="w-8 h-8 rounded-full flex items-center justify-center">
                              {index + 1}
                            </Badge>
                            <div className="flex items-center gap-3">
                              {booth.logo && (
                                <img 
                                  src={booth.logo} 
                                  alt={`${booth.name || booth.login} logo`}
                                  className="w-10 h-10 object-contain rounded"
                                />
                              )}
                              <span className={Number(booth.id) === Number((displayBooth as any)?.id) ? 'font-semibold' : ''}>
                                {Number(booth.id) === Number((displayBooth as any)?.id) ? boothName : (booth.name || booth.login)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{Number(booth.visits || 0)}</span>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Žádné stánky nejsou zaregistrované</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="program" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Do dalšího bodu programu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold text-primary mb-2">{formatTime(timeToNext)}</div>
                  <p className="text-muted-foreground">{timeToNext > 0 ? `zbývá do: ${nextEventName}` : 'Žádné další události dnes'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Program dne</CardTitle>
                <CardDescription>Harmonogram O2 Guru Summit 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.isArray(program) && program.length > 0 ? (
                    program.map((item: any, index: number) => {
                      const now = new Date();
                      const currentTime = now.getHours() * 60 + now.getMinutes();
                      const [h, m] = String(item.time || '').split(':');
                      const itemTime = (parseInt(h || '0') * 60) + parseInt(m || '0');
                      const itemEndTime = itemTime + Number(item.duration || 0);
                      const isActive = currentTime >= itemTime && currentTime < itemEndTime;
                      const isPast = currentTime >= itemEndTime;
                      const categoryInfo = getCategoryInfo(item.category || 'lecture');
                      const CategoryIcon = categoryInfo.icon;

                      return (
                        <div
                          key={item.id ?? index}
                          className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-primary/10 border border-primary/20'
                              : isPast
                              ? 'bg-muted/30 text-muted-foreground'
                              : `${categoryInfo.bgColor} ${categoryInfo.borderColor} border`
                          }`}
                        >
                          <div className="flex-shrink-0">
                            <Badge variant={isActive ? 'default' : isPast ? 'secondary' : 'outline'}>
                              {item.time}
                            </Badge>
                          </div>
                          <div className={`p-2 rounded-full ${categoryInfo.bgColor}`}>
                            <CategoryIcon className={`h-4 w-4 ${categoryInfo.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium ${isPast ? 'line-through' : ''}`}>{item.event}</div>
                            <div className="text-sm text-muted-foreground">
                              {Number(item.duration || 0)} minut • {item.category === 'lecture' ? 'Přednáška' :
                                                                      item.category === 'break' ? 'Pauza' :
                                                                      item.category === 'workshop' ? 'Workshop' :
                                                                      item.category === 'networking' ? 'Networking' :
                                                                      item.category === 'ceremony' ? 'Ceremoniál' : 'Událost'}
                            </div>
                          </div>
                          {isActive && <Badge className="bg-secondary text-secondary-foreground">Probíhá</Badge>}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Program ještě nebyl naplánován</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
