
const debounce = (callback: () => void, timeout: number) => {
	let timeoutHandle: ReturnType<typeof setTimeout>|null = null;
	return () => {
		if (timeoutHandle !== null) {
			clearTimeout(timeoutHandle);
		}
		timeoutHandle = setTimeout(() => {
			timeoutHandle = null;
			callback();
		}, timeout);
	};
};

export default debounce;