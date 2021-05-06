const { ethers } = require("hardhat");
import { BigNumber } from 'ethers';
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

export async function summon(contractName:string, ABI:any, args:Array<any> = [], signer=null){
  const [first] = await getSharedSigners();
  if(!signer){
    signer = first;
  }

  const _Factory = await ethers.getContractFactory(contractName, signer);

  const _Contract = await _Factory.deploy(...args);

  let provider = getSharedProvider();

  let contract = new ethers.Contract(_Contract.address, ABI, provider);

  let signedContract = contract.connect(signer);

  signedContract._Contract = _Contract;
  return signedContract;
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
    const [first] = await getSharedSigners();
    first.provider.send("evm_increaseTime", [skipDuration])
    first.provider.send("evm_mine")
}

export class BalanceLogger{
  TokensObj: any;
  signersObj: any;
  provider: any;
  constructor(_TokensObj, _signersObj, _provider){
    /*
      new Logger({SampleToken1, SampleToken2}, {owner,alice,bob,PoolContract});
    */
    this.TokensObj = _TokensObj;
    this.signersObj = _signersObj;
    this.provider = _provider;
  }
  async dump(){
    let arr1 = await Promise.all(
      Object.keys(this.signersObj).map(async username=>{
        let arr2 = await Promise.all(
          Object.keys(this.TokensObj).map(async tokenName=>{
            return `${tokenName}:${toFloat( (await this.TokensObj[tokenName].balanceOf(this.signersObj[username].address)).toString() )}`
          })
        );
        if(username.match(/^[A-Z][a-zA-Z0-9]+/)){
          /* contract balance */
          let Contract = this.signersObj[username];
          arr2.unshift(`${username}: eth:${toFloat((await Contract.provider.getBalance(Contract.address)).toString() )}`);
        } else {
          /* EOA balance */
          arr2.unshift(`${username}: eth:${toFloat((await this.signersObj[username].getBalance()).toString() )}`);
        }
        return arr2.join(" ");
      })
    );
    console.log(arr1.join("\n"));
  }
  async getBalances(){
    let obj = {};
    await Promise.all(
      Object.keys(this.signersObj).map(async username=>{
        obj[username] = {};
        if(username.match(/^[A-Z][a-zA-Z0-9]+/)){
          /* contract balance */
          let Contract = this.signersObj[username];
          obj[username].eth = await Contract.provider.getBalance(Contract.address);
        } else {
          /* EOA balance */
          obj[username].eth = await this.signersObj[username].getBalance();
        }
        await Promise.all(
          Object.keys(this.TokensObj).map(async tokenName=>{
            obj[username][tokenName] = await this.TokensObj[tokenName].balanceOf(this.signersObj[username].address);
            return true;
          })
        );
        return true;
      })
    );
    return obj;
  }
}
export function toERC20(amount:string, decimal:number=18): BigNumber{
    return ethers.utils.parseUnits(amount, decimal);
}
export function toFloat(amount:string, decimal:number=18):string{
  return ethers.utils.formatUnits(amount, decimal);
}
