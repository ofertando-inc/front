import { describe, expect, it } from 'vitest';
import { isOfferExpired } from '$lib/offers/expiration';

const NOW = new Date('2026-06-01T12:00:00.000Z').getTime();

describe('isOfferExpired', () => {
	it('returns true when the status is EXPIRED regardless of date', () => {
		expect(isOfferExpired({ status: 'EXPIRED', endDate: '2999-01-01T00:00:00.000Z' }, NOW)).toBe(
			true
		);
	});

	it('returns true when the endDate is in the past even if status is ACTIVE', () => {
		expect(isOfferExpired({ status: 'ACTIVE', endDate: '2026-05-31T12:00:00.000Z' }, NOW)).toBe(
			true
		);
	});

	it('returns false when the offer is ACTIVE and the endDate is in the future', () => {
		expect(isOfferExpired({ status: 'ACTIVE', endDate: '2026-06-02T12:00:00.000Z' }, NOW)).toBe(
			false
		);
	});

	it('treats the exact endDate boundary as not yet expired', () => {
		expect(isOfferExpired({ status: 'ACTIVE', endDate: '2026-06-01T12:00:00.000Z' }, NOW)).toBe(
			false
		);
	});

	it('does not flag an offer expired when the endDate is unparseable', () => {
		expect(isOfferExpired({ status: 'ACTIVE', endDate: 'not-a-date' }, NOW)).toBe(false);
	});

	it('defaults the comparison to the current time when now is omitted', () => {
		expect(isOfferExpired({ status: 'ACTIVE', endDate: '2000-01-01T00:00:00.000Z' })).toBe(true);
	});
});
