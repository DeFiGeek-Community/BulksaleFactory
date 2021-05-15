require('dotenv').config();

import * as ethers from 'ethers';
import { BigNumber, Wallet, getDefaultProvider, Contract } from 'ethers';
import { genABI } from './genABI';



// const provider = ethers.getDefaultProvider('rinkeby', { alchemy: process.env.ALCHEMY_API_TOKEN });
const provider = ethers.getDefaultProvider('rinkeby', { infura: process.env.INFURA_API_TOKEN });
const foundation = new Wallet(process.env.FOUNDATION_PRIVATE_KEY, provider);


export async function addTemplate(templateName, factoryAddress, templateAddress){
    const Factory = (new ethers.Contract(factoryAddress, genABI('Factory'), provider));
    const Template = (new ethers.Contract(templateAddress, genABI(templateName), provider));

    /*
        consistency check
    */
    const _embeddedFactoryAddress = await Template.factory();
    if(_embeddedFactoryAddress !== factoryAddress) throw new Error(`_embeddedFactoryAddress=${_embeddedFactoryAddress} is not equal to factoryAddress=${factoryAddress}`);

    /*
        Finding unique name
    */
    function genName(filename, i){ return `${filename}.${i}.sol` }
    let nonce = 0;
    let name;
    let lookupResult;
    while(lookupResult == "0x0000000000000000000000000000000000000000" || !lookupResult) {
        name = genName(templateName, nonce);
        lookupResult = await Factory.templates(name);
        nonce++;
    }


    /*
        adding
    */
    try {
        await (
            await Factory.connect(foundation)
            .addTemplate(
                name,
                Template.address
            ,{gasLimit: 10000000})
        ).wait();
    } catch (e) {
        console.trace(e.message);
    }

    console.log(name, await Factory.templates(name));    
}