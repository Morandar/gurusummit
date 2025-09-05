import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AlertCircle, User, Edit, Upload, X } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface ProfileEditModalProps {
  user: any;
  onUserUpdate: (updatedUser: any) => void;
}

export const ProfileEditModal = ({ user, onUserUpdate }: ProfileEditModalProps) => {
  const { users, setUsers } = useData();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [position, setPosition] = useState(user.position || '');
  const [profileImage, setProfileImage] = useState(user.profileImage || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!firstName.trim() || !lastName.trim() || !position) {
        setError('Všechna pole jsou povinná.');
        return;
      }

      // Find the current user in the database
      const currentUser = users.find(u => u.personalNumber === user.personalNumber);
      if (!currentUser) {
        setError('Uživatel nebyl nalezen.');
        return;
      }

      // Update user in Supabase database (including profile image)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          firstname: firstName.trim(),
          lastname: lastName.trim(),
          position: position,
          profileimage: profileImage || null
        })
        .eq('id', currentUser.id);

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        setError('Chyba při ukládání do databáze. Zkuste to prosím znovu.');
        return;
      }

      // Update user in the global state
      const updatedUsers = users.map(u => 
        u.personalNumber === user.personalNumber 
          ? { ...u, firstName: firstName.trim(), lastName: lastName.trim(), position, profileImage }
          : u
      );
      
      setUsers(updatedUsers);

      // Update the logged-in user
      const updatedUser = {
        ...user,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        position,
        profileImage
      };
      
      onUserUpdate(updatedUser);

      toast({
        title: "Profil aktualizován",
        description: "Vaše údaje byly úspěšně uloženy.",
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Nastala chyba při ukládání profilu. Zkuste to prosím znovu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setPosition(user.position || '');
    setProfileImage(user.profileImage || '');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="h-4 w-4" />
          Upravit profil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Upravit profil
          </DialogTitle>
          <DialogDescription>
            Upravte své osobní údaje. Osobní číslo nelze změnit.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="personalNumber">Osobní číslo</Label>
            <Input
              id="personalNumber"
              value={user.personalNumber}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label>Profilový obrázek</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profileImage} />
                <AvatarFallback className="text-lg">
                  {firstName && lastName ? `${firstName[0]}${lastName[0]}` : <User className="h-6 w-6" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Nahrát
                </Button>
                {profileImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeImage}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Odstranit
                  </Button>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">Jméno *</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="Zadejte vaše jméno"
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Pozice *</Label>
            <Select value={position} onValueChange={setPosition} required>
              <SelectTrigger>
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

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Zrušit
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Ukládání...' : 'Uložit změny'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};