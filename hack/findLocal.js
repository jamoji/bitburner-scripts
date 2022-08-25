import {
    formatMoney, launchScriptHelper
} from '/hack/utils.js'

/** @param {NS} ns */
export async function main(ns) {
	let args = ns.args;
	// let servers = scanAllServers(ns);
	let threshold = 0.75;
	let servers = ["home"];
    let sd = [["home"]];
    let serverDetails = {};
    let depth = 1;
    let serverInfo = (x) => {
        if ( ! serverDetails[x] )
            serverDetails[x] = ns.getServer(x); // If we do not have it cached, then fetch it
        return serverDetails[x]; 
    }

	let ordering = (a, b) => {
        let d = serverInfo(b).purchasedByPlayer - serverInfo(a).purchasedByPlayer;// Purchased servers to the very top
        d = d != 0 ? d : ns.scan(b).hasAdminRights - ns.scan(a).hasAdminRights; // Sort servers we admin.    
        d = d != 0 ? d :  serverInfo(a).moneyMax - serverInfo(b).moneyMax // Servers with the highest money go up    
        d = d != 0 ? d : a.slice(0, 2).toLowerCase().localeCompare(b.slice(0, 2).toLowerCase()); // Hack: compare nameust the first 2 chars to keep purchased servers in order purchased
        return d;
    }

	let buildtree = ( server, children = [] ) => {
        let name;
        for (name of ns.scan(server).sort(ordering)) {
            if (!servers.includes(name)) {
                servers.push(name); // Keep us from having the same server in the list multiple times.
                children.push(name);
            }
        }
        return children;
	}
    
    /** start from local, query and sort locally connected servers */
    for ( let i = 0; i < depth; i++ ) {
        /** get the array at the current depth, then fetch and order its kids*/
        let s = sd[i];
        let nextDepth = i+1;
        let children = []
        for( let ind in sd[i] ) {
            buildtree(sd[i][ind],children);
        }
        let sorted = children.sort(ordering);
        sd[nextDepth] = sorted;
    }
    for ( let i = 0; i < servers.length; i++ ) {
        let server = servers[i];
        let serverDetail = serverInfo[server];
        /** from there, step through servers, if we have the root, scp files to those servers, and kick off the hack. */
        ns.print(`Server: ${server} Owned: ${serverDetail.purchasedByPlayer.toString()} 
            hasAdminRights: ${serverDetail.hasAdminRights.toString()} 
            MaxCash:${formatMoney(serverDetail.moneyMax)}`)
        if ( serverDetail.hasAdminRights ) {
            launchScriptHelper(ns,'sync.js')
        }
        /** if viruss flag is set, then  go ahead and copy this script there, and have it start from there */
    } 
    
}