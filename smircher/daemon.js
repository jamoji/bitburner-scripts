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
let _ns, scripts=[];
let doc = document;
const ran_flag = "/Temp/ran-casino.txt"
let reserve_percent;
/** @param {NS} ns */
export async function main(ns) {
    const runOptions = getConfiguration(ns, argsSchema);
    if (!runOptions || await instanceCount(ns) > 1) return; // Prevent multiple instances of this script from being started, even with different args.
    let options = runOptions; // We don't set the global "options" until we're sure this is the only running instance
    disableLogs(ns, ['sleep', 'run', 'getServerMaxRam', 'getServerUsedRam']);
    _ns=ns;
    let max_hacknodes = options['max-hacknodes'];
    let prioriy_home = options['priority-home'];
    reserve_percent = options['reserve-percent'];
    let tail = options.tail;
    let exitMe = killAllOtherScripts;
    ns.atExit(exitMe);
    do {
        // check the loop every so often, make sure things are puring allong
        let player = ns.getPlayer();
        if( player.skills.hacking < 10 ) {
            trainHacking();
        } else if( myMoney() > 200000 && canRunCasino() )  {
            await runCasino();
        } else {
            runHacks();
            runHacknet();
        }
        await ns.sleep(10000);
    } while(true)

}

/**
 * myMoney
 * @returns float my money minus my reserve
 */
 function myMoney() {
    let pmoney = _ns.getServerMoneyAvailable("home");
    return pmoney - ( pmoney * reserve_percent );
}

/**
 * trainHacking()
 * Used to automatically train hacking at the university.  Does it through dom manipulation
 */
function trainHacking() {
    if( ! scripts.includes('trainHacking.js'))
        scripts.push('trainHacking.js');
    if( ! _ns.isRunning('trainHacking.js') ) {
        launchScriptHelper( _ns,'trainHacking.js')
    }
}

/**
 * canRunCasino()
 * Check to see if i can run it.
 * @returns boolean
 */
function canRunCasino() {
    if( _ns.fileExists( ran_flag, 'home' ) ) {
        return false;
    }
    return true;
}

/**
 * runCasino()
 * Runs the roulette hack on the casino.  Can only be done one time, so we will use a touch file to make sure we know we ran it.
 */
async function runCasino() {
    if( canRunCasino() && ! _ns.isRunning('roulettebreaker.js') ) {
        await killAllOtherScripts();
        launchScriptHelper( _ns,'roulettebreaker.js')
    }
}

/**
 * runHacknet()
 * manages purchases for the hacknet
 */
function runHacknet() {
    if( ! scripts.includes('hacknet.js'))
        scripts.push('hacknet.js');
    if( ! _ns.isRunning('hacknet.js') ) {
        launchScriptHelper( _ns,'hacknet.js')
    }
}

/**
 * runHacknet()
 * manages purchases for the hacking.
 * Starts hack-loop.js, which handles doing all of the hackers for us
 */
function runHacks() {
    if( ! scripts.includes('hack-loop.js'))
        scripts.push('hack-loop.js');
    if( ! _ns.isRunning('hack-loop.js') ) {
        launchScriptHelper( _ns, 'hack-loop.js', [['--reload',true]] );
    }
}
/**
 * killAllOtherScripts()
 * kills all other scripts, outside of this one.
 * Params:
 * Scripts to skip
 */
async function killAllOtherScripts( skip = null ) {
    let servers = scanAllServers( _ns );
    _ns.disableLog('scriptRunning');
    _ns.disableLog('scriptKill');
    for( let j = 0; j < servers.length; j++ ) {
        let server = servers[j];
        for( let i = 0; i < scripts.length; i++ ) {
            let script = scripts[i];
            try {
            if( script && _ns.scriptRunning( script, server ) )
                _ns.scriptKill( script, servers )
            } catch {}
        }
    }
    _ns.enableLog('scriptRunning');
    _ns.enableLog('scriptKill');
    await _ns.sleep(500);
}