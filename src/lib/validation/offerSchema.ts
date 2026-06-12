import { z } from 'zod';
import { isKnownCity } from '$lib/offers/cities';

export const OFFER_TITLE_MAX_LENGTH = 200;
export const OFFER_DESCRIPTION_MAX_LENGTH = 5000;
export const OFFER_TYPE_MAX_LENGTH = 50;
export const OFFER_STORE_NAME_MAX_LENGTH = 100;
export const OFFER_CITY_MAX_LENGTH = 100;

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

const offerShape = {
	title: requiredText(OFFER_TITLE_MAX_LENGTH),
	description: requiredText(OFFER_DESCRIPTION_MAX_LENGTH),
	offerType: requiredText(OFFER_TYPE_MAX_LENGTH),
	externalUrl: optionalUrl(),
	storeName: requiredText(OFFER_STORE_NAME_MAX_LENGTH),
	city: requiredText(OFFER_CITY_MAX_LENGTH),
	startDate: dateString(),
	endDate: dateString(),
	categoryIds: z.array(z.string()).min(1, { message: 'isNotEmpty' })
};

function validateOffer(
	data: Partial<{ offerType: string; city: string; startDate: string; endDate: string }>,
	ctx: z.RefinementCtx
) {
	const startDate = parseValidDate(data.startDate);
	const endDate = parseValidDate(data.endDate);

	if (endDate && endDate.getTime() <= Date.now()) {
		ctx.addIssue({
			code: 'custom',
			path: ['endDate'],
			message: 'isInFuture'
		});
	}

	if (startDate && endDate && endDate.getTime() <= startDate.getTime()) {
		ctx.addIssue({
			code: 'custom',
			path: ['endDate'],
			message: 'isAfterStart'
		});
	}

	// Local offers must point to a real Colombian city. Online offers use a
	// sentinel ("Nacional") and are not checked against the city list.
	if (data.offerType === 'local') {
		const city = (data.city ?? '').trim();
		if (city && !isKnownCity(city)) {
			ctx.addIssue({
				code: 'custom',
				path: ['city'],
				message: 'unknownCity'
			});
		}
	}
}

export const createOfferSchema = z.object(offerShape).superRefine(validateOffer);

export const updateOfferSchema = z.object(offerShape).partial().superRefine(validateOffer);

export type CreateOfferFormData = z.infer<typeof createOfferSchema>;
export type UpdateOfferFormData = z.infer<typeof updateOfferSchema>;
