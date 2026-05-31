import { describe, expect, it } from 'vitest';
import { ApiError } from '$lib/api/client';
import { messages } from '$lib/i18n/messages';
import { resolveOfferError } from '$lib/offers/offerErrors';

const t = messages.es;

describe('resolveOfferError', () => {
	it('maps offer.not_found to a banner message', () => {
		const error = new ApiError('offer.not_found', 404);

		expect(resolveOfferError(error, t, 'browse')).toEqual({
			bannerMessage: t.errors['offer.not_found'],
			fieldErrors: {}
		});
	});

	it('maps offer.forbidden to a banner message in the update context', () => {
		const error = new ApiError('offer.forbidden', 403);

		expect(resolveOfferError(error, t, 'update')).toEqual({
			bannerMessage: t.errors['offer.forbidden'],
			fieldErrors: {}
		});
	});

	it('maps offer.invalid_dates to a banner message in the create context', () => {
		const error = new ApiError('offer.invalid_dates', 400);

		expect(resolveOfferError(error, t, 'create')).toEqual({
			bannerMessage: t.errors['offer.invalid_dates'],
			fieldErrors: {}
		});
	});

	it('maps offer.invalid_status_transition to a banner message in the delete context', () => {
		const error = new ApiError('offer.invalid_status_transition', 400);

		expect(resolveOfferError(error, t, 'delete')).toEqual({
			bannerMessage: t.errors['offer.invalid_status_transition'],
			fieldErrors: {}
		});
	});

	it('maps pagination.invalid_cursor to a banner message in the browse context', () => {
		const error = new ApiError('pagination.invalid_cursor', 400);

		expect(resolveOfferError(error, t, 'browse')).toEqual({
			bannerMessage: t.errors['pagination.invalid_cursor'],
			fieldErrors: {}
		});
	});

	it('extracts validation.failed details into per-field errors', () => {
		const error = new ApiError('validation.failed', 400, {
			fields: [
				{ field: 'title', constraints: ['isNotEmpty'] },
				{ field: 'endDate', constraints: ['isDateString'] }
			]
		});

		expect(resolveOfferError(error, t, 'create')).toEqual({
			bannerMessage: null,
			fieldErrors: {
				title: t.validation.fields.title.isNotEmpty,
				endDate: t.validation.fields.endDate.isDateString
			}
		});
	});

	it('falls back to a banner when validation.failed has no usable details', () => {
		const error = new ApiError('validation.failed', 400);

		expect(resolveOfferError(error, t, 'create')).toEqual({
			bannerMessage: t.errors['validation.failed'],
			fieldErrors: {}
		});
	});

	it('translates rate-limit keys to their banner message', () => {
		const error = new ApiError('error.too_many_requests', 429);

		expect(resolveOfferError(error, t, 'browse')).toEqual({
			bannerMessage: t.errors['error.too_many_requests'],
			fieldErrors: {}
		});
	});

	it('maps 5xx with unknown key to the offer server error', () => {
		const error = new ApiError(null, 502);

		expect(resolveOfferError(error, t, 'browse')).toEqual({
			bannerMessage: t.offer.serverError,
			fieldErrors: {}
		});
	});

	it('falls back to the contextual browse message for non-ApiError', () => {
		expect(resolveOfferError(new Error('network'), t, 'browse')).toEqual({
			bannerMessage: t.offer.genericBrowseError,
			fieldErrors: {}
		});
	});

	it('falls back to the contextual create message for non-ApiError', () => {
		expect(resolveOfferError(new Error('network'), t, 'create')).toEqual({
			bannerMessage: t.offer.genericCreateError,
			fieldErrors: {}
		});
	});

	it('falls back to the contextual update message for non-ApiError', () => {
		expect(resolveOfferError(new Error('network'), t, 'update')).toEqual({
			bannerMessage: t.offer.genericUpdateError,
			fieldErrors: {}
		});
	});

	it('falls back to the contextual delete message for non-ApiError', () => {
		expect(resolveOfferError(new Error('network'), t, 'delete')).toEqual({
			bannerMessage: t.offer.genericDeleteError,
			fieldErrors: {}
		});
	});

	it('maps vote.offer_not_voteable to a banner message in the vote context', () => {
		const error = new ApiError('vote.offer_not_voteable', 400);

		expect(resolveOfferError(error, t, 'vote')).toEqual({
			bannerMessage: t.errors['vote.offer_not_voteable'],
			fieldErrors: {}
		});
	});

	it('falls back to the contextual vote message for non-ApiError', () => {
		expect(resolveOfferError(new Error('network'), t, 'vote')).toEqual({
			bannerMessage: t.offer.genericVoteError,
			fieldErrors: {}
		});
	});

	it('maps report.offer_not_reportable to a banner message in the report context', () => {
		const error = new ApiError('report.offer_not_reportable', 400);

		expect(resolveOfferError(error, t, 'report')).toEqual({
			bannerMessage: t.errors['report.offer_not_reportable'],
			fieldErrors: {}
		});
	});

	it('falls back to the contextual report message for non-ApiError', () => {
		expect(resolveOfferError(new Error('network'), t, 'report')).toEqual({
			bannerMessage: t.offer.genericReportError,
			fieldErrors: {}
		});
	});

	it('maps comment.cannot_reply_to_reply to a banner message in the comment context', () => {
		const error = new ApiError('comment.cannot_reply_to_reply', 400);

		expect(resolveOfferError(error, t, 'comment')).toEqual({
			bannerMessage: t.errors['comment.cannot_reply_to_reply'],
			fieldErrors: {}
		});
	});

	it('falls back to the contextual comment message for non-ApiError', () => {
		expect(resolveOfferError(new Error('network'), t, 'comment')).toEqual({
			bannerMessage: t.offer.genericCommentError,
			fieldErrors: {}
		});
	});

	it('falls back to the contextual generic for unknown ApiError keys', () => {
		const error = new ApiError('something.brand_new', 418);

		expect(resolveOfferError(error, t, 'update')).toEqual({
			bannerMessage: t.offer.genericUpdateError,
			fieldErrors: {}
		});
	});
});
