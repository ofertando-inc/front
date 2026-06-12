export const USER_ROLES = ['USER', 'ADMIN'] as const;
export const USER_STATUSES = ['ACTIVE', 'DISABLED'] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];

export interface User {
	id: string;
	email: string;
	username: string;
	role: UserRole;
	status: UserStatus;
	createdAt: string;
	updatedAt: string;
}

export interface UserStats {
	offerCount: number;
	commentCount: number;
}

// All fields optional. Changing email or password requires `currentPassword`;
// changing the username alone does not.
export interface UpdateMeDto {
	username?: string;
	email?: string;
	password?: string;
	currentPassword?: string;
}
