export const USER_ROLES = ['USER', 'ADMIN', 'ROOT'] as const;
export const USER_STATUSES = ['ACTIVE', 'DISABLED'] as const;
export const ACCOUNT_TYPES = ['INDIVIDUAL', 'BUSINESS'] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface User {
	id: string;
	email: string;
	username: string;
	role: UserRole;
	// BUSINESS accounts are created by a ROOT admin (no self-signup) and get
	// access to the business space once affiliated to a merchant.
	accountType: AccountType;
	status: UserStatus;
	// Server-derived score (upvotes received, resolved reports…). Can be negative.
	reputation: number;
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
