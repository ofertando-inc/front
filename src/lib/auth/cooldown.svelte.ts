export function createCooldown() {
	let seconds = $state(0);
	let timerId: ReturnType<typeof setInterval> | null = null;

	function stop() {
		if (timerId !== null) {
			clearInterval(timerId);
			timerId = null;
		}
		seconds = 0;
	}

	function start(durationSeconds: number) {
		stop();
		if (durationSeconds <= 0) return;

		seconds = durationSeconds;
		timerId = setInterval(() => {
			seconds -= 1;
			if (seconds <= 0) stop();
		}, 1000);
	}

	return {
		get seconds() {
			return seconds;
		},
		get active() {
			return seconds > 0;
		},
		start,
		stop
	};
}
