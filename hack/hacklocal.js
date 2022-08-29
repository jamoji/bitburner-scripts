/** @param {NS} ns */
export async function main(ns) {
	let args = ns.args;
	// Defines the "target server", which is the server
	// that we're going to hack. In this case, it's "joesguns"
	let target = args[0] ? args[0]:"joesguns";
	let threshold = args[1] ? args[1]:0.75;
	let getMoney = args[2] != undefined ? args[2]:true;
	let growMem = args[3] !== undefined ? args[3]:1.75;
	let hackMem = args[4] !== undefined ? args[4]:1.7;
	let weakenMem = args[5] !== undefined ? args[5]:1.6;
	// Defines how much money a server should have before we hack it
	// In this case, it is set to 75% of the server's max money
	let moneyThresh = ns.getServerMaxMoney(target) * threshold;
	let name = ns.getHostname();
	// Defines the maximum security level the target server can
	// have. If the target's security level is higher than this,
	// we'll weaken it before doing anything else
	
	let securityThresh = ns.getServerMinSecurityLevel(target) + 5;
	let mem = ns.getServerRam(name);
	let growThreads = Math.floor((mem[0]-mem[1])*threshold/growMem);
	let hackThreads = Math.floor((mem[0]-mem[1])*threshold/hackMem);
	let weakenThreads = Math.floor((mem[0]-mem[1])*threshold/weakenMem);
	// Infinite loop that continously hacks/grows/weakens the target server
	if ( growThreads == 0 || hackThreads == 0 || weakenThreads == 0 ) {
		ns.tprint(`Cannot run on ${name} due to low RAM`);
		return;
	}
	try {
		//args[0: target, 1: desired start time, 2: expected end, 3: expected duration, 4: description, 5: disable toast warnings, 6: loop]
		let sargs = [ target,0,0,0,0,false ];
		ns.print(`Starting loop on ${name} RAMMax: ${mem[0]} RAM-Used:${mem[1]} GrowThreads ${growThreads} HackThreads ${hackThreads} weakThreads ${weakenThreads} GetMoney ${getMoney}`);
		while(true) {
			if (ns.getServerSecurityLevel(target) > securityThresh && weakenThreads > 0 ) {
				// If the server's security level is above our threshold, weaken it
				if( ns.scriptRunning('/hack/Remote/weak-target.js',name) ) {
					await ns.sleep(500);
				} else {
					await killemall(ns);
					ns.run('/hack/Remote/weak-target.js', weakenThreads, ...sargs);
				}
				 
			} else if ((ns.getServerMoneyAvailable(target) < moneyThresh || ! getMoney) && growThreads > 0 ) {
				// If the server's money is less than our threshold, grow it
				if( ns.scriptRunning('/hack/Remote/grow-target.js',name) ) {
					await ns.sleep(500);
				} else {
					await killemall(ns);
					ns.run('/hack/Remote/grow-target.js', growThreads, ...sargs);
				}
			} else if( getMoney && hackThreads > 0) {
				// Otherwise, hack it
				if( ns.scriptRunning('/hack/Remote/hack-target.js',name) ) {
					await ns.sleep(500);
				} else {
					await killemall(ns);
					ns.run('/hack/Remote/hack-target.js', hackThreads, ...sargs);
				}
			} else {
				await ns.sleep(1000);
			}
		}
	} catch(e) {
		ns.tprint(`Could not run loop on ${name} RAMMax: ${mem[0]} RAM-Used:${mem[1]} GrowThreads ${growThreads} HackThreads ${hackThreads} weakThreads ${weakenThreads} GetMoney ${getMoney}`);
		ns.tprint(JSON.stringify(e,null,4))
	}
	
}
async function killemall(ns) {
	try {
		await ns.kill('/hack/Remote/weak-target.js');
		await ns.kill('/hack/Remote/grow-target.js');
		await ns.kill('/hack/Remote/hack-target.js');
	} catch {}
	await ns.sleep(1000);
}