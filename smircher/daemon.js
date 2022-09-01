import {
    log, getConfiguration, disableLogs, instanceCount
} from '/smircher/utils.js'

const argsSchema = [
    ['max-hacknodes', 25], // Maximum Number of Hacknodes to purchase
    ['priority-home',true], // Prioritize home compute purchase over augments
    ['reserve-percent', 0.6], // reserve percentage to save for priority
    ['tail',false] // open tail window on run
];

export function autocomplete(data, _) {
    data.flags(argsSchema);
    return [];
}
/** @param {NS} ns */
export async function main(ns) {
	let args = ns.args;
    const runOptions = getConfiguration(ns, argsSchema);
    if (!runOptions || await instanceCount(ns) > 1) return; // Prevent multiple instances of this script from being started, even with different args.
    options = runOptions; // We don't set the global "options" until we're sure this is the only running instance
    disableLogs(ns, ['sleep', 'run', 'getServerMaxRam', 'getServerUsedRam']);
    
}