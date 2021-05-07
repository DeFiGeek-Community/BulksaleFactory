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
  list: Array<any>;
  constructor(_TokensObj, _signersObj, _provider){
    /*
      new Logger({SampleToken1, SampleToken2}, {owner,alice,bob,PoolContract});
    */
    this.TokensObj = _TokensObj;
    this.signersObj = _signersObj;
    this.provider = _provider;
    this.list = [];
  }
  async log(){
    this.list.push(await this.getBalances());
  }
  diff(person:string, token:string): BigNumber{
    let newBal: BigNumber = this.list[this.list.length-1][person][token];
    let oldBal: BigNumber = this.list[0][person][token];
    return newBal.sub(oldBal);
  }
  diffStr(person:string, token:string): string{
    if(this.list.length < 2) return "-";
    return toFloat(this.diff(person, token).toString());
  }
  ltAbsOneBN(bn:BigNumber|string){
    let isNumber:boolean=false, num:number;
    let isBigNumber:boolean = ethers.BigNumber.isBigNumber(bn);
    const maxStr = `${Number.MAX_SAFE_INTEGER}`;

    if(!isBigNumber && (<string>bn).length >= maxStr.length) {
      return false;
    } else if ((<string>bn).length == maxStr.length && (<string>bn).slice(0,1) == maxStr.slice(0,1)) {
      return false
    }
    if(isBigNumber){
      try {
        isNumber =
          (<BigNumber>bn).gt(-1*(Number.MAX_SAFE_INTEGER-1))
          &&
          (<BigNumber>bn).lt(Number.MAX_SAFE_INTEGER-1);
      } catch (e) {
        console.error(e.message);
      }

      try {
        num = (<BigNumber>bn).toNumber();
      } catch (e) {
        return false;
      }

    } else {
      isNumber = true;
      num = parseInt(<string>bn);
    }

    if(isNumber) {
      return -1 < num && num < 1;
    } else {
      return false;
    }
  }
  async dump(){
    let arr1 = await Promise.all(
      Object.keys(this.signersObj).map(async username=>{
        const un:string = username.padEnd(10, ' ');
        let arr2 = await Promise.all(
          Object.keys(this.TokensObj).map(async tokenName=>{
            const tn:string = tokenName.padEnd(10, ' ');
            const val:string = toFloat( (await this.TokensObj[tokenName].balanceOf(this.signersObj[username].address)).toString() ).padEnd(30, ' ');
            return `${tn}:${val}`
          })
        );
        if(username.match(/^[A-Z][a-zA-Z0-9]+/)){
          /* contract balance */
          let Contract = this.signersObj[username];
          const val = toFloat((await Contract.provider.getBalance(Contract.address)).toString() ).padEnd(14, ' ');
          arr2.unshift(`${un}: eth:${val}`);
        } else {
          /* EOA balance */
          const val = toFloat((await this.signersObj[username].getBalance()).toString() ).padEnd(14, ' ');
          arr2.unshift(`${un}: eth:${val}`);
        }
        const _val = this.diffStr(username, 'eth').padEnd(14, ' ');
        arr2.push(`diff::eth ${_val}`);
        Object.keys(this.TokensObj).map(async tokenName=>{
          const tn:string = tokenName.padEnd(10, ' ');
          const val = this.diffStr(username, tokenName).padEnd(14, ' ');
          arr2.push(`diff::${tn} ${val}`);
        })
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
