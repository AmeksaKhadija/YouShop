'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Package, Truck, Shield, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/products/product-grid';
import { productsApi } from '@/lib/api';

const features = [
  {
    icon: Package,
    title: 'Produits de qualité',
    description: 'Sélection rigoureuse de nos articles',
  },
  {
    icon: Truck,
    title: 'Livraison rapide',
    description: 'Expédition sous 24-48h',
  },
  {
    icon: Shield,
    title: 'Paiement sécurisé',
    description: 'Transactions 100% sécurisées',
  },
  {
    icon: Headphones,
    title: 'Support client',
    description: 'À votre écoute 7j/7',
  },
];

export default function HomePage() {
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { limit: 8 }],
    queryFn: () => productsApi.getProducts({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-muted/50 to-background">
        <div className="container py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Bienvenue sur <span className="text-primary">YouShop</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Découvrez notre sélection de produits de qualité. Livraison rapide,
            paiement sécurisé et service client exceptionnel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/products">
                Voir le catalogue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Créer un compte</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Nouveautés</h2>
            <p className="text-muted-foreground mt-1">
              Découvrez nos derniers produits
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/products">
              Voir tout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <ProductGrid products={productsData?.data || []} isLoading={isLoading} />
      </section>

      {/* CTA Section */}
      <section className="container">
        <div className="bg-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à commencer vos achats ?
          </h2>
          <p className="text-lg opacity-90 mb-6 max-w-xl mx-auto">
            Inscrivez-vous gratuitement et profitez de nos offres exclusives.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">
              S&apos;inscrire maintenant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
