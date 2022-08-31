/** @param {NS} ns */
export async function main(ns) {
	let args = ns.args;
	/** args[0] == reserve default 20k, args[1] == maxNumberOfNodes default 25, args[2] == maxLevelNodes default 200 */
	let reserve = args[0] !== undefined ? args[0]:200000;
	let maxNumberOfNodes = args[1] !== undefined ? args[1]:25;
	let maxLevel = 200;
	let wait = 10000;
	
	function myMoney() {
    	return ns.getServerMoneyAvailable("home")-reserve;
	}
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("sleep");
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