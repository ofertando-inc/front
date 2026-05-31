import { describe, expect, it } from 'vitest';
import { localInputToUtcIso, utcIsoToLocalInput } from '$lib/offers/dates';

describe('localInputToUtcIso', () => {
	it('produces an ISO 8601 UTC string ending in Z', () => {
		const result = localInputToUtcIso('2026-05-29T14:03');
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
	});

	it('is idempotent for an already-UTC value', () => {
		const utc = '2026-05-29T12:03:00.000Z';
		expect(localInputToUtcIso(utc)).toBe(utc);
	});

	it('returns an empty string unchanged', () => {
		expect(localInputToUtcIso('')).toBe('');
	});

	it('returns an unparseable value unchanged', () => {
		expect(localInputToUtcIso('not-a-date')).toBe('not-a-date');
	});
});

describe('utcIsoToLocalInput', () => {
	it('formats to a datetime-local value without a timezone suffix', () => {
		const result = utcIsoToLocalInput('2026-05-29T12:03:00.000Z');
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
	});

	it('returns an unparseable value unchanged', () => {
		expect(utcIsoToLocalInput('nope')).toBe('nope');
	});
});

describe('round-trip', () => {
	it('local -> UTC -> local returns the original picker value (timezone-independent)', () => {
		const local = '2026-05-29T14:03';
		expect(utcIsoToLocalInput(localInputToUtcIso(local))).toBe(local);
	});

	it('UTC -> local -> UTC preserves the instant', () => {
		const utc = '2026-05-29T12:03:00.000Z';
		expect(localInputToUtcIso(utcIsoToLocalInput(utc))).toBe(utc);
	});
});
