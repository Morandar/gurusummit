import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BoothQuestion, useData } from '@/context/DataContext';

interface BoothCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (boothId: number, visitResult: 'created' | 'pending' | 'answered' | 'error') => void;
  boothName: string;
  boothId: number;
  userId: number;
  visitStatus?: 'pending' | 'correct' | 'wrong';
}

export const BoothCodeModal = ({ isOpen, onClose, onSuccess, boothName, boothId, userId, visitStatus }: BoothCodeModalProps) => {
  const [code, setCode] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<'a' | 'b' | 'c' | ''>('');
  const [currentQuestion, setCurrentQuestion] = useState<BoothQuestion | null>(null);
  const [step, setStep] = useState<'code' | 'question'>('code');
  const { toast } = useToast();
  const { booths, isCodeEntryAllowed, visitBooth, submitBoothAnswer } = useData();
  const inputRef = useRef<HTMLInputElement>(null);

  const pickQuestion = (questions: BoothQuestion[]) => {
    if (questions.length === 0) return null;
    let randomIndex = 0;
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      randomIndex = buf[0] % questions.length;
    } else {
      randomIndex = Math.floor(Math.random() * questions.length);
    }
    return questions[randomIndex];
  };

  useEffect(() => {
    if (!isOpen) return;
    if (visitStatus === 'correct' || visitStatus === 'wrong') {
      toast({
        title: 'Již zodpovězeno',
        description: 'Tento stánek už máte zodpovězený.',
        variant: 'destructive'
      });
      handleClose();
      return;
    }
    const booth = booths.find(b => b.id === boothId);
    const questions = booth?.questions || [];
    const fallbackUser = (window as any).__authUser as { personalNumber?: string; id?: string } | undefined;
    const userKey = fallbackUser?.personalNumber || fallbackUser?.id || 'anonymous';
    const storageKey = `booth-question-${userKey}-${boothId}`;
    let chosen: BoothQuestion | null = null;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as { question: BoothQuestion };
        const match = questions.find(q =>
          q.question === parsed.question?.question &&
          q.options?.a === parsed.question?.options?.a &&
          q.options?.b === parsed.question?.options?.b &&
          q.options?.c === parsed.question?.options?.c &&
          q.correct === parsed.question?.correct
        );
        if (match) {
          chosen = match;
        }
      }
    } catch {
      // ignore storage errors
    }

    if (!chosen) {
      chosen = pickQuestion(questions);
      if (chosen) {
        try {
          localStorage.setItem(storageKey, JSON.stringify({ question: chosen }));
        } catch {
          // ignore storage errors
        }
      }
    }

    setCurrentQuestion(chosen);
    setSelectedAnswer('');
    setStep(visitStatus === 'pending' ? 'question' : 'code');
  }, [booths, boothId, isOpen, visitStatus, toast]);

  const validateCode = (inputCode: string) => {
    const booth = booths.find(b => b.id === boothId);
    if (!booth) return false;
    return inputCode.toUpperCase() === booth.code.toUpperCase();
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
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
      const result = await visitBooth(userId, boothId);
      if (result === 'answered') {
        toast({
          title: 'Již zodpovězeno',
          description: 'Tento stánek už máte zodpovězený.',
          variant: 'destructive'
        });
        onSuccess(boothId, result);
        handleClose();
        return;
      }
      if (result === 'error') {
        return;
      }
      if (!currentQuestion) {
        toast({
          title: 'Chybí otázka',
          description: 'Tento stánek nemá nastavené otázky. Kontaktujte obsluhu stánku.',
          variant: 'destructive'
        });
        return;
      }
      if (result === 'created') {
        toast({
          title: 'Kód ověřen',
          description: 'Získali jste 1 bod. Pokračujte na otázku.',
        });
      } else {
        toast({
          title: 'Kód ověřen',
          description: 'Pokračujte na otázku.',
        });
      }
      onSuccess(boothId, result);
      setStep('question');
      return;
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

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion) {
      toast({
        title: 'Chybí otázka',
        description: 'Tento stánek nemá nastavené otázky. Kontaktujte obsluhu stánku.',
        variant: 'destructive'
      });
      return;
    }
    if (!selectedAnswer) {
      toast({
        title: 'Vyberte odpověď',
        description: 'Před potvrzením vyberte odpověď na otázku.',
        variant: 'destructive'
      });
      return;
    }
    const isCorrect = selectedAnswer === currentQuestion.correct;
    const ok = await submitBoothAnswer(userId, boothId, isCorrect);
    if (!ok) return;

    if (isCorrect) {
      toast({
        title: 'Správně! 🎉',
        description: 'Získali jste 2 body za správnou odpověď.',
      });
    } else {
      toast({
        title: 'Špatná odpověď',
        description: 'Odpověď nebyla správná. Pokus je vyčerpán.',
        variant: 'destructive'
      });
    }
    handleClose();
  };

  const handleClose = () => {
    setCode('');
    setSelectedAnswer('');
    setCurrentQuestion(null);
    setStep('code');
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
          {step === 'code' ? (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
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
                  Pokračovat
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAnswerSubmit} className="space-y-4">
              <div className="space-y-3">
                <Label>Otázka</Label>
                {currentQuestion ? (
                  <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-sm font-medium text-foreground">{currentQuestion.question}</p>
                    <div className="space-y-2">
                      {(['a', 'b', 'c'] as const).map(optionKey => (
                        <label
                          key={optionKey}
                          className="flex items-start gap-2 rounded-md border border-transparent px-2 py-1.5 text-sm transition hover:border-muted-foreground/40"
                        >
                          <input
                            type="radio"
                            name="booth-question"
                            value={optionKey}
                            checked={selectedAnswer === optionKey}
                            onChange={() => setSelectedAnswer(optionKey)}
                            className="mt-0.5"
                          />
                          <span className="font-semibold uppercase">{optionKey}.</span>
                          <span>{currentQuestion.options[optionKey]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Tento stánek zatím nemá nastavené otázky.
                  </p>
                )}
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
                  disabled={!currentQuestion || !selectedAnswer}
                >
                  Potvrdit odpověď
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
