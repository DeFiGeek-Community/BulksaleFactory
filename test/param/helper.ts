const { ethers } = require("hardhat");
import { BigNumber, Contract, Signer } from 'ethers';
const {  MockProvider } = require("ethereum-waffle");

let provider;
export function getSharedProvider(){
  if(!provider){
    provider = new MockProvider();
  }
  return provider;
}
let signers;
export function getSharedSigners(){
  if(!signers) {
    signers = ethers.getSigners();
  }
  return signers;
}

export async function summon(contractName:string, ABI:any, args:Array<any> = [], signer:Signer|undefined=undefined, linkings:Array<string>=[]):Promise<Contract>{
  return await _summon(contractName, ABI, !args ? [] : args, !signer ? undefined : signer, true, linkings);
}
export async function libDeploy(contractName:string, signer:Signer|undefined=undefined){
    const _Factory = await ethers.getContractFactory(contractName, signer);
    const _Contract:Contract = await _Factory.deploy();
    return _Contract;
}
export async function create(contractName:string, ABI:any, args:Array<any> = [], signer:Signer|undefined=undefined, linkings:Array<string>=[]):Promise<Contract>{
  return await _summon(contractName, ABI, !args ? [] : args, !signer ? undefined : signer, false, linkings);
}
let signedContracts = {};
export async function _summon(contractName:string, ABI:any, args:Array<any> = [], signer:Signer|undefined=undefined, singleton:boolean=true, linkings:Array<string>):Promise<Contract>{
  let result;
  if( singleton && !!signedContracts[contractName] ) {
    result = signedContracts[contractName];
  } else {
    const [first] = await getSharedSigners();
    if(!signer){
      signer = first;
    }

    let libs = {}
    await Promise.all(linkings.map(async libName=> libs[libName] = (await libDeploy(libName)).address ));
    const _Factory = await ethers.getContractFactory(contractName, {
      signer: signer,
      libraries: libs
    });

    const _Contract:Contract = await _Factory.deploy(...args);

    let provider = getSharedProvider();

    let contract:Contract = new ethers.Contract(_Contract.address, ABI, provider);

    let _signedContract:Contract = contract.connect(<Signer>signer);

    if(singleton) signedContracts[contractName] = _signedContract; // Don't save if one-time contract.

    result = _signedContract;
  }
  return result;
}


export function parseAddr(addr){
  if(!addr) throw new Error('Error: helper.parseAddr(undefined)');
  return `0x${addr.slice(26,addr.length)}`;
}
export function parseBool(bytes){
  return parseInt(bytes.slice(bytes.length-1, bytes.length)) === 1;
}
export function parseInteger(bytes){
  bytes = bytes.slice(2, bytes.length);
  return parseInt(bytes);
}

export async function getLogs(Contract:Contract, event, arg){
  return Contract.queryFilter(Contract.filters[event](arg), 0, (await getLatestBlock()).number);
}

const codec = new ethers.utils.AbiCoder();
export function encode(types, values){
  return codec.encode(types, values);
}
export function decode(types, data) {
  return codec.decode(types, data);  
} 

export async function increaseTime(skipDuration:number){
    const [first] = await getSharedSigners();
    first.provider.send("evm_increaseTime", [skipDuration])
    first.provider.send("evm_mine")
}

export function toERC20(amount:string, decimal:number=18): BigNumber{
    return ethers.utils.parseUnits(amount, decimal);
}
export function toFloat(amount:string, decimal:number=18):string{
  return ethers.utils.formatUnits(amount, decimal);
}

export async function getLatestBlock(){
  const [first] = await getSharedSigners();
  const provider = first.provider;
  const blockNumber:number = await provider.getBlockNumber();
  const block = await provider.getBlock( blockNumber );
  return block;
}
export async function onChainNow(){
  const block = await getLatestBlock();
  return block.timestamp;
}