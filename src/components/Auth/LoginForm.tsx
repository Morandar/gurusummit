import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onLogin: (userType: 'participant' | 'booth' | 'admin', credentials: any) => Promise<boolean>;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [personalNumber, setPersonalNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginType, setLoginType] = useState<'participant' | 'booth' | 'admin'>('participant');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Validate password confirmation for participant registration
      if (loginType === 'participant' && isRegistering) {
        if (password !== confirmPassword) {
          setError('Hesla se neshodují. Zkontrolujte prosím zadané heslo.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Heslo musí mít alespoň 6 znaků.');
          setIsLoading(false);
          return;
        }
      }
      
      let credentials: any = {};
      
      if (loginType === 'participant') {
        credentials = {
          personalNumber,
          password,
          ...(isRegistering && { firstName, lastName, position })
        };
      } else if (loginType === 'booth') {
        credentials = {
          login: email, // booth login (explicit field)
          password
        };
      } else if (loginType === 'admin') {
        credentials = {
          email,
          password
        };
      }

      const success = await onLogin(loginType, credentials);
      
      if (!success) {
        let errorMessage = '';
        if (loginType === 'admin') {
          errorMessage = 'Neplatné admin přihlašovací údaje.';
        } else if (loginType === 'booth') {
          errorMessage = 'Neplatné přihlašovací údaje stánku.';
        } else if (loginType === 'participant') {
          if (isRegistering) {
            errorMessage = 'Chyba při registraci. Zkuste to prosím znovu.';
          } else {
            errorMessage = 'Uživatel s tímto osobním číslem neexistuje. Zkuste se registrovat.';
          }
        }
        setError(errorMessage);
      }
    } catch (error) {
      setError('Nastala neočekávaná chyba. Zkuste to prosím znovu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-card border border-border/70 rounded-3xl overflow-hidden">
        <CardHeader className="text-center bg-gradient-primary rounded-t-3xl text-white">
          <CardTitle className="text-2xl font-black">O2 Guru Summit 2025</CardTitle>
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
          <Tabs value={loginType} onValueChange={(value) => setLoginType(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="participant" className="text-sm">Účastník</TabsTrigger>
              <TabsTrigger value="booth" className="text-sm">Stánek</TabsTrigger>
              <TabsTrigger value="admin" className="text-sm">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="participant">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="personalNumber">Osobní číslo *</Label>
                  <Input
                    id="personalNumber"
                    value={personalNumber}
                    onChange={(e) => setPersonalNumber(e.target.value)}
                    required
                    placeholder="Zadejte vaše osobní číslo"
                    className="transition-all duration-200 focus:ring-primary"
                  />
                </div>

                {isRegistering && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Jméno *</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        placeholder="Zadejte vaše jméno"
                        className="transition-all duration-200 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Příjmení *</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        placeholder="Zadejte vaše příjmení"
                        className="transition-all duration-200 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Pozice *</Label>
                      <Select
                        value={position}
                        onValueChange={(value) => {
                          console.log('Position selected:', value);
                          setPosition(value);
                        }}
                        required
                      >
                        <SelectTrigger id="position">
                          <SelectValue placeholder="Vyberte pozici" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="O2 Guru">O2 Guru</SelectItem>
                          <SelectItem value="SMB">SMB</SelectItem>
                          <SelectItem value="O2 Guru Social Media">O2 Guru Social Media</SelectItem>
                          <SelectItem value="TESU">TESU</SelectItem>
                          <SelectItem value="Oneplay">Oneplay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Heslo *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={isRegistering ? "Minimálně 6 znaků" : ""}
                    className="transition-all duration-200 focus:ring-primary"
                  />
                </div>

                {isRegistering && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Potvrzení hesla *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Zadejte heslo znovu"
                      className={`transition-all duration-200 focus:ring-primary ${
                        confirmPassword && password !== confirmPassword
                          ? 'border-red-500 focus:ring-red-500'
                          : ''
                      }`}
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-sm text-red-600">Hesla se neshodují</p>
                    )}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary-hover"
                  disabled={isLoading}
                >
                  {isLoading ? 'Přihlašování...' : (isRegistering ? 'Registrovat se' : 'Přihlásit se')}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                    setConfirmPassword('');
                  }}
                >
                  {isRegistering ? 'Už máte účet? Přihlaste se' : 'Nemáte účet? Registrujte se'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="booth">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="boothUsername">Přihlašovací jméno *</Label>
                  <Input
                    id="boothUsername"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="transition-all duration-200 focus:ring-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="boothPassword">Heslo *</Label>
                  <Input
                    id="boothPassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="transition-all duration-200 focus:ring-secondary"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-secondary hover:bg-secondary-hover"
                  disabled={isLoading}
                >
                  {isLoading ? 'Přihlašování...' : 'Přihlásit se jako stánek'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin uživatelské jméno</Label>
                  <Input
                    id="adminEmail"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="off"
                    placeholder="Zadejte admin uživatelské jméno"
                    className="transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Admin heslo</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="off"
                    className="transition-all duration-200"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Přihlašování...' : 'Přihlásit se jako admin'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
