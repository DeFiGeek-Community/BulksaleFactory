const { ethers } = require("hardhat");
import { BigNumber } from "ethers";
import { summon, getSharedProvider, getSharedSigners, 
  parseAddr, parseBool, parseInteger, getLogs,
  encode, decode, increaseTime } from "./helper";
import * as specs from './parameterizedSpecs';



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
}:{
    token: string,
    start: number/* unixtime in sec (not milisec) */,
    eventDuration: number /* in sec */,
    lockDuration: number /* in sec */,
    expirationDuration: number /* in sec */,
    sellingAmount: BigNumber,
    minEtherTarget: BigNumber,
    owner: string,
    feeRatePerMil: number
}){
    let types;
    if(templateName == 'BulksaleV1.sol'){
        types = ["address", "uint", "uint", "uint", "uint", "uint", "uint", 'address', 'uint'];
    } else if(templateName == 'BulksaleV2.sol') {
        types = ["address", "uint", "uint", "uint", "uint", "uint", "uint", 'address', 'uint'];
    } else {
        console.trace(`${templateName} is not planned yet. Add your typedef for abi here.`);
        throw 1;
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

let ctx;
export function parameterizedSpecs(){
    ctx = specs.successWithModerateSetting();
    Object.keys(specs).map(specName=> ctx = specs[specName](ctx) );
    return ctx;
}
