/** @param {NS} ns */
export async function main(ns) {
    let files = ns.ls('home');
    let args = ns.args;
    if( ! args[0] ) {
        ns.print("Arguments for filter are required")
        return;
    }
    let filter = args[0];
    ns.print(filter);
    for( let i in files ) {
        ns.print(`${files[i]} ${files[i].includes( filter ) ? "yes":"no"}`);
        if( files[i].includes( filter ) )
            ns.rm(files[i],'home');
    }
}