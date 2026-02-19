import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onLogin: (credentials: { identifier: string; password: string }) => Promise<boolean>;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await onLogin({
        identifier: identifier.trim(),
        password
      });

      if (!success) {
        setError('Neplatné přihlašovací údaje.');
      }
    } catch {
      setError('Nastala neočekávaná chyba. Zkuste to prosím znovu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-card border border-border/70 rounded-3xl overflow-hidden">
        <CardHeader className="text-center bg-gradient-primary rounded-t-3xl text-white">
          <CardTitle className="text-2xl font-black">O2 Guru Summit</CardTitle>
          <CardDescription className="text-white/90">
            Přihlaste se do aplikace summitu
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Přihlašovací jméno / osobní číslo</Label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
                placeholder="Např. osobní číslo, login stánku nebo admin email"
                className="transition-all duration-200 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="transition-all duration-200 focus:ring-primary"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Typ účtu se rozpozná automaticky.
            </p>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover"
              disabled={isLoading}
            >
              {isLoading ? 'Přihlašování...' : 'Přihlásit se'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
