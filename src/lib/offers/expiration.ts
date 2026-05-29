import type { Offer } from '$lib/types/offer';

/**
 * Whether an offer must be displayed as expired.
 *
 * The backend flips an offer to `EXPIRED` lazily (hourly job + on detail read),
 * so the stored `status` can lag slightly behind reality. We therefore OR the
 * status with a live date comparison: an offer whose `endDate` is in the past
 * is expired for display purposes even if its status has not been flipped yet.
 */
export function isOfferExpired(
	offer: Pick<Offer, 'status' | 'endDate'>,
	now: number = Date.now()
): boolean {
	if (offer.status === 'EXPIRED') return true;

	const endTime = new Date(offer.endDate).getTime();
	return Number.isFinite(endTime) && endTime < now;
}
