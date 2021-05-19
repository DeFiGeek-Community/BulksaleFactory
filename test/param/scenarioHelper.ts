const { ethers } = require("hardhat");
import { BigNumber, Contract, Wallet, utils } from 'ethers';
const {
    isAddress,
    getAddress,
    arrayify,
    hexlify,
    isBytes,    
} = utils;

import { summon, getSharedProvider, getSharedSigners, 
  parseAddr, parseBool, parseInteger, getLogs,
  encode, decode, increaseTime } from "./helper";


export function getTokenAbiArgs(templateName:string, {
    initialSupply,
    name,
    symbol,
    owner
}:{
    initialSupply: BigNumber,
    name: string,
    symbol: string,
    owner: string
}){
    let types;
    if(!templateName || templateName.length==0) throw new Error(`scenarioHelper::getTokenAbiArgs() -> templateName is empty.`);
    if(templateName.indexOf('OwnableToken') == 0){
        types = ["uint", "string", "string", "address"]
    } else {
        console.trace(`${templateName} is not planned yet. Add your typedef for abi here.`);
        throw 1;
    }
    return encode(
        types,
        [initialSupply, name, symbol, owner]
    );

}

export function getBulksalePayload(templateName:string, {
    start,
    eventDuration,
    lockDuration,
    expirationDuration,
    feeRatePerMil,
    minEtherTarget,
    owner,
    token,
    sellingAmount,
}:{
    start: Uint8Array, /* in 5min framing since 2021-06-01, 3 bytes */
    eventDuration: Uint8Array, /* in daily framing, 1 byte */
    lockDuration: Uint8Array, /* in daily framing, 1 byte */
    expirationDuration: Uint8Array, /* in daily framing, 1 byte */
    feeRatePerMil: Uint8Array, /* in permil framing, 1 byte */
    minEtherTarget: Uint8Array, /* in interger framing, 8 byte */
    owner: Uint8Array, /* in hex framing, 20 byte */
    token: Uint8Array, /* in hex framing, 20 byte */
    sellingAmount: Uint8Array, /* in interger framing, 8 byte */
}): string {
    if(!templateName || templateName.length==0) throw new Error(`scenarioHelper::getBulksalePayload() -> templateName is empty.`);
    start =              padUint8Array(start, 3);
    eventDuration =      padUint8Array(eventDuration, 1);
    lockDuration =       padUint8Array(lockDuration, 1);
    expirationDuration = padUint8Array(expirationDuration, 1);
    feeRatePerMil =      padUint8Array(feeRatePerMil, 1);
    minEtherTarget =     padUint8Array(minEtherTarget, 8);
    if ( !isAddress(hexlify(owner)) ) throw new Error(`owner is not an address.`);
    if ( !isAddress(hexlify(token)) ) throw new Error(`token is not an address.`);
    sellingAmount =      padUint8Array(sellingAmount, 8);


    let payload: Uint8Array = new Uint8Array();
    if(templateName.indexOf('BulksaleV1')==0){
        payload = mergeUint8Array(payload, start);
        payload = mergeUint8Array(payload, eventDuration);
        payload = mergeUint8Array(payload, lockDuration);
        payload = mergeUint8Array(payload, expirationDuration);
        payload = mergeUint8Array(payload, feeRatePerMil);
        payload = mergeUint8Array(payload, minEtherTarget);
        console.log(hexlify(owner), owner);
        console.log(hexlify(token), token);
        payload = mergeUint8Array(payload, owner);
        console.log(hexlify(payload));
        payload = mergeUint8Array(payload, token);
        console.log(hexlify(payload));
        payload = mergeUint8Array(payload, sellingAmount);
        console.log(hexlify(payload));
        return hexlify(payload);
    } else {
        console.trace(`${templateName} is not planned yet. Add your typedef for abi here.`);
        throw 1;
    }
}
function numerifyUint8Array(Uint8Arr:Uint8Array):number {
    var length = Uint8Arr.length;

    let buffer = Buffer.from(Uint8Arr);
    var result = buffer.readUIntBE(0, length);

    return result;
}
function mergeUint8Array(a:Uint8Array, b:Uint8Array): Uint8Array{
    var mergedArray = new Uint8Array(a.length + b.length);
    mergedArray.set(a);
    mergedArray.set(b, a.length);
    return mergedArray;
}
function padUint8Array(arr:Uint8Array, count:number): Uint8Array{
    if(arr.byteLength > count) throw new Error(`arr.byteLength=${arr.byteLength} is more than count=${count}.`);
    else if (arr.byteLength === count) return arr;
    else {
        const nullArray = new Array(count-arr.byteLength).fill(0);
        return mergeUint8Array(new Uint8Array(nullArray), arr);
    }
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