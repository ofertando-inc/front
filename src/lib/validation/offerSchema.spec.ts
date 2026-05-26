import { describe, expect, it } from 'vitest';
import { createOfferSchema, updateOfferSchema } from '$lib/validation/offerSchema';

const futureStartDate = '2099-05-21T10:00';
const futureEndDate = '2099-05-28T10:00';

const validOffer = {
	title: 'Big discount',
	description: '50% off selected products',
	offerType: 'online',
	externalUrl: 'https://example.com/deal',
	storeName: 'Acme',
	city: 'Bogotá',
	startDate: futureStartDate,
	endDate: futureEndDate
};

function fieldMessages(error: unknown, field: string): string[] {
	const issues =
		error && typeof error === 'object' && 'issues' in error
			? (error as { issues: Array<{ path: Array<string | number>; message: string }> }).issues
			: [];

	return issues.filter((issue) => issue.path[0] === field).map((issue) => issue.message);
}

describe('createOfferSchema', () => {
	it('accepts a complete valid offer payload', () => {
		expect(createOfferSchema.parse(validOffer)).toEqual(validOffer);
	});

	it('trims text fields and converts an empty external URL to undefined', () => {
		expect(
			createOfferSchema.parse({
				...validOffer,
				title: '  Big discount  ',
				externalUrl: ''
			})
		).toMatchObject({
			title: 'Big discount',
			externalUrl: undefined
		});
	});

	it('requires every create field except externalUrl', () => {
		const result = createOfferSchema.safeParse({});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
				expect.arrayContaining([
					'title',
					'description',
					'offerType',
					'storeName',
					'city',
					'startDate',
					'endDate'
				])
			);
		}
	});

	it('uses backend-compatible constraint names for string and URL errors', () => {
		const result = createOfferSchema.safeParse({
			...validOffer,
			title: '',
			externalUrl: 'not-a-url'
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(fieldMessages(result.error, 'title')).toContain('isNotEmpty');
			expect(fieldMessages(result.error, 'externalUrl')).toContain('isUrl');
		}
	});

	it('requires the end date to be in the future', () => {
		const result = createOfferSchema.safeParse({
			...validOffer,
			endDate: '2020-01-01T10:00'
		});

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
