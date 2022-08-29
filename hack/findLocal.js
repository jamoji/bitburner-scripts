import {
    formatMoney, launchScriptHelper, formatNumberShort, exec
} from '/hack/utils.js'

/** @param {NS} ns */
export async function main(ns) {
	let args = ns.args;
	// let servers = scanAllServers(ns);
	let threshold = 0.8;
	let servers = ["home"];
    let sd = [["home"]];
    let serverDetails = {};
    let depth = 10;
    let player = ns.getPlayer();
    let skipHost = ['darkweb'];

    let serverInfo = (x, useCache = true) => {
        if ( ! serverDetails[x]  || ! useCache )
            serverDetails[x] = ns.getServer(x); // If we do not have it cached, then fetch it
        return serverDetails[x]; 
    }

	let ordering = (a, b) => {
        let d = serverInfo(b).purchasedByPlayer - serverInfo(a).purchasedByPlayer;// Purchased servers to the very top
        d = d != 0 ? d : ns.scan(b).hasAdminRights - ns.scan(a).hasAdminRights; // Sort servers we admin.    
        d = d != 0 ? d :  serverInfo(b).moneyMax - serverInfo(a).moneyMax // Servers with the highest money go down    
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
        let serverDetail = serverInfo(server);
        if( skipHost.includes(serverDetail.hostname))
            continue;
        /** from there, step through servers, if we have the root, scp files to those servers, and kick off the hack. */
        ns.print(`Server: ${server} Owned: ${serverDetail.purchasedByPlayer.toString()} 
            hasAdminRights: ${serverDetail.hasAdminRights.toString()} 
            MaxCash:${formatMoney(serverDetail.moneyMax)}`)
        if ( ! serverDetail.hasAdminRights && serverDetail.hackDifficulty < player.skills.hacking ) {
            launchScriptHelper( ns, 'crack-host.js', [ serverDetail.hostname ] );
        }
        if ( serverDetail.hackDifficulty < player.skills.hacking ) {
            try { await ns.scriptKill('/hack/hacklocal.js',serverDetail.hostname); } catch{}
            try { await ns.scriptKill('/hack/Remote/weak-target.js',serverDetail.hostname); } catch{}
            try { await ns.scriptKill('/hack/Remote/grow-target.js',serverDetail.hostname); } catch{}
            try { await ns.scriptKill('/hack/Remote/hack-target.js',serverDetail.hostname); } catch{}
        }
        if( serverDetail.hostname !== "home") {
            await ns.scp( '/hack/hacklocal.js',serverDetail.hostname, 'home' );
            await ns.scp( '/hack/Remote/weak-target.js',serverDetail.hostname, 'home' );
            await ns.scp( '/hack/Remote/grow-target.js',serverDetail.hostname, 'home' );
            await ns.scp( '/hack/Remote/hack-target.js',serverDetail.hostname, 'home' );   
        }
    }
    await ns.sleep(5000); // waiting for the servers to stop running scripts
    let weakenRam = ns.getScriptRam('/hack/Remote/weak-target.js','home');
    let growRam = ns.getScriptRam('/hack/Remote/grow-target.js','home');
    let hackRam = ns.getScriptRam('/hack/Remote/hack-target.js','home');
    let manageRam = ns.getScriptRam('/hack/hacklocal.js', 'home');
    // find the correct host to hack, given our current hacking skill
    let target,cash;
    for( let i = 0; i < servers.length; i++) {
        let serverDetail = serverInfo(servers[i],false);
        if( serverDetail.hasAdminRights && ( serverDetail.requiredHackingSkill < player.skills.hacking ) && ( cash == undefined || serverDetail.moneyMax > cash)) {
            // ns.tprint(`Choosing ${serverDetail.hostname} for money hacking. ${serverDetail.moneyMax} > ${cash == undefined ? 0:cash} ${player.skills.hacking} > ${serverDetail.requiredHackingSkill}`)
            target = serverDetail.hostname;
            cash = serverDetail.moneyMax;
        }
    }
    
    for ( let i = 0; i < servers.length; i++ ) {
        let server = servers[i];
        let serverDetail = serverInfo(server);
        if( skipHost.includes(serverDetail.hostname))
            continue;
            // Run the script on the host
        if( serverDetail.maxRam < manageRam + hackRam ) {
            ns.print(`Skipping ${serverDetail.hostname} due to low RAM ${serverDetail.maxRam}`)
        } else if(ns.getServer(serverDetail.hostname).hasAdminRights) {
            ns.print(`Running Hacklocal on ${serverDetail.hostname}`);
            let sargs;
            if(i == 0 || target == undefined) {
                sargs = ['joesguns', threshold, false, growRam,hackRam,weakenRam];
            } else {
                sargs = [ target, threshold, true, growRam,hackRam,weakenRam];
            }
            await exec(ns,'/hack/hacklocal.js', serverDetail.hostname, 1, ...sargs)
        }
        
    }
    // ns.exec(p.filename, server, p.threads, ...p.args);
    /** if viruss flag is set, then  go ahead and copy this script there, and have it start from there */
}