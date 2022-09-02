import {
    getConfiguration, disableLogs, instanceCount,findRetry,click
} from '/smircher/utils.js'

const argsSchema = [
    ['tries', 25], // Number of tries to take at training.

];

export function autocomplete(data, _) {
    data.flags(argsSchema);
    return [];
}
/** @param {NS} ns */
export async function main(ns) {
    const runOptions = getConfiguration(ns, argsSchema);
    if (!runOptions || await instanceCount(ns) > 1) return; // Prevent multiple instances of this script from being started, even with different args.
    let options = runOptions; // We don't set the global "options" until we're sure this is the only running instance
    disableLogs(ns, ['sleep', 'run', 'getServerMaxRam', 'getServerUsedRam']);
    let attempts = 0; 
	let tries = options.tries;
	while (attempts++ <= tries) {
		if (attempts > 1) 
			await ns.sleep(1000);
		try {
            // Step 2.2: Navigate to the City University
			try { // Try to do this without SF4, because it's faster and doesn't require a temp script to be cleaned up below
				// Click our way to the city university
				await click(ns, await findRetry( ns, "//div[(@role = 'button') and (contains(., 'City'))]"));
				await click(ns, await findRetry( ns, "//span[@aria-label = 'Rothman University']"));
			} catch { // Use SF4 as a fallback, it's more reliable.
			}
            await click(ns, await findRetry( ns, "//button[@aria-label='Gain hacking experience!']" ) );
            await click(ns, await findRetry( ns, "//button[text() = 'Do something else simultaneously']"))
        } catch {}
    }
}