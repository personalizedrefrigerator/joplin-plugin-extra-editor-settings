import joplin from "api"

export const isMobile = async () => {
	try {
		return (await joplin.versionInfo()).platform === 'mobile';
	} catch (e) {
		console.warn('Error checking if on mobile:', e);
		return false;
	}
}