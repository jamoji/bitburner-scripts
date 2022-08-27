import { autoRetry, log } from '/hack/utils.js'
/** @param {NS} ns */
let _ns;
export async function main(ns) {
	/** args[0] == loop, defaults to true, args[1] == tries, default 10, args[2] == number of bets, 0 == unlimited, args[3] == bet, default is maximum of current money up to 100 Mill. */
	// Save our original functions
	
	let floor = Math.floor;
	let random = Math.random;
	_ns = ns;
	// Load our arguments
	let args = ns.args;
	let loop = args[0] !== undefined ? args[0]:true;
	let tries = args[1] !== undefined ? args[1]:10;
	let loops = args[2] !== undefined ? args[2]:0;
	let ammount = args[3] !== undefined ? args[3]:100000000;
	let tail = args[4] !== undefined ? args[4]:false;
	if( tail ) {
		ns.tail();
		await ns.sleep(1000);
		ns.tprint("Starting Tail")
	}
	ns.print(`Loop: ${loop.toString()} Tries: ${tries.toString()} Betting Loops: ${loops.toString()} Bet ammount: ${ammount.toString()}`);
	let breakMath = function() {
		//Override default JS functions
		Math.floor = (number) => { return 1 }; Math.random = () => { return 0 };
		/** use: run this, and then go to roulette and bet on the same choice every time.
		 *  WARNING!!!
		 *  the game will crash if you do anything else!
		 *  save the game and reload to fix.
		 */
	}
	// fix math function
	let fixMath = () => {
		Math.floor = floor;
		Math.random = random;
	}
	// Step 1.1 Setup the run
	// Helper function to detect if the "Stop [[faction|company] work|styding|training]" etc... button from the focus screen is up
	const checkForFocusScreen = async () =>
		await findRetry(ns, "//button[contains(text(), 'Stop playing')]", true) ? false : // False positive, casino "stop" button, no problems here
			await findRetry(ns, "//button[contains(text(), 'Stop')]", true); // Otherwise, a button with "Stop" on it is probably from the work screen
	let attempts = 0; 
	let rtButton, roulButton, wagerField, wheelSlotButton;
	while (attempts++ <= tries) {
		if (attempts > 1) 
			await ns.sleep(1000);
		try {
			// Step 2.1: If the player is focused, stop the current action
			const btnStopAction = await checkForFocusScreen();
			if (btnStopAction) { // If we were performing an action unfocused, it will be focused on restart and we must stop that action to navigate.
				log(ns, "It looks like we're on a focus screen. Stopping whatever we're doing...")
				await click(btnStopAction);
			}
			// Step 2.2: Navigate to the City Casino
			try { // Try to do this without SF4, because it's faster and doesn't require a temp script to be cleaned up below
				// Click our way to the city casino
				await click(await findRetry(ns, "//div[(@role = 'button') and (contains(., 'City'))]"));
				await click(await findRetry(ns, "//span[@aria-label = 'Iker Molina Casino']"));
			} catch { // Use SF4 as a fallback, it's more reliable.
				try { await getNsDataThroughFile(ns, 'ns.singularity.goToLocation(ns.args[0])', '/Temp/goToLocation.txt', ["Iker Molina Casino"]); }
				catch { return tailAndLog(ns, "ERROR: Failed to travel to the casino both using UI navigation and using SF4 as a fall-back."); }
			}
			// Step 2.3: Try to start the blackjack game
			const blackjack = await findRetry(ns, "//button[contains(text(), 'roulette')]");
			if (!blackjack) {
				tailAndLog(ns, `ERROR: Could not find the "Play roulette" button. Did something steal focus? Trying again... ` +
					`Please post a full-game screenshot on Discord if you can't get past this point.`)
				continue; // Loop back to start and try again
			}
			await click(blackjack);

			// Step 2.4: Get some buttons we will need to play blackjack
			inputWager = await findRetry(ns, "//input[@value = 1000000]");
			btnStartGame = await findRetry(ns, "//button[text() = '35']");
			rtButton = await findRetry(ns, "//button[text() = 'Return To World']");
			if (!inputWager || !btnStartGame || !rtButton) {
				tailAndLog(ns, `ERROR: Could not find one or more game controls. Did something steal focus? Trying again... ` +
					`Please post a full-game screenshot on Discord if you can't get past this point.`)
				continue; // Loop back to start and try again
			}

			// // Step 2.5: Clean up temp files and kill other running scripts to speed up the reload cycle
			// if (ns.ls("home", "/Temp/").length > 0) { // Do a little clean-up to speed up save/load.
			// 	// Step 2.5.1: Test that we aren't already kicked out of the casino before doing drastic things like killing scripts
			// 	await setText(inputWager, `1`); // Bet just a dollar and quick the game right away, no big deal
			// 	await click(btnStartGame);
			// 	if (await findRetry(ns, "//p[contains(text(), 'Count:')]", true, 10)) { // If this works, we're still allowed in
			// 		const btnStay = await findRetry(ns, "//button[text() = 'Stay']", true);
			// 		if (btnStay) await click(btnStay); // Trigger the game to end if we didn't instantly win/lose our $1 bet.
			// 	} else { // Otherwise, we've probably been kicked out of the casino, but...
			// 		// because we haven't killed scripts yet, it's possible another script stole focus again. Detect and handle that case.
			// 		if (await checkForFocusScreen()) {
			// 			log(ns, "ERROR: It looks like something stole focus while we were trying to automate the casino. Trying again.");
			// 			continue; // Loop back to start and try again
			// 		}
			// 		await ns.write(ran_flag, true, "w"); // Write a flag other scripts can check for indicating we think we've been kicked out of the casino.
			// 		return log(ns, "INFO: We appear to already have been previously kicked out of the casino.", true);
			// 	}
			// 	// Step 2.5.2: Kill all other scripts if enabled (note, we assume that if the temp folder is empty, they're already killed and this is a reload)
			// 	if (options['kill-all-scripts'])
			// 		await killAllOtherScripts(ns, !options['no-deleting-remote-files']);
			// 	// Step 2.5.3: Clear the temp folder on home (all transient scripts / outputs)
			// 	await waitForProcessToComplete(ns, ns.run(getFilePath('cleanup.js')));
			// }
			fixMath();
			break; // We achieved everthing we wanted, we can exit the while loop.
		} catch (err) {
			fixMath();
			ns.tail(); // We're having difficulty, pop open a tail window so the user is aware.
			log(ns, `WARNING: casino.js Caught (and suppressed) an unexpected error while navigating to blackjack. Will try again...\n` +
				(typeof err === 'string' ? err : err.message || JSON.stringify(err)), false, 'warning');
		}
	}
	return;
}
let doc = eval("document");
// Some DOM helpers (partial credit to @ShamesBond)
async function click(elem) {
	await elem[Object.keys(elem)[1]].onClick({ isTrusted: true });
	await _ns.sleep(1000);
}
async function setText(input, text) {
	await input[Object.keys(input)[1]].onChange({ isTrusted: true, target: { value: text } });
	await _ns.sleep(1000);
}
function find(xpath) { return doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; }
async function findRetry(ns, xpath, expectFailure = false, retries = null) {
	try {
		return await autoRetry(ns, () => find(xpath), e => e !== undefined,
			() => expectFailure ? `It's looking like the element with xpath: ${xpath} isn't present...` :
				`Could not find the element with xpath: ${xpath}\nSomething may have re-routed the UI`,
			retries != null ? retries : expectFailure ? 3 : 10, 1, 2);
	} catch (e) {
		if (!expectFailure) throw e;
	}
}
/** Helper to open a tail window and log a message to the console and terminal. Useful when trying to inform the player of a failure.
 * @param {NS} ns **/
 function tailAndLog(ns, message) {
	ns.tail();
	log(ns, message, true);
}