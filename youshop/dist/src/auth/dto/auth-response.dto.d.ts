import { Role } from '@prisma/client';
export declare class UserResponseDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    createdAt: Date;
}
export declare class AuthResponseDto {
    accessToken: string;
    user: UserResponseDto;
}
