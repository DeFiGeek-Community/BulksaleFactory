const isDebug = false;

import chalk from 'chalk';
const { ethers } = require("hardhat");
import { BigNumber } from 'ethers';

const reporter = (<any>global).reporter;
const { waffleJest } = require("@ethereum-waffle/jest");
expect.extend(waffleJest);
const betterexpect = (<any>expect); // TODO: better typing for waffleJest

import { summon, create, getSharedProvider, getSharedSigners, 
  parseAddr, parseBool, parseInteger, getLogs,
  encode, decode, increaseTime,
  toERC20, toFloat, onChainNow } from "./helper";
import { getBulksaleAbiArgs, getTokenAbiArgs, sendEther } from "./scenarioHelper";
import { State } from './parameterizedSpecs';
import { parameterizedSpecs } from './paramSpecEntrypoint';
import { Severity, Reporter } from "jest-allure/dist/Reporter";
import { suite, test } from '@testdeck/jest'
import fs from 'fs';
import { BalanceLogger } from '@src/BalanceLogger';
import { genABI } from '@src/genABI';

const FACTORY_ABI = genABI('Factory');
const SAMPLE_TOKEN_ABI = genABI('SampleToken');
const BULKSALEV1_ABI = genABI('BulksaleV1');

/* Parameterized Test (Testcases are in /test/parameterizedSpecs.ts) */
describe("Foundational scenario tests", function() {
    const {
        paramsSet,
        addTokenTemplateSpecs,
        tokenCloneDeploySpecs,
        addTemplateSpecs,
        approveSpecs,
        deploySpecs,
        depositSpecs,
        claimSpecs,
        deployerWithdrawalSpecs,
        foundationWithdrawalSpecs,
        endSpecs
     } = parameterizedSpecs("TokenTemplate");
    let provider;

    paramsSet.map(($p,i)=>{
        const templateName = $p.templateName;
        const tokenTemplateName = "OwnableToken.sol";
        describe($p.title, ()=>{
            (($p.only) ? it.only : it)(`creates a sale with ${templateName} template
                with sell/supply=${$p.sellingAmount}/${$p.totalIssuance}=${($p.totalIssuance!=0) ? Math.ceil(100*$p.sellingAmount/$p.totalIssuance) : '??'}%
                term: ${$p.eventDuration/(60*60*24)}days
                lock: ${$p.lockDuration/(60*60*24)}days
                expire: ${$p.expirationDuration/(60*60*24)}days
                minTarget: ${$p.minEtherTarget}ETH
                feeRate: ${$p.feeRatePerMil/10}%
                and try a claim`, async function() {


                /* 1. Set test reporter */
                reporter
                .description("")
                .severity(Severity.Critical)
                // .feature(Feature.Betting)
                .story("");

                /* 2. Set signed contracts */
                const [foundation,deployer,alice,bob,carl,david,eve,fin,george] = await getSharedSigners();
                const signer = foundation;
                const TOTAL_ISSUANCE:BigNumber = toERC20($p.totalIssuance);
                const SELLING_AMOUNT:BigNumber = toERC20($p.sellingAmount);
                const MIN_ETHER_TARGET:BigNumber = toERC20($p.minEtherTarget);

                /* `summon()`: Singleton contracts. */
                const Factory = await summon("Factory", FACTORY_ABI, [foundation.address], foundation);
                console.log(chalk.blue.bgBlack.bold(`
                \n=============================================\n
                Factory.address => ${Factory.address}
                \n=============================================\n
                `));



                /* `create()`: New token, every time. */
                const OwnableToken = await create("OwnableToken", SAMPLE_TOKEN_ABI, [], deployer);
                const BulksaleV1 = await summon("BulksaleV1", BULKSALEV1_ABI, [], foundation);
                if (!provider) provider = Factory.provider;

                /* 3. Exec scenario */
                const bl = new BalanceLogger({}, {foundation,Factory,deployer,alice,bob,carl,david,eve,fin,george}, provider, `${templateName}:${i}th-${$p.title}`);
                // await bl.log();
                if(isDebug) await bl.dump();


                /* 3-1. TokenTemplate deployment */
                const tokenTemplateAddr = OwnableToken.address;
                const argsForTokenClone = getTokenAbiArgs(tokenTemplateName, {
                    initialSupply: TOTAL_ISSUANCE,
                    name: "VeryGoodToken",
                    symbol: "VRG",
                    owner: deployer.address
                });
                /* Deployment begins */
                if( await Factory.templates(tokenTemplateName) === "0x0000000000000000000000000000000000000000" ) {
                    await Promise.all(addTokenTemplateSpecs[i].map(async assertion => await assertion(<State>{bl,Factory,signer:foundation,args:[tokenTemplateName, tokenTemplateAddr]}) ));
                    try {
                        await ( await Factory.connect(foundation).addTemplate(tokenTemplateName, tokenTemplateAddr) ).wait();
                    } catch (e) { if(isDebug) console.log(e.message) }
                } else {
                    if(isDebug) console.log(`${tokenTemplateName} is duplicated and addTemplate has been skipped.`)
                }
                await Promise.all(tokenCloneDeploySpecs[i].map(async assertion => await assertion(<State>{bl,Factory,SampleToken:OwnableTokenClone,signer:deployer, args: [tokenTemplateName, argsForTokenClone] }) ));
                let tokenCloneDeployResult;
                try {
                    tokenCloneDeployResult =
                        await ( await Factory.connect(deployer).deployTokenClone(tokenTemplateName, argsForTokenClone) ).wait();
                } catch (e) { if(isDebug) console.log(e.message) }
                if(!tokenCloneDeployResult) console.log(tokenTemplateName, argsForTokenClone)
                let tokenAddr = tokenCloneDeployResult.events[tokenCloneDeployResult.events.length-1].args[2];
                const OwnableTokenClone = (new ethers.Contract(tokenAddr, SAMPLE_TOKEN_ABI, provider));
                bl.setToken({SampleToken:OwnableTokenClone})
                await bl.log();
                /* Token clone instantiated */


                /* 3-2. Bulksale Template deployment */
                const bulksaleTemplateAddr = BulksaleV1.address;
                const argsForBulksaleClone = getBulksaleAbiArgs(templateName, {
                    token: tokenAddr,
                    start: await onChainNow() + $p.startModification,
                    eventDuration: $p.eventDuration,
                    lockDuration: $p.lockDuration,
                    expirationDuration: $p.expirationDuration,
                    sellingAmount: SELLING_AMOUNT,
                    minEtherTarget: MIN_ETHER_TARGET,
                    owner: deployer.address,
                    feeRatePerMil: $p.feeRatePerMil
                });
                if( await Factory.templates(templateName) === "0x0000000000000000000000000000000000000000" ) {
                    await Promise.all(addTemplateSpecs[i].map(async assertion => await assertion(<State>{bl,Factory,SampleToken:OwnableTokenClone,signer:foundation,args:[templateName, bulksaleTemplateAddr]}) ));
                    try {
                        await ( await Factory.connect(foundation).addTemplate(templateName, bulksaleTemplateAddr) ).wait();
                    } catch (e) { if(isDebug) console.log(e.message) }
                } else {
                    if(isDebug) console.log(`${templateName} is duplicated and addTemplate has been skipped.`)
                }

                await Promise.all(approveSpecs[i].map(async assertion => await assertion(<State>{bl,Factory,SampleToken:OwnableTokenClone,signer:deployer, args: [Factory.address, SELLING_AMOUNT] }) ));
                try {
                    await ( await OwnableTokenClone.connect(deployer).approve(Factory.address, SELLING_AMOUNT) ).wait();
                } catch (e) { if(isDebug) console.log(e.message) }

                await Promise.all(deploySpecs[i].map(async assertion => await assertion(<State>{bl,Factory,SampleToken:OwnableTokenClone,signer:deployer, args: [templateName, tokenAddr, SELLING_AMOUNT, argsForBulksaleClone] }) ));
                let saleDeployResult;
                try {
                    saleDeployResult = 
                        await ( await Factory.connect(deployer).deploy(templateName, tokenAddr, SELLING_AMOUNT, argsForBulksaleClone) ).wait();
                } catch (e) { if(isDebug) console.log(templateName, tokenAddr, SELLING_AMOUNT, argsForBulksaleClone) }
                if(!saleDeployResult) console.log(templateName, tokenAddr, SELLING_AMOUNT, argsForBulksaleClone)
                let latestBulksaleCloneAddr = saleDeployResult.events[saleDeployResult.events.length-1].args[2];
                const BulksaleClone = (new ethers.Contract(latestBulksaleCloneAddr, BULKSALEV1_ABI, provider));
                bl.setSigner({BulksaleV1:BulksaleClone});
                /* Deployment ended */


                /* Time flies */
                await increaseTime($p.timetravel1);
                /* Time flies */

                /* Session begins */
                await Promise.all(depositSpecs[i].map(async assertion => await assertion(<State>{bl,Factory,BulksaleV1:BulksaleClone,SampleToken:OwnableTokenClone,signer,args:[$p.lots.a, alice]}) ));
                try {
                    if(parseFloat($p.lots.a) !== 0) await sendEther(BulksaleClone.address, $p.lots.a, alice);
                } catch (e) { if(isDebug) console.log(e.message) }
                try {
                    if(parseFloat($p.lots.b) !== 0) await sendEther(BulksaleClone.address, $p.lots.b, bob);
                } catch (e) { if(isDebug) console.log(e.message) }
                try {
                    if(parseFloat($p.lots.c) !== 0) await sendEther(BulksaleClone.address, $p.lots.c, carl);
                } catch (e) { if(isDebug) console.log(e.message) }
                try {
                    if(parseFloat($p.lots.d) !== 0) await sendEther(BulksaleClone.address, $p.lots.d, david);
                } catch (e) { if(isDebug) console.log(e.message) }
                try {
                    if(parseFloat($p.lots.e) !== 0) await sendEther(BulksaleClone.address, $p.lots.e, eve);
                } catch (e) { if(isDebug) console.log(e.message) }
                try {
                    if(parseFloat($p.lots.f) !== 0) await sendEther(BulksaleClone.address, $p.lots.f, fin);
                } catch (e) { if(isDebug) console.log(e.message) }
                try {
                    if(parseFloat($p.lots.g) !== 0) await sendEther(BulksaleClone.address, $p.lots.g, george);
                } catch (e) { if(isDebug) console.log(e.message) }
                /* Session ends */



                /* Time flies */
                await increaseTime($p.timetravel2);
                /* Time flies */


                /*
                    Finalize each own result
                */
                /* Simply for themselves */
                await Promise.all(claimSpecs[i].map(async assertion => assertion(<State>{bl,Factory,BulksaleV1:BulksaleClone,SampleToken:OwnableTokenClone,signer:alice,args:[alice.address, alice.address]}) ));
                try {
                    await (await BulksaleClone.connect(alice).claim(alice.address, alice.address)).wait();
                } catch (e) { if(isDebug) console.log(e.message) }

                try {
                    await (await BulksaleClone.connect(bob).claim(bob.address, bob.address)).wait();
                } catch (e) { if(isDebug) console.log(e.message) }

                try {
                    await (await BulksaleClone.connect(carl).claim(carl.address, carl.address)).wait();
                } catch (e) { if(isDebug) console.log(e.message) }

                try {
                    await (await BulksaleClone.connect(david).claim(david.address, david.address)).wait();
                } catch (e) { if(isDebug) console.log(e.message) }

                /* alice claims for gas-less-eve */
                try {
                    await (await BulksaleClone.connect(alice).claim(eve.address, eve.address)).wait();
                } catch (e) { if(isDebug) console.log(e.message) }

                /* fin gives his contribution to gas-less-george */
                try {
                    await (await BulksaleClone.connect(fin).claim(fin.address, george.address)).wait();
                } catch (e) { if(isDebug) console.log(e.message) }

                /* withdraw the raised fund */
                await Promise.all(deployerWithdrawalSpecs[i].map(async assertion => await assertion(<State>{bl,Factory,BulksaleV1:BulksaleClone,SampleToken:OwnableTokenClone,signer:deployer,args:[]}) ));
                try {
                    await (await BulksaleClone.connect(deployer).withdrawProvidedETH()).wait();
                } catch (e) { if(isDebug) console.log(e.message) }

                /* Platform withdraws fee */
                await bl.log();
                await Promise.all(foundationWithdrawalSpecs[i].map(async assertion => await assertion(<State>{bl,Factory,BulksaleV1:BulksaleClone,SampleToken:OwnableTokenClone,signer:foundation,args:[foundation.address, bl.get('Factory', 'eth')]}) ));
                try {
                    await (await Factory.connect(foundation).withdraw(foundation.address, bl.get('Factory', 'eth') )).wait();
                } catch (e) { if(isDebug) console.log(e.message) }

                await increaseTime($p.timetravel3);
                await bl.log();
                await bl.dump();

                /* 4. Verify  */
                await Promise.all(endSpecs[i].map(async assertion => await assertion(<State>{bl,Factory,BulksaleV1:BulksaleClone,SampleToken:OwnableTokenClone,signer:foundation,args:[]}) ));
            });
        })
    });
});
