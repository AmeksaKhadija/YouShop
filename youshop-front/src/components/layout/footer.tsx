import Link from 'next/link';
import { Package } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Package className="h-6 w-6 text-primary" />
              <span>YouShop</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Votre destination shopping en ligne. Qualité, prix et service client exceptionnels.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/products" className="hover:text-primary transition-colors">
                  Catalogue
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-primary transition-colors">
                  Panier
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold mb-4">Mon compte</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Connexion
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-primary transition-colors">
                  Inscription
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-primary transition-colors">
                  Mes commandes
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>support@youshop.com</li>
              <li>+33 1 23 45 67 89</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} YouShop. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
