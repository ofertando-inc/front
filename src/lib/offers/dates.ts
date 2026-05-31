/**
 * Date conversions for the offer form.
 *
 * A `<input type="datetime-local">` yields a *naive* local string such as
 * "2026-05-29T14:03" (no timezone). The backend expects ISO 8601 UTC with a `Z`
 * suffix. These helpers convert at the browser boundary, where the user's
 * timezone (and its DST rules for the given date) is known — never on the
 * SvelteKit server, which usually runs in UTC and would mistranslate the value.
 */

/** Two characters wide, zero-padded. */
function pad(value: number): string {
	return String(value).padStart(2, '0');
}

/**
 * Convert a datetime-local input value to an ISO 8601 UTC string.
 *
 * Idempotent: passing an already-UTC ISO string returns the equivalent UTC
 * string, so calling it twice is safe. Returns the input unchanged when it is
 * empty or cannot be parsed, leaving validation to reject it downstream.
 */
export function localInputToUtcIso(value: string): string {
	if (!value) return value;

	const timestamp = Date.parse(value);
	if (Number.isNaN(timestamp)) return value;

	return new Date(timestamp).toISOString();
}

/**
 * Convert an ISO 8601 UTC string to a datetime-local input value
 * ("YYYY-MM-DDTHH:mm") in the browser's local timezone. Returns the input
 * unchanged when it cannot be parsed.
 */
export function utcIsoToLocalInput(value: string): string {
	if (!value) return value;

	const timestamp = Date.parse(value);
	if (Number.isNaN(timestamp)) return value;

	const date = new Date(timestamp);
	return (
		`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
		`T${pad(date.getHours())}:${pad(date.getMinutes())}`
	);
}
