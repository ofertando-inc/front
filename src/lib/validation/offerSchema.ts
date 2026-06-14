import { z } from 'zod';
import { isKnownCity } from '$lib/offers/cities';

export const OFFER_TITLE_MAX_LENGTH = 200;
export const OFFER_DESCRIPTION_MAX_LENGTH = 5000;
export const OFFER_TYPE_MAX_LENGTH = 50;
export const OFFER_MERCHANT_NAME_MAX_LENGTH = 100;
export const OFFER_ADDRESS_MAX_LENGTH = 200;
export const OFFER_CITY_MAX_LENGTH = 100;
export const OFFER_REGION_MAX_LENGTH = 100;

const isoLocalDateTime = z.iso.datetime({ local: true });
const isoUtcDateTime = z.iso.datetime();
const isoDate = z.iso.date();

function requiredText(maxLength: number) {
	return z
		.string({ error: 'isString' })
		.trim()
		.min(1, { message: 'isNotEmpty' })
		.max(maxLength, { message: 'maxLength' });
}

function optionalText(maxLength: number) {
	return z.preprocess(
		(value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
		z.string({ error: 'isString' }).trim().max(maxLength, { message: 'maxLength' }).optional()
	);
}

function optionalId() {
	return z.preprocess(
		(value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
		z.string({ error: 'isString' }).optional()
	);
}

function optionalNumber() {
	return z.preprocess((value) => {
		if (value === '' || value === undefined || value === null) return undefined;
		if (typeof value === 'string') {
			const parsed = Number(value);
			return Number.isNaN(parsed) ? value : parsed;
		}
		return value;
	}, z.number().optional());
}

function optionalUrl() {
	return z.preprocess(
		(value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
		z.string({ error: 'isString' }).trim().url({ message: 'isUrl' }).optional()
	);
}

function dateString() {
	return z
		.string({ error: 'isDateString' })
		.trim()
		.refine((value) => isValidDateString(value), { message: 'isDateString' });
}

function isValidDateString(value: string): boolean {
	return (
		isoLocalDateTime.safeParse(value).success ||
		isoUtcDateTime.safeParse(value).success ||
		isoDate.safeParse(value).success
	);
}

function parseValidDate(value: string | undefined): Date | null {
	if (!value || !isValidDateString(value)) return null;

	const timestamp = Date.parse(value);
	return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

// Flat form fields. The server action reshapes merchant*/location* into the
// nested `CreateOfferDto` (merchantId | merchantName, locationId | location{}).
const offerShape = {
	title: requiredText(OFFER_TITLE_MAX_LENGTH),
	description: requiredText(OFFER_DESCRIPTION_MAX_LENGTH),
	offerType: requiredText(OFFER_TYPE_MAX_LENGTH),
	// Channel flag: online offers drop the location and require an external URL.
	// Plain boolean here; the create schema defaults it to false (an omitted flag
	// is treated as physical), the partial update schema leaves it untouched.
	isOnline: z.boolean(),
	externalUrl: optionalUrl(),
	// Merchant: an existing id (picked from the referential) or a free-text name
	// to find-or-create. The name stays required for both channels.
	merchantId: optionalId(),
	merchantName: requiredText(OFFER_MERCHANT_NAME_MAX_LENGTH),
	// Location (physical only): an existing id, or a geocoded address payload.
	locationId: optionalId(),
	locationAddress: optionalText(OFFER_ADDRESS_MAX_LENGTH),
	locationCity: optionalText(OFFER_CITY_MAX_LENGTH),
	locationRegion: optionalText(OFFER_REGION_MAX_LENGTH),
	locationLatitude: optionalNumber(),
	locationLongitude: optionalNumber(),
	startDate: dateString(),
	endDate: dateString(),
	categoryIds: z.array(z.string()).min(1, { message: 'isNotEmpty' })
};

function validateOffer(
	data: Partial<{
		isOnline: boolean;
		externalUrl: string;
		locationId: string;
		locationAddress: string;
		locationCity: string;
		startDate: string;
		endDate: string;
	}>,
	ctx: z.RefinementCtx,
	// `strict` (create) enforces presence: a physical offer must carry a location,
	// an online one a link. Partial updates only check the fields actually given.
	strict: boolean
) {
	const startDate = parseValidDate(data.startDate);
	const endDate = parseValidDate(data.endDate);

	if (endDate && endDate.getTime() <= Date.now()) {
		ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'isInFuture' });
	}

	if (startDate && endDate && endDate.getTime() <= startDate.getTime()) {
		ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'isAfterStart' });
	}

	// Online offers carry no location but must link out (mirrors the backend
	// `offer.online_requires_url`).
	if (data.isOnline === true) {
		const url = (data.externalUrl ?? '').trim();
		if (strict && !url) {
			ctx.addIssue({ code: 'custom', path: ['externalUrl'], message: 'isNotEmpty' });
		}
		return;
	}

	// Physical offers need a location: an existing id, or a known Colombian city
	// (from the bundled list) plus an address (mirrors `offer.location_required`).
	if (strict && data.isOnline === false) {
		if ((data.locationId ?? '').trim()) return;

		const city = (data.locationCity ?? '').trim();
		const address = (data.locationAddress ?? '').trim();

		if (!city) {
			ctx.addIssue({ code: 'custom', path: ['locationCity'], message: 'isNotEmpty' });
		} else if (!isKnownCity(city)) {
			ctx.addIssue({ code: 'custom', path: ['locationCity'], message: 'unknownCity' });
		}
		if (!address) {
			ctx.addIssue({ code: 'custom', path: ['locationAddress'], message: 'isNotEmpty' });
		}
	}
}

// Create defaults the channel flag to false so an omitted value is treated as a
// physical offer (and the location requirement applies).
const createOfferShape = { ...offerShape, isOnline: z.boolean().default(false) };

export const createOfferSchema = z
	.object(createOfferShape)
	.superRefine((data, ctx) => validateOffer(data, ctx, true));

export const updateOfferSchema = z
	.object(offerShape)
	.partial()
	.superRefine((data, ctx) => validateOffer(data, ctx, false));

export type CreateOfferFormData = z.infer<typeof createOfferSchema>;
export type UpdateOfferFormData = z.infer<typeof updateOfferSchema>;
