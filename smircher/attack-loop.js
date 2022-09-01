import {
    launchScriptHelper, getConfiguration, instanceCount
} from '/smircher/utils.js'

const argsSchema = [
    ['name',''], // name of this server
    ['threshold', 0.8], // Threshold of system resources to use
    ['loop', true], // Run as Daemon
    ['prioritize_xp', false], // Prioritize hack xp over money
    ['servers',[]], // Server information    
    ['tail', false] // open tail window on run
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
    let options = runOptions; // We don't set the global "options" until we're sure this is the only running instance
	let threshold = options.threshold;
	let tail = options.tail;
	
	let name = ns.getHostname();

	let moneyThresh = ns.getServerMaxMoney(target) * threshold;
	let securityThresh = ns.getServerMinSecurityLevel(target) + 5;
    let target,cash;
    let serverKeys = Object.keys(servers);
    for( let i = 0; i < serverKeys.length; i++) {
        let serverDetail = servers(serverKeys[i]);
        
    }
	try { await ns.scriptKill('/smircher/Remote/attack-target.js',name); } catch{}
	// simple round robin.  Works if the number of threads is small.
	let sargs = [ ['target',target], ['host',name], ['threshold',threshold], ['loop',true], ['tail',false] ];
	while(true) {
        // loop the servers i have, divide my resources.
		try {
			if(! ns.scriptRunning('/smircher/Remote/attack-target.js',name))
				launchScriptHelper(ns,'Remote/attack-target.js', 1, ...sargs);
		} catch {}
		await ns.sleep(10000);
	}
}