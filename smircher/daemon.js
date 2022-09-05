import {
    log, getConfiguration, disableLogs, instanceCount, exec, find, click, setText,scanAllServers, launchScriptHelper
} from '/smircher/utils.js'

const argsSchema = [
    ['max-hacknodes', 25], // Maximum Number of Hacknodes to purchase
    ['priority-home',true], // Prioritize home compute purchase over augments
    ['reserve-percent', 0.6], // reserve percentage to save for priority purchase
    ['tail',false] // open tail window on run
];

export function autocomplete(data, _) {
    data.flags(argsSchema);
    return [];
}
let killAllOtherScripts, scripts=[];
let doc = document;
const ran_flag = "/Temp/ran-casino.txt"
let reserve_percent;
/** @param {NS} ns */
export async function main(ns) {
    const runOptions = getConfiguration(ns, argsSchema);
    if (!runOptions || await instanceCount(ns) > 1) return; // Prevent multiple instances of this script from being started, even with different args.
    let options = runOptions; // We don't set the global "options" until we're sure this is the only running instance
    disableLogs(ns, ['sleep', 'run', 'getServerMaxRam', 'getServerUsedRam']);
    let max_hacknodes = options['max-hacknodes'];
    let prioriy_home = options['priority-home'];
    reserve_percent = options['reserve-percent'];
    let tail = options.tail;
    

    /**
     * killAllOtherScripts()
     * kills all other scripts, outside of this one.
     * Scripts to skip
     */
     killAllOtherScripts = async ( ) => {
        let servers = scanAllServers( ns );
        ns.disableLog('scriptRunning');
        ns.disableLog('scriptKill');
        for( let j = 0; j < servers.length; j++ ) {
            let server = servers[j];
            for( let i = 0; i < scripts.length; i++ ) {
                let script = scripts[i];
                try {
                if( script && ns.scriptRunning( script, server ) )
                    ns.scriptKill( script, servers )
                } catch {}
            }
        }
        ns.enableLog('scriptRunning');
        ns.enableLog('scriptKill');
        return ns.sleep(500);
    };
    ns.atExit(killAllOtherScripts);
    do {
        // check the loop every so often, make sure things are puring allong
        let player = ns.getPlayer();
        if( player.skills.hacking < 10 ) {
            trainHacking( ns );
        } else if( myMoney( ns ) > 200000 && canRunCasino( ns ) )  {
            await runCasino( ns );
        } else {
            runHacks( ns );
            runHacknet( ns );
        }
        await ns.sleep(10000);
    } while(true)

}

/**
 * myMoney
 * @param {NS} ns
 * @returns float my money minus my reserve
 */
 function myMoney(ns) {
    let pmoney = ns.getServerMoneyAvailable("home");
    return pmoney - ( pmoney * reserve_percent );
}

/**
 * trainHacking()
 * @param {NS} ns
 * Used to automatically train hacking at the university.  Does it through dom manipulation
 */
function trainHacking(ns) {
    if( ! scripts.includes('/smircher/trainHacking.js'))
        scripts.push('/smircher/trainHacking.js');
    if( ! ns.scriptRunning('/smircher/trainHacking.js','home') ) {
        launchScriptHelper( ns,'trainHacking.js', ['home'] )
    }
}

/**
 * canRunCasino()
 * Check to see if i can run it.
 * @param {NS} ns
 * @returns boolean
 */
function canRunCasino(ns) {
    if( ns.getPlayer().money < 10000000000 && ns.getPlayer().skills.hacking < 10 ) {
        try { ns.rm( ran_flag, 'home' ) }catch {}
    }
    if( ns.fileExists( ran_flag, 'home' ) ) {
        return false;
    }
    return true;
}

/**
 * runCasino()
 * @param {NS} ns
 * Runs the roulette hack on the casino.  Can only be done one time, so we will use a touch file to make sure we know we ran it.
 */
async function runCasino(ns) {
    if( canRunCasino() && ! ns.scriptRunning('/smircher/roulettebreaker.js','home') ) {
        await killAllOtherScripts( );
        launchScriptHelper( ns,'roulettebreaker.js', ['home'] )
    }
    return ns.sleep(10);
}

/**
 * runHacknet()
 * @param {NS} ns
 * manages purchases for the hacknet
 */
function runHacknet(ns) {
    if( ! scripts.includes('/smircher/hacknet-manager.js'))
        scripts.push('/smircher/hacknet-manager.js');
    if( ! ns.scriptRunning('/smircher/hacknet-manager.js','home') ) {
        launchScriptHelper( ns,'hacknet-manager.js', ['home'] )
    }
}

/**
 * runHacknet()
 * @param {NS} ns
 * manages purchases for the hacking.
 * Starts hack-loop.js, which handles doing all of the hackers for us
 */
function runHacks(ns) {
    if( ! scripts.includes('/smircher/hack-loop.js'))
        scripts.push('/smircher/hack-loop.js');
    if( ! ns.scriptRunning('/smircher/hack-loop.js','home') ) {
        launchScriptHelper( ns, 'hack-loop.js', ['--reload',true] );
    }
}
