const { ethers } = require("hardhat");
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

export async function summon(contractName:string, ABI:any, args:Array<any> = []){
  const [owner] = await getSharedSigners();

  const _Factory = await ethers.getContractFactory(contractName);

  const _Contract = await _Factory.deploy(...args);

  let provider = getSharedProvider();

  let contract = new ethers.Contract(_Contract.address, ABI, provider);

  let signedContract = contract.connect(owner);

  signedContract._Contract = _Contract;
  return signedContract;
}


export function parseAddr(addr){
  return `0x${addr.slice(26,addr.length)}`;
}
export function parseBool(bytes){
  return parseInt(bytes.slice(bytes.length-1, bytes.length)) === 1;
}
export function parseInteger(bytes){
  bytes = bytes.slice(2, bytes.length);
  return parseInt(bytes);
}

export async function getLogs(Contract, event, arg, from=0, to=100){
  return Contract.queryFilter(Contract._Contract.filters[event](arg), from, to);
}

const codec = new ethers.utils.AbiCoder();
export function encode(types, values){
  return codec.encode(types, values);
}
export function decode(types, data) {
  return codec.decode(types, data);  
} 

export async function increaseTime(skipDuration:number){
    const [owner] = await getSharedSigners();
    owner.provider.send("evm_increaseTime", [skipDuration])
    owner.provider.send("evm_mine")
}
