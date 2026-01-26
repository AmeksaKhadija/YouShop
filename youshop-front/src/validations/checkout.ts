import { z } from 'zod';

export const addressSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  city: z.string().min(2, 'La ville doit contenir au moins 2 caractères'),
  postalCode: z.string().regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres'),
  country: z.string().min(2, 'Le pays est requis'),
  phone: z.string().regex(/^(\+33|0)[1-9](\d{2}){4}$/, 'Numéro de téléphone invalide'),
});

export type AddressFormData = z.infer<typeof addressSchema>;
