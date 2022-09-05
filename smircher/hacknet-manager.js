import {
    log, getConfiguration, disableLogs, instanceCount, exec, find, click, setText,scanAllServers, launchScriptHelper
} from '/smircher/utils.js'

const argsSchema = [
    ['max-hacknodes', 25], // Maximum Number of Hacknodes to purchase
    ['max-level-nodes',200], // Prioritize home compute purchase over augments
    ['reserve-percent', 0.6], // reserve percentage to save for priority purchase
    ['tail',false] // open tail window on run
];

export function autocomplete(data, _) {
    data.flags(argsSchema);
    return [];
}
let _ns, scripts=[];
let doc = document;
const ran_flag = "/Temp/ran-casino.txt"

/** @param {NS} ns */
export async function main(ns) {
    const runOptions = getConfiguration(ns, argsSchema);
    if (!runOptions || await instanceCount(ns) > 1) return; // Prevent multiple instances of this script from being started, even with different args.
    let options = runOptions; // We don't set the global "options" until we're sure this is the only running instance
    disableLogs(ns, ['sleep', 'run', 'getServerMaxRam', 'getServerUsedRam','getServerMoneyAvailable']);
    _ns=ns;
	let args = ns.args;
	let reserve = options['reserve-percent'];
	let maxNumberOfNodes = options['max-hacknodes'];
	let maxLevel = options['max-level-nodes'];
	let wait = 10000;
	
	function myMoney() {
		let pmoney = ns.getServerMoneyAvailable("home");
    	return pmoney - ( pmoney * reserve );
	}
	function buyNodes() {
		if(myMoney() > ns.hacknet.getPurchaseNodeCost() && ns.hacknet.numNodes() < maxNumberOfNodes ) {
			let res = ns.hacknet.purchaseNode();
			ns.print("Purchased hacknet Node with index " + res);
		}
	}
	
	function upgradeNodesLevel() {
		// ns.print("Upgrading Nodes Level");
		for (let i = 0; i < ns.hacknet.numNodes(); i++) {
			if ( maxLevel == null || ns.hacknet.getNodeStats(i).level <= maxLevel ) {
				if ( myMoney() > ns.hacknet.getLevelUpgradeCost(i, 10)) {
					let res = ns.hacknet.upgradeLevel(i, 10);
					ns.print(`Upgrading Node ${i} to Level:${ns.hacknet.getNodeStats(i).level}`);
				}
			};
		};		
	}
	function upgradeNodesRAM() {
		// ns.print("Upgrading Nodes RAM");
		for (let i = 0; i < ns.hacknet.numNodes(); i++) {
			let cost = ns.hacknet.getRamUpgradeCost(i, 2);
			if ( myMoney() > ns.hacknet.getRamUpgradeCost(i, 2) ) {
				let res = ns.hacknet.upgradeRam(i, 2);
				ns.print(`Upgrading Node ${i} to RAM:${ns.hacknet.getNodeStats(i).ram}`);
			}
		};
	}
	function upgradeNodesCores() {
		// ns.print("Upgrading Nodes Cores");
		for (let i = 0; i < ns.hacknet.numNodes(); i++) {
			let cost = ns.hacknet.getCoreUpgradeCost(i, 1);
			if ( myMoney() > ns.hacknet.getCoreUpgradeCost(i, 1) ) {
				let res = ns.hacknet.upgradeCore(i, 1);
				ns.print(`Upgrading Node ${i} to Cores:${ns.hacknet.getNodeStats(i).cores}`);
			}	
		};
	}

	function upgradeCache() {
		for ( let i = 0; i < ns.hacknet.numNodes(); i++ ) {
			let cost = ns.hacknet.getCacheUpgradeCost(i,1);
			if( myMoney() > cost ) {
				let res = ns.hacknet.upgradeCache(i,1);
				ns.print(`Upgrading Node ${i} to Cache:${ns.hacknet.getNodeStats(i).cache} Capacity: ${ns.hacknet.getNodeStats(i).hashCapacity}`);
			} 
		}
	}

	function sellHash() {
		let thresh = 0.8, sell = 0.5, cap = ns.hacknet.hashCapacity(), numhash = ns.hacknet.numHashes();
		if( cap * thresh > numhash ) {
			ns.hacknet.spendHashes("Sell For Money","home",MATH.floor(numhash * sell) );
		}
	}

	ns.print(`Beginning the hacknet purchase management`);
	while(true) {
		// ns.print(`Current Nodes: Count ${ns.hacknet.numNodes()}`)
		buyNodes();
		upgradeNodesLevel();
		upgradeNodesRAM();
		upgradeNodesCores();
		upgradeCache();
		sellHash();
			
		await ns.sleep(wait);
	}
}