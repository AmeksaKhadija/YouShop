import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200, 'Le nom ne peut pas dépasser 200 caractères'),
  description: z.string().max(2000, 'La description ne peut pas dépasser 2000 caractères').optional(),
  price: z
    .number({ message: 'Le prix doit être un nombre' })
    .positive('Le prix doit être positif')
    .multipleOf(0.01, 'Le prix ne peut avoir que 2 décimales'),
  imageUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  categoryId: z.string().uuid('Catégorie invalide'),
  sku: z.string().max(100, 'Le SKU ne peut pas dépasser 100 caractères').optional(),
  initialStock: z.number().int().nonnegative('Le stock doit être positif ou nul').optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;
export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;
