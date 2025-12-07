/**
 * User Form Component
 * File 346 - Form for creating and editing users
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import { useRoles, useCreateUser, useUpdateUser } from '@/hooks/useUsers';
import { User as UserType, CreateUserInput, UpdateUserInput } from '@/types/user';

// Validation schema
const createUserSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
  roleId: z.number().min(1, 'Sélectionnez un rôle'),
  isActive: z.boolean(),
  sendWelcomeEmail: z.boolean(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

const updateUserSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  roleId: z.number().min(1, 'Sélectionnez un rôle'),
  isActive: z.boolean(),
}).refine(data => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

interface UserFormProps {
  user?: UserType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Union type for form values
type FormValues = z.infer<typeof createUserSchema> | z.infer<typeof updateUserSchema>;

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const { t } = useTranslation();
  const isEditing = !!user;

  const { data: roles } = useRoles();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const [showPassword, setShowPassword] = React.useState(false);

  // Use separate form configurations for create vs edit
  const schema = isEditing ? updateUserSchema : createUserSchema;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      confirmPassword: '',
      roleId: user?.roleId || 0,
      isActive: user?.isActive ?? true,
      sendWelcomeEmail: true,
    },
  });

  // Handle submit
  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && user) {
        const updateData: UpdateUserInput & { id: number } = {
          id: user.id,
          name: values.name,
          email: values.email,
          roleId: values.roleId,
          isActive: values.isActive,
        };
        if (values.password) {
          updateData.password = values.password;
        }
        await updateUser.mutateAsync(updateData);
      } else {
        const createData: CreateUserInput = {
          name: values.name,
          email: values.email,
          password: values.password || '',
          roleId: values.roleId,
          isActive: values.isActive,
          sendWelcomeEmail: 'sendWelcomeEmail' in values ? values.sendWelcomeEmail : true,
        };
        await createUser.mutateAsync(createData);
      }
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createUser.isPending || updateUser.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
        {/* Name */}
        <FormField
          control={form.control as any}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input {...field} placeholder="Jean Dupont" className="pl-9" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control as any}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input {...field} type="email" placeholder="jean@example.com" className="pl-9" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control as any}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isEditing ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm Password */}
        <FormField
          control={form.control as any}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmer le mot de passe</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Role */}
        <FormField
          control={form.control as any}
          name="roleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rôle</FormLabel>
              <Select
                value={String(field.value)}
                onValueChange={(v) => field.onChange(parseInt(v))}
              >
                <FormControl>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </div>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles?.map(role => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Is Active */}
        <FormField
          control={form.control as any}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <FormLabel>Compte actif</FormLabel>
                <FormDescription>
                  L'utilisateur pourra se connecter
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Send Welcome Email */}
        {!isEditing && (
          <FormField
            control={form.control as any}
            name="sendWelcomeEmail"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3 rounded-lg border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div>
                  <FormLabel>Envoyer un email de bienvenue</FormLabel>
                  <FormDescription>
                    Un email avec les informations de connexion sera envoyé
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Enregistrer' : 'Créer l\'utilisateur'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default UserForm;
