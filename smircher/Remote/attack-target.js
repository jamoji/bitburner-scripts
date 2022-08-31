import {
    getConfiguration, disableLogs, instanceCount
} from '/smircher/utils.js'

const argsSchema = [
    ['target',''],
    ['host',''],
    ['threshold', 0.8], // Threshold of system resources to use
    ['loop', true], // Run as Daemon 
    ['manipulateStock', false], // Self explanitory
    ['xp', false ], // Go for XP only, skip hacking.
    ['attackRam',3.8], // how much ram for this script
    ['attackLoopRam',4.5], // how much 
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
    let loop = options.loop;
    let host = options.host;
    let threshol = options.threshold;
    let manipulateStock = options.manipulateStock;
    let target = options.target;
    let xp = options.xp;
    disableLogs(ns, [ 'sleep', 'run', 'kill' ]);

    
	do {
        if (ns.getServerSecurityLevel(target) > securityThresh  ) {
            // If the server's security level is above our threshold, weaken it
            await ns.weaken(target)
        } else if ((ns.getServerMoneyAvailable(target) < moneyThresh || ! getMoney)  ) {
            // If the server's money is less than our threshold, grow it
            ns.grow(target, { stock: manipulateStock })
        } else if( !xp ) {
            // Otherwise, hack it
            ns.hack(target, { stock: manipulateStock })
        } else {
            await ns.sleep(1000);
        }
    } while(loop)
}
async function killemall(ns, name, skip=null) {
	let scripts = ['/smircher/Remote/weak-target.js','/smircher/Remote/grow-target.js','/smircher/Remote/hack-target.js'];
    let skips = ['/smircher/hack-loop.js',skip]
	try {
		for( let script in scripts ) {
			if( skip == null || ! skips.includes( scripts[script] ) ) {
				await ns.kill( scripts[script], name );
			}
		}		
	} catch {}
	await ns.sleep(100);
}