import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, RotateCcw, Trash2, Play, User, Maximize2, Minimize2 } from 'lucide-react';
import { useData } from '@/context/DataContext';

interface LotteryWheelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LotteryWheel = ({ isOpen, onClose }: LotteryWheelProps) => {
    const { users, booths, winners, addWinner, lotterySettings } = useData();
   const [isSpinning, setIsSpinning] = useState(false);
   const [winner, setWinner] = useState<{ id: number; firstName: string; lastName: string; personalNumber: string; profileImage?: string } | null>(null);
   const [excludedUsers, setExcludedUsers] = useState<number[]>([]);
   const [isFullscreen, setIsFullscreen] = useState(false);

  // Get users who completed minimum percentage and are not already winners
  const winnerUserIds = winners.map(w => w.userId);
  const eligibleUsers = users.filter(user => {
    const requiredBooths = Math.ceil((lotterySettings.minimumPercentage / 100) * booths.length);
    return user.visitedBooths.length >= requiredBooths && !winnerUserIds.includes(user.id);
  });

  const spinWheel = () => {
    if (eligibleUsers.length === 0) return;

    setIsSpinning(true);
    setWinner(null);

    // Simulate spinning animation
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * eligibleUsers.length);
      const selectedWinner = eligibleUsers[randomIndex];
      setWinner({
        id: selectedWinner.id,
        firstName: selectedWinner.firstName,
        lastName: selectedWinner.lastName,
        personalNumber: selectedWinner.personalNumber,
        profileImage: selectedWinner.profileImage
      });
      setIsSpinning(false);
    }, 3000);
  };

  const cancelWinner = () => {
    // Simply reset the winner without adding to excluded list
    setWinner(null);
  };

  const continueWithWinner = async () => {
    if (winner) {
      const winnerUser = users.find(u => u.id === winner.id);
      if (winnerUser) {
        await addWinner(winnerUser);
        // Winner is now automatically excluded from future draws via the database
      }
    }
    setWinner(null);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${isFullscreen ? 'bg-black' : 'bg-black/50'}`}>
      <Card className={`w-full ${isFullscreen ? 'max-w-none h-full max-h-none' : 'max-w-2xl max-h-[90vh]'} overflow-y-auto`}>
        <CardHeader className="text-center bg-gradient-primary text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1"></div>
            <div className="flex-1 text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Trophy className="h-6 w-6" />
                Kolo štěstí - O2 Guru Summit 2025
              </CardTitle>
              <p className="text-white/90">
                Slosování o super ceny pro účastníky s minimálně {lotterySettings.minimumPercentage}% pokrokem
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={`${isFullscreen ? 'p-8' : 'p-6'} space-y-6`}>
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">{eligibleUsers.length}</div>
              <div className="text-sm text-muted-foreground">Oprávnění účastníci</div>
            </div>
            <div className="text-center p-4 bg-secondary/10 rounded-lg">
              <div className="text-2xl font-bold text-secondary">{winners.length}</div>
              <div className="text-sm text-muted-foreground">Celkem výherců</div>
            </div>
          </div>

          {/* Wheel Animation */}
          <div className="text-center space-y-4">
            <div className="relative w-80 h-80 mx-auto">
              {/* Outer Wheel */}
              <div 
                className={`w-full h-full rounded-full border-8 border-primary relative transition-transform duration-75 ${
                  isSpinning ? 'animate-spin' : ''
                }`} 
                style={{
                  background: eligibleUsers.length > 0 
                    ? `conic-gradient(from 0deg, ${eligibleUsers.map((_, i) => 
                        `hsl(${(i * 360) / eligibleUsers.length}deg 70% 50%) ${(i * 100) / eligibleUsers.length}%, hsl(${((i + 1) * 360) / eligibleUsers.length}deg 70% 50%) ${((i + 1) * 100) / eligibleUsers.length}%`
                      ).join(', ')})` 
                    : 'hsl(var(--muted))',
                  animationDuration: isSpinning ? '0.1s' : '1s'
                }}
              >
                {/* User avatars on the wheel */}
                {eligibleUsers.map((user, index) => {
                  const angle = (index * 360) / eligibleUsers.length;
                  const radius = 110; // Distance from center
                  const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
                  const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
                  
                  return (
                    <div
                      key={user.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                      }}
                    >
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarImage src={user.profileImage} />
                        <AvatarFallback className="text-xs">
                          {user.firstName && user.lastName ? 
                            `${user.firstName[0]}${user.lastName[0]}` : 
                            <User className="h-4 w-4" />
                          }
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  );
                })}
                
                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-white border-4 border-primary rounded-full transform -translate-x-1/2 -translate-y-1/2 z-20"></div>
              </div>
              
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 w-0 h-0 border-l-6 border-r-6 border-b-12 border-l-transparent border-r-transparent border-b-primary transform -translate-x-1/2 -translate-y-3 z-30"></div>
            </div>

            {!isSpinning && !winner && (
              <Button 
                onClick={spinWheel} 
                disabled={eligibleUsers.length === 0}
                className="bg-gradient-primary text-white hover:opacity-90 text-lg px-8 py-3"
              >
                <Play className="h-5 w-5 mr-2" />
                Roztočit kolo!
              </Button>
            )}

            {isSpinning && (
              <div className="space-y-2">
                <div className="text-xl font-bold text-primary animate-pulse">
                  Kolo se točí...
                </div>
                <div className="text-sm text-muted-foreground">
                  Čekáme na výsledek losování
                </div>
              </div>
            )}
          </div>

          {/* Winner Display */}
          {winner && (
            <div className="text-center space-y-4 p-6 bg-gradient-primary/10 rounded-lg border-2 border-primary">
              <div className="text-3xl">🎉</div>
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={winner.profileImage} />
                    <AvatarFallback className="text-xl">
                      {winner.firstName && winner.lastName ? 
                        `${winner.firstName[0]}${winner.lastName[0]}` : 
                        <User className="h-8 w-8" />
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {winner.firstName} {winner.lastName}
                    </div>
                    <Badge variant="outline" className="text-lg px-4 py-2 mt-2">
                      {winner.personalNumber}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={cancelWinner}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Zrušit
                </Button>
                <Button 
                  onClick={continueWithWinner}
                  className="flex items-center gap-2 bg-gradient-primary text-white"
                >
                  <Trophy className="h-4 w-4" />
                  Potvrdit výherce
                </Button>
              </div>
            </div>
          )}

          {/* Eligible Users List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Oprávnění účastníci ({eligibleUsers.length})</h3>
            {eligibleUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Žádní účastníci nemají dokončené všechny stánky.
              </p>
            ) : (
              <div className="grid gap-2 max-h-40 overflow-y-auto">
                {eligibleUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profileImage} />
                        <AvatarFallback className="text-sm">
                          {user.firstName && user.lastName ? 
                            `${user.firstName[0]}${user.lastName[0]}` : 
                            <User className="h-5 w-5" />
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-muted-foreground">{user.personalNumber} - {user.position}</div>
                      </div>
                    </div>
                    <Badge variant="secondary">100%</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Zavřít
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};