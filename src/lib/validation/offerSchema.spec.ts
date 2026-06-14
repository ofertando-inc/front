import { describe, expect, it } from 'vitest';
import { createOfferSchema, updateOfferSchema } from '$lib/validation/offerSchema';

const futureStartDate = '2099-05-21T10:00';
const futureEndDate = '2099-05-28T10:00';

// A physical (in-store) offer: carries a merchant name and a geocoded location.
const validOffer = {
	title: 'Big discount',
	description: '50% off selected products',
	offerType: 'discount',
	isOnline: false,
	externalUrl: 'https://example.com/deal',
	merchantName: 'Acme',
	locationAddress: 'Calle 10 #20-30',
	locationCity: 'Bogotá',
	locationLatitude: 4.6,
	locationLongitude: -74.08,
	startDate: futureStartDate,
	endDate: futureEndDate,
	categoryIds: ['cat-1']
};

function fieldMessages(error: unknown, field: string): string[] {
	const issues =
		error && typeof error === 'object' && 'issues' in error
			? (error as { issues: Array<{ path: Array<string | number>; message: string }> }).issues
			: [];

	return issues.filter((issue) => issue.path[0] === field).map((issue) => issue.message);
}

describe('createOfferSchema', () => {
	it('accepts a complete valid physical offer', () => {
		expect(createOfferSchema.parse(validOffer)).toMatchObject({
			merchantName: 'Acme',
			locationCity: 'Bogotá',
			isOnline: false
		});
	});

	it('coerces numeric location coordinates from strings', () => {
		const result = createOfferSchema.parse({
			...validOffer,
			locationLatitude: '4.6',
			locationLongitude: '-74.08'
		});
		expect(result.locationLatitude).toBe(4.6);
		expect(result.locationLongitude).toBe(-74.08);
	});

	it('defaults isOnline to false when omitted', () => {
		const withoutFlag: Record<string, unknown> = { ...validOffer };
		delete withoutFlag.isOnline;
		expect(createOfferSchema.parse(withoutFlag)).toMatchObject({ isOnline: false });
	});

	it('requires a merchant name', () => {
		const result = createOfferSchema.safeParse({ ...validOffer, merchantName: '' });

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(fieldMessages(result.error, 'merchantName')).toContain('isNotEmpty');
		}
	});

	it('requires at least one category', () => {
		const result = createOfferSchema.safeParse({ ...validOffer, categoryIds: [] });

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(fieldMessages(result.error, 'categoryIds')).toContain('isNotEmpty');
		}
	});

	it('requires the end date to be in the future', () => {
		const result = createOfferSchema.safeParse({ ...validOffer, endDate: '2020-01-01T10:00' });

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(fieldMessages(result.error, 'endDate')).toContain('isInFuture');
		}
	});

	it('requires the end date to be after the start date', () => {
		const result = createOfferSchema.safeParse({
			...validOffer,
			startDate: '2099-05-28T10:00',
			endDate: '2099-05-21T10:00'
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(fieldMessages(result.error, 'endDate')).toContain('isAfterStart');
		}
	});

	it('accepts a physical offer linked to an existing location id', () => {
		const result = createOfferSchema.safeParse({
			...validOffer,
			locationId: 'loc-1',
			locationAddress: '',
			locationCity: ''
		});

		expect(result.success).toBe(true);
	});

	it('requires a location for a physical offer', () => {
		const result = createOfferSchema.safeParse({
			...validOffer,
			locationAddress: '',
			locationCity: ''
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(fieldMessages(result.error, 'locationCity')).toContain('isNotEmpty');
			expect(fieldMessages(result.error, 'locationAddress')).toContain('isNotEmpty');
		}
	});

	it('rejects a physical offer whose city is not in the list', () => {
		const result = createOfferSchema.safeParse({ ...validOffer, locationCity: 'Gotham' });

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(fieldMessages(result.error, 'locationCity')).toContain('unknownCity');
		}
	});

	it('drops the location requirement for an online offer', () => {
		const result = createOfferSchema.safeParse({
			...validOffer,
			isOnline: true,
			locationAddress: '',
			locationCity: ''
		});

		expect(result.success).toBe(true);
	});

	it('requires an external URL for an online offer', () => {
		const result = createOfferSchema.safeParse({
			...validOffer,
			isOnline: true,
			externalUrl: '',
			locationAddress: '',
			locationCity: ''
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(fieldMessages(result.error, 'externalUrl')).toContain('isNotEmpty');
		}
	});
});

describe('updateOfferSchema', () => {
	it('accepts partial offer payloads', () => {
		expect(updateOfferSchema.parse({ title: 'Updated title' })).toEqual({
			title: 'Updated title'
		});
	});

	it('keeps date ordering validation when both dates are provided', () => {
		const result = updateOfferSchema.safeParse({
			startDate: '2099-05-28T10:00',
			endDate: '2099-05-21T10:00'
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(fieldMessages(result.error, 'endDate')).toContain('isAfterStart');
		}
	});
});
