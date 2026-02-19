import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trophy, User, Trash2, RotateCcw } from 'lucide-react';
import { useData } from '@/context/DataContext';

interface WinnersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WinnersModal = ({ isOpen, onClose }: WinnersModalProps) => {
  const { winners, resetLottery } = useData();

  const handleResetLottery = () => {
    resetLottery();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('cs-CZ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center bg-gradient-primary text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Trophy className="h-6 w-6" />
            Vylosovaní výherci - O2 Guru Summit
          </CardTitle>
          <p className="text-white/90">
            Seznam všech vylosovaných výherců
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Header Statistics */}
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <div className="text-2xl font-bold text-primary">{winners.length}</div>
            <div className="text-sm text-muted-foreground">Celkem výherců</div>
          </div>

          {/* Winners List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Seznam výherců</h3>
              {winners.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Resetovat losování
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Resetovat losování?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Opravdu chcete resetovat celé losování? Tímto smažete všechny vylosované výherce. Tato akce je nevratná.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Zrušit</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetLottery} className="bg-destructive text-destructive-foreground">
                        Resetovat
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            
            {winners.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  Zatím nebyli vylosováni žádní výherci.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Použijte kolo štěstí pro losování výherců.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {winners.map((winner, index) => (
                  <Card key={winner.id} className="p-4 bg-gradient-primary/5 border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-lg px-3 py-1">
                            #{index + 1}
                          </Badge>
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={winner.profileImage} />
                            <AvatarFallback>
                              {winner.firstName && winner.lastName ? 
                                `${winner.firstName[0]}${winner.lastName[0]}` : 
                                <User className="h-6 w-6" />
                              }
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-primary">
                            {winner.firstName} {winner.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {winner.personalNumber} - {winner.position}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          Vylosován
                        </div>
                        <div className="text-sm font-medium">
                          {formatDate(winner.wonAt)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Zavřít
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};