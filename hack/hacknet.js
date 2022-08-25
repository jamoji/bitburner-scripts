/** @param {NS} ns */
export async function main(ns) {
	var reserve = 10000000;
	var wait = 10000;
	var maxLevel = null;
	function myMoney() {
    	return ns.getServerMoneyAvailable("home")-reserve;
	}
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("sleep");
	function buyNodes() {
		if(myMoney() > ns.hacknet.getPurchaseNodeCost()) {
			var res = ns.hacknet.purchaseNode();
			ns.print("Purchased hacknet Node with index " + res);
		}
	}
	
	function upgradeNodesLevel() {
		// ns.print("Upgrading Nodes Level");
		for (var i = 0; i < ns.hacknet.numNodes(); i++) {
			if ( maxLevel == null || ns.hacknet.getNodeStats(i).level <= maxLevel ) {
				if ( myMoney() > ns.hacknet.getLevelUpgradeCost(i, 10) ) {
					var res = ns.hacknet.upgradeLevel(i, 10);
					ns.print(`Upgrading Node ${i} to Level:${ns.hacknet.getNodeStats(i).level}`);
				}
			};
		};		
	}
	function upgradeNodesRAM() {
		// ns.print("Upgrading Nodes RAM");
		for (var i = 0; i < ns.hacknet.numNodes(); i++) {
			var cost = ns.hacknet.getRamUpgradeCost(i, 2);
			if ( myMoney() > ns.hacknet.getRamUpgradeCost(i, 2) ) {
				var res = ns.hacknet.upgradeRam(i, 2);
				ns.print(`Upgrading Node ${i} to RAM:${ns.hacknet.getNodeStats(i).ram}`);
			}
		};
	}
	function upgradeNodesCores() {
		// ns.print("Upgrading Nodes Cores");
		for (var i = 0; i < ns.hacknet.numNodes(); i++) {
			var cost = ns.hacknet.getCoreUpgradeCost(i, 1);
			if ( myMoney() > ns.hacknet.getCoreUpgradeCost(i, 1) ) {
				var res = ns.hacknet.upgradeCore(i, 1);
				ns.print(`Upgrading Node ${i} to Cores:${ns.hacknet.getNodeStats(i).cores}`);
			}	
		};
	}
	ns.print(`Beginning the hacknet purchase management`);
	while(true) {
		// ns.print(`Current Nodes: Count ${ns.hacknet.numNodes()}`)
		buyNodes();
				
		upgradeNodesLevel();
		upgradeNodesRAM();
		upgradeNodesCores();	
		await ns.sleep(wait);
	}
}