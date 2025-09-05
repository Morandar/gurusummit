import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/DataContext';

interface BoothCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (boothId: number) => void;
  boothName: string;
  boothId: number;
}

export const BoothCodeModal = ({ isOpen, onClose, onSuccess, boothName, boothId }: BoothCodeModalProps) => {
  const [code, setCode] = useState('');
  const { toast } = useToast();
  const { booths, isCodeEntryAllowed } = useData();
  const inputRef = useRef<HTMLInputElement>(null);

  const validateCode = (inputCode: string) => {
    const booth = booths.find(b => b.id === boothId);
    if (!booth) return false;
    return inputCode.toUpperCase() === booth.code.toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast({
        title: 'Chyba',
        description: 'Zadejte prosím kód stánku',
        variant: 'destructive'
      });
      return;
    }

    if (!isCodeEntryAllowed()) {
      toast({
        title: 'Zadávání kódů není povoleno',
        description: 'Zadávání kódů stánků je momentálně zakázáno.',
        variant: 'destructive'
      });
      return;
    }

    if (validateCode(code)) {
      toast({
        title: 'Úspěch! 🎉',
        description: `Stánek "${boothName}" byl úspěšně navštíven! Získali jste 10 bodů.`,
      });
      onSuccess(boothId);
      handleClose();
    } else {
      toast({
        title: 'Neplatný kód',
        description: 'Zadaný kód není správný. Zkuste to znovu.',
        variant: 'destructive'
      });
      setCode('');
      inputRef.current?.focus();
    }
  };

  const handleClose = () => {
    setCode('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-secondary" />
            Návštěva stánku
          </DialogTitle>
          <DialogDescription>
            Zadejte heslo pro stánek "{boothName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Heslo stánku</Label>
              <Input
                ref={inputRef}
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Zadejte heslo stánku..."
                maxLength={15}
                className="text-center text-lg font-mono tracking-wider"
                autoFocus
              />
              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>Heslo získáte od pracovníka stánku</p>
                <p className="text-green-600 font-semibold">✓ Funguje na všech zařízeních</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Zrušit
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-secondary hover:bg-secondary-hover"
                disabled={!code.trim()}
              >
                Potvrdit
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};