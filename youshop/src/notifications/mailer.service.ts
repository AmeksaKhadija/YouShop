import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface MailOptions {
  to: string;
  subject: string;
  template: string;
  context: object;
}

export interface OrderConfirmationData {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
}

export interface PaymentConfirmationData {
  customerName: string;
  orderNumber: string;
  amount: number;
  currency: string;
  paymentDate: string;
  transactionId: string;
}

@Injectable()
export class MailerService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailerService.name);
  private readonly from: string;
  private readonly templates: Map<string, Handlebars.TemplateDelegate> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.from = this.configService.get<string>('MAIL_FROM', 'YouShop <noreply@youshop.com>');

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });

    this.loadTemplates();
  }

  private loadTemplates(): void {
    // Register Handlebars helpers
    Handlebars.registerHelper('formatPrice', (price: number) => {
      return price.toFixed(2);
    });

    Handlebars.registerHelper('formatDate', (date: string) => {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    });

    // Pre-compile templates
    this.templates.set('order-confirmation', this.compileTemplate('order-confirmation'));
    this.templates.set('payment-confirmation', this.compileTemplate('payment-confirmation'));
    this.templates.set('payment-failed', this.compileTemplate('payment-failed'));
    this.templates.set('welcome', this.compileTemplate('welcome'));
  }

  private compileTemplate(name: string): Handlebars.TemplateDelegate {
    const templatePath = path.join(__dirname, 'templates', `${name}.hbs`);

    // If template file doesn't exist, return a default template
    if (!fs.existsSync(templatePath)) {
      return Handlebars.compile(this.getDefaultTemplate(name));
    }

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    return Handlebars.compile(templateSource);
  }

  private getDefaultTemplate(name: string): string {
    const templates: Record<string, string> = {
      'order-confirmation': `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .order-table th, .order-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .order-table th { background: #f0f0f0; }
            .total-row { font-weight: bold; background: #e0e0e0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>YouShop</h1>
              <p>Confirmation de commande</p>
            </div>
            <div class="content">
              <p>Bonjour {{customerName}},</p>
              <p>Merci pour votre commande ! Voici le recapitulatif :</p>

              <p><strong>Numero de commande :</strong> {{orderNumber}}</p>
              <p><strong>Date :</strong> {{formatDate orderDate}}</p>

              <table class="order-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Quantite</th>
                    <th>Prix unitaire</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {{#each items}}
                  <tr>
                    <td>{{this.name}}</td>
                    <td>{{this.quantity}}</td>
                    <td>{{formatPrice this.unitPrice}} EUR</td>
                    <td>{{formatPrice this.totalPrice}} EUR</td>
                  </tr>
                  {{/each}}
                  <tr>
                    <td colspan="3">Sous-total</td>
                    <td>{{formatPrice subtotal}} EUR</td>
                  </tr>
                  <tr>
                    <td colspan="3">TVA (20%)</td>
                    <td>{{formatPrice taxAmount}} EUR</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="3">Total</td>
                    <td>{{formatPrice totalAmount}} EUR</td>
                  </tr>
                </tbody>
              </table>

              <p>Moyen de paiement : {{paymentMethod}}</p>

              <p>Nous vous tiendrons informe de l'expedition de votre commande.</p>
            </div>
            <div class="footer">
              <p>© 2025 YouShop. Tous droits reserves.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      'payment-confirmation': `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .success-box { background: #D1FAE5; border: 1px solid #10B981; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>YouShop</h1>
              <p>Paiement confirme</p>
            </div>
            <div class="content">
              <p>Bonjour {{customerName}},</p>

              <div class="success-box">
                <p><strong>Votre paiement a ete accepte !</strong></p>
              </div>

              <p><strong>Commande :</strong> {{orderNumber}}</p>
              <p><strong>Montant :</strong> {{formatPrice amount}} {{currency}}</p>
              <p><strong>Date :</strong> {{formatDate paymentDate}}</p>
              <p><strong>Reference :</strong> {{transactionId}}</p>

              <p>Votre commande est en cours de preparation.</p>
            </div>
            <div class="footer">
              <p>© 2025 YouShop. Tous droits reserves.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      'payment-failed': `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .error-box { background: #FEE2E2; border: 1px solid #EF4444; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>YouShop</h1>
              <p>Echec du paiement</p>
            </div>
            <div class="content">
              <p>Bonjour {{customerName}},</p>

              <div class="error-box">
                <p><strong>Votre paiement n'a pas pu etre traite.</strong></p>
                <p>Raison : {{errorMessage}}</p>
              </div>

              <p><strong>Commande :</strong> {{orderNumber}}</p>
              <p><strong>Montant :</strong> {{formatPrice amount}} {{currency}}</p>

              <p>Veuillez reessayer ou utiliser un autre moyen de paiement.</p>
            </div>
            <div class="footer">
              <p>© 2025 YouShop. Tous droits reserves.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      'welcome': `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bienvenue sur YouShop !</h1>
            </div>
            <div class="content">
              <p>Bonjour {{firstName}} {{lastName}},</p>
              <p>Merci de vous etre inscrit sur YouShop !</p>
              <p>Votre compte a ete cree avec succes. Vous pouvez maintenant :</p>
              <ul>
                <li>Parcourir notre catalogue de produits</li>
                <li>Passer des commandes</li>
                <li>Suivre vos livraisons</li>
              </ul>
              <p>A bientot sur YouShop !</p>
            </div>
            <div class="footer">
              <p>© 2025 YouShop. Tous droits reserves.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    return templates[name] || '<p>{{message}}</p>';
  }

  async sendMail(options: MailOptions): Promise<boolean> {
    try {
      const template = this.templates.get(options.template);
      if (!template) {
        this.logger.error(`Template not found: ${options.template}`);
        return false;
      }

      const html = template(options.context);

      await this.transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html,
      });

      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error}`);
      return false;
    }
  }

  async sendOrderConfirmation(to: string, data: OrderConfirmationData): Promise<boolean> {
    return this.sendMail({
      to,
      subject: `YouShop - Confirmation de commande ${data.orderNumber}`,
      template: 'order-confirmation',
      context: data,
    });
  }

  async sendPaymentConfirmation(to: string, data: PaymentConfirmationData): Promise<boolean> {
    return this.sendMail({
      to,
      subject: `YouShop - Paiement confirme pour ${data.orderNumber}`,
      template: 'payment-confirmation',
      context: data,
    });
  }

  async sendPaymentFailed(
    to: string,
    data: { customerName: string; orderNumber: string; amount: number; currency: string; errorMessage: string },
  ): Promise<boolean> {
    return this.sendMail({
      to,
      subject: `YouShop - Echec du paiement pour ${data.orderNumber}`,
      template: 'payment-failed',
      context: data,
    });
  }

  async sendWelcomeEmail(to: string, data: { firstName: string; lastName: string }): Promise<boolean> {
    return this.sendMail({
      to,
      subject: 'Bienvenue sur YouShop !',
      template: 'welcome',
      context: data,
    });
  }
}
