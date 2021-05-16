
import { Contract, Wallet } from 'ethers';
import { toERC20, onChainNow } from "../test/helper";
import { getTokenAbiArgs, getBulksaleAbiArgs } from "../test/scenarioHelper";
import { timeout } from "./timeout";

let saleTemplateKey;
export function setSaleTemplateKey(_saleTemplateKey:string){
    saleTemplateKey = saleTemplateKey;
}
export function getSaleTemplateKey():string{
    return saleTemplateKey;
}

export async function cloneTokenAndSale(Factory:Contract, deployer, tokenTemplateName:string, saleTemplateName:string){
    /*
        1. Initial settings.
    */
    const TOKEN_NAME = "VeryGoodToken";
    const TOKEN_SYMBOL = "VRG";
    const TOTAL_ISSUANCE = toERC20("1000000000000000");
    const SELLING_AMOUNT = toERC20("500000000000000");
    const feeRatePerMil = 1;
    const MIN_ETHER_TARGET = toERC20("0.05");
    const startModification = 60*3;
    const eventDuration = 60*60*24*30;
    const lockDuration = 60*60*24*30;
    const expirationDuration = 60*60*24*30*6;

    /*
        2. ABI for the token clone deployment.
    */
    const tokenOpts = {
        initialSupply: TOTAL_ISSUANCE,
        name: TOKEN_NAME,
        symbol: TOKEN_SYMBOL,
        owner: (<Wallet>deployer).address
    };
    const argsForTokenClone = getTokenAbiArgs(tokenTemplateName, tokenOpts);

    /*
        3. A token clone deployment.
    */
    console.log(`Deploying token clone... ${JSON.stringify(tokenOpts)}`);
    let tokenCloneDeployResult;
    try {
        tokenCloneDeployResult = 
            await (
                await Factory.connect(deployer)
                    .deployTokenClone(tokenTemplateName, argsForTokenClone)
            ).wait();
    } catch (e) { console.trace(e.message) }
    await timeout(15000);
    if(!tokenCloneDeployResult) console.trace(tokenTemplateName, argsForTokenClone)
    let tokenAddr;
    try {
        tokenAddr = tokenCloneDeployResult.events[tokenCloneDeployResult.events.length-1].args[2];
    } catch (e) { console.trace(e.message) }
    console.log(`Token Clone Deployed: ${tokenTemplateName}=${tokenAddr}`);

    /*
        4. ABI for the sale clone deployment.
    */
    const saleOpts = {
        token: <string>tokenAddr,
        start: <number>(await onChainNow() + startModification),
        eventDuration: eventDuration,
        lockDuration: lockDuration,
        expirationDuration: expirationDuration,
        sellingAmount: SELLING_AMOUNT,
        minEtherTarget: MIN_ETHER_TARGET,
        owner: (<Wallet>deployer).address,
        feeRatePerMil: feeRatePerMil,
    };
    const argsForBulksaleClone = getBulksaleAbiArgs(saleTemplateName, saleOpts);

    /*
        5. A sale clone deployment.
    */
    console.log(`Deploying sale clone... ${JSON.stringify(tokenOpts)}`);
    let saleDeployResult;
    try {
        saleDeployResult = 
            await (
                await Factory.connect(deployer)
                    .deploy(saleTemplateName, tokenAddr, SELLING_AMOUNT, argsForBulksaleClone)
            ).wait();
    } catch (e) { console.trace(saleTemplateName, tokenAddr, SELLING_AMOUNT, argsForBulksaleClone) }
    await timeout(15000);
    if(!saleDeployResult) console.trace(saleTemplateName, tokenAddr, SELLING_AMOUNT, argsForBulksaleClone)
    let latestBulksaleCloneAddr;
    try {
        latestBulksaleCloneAddr = saleDeployResult.events[saleDeployResult.events.length-1].args[2];
    } catch (e) { console.trace(e.message) }
    console.log(`Sale Clone Deployed: ${saleTemplateName}=${latestBulksaleCloneAddr}`);


}