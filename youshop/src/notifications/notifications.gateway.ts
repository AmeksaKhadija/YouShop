import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedClients = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(): void {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token`);
        client.disconnect();
        return;
      }

      const payload = await this.verifyToken(token);
      if (!payload) {
        this.logger.warn(`Client ${client.id} connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      client.userId = payload.sub;
      client.userRole = payload.role;

      // Add to connected clients map
      if (!this.connectedClients.has(payload.sub)) {
        this.connectedClients.set(payload.sub, new Set());
      }
      this.connectedClients.get(payload.sub)!.add(client.id);

      // Join user-specific room
      client.join(`user:${payload.sub}`);

      // Join admin room if admin
      if (payload.role === 'ADMIN') {
        client.join('admins');
      }

      this.logger.log(`Client connected: ${client.id} (User: ${payload.sub})`);

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to YouShop notifications',
        userId: payload.sub,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    if (client.userId) {
      const userSockets = this.connectedClients.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedClients.delete(client.userId);
        }
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channel: string },
  ): void {
    if (data.channel && client.userId) {
      client.join(data.channel);
      this.logger.log(`Client ${client.id} subscribed to ${data.channel}`);
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channel: string },
  ): void {
    if (data.channel) {
      client.leave(data.channel);
      this.logger.log(`Client ${client.id} unsubscribed from ${data.channel}`);
    }
  }

  // =====================
  // NOTIFICATION METHODS
  // =====================

  sendToUser(userId: string, event: string, data: unknown): void {
    this.server.to(`user:${userId}`).emit(event, data);
    this.logger.debug(`Sent ${event} to user ${userId}`);
  }

  sendToAdmins(event: string, data: unknown): void {
    this.server.to('admins').emit(event, data);
    this.logger.debug(`Sent ${event} to admins`);
  }

  broadcast(event: string, data: unknown): void {
    this.server.emit(event, data);
    this.logger.debug(`Broadcast ${event}`);
  }

  isUserOnline(userId: string): boolean {
    return this.connectedClients.has(userId);
  }

  getOnlineUsersCount(): number {
    return this.connectedClients.size;
  }

  // =====================
  // SPECIFIC NOTIFICATIONS
  // =====================

  notifyPaymentSuccess(userId: string, data: { orderId: string; orderNumber: string; amount: number }): void {
    this.sendToUser(userId, 'payment:success', {
      type: 'PAYMENT_SUCCESS',
      title: 'Paiement reussi',
      message: `Votre paiement de ${data.amount.toFixed(2)} EUR pour la commande ${data.orderNumber} a ete accepte.`,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  notifyPaymentFailed(userId: string, data: { orderId: string; orderNumber: string; error: string }): void {
    this.sendToUser(userId, 'payment:failed', {
      type: 'PAYMENT_FAILED',
      title: 'Echec du paiement',
      message: `Le paiement pour la commande ${data.orderNumber} a echoue: ${data.error}`,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  notifyOrderStatusUpdate(
    userId: string,
    data: { orderId: string; orderNumber: string; status: string },
  ): void {
    this.sendToUser(userId, 'order:status', {
      type: 'ORDER_STATUS',
      title: 'Mise a jour de commande',
      message: `La commande ${data.orderNumber} est maintenant: ${data.status}`,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  notifyLowStock(data: { productId: string; productName: string; sku: string; quantity: number }): void {
    this.sendToAdmins('stock:low', {
      type: 'STOCK_LOW',
      title: 'Alerte stock bas',
      message: `Le produit "${data.productName}" (SKU: ${data.sku}) n'a plus que ${data.quantity} unites en stock.`,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  notifyOutOfStock(data: { productId: string; productName: string; sku: string }): void {
    this.sendToAdmins('stock:out', {
      type: 'STOCK_OUT',
      title: 'Rupture de stock',
      message: `Le produit "${data.productName}" (SKU: ${data.sku}) est en rupture de stock!`,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // =====================
  // HELPER METHODS
  // =====================

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const token = client.handshake.auth?.token;
    if (token) {
      return token;
    }

    return client.handshake.query?.token as string || null;
  }

  private async verifyToken(token: string): Promise<{ sub: string; role: string } | null> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      return payload;
    } catch {
      return null;
    }
  }
}
