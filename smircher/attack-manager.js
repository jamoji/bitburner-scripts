import {
    formatMoney, launchScriptHelper, formatNumberShort, exec, log, getConfiguration, disableLogs, instanceCount
} from '/smircher/utils.js'

const argsSchema = [
    ['threshold', 0.8], // Threshold of system resources to use
    ['loop', true], // Run as Daemon
    ['reload',false], // Should we copy scripts back to the targets if they are missing.
    ['prioritize_xp', false], // Prioritize hack xp over money    
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
    disableLogs(ns, ['sleep', 'run', 'getServerMaxRam', 'getServerUsedRam']);
	// let servers = scanAllServers(ns);
	let threshold = options.threshold;
    let reload = options.reload;
    let prioritize_xp = options.prioritize_xp;
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
    do {
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
            log(ns,`Server: ${server} Owned: ${serverDetail.purchasedByPlayer.toString()} 
                hasAdminRights: ${serverDetail.hasAdminRights.toString()} 
                MaxCash:${formatMoney(serverDetail.moneyMax)}`)
            if ( ! serverDetail.hasAdminRights && serverDetail.hackDifficulty < player.skills.hacking ) {
                launchScriptHelper( ns, 'crack-host.js', [ serverDetail.hostname ] );
            }
            if( reload || !ns.fileExists('/smircher/attack-loop.js', serverDetail.hostname ) ) {
                if ( serverDetail.hackDifficulty < player.skills.hacking ) {
                    try { await ns.scriptKill('/smircher/attack-loop.js',serverDetail.hostname); } catch{}
                    try { await ns.scriptKill('/smircher/Remote/attack-target.js',serverDetail.hostname); } catch{}
                    try { await ns.scriptKill('/smircher/utils.js',serverDetail.hostname); } catch{}
                    
                }
                if( serverDetail.hostname !== "home") {
                    await ns.rm( '/smircher/attack-loop.js',serverDetail.hostname );
                    await ns.rm( '/smircher/Remote/attack-target.js',serverDetail.hostname );
                    await ns.rm( '/smircher/utils.js',serverDetail.hostname );

                    await ns.scp( '/smircher/attack-loop.js',serverDetail.hostname, 'home' );
                    await ns.scp( '/smircher/Remote/attack-target.js',serverDetail.hostname, 'home' );
                    await ns.scp( '/smircher/utils.js',serverDetail.hostname, 'home' );
                }
            }
        }
        
        await ns.sleep(5000); // waiting for the servers to stop running scripts
        let attackRam = ns.getScriptRam('/smircher/Remote/attack-target.js','home');
        let attackManagerRam = ns.getScriptRam('/smircher/attack-loop.js', 'home');
        // find the correct host to hack, given our current hacking skill
        let targets = [];
        for( let i = 0; i < servers.length; i++) {
            if( serverInfo(servers[i]).hasAdminRights && ( serverInfo(servers[i]).requiredHackingSkill < player.skills.hacking ) ) {
                targets.push(servers[i]);
            }
        }
        for ( let i = 0; i < servers.length; i++ ) {
            let server = servers[i];
            let serverDetail = serverInfo(server);
            if( skipHost.includes(serverDetail.hostname))
                continue;
                // Run the script on the host
            if( serverDetail.maxRam < attackManagerRam + attackRam ) {
                log(ns,`Skipping ${serverDetail.hostname} due to low RAM ${serverDetail.maxRam}`)
            } else if(ns.getServer(serverDetail.hostname).hasAdminRights) {
                log(ns,`Running attack-loop on ${serverDetail.hostname}`);
                let sargs;
                if((serverDetail.purchasedByPlayer || target == undefined) && ( player.skills.hacking < 500 || prioritize_xp ) ) {
                    if( player.skills.hacking < 10 )
                        sargs = [['servers',['n00dles']], ['threshold',threshold], ['loop',true], ['prioritize_xp',false],['tail',false],['attackRam',attackRam],['attackManagerRam',attackManagerRam],['name',serverDetail.hostname]];
                    else
                        sargs = [['servers',['joesguns']], ['threshold',threshold], ['loop',true], ['prioritize_xp',false],['tail',false],['attackRam',attackRam],['attackManagerRam',attackManagerRam],['name',serverDetail.hostname]];
                } else {
                    let serverList = [];
                    if( serverDetail.maxRam > 32 ) {
                        //we can divide by 32, floor it, and take that many servers to hack
                        let countServers = Math.floor( serverDetail.maxRam / 32 );
                        // start at the last place in the list, and go up.
                    } else {
                        //Just take one
                        serverList.push(targets.pop());
                    }
                    sargs = [['servers',serverList], ['threshold',threshold], ['loop',true], ['prioritize_xp',false],['tail',false],['attackRam',attackRam],['attackManagerRam',attackManagerRam],['name',serverDetail.hostname]];
                }
                if( reload || !ns.scriptRunning('/smircher/attack-loop.js', serverDetail.hostname) )
                    await exec(ns,'/smircher/attack-loop.js', serverDetail.hostname, 1, ...sargs)
            }
            
        }
        reload = false;
    } while( loop );
}