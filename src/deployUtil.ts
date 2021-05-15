import {readFileSync,writeFileSync} from 'fs';
const addressExp = /address public constant factory = address\(0x([0-9a-fA-F]{40})\);/;
const localFactoryAddressPath = '.localFactoryAddress';
const uptreamFactoryAddressPath = '.uptreamFactoryAddress';

export function hardcodeFactoryAddress(filename, address){
  let path = `contracts/${filename}.sol`;
  let tmp = readFileSync(path).toString().replace(
    addressExp,
    `address public constant factory = address(${address});`
  );
  writeFileSync(path, tmp);
}

export function preserveLocalFactoryAddress(filename){
  writeFileSync(localFactoryAddressPath, extractEmbeddedFactoryAddress(filename));
}
export function getLocalFactoryAddress(){
  return readFileSync(localFactoryAddressPath).toString();
}

export function preserveUpstreamFactoryAddress(filename){
  writeFileSync(uptreamFactoryAddressPath, extractEmbeddedFactoryAddress(filename));
}
export function getUpstreamFactoryAddress(){
  return readFileSync(uptreamFactoryAddressPath).toString();
}

export function preserveUpstreamTemplateAddress(codename, templateAddress){
  writeFileSync(`.upstream${codename}Address`, templateAddress);
}
export function getUpstreamTemplateAddress(codename){
  return readFileSync(`.upstream${codename}Address`).toString();
}


export function recoverFactoryAddress(filename){
  let path = `contracts/${filename}.sol`;
  let tmp = readFileSync(path).toString().replace(
    addressExp,
    `address public constant factory = address(${getLocalFactoryAddress()});`
  );
  writeFileSync(path, tmp);
}

export function extractEmbeddedFactoryAddress(filename){
  let path = `contracts/${filename}.sol`;
  let group = readFileSync(path).toString().match(addressExp);
  return `0x${group[1]}`;
}