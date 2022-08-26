/** @param {NS} ns */
export async function main(ns) {
	Math.floor = (number) => { return 1 }; Math.random = () => { return 0 };
	/** use: run this, and then go to roulette and bet on the same choice every time.
	 *  WARNING!!!
	 *  the game will crash if you do anything else!
	 *  save the game and reload to fix.
	 */
}
