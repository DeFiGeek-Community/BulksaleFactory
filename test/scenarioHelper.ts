const { ethers } = require("hardhat");
import { BigNumber } from "ethers";
import { summon, getSharedProvider, getSharedSigners, 
  parseAddr, parseBool, parseInteger, getLogs,
  encode, decode, increaseTime } from "./helper";




export function getAbiArgs(templateName, {
    token,
    start,
    eventDuration,
    lockDuration,
    expirationDuration,
    sellingAmount,
    minEtherTarget,
    owner,
    feeRatePerMil
}){
    let types;
    if(templateName == 'Bulksale_DefiGeek_20210505'){
        types = ["address", "uint", "uint", "uint", "uint", "uint", "uint", 'address', 'uint'];
    } else {
        throw new Error(`${templateName} is not planned yet. Add your typedef for abi here.`);
    }
    if( feeRatePerMil < 1 || 100 <= feeRatePerMil ) throw new Error("feeRatePerMil is out of range.");

    return encode(
        types,
        [token, start, eventDuration, lockDuration, expirationDuration, sellingAmount, minEtherTarget, owner, feeRatePerMil]
    );
}


export async function sendERC20(erc20contract:any, to:any, amountStr:string, signer){
    let sendResult = await (await signer.sendTransaction({
        to: to,
        value: ethers.utils.parseEther(amountStr)
    })).wait();
}
export async function sendEther(to:any, amountStr:string, signer){
    let sendResult = await (await signer.sendTransaction({
        to: to,
        value: ethers.utils.parseEther(amountStr)
    })).wait();
}
