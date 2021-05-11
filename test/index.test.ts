const isDebug = false;

const { ethers } = require("hardhat");
import { BigNumber } from 'ethers';

const reporter = (<any>global).reporter;
const { waffleJest } = require("@ethereum-waffle/jest");
expect.extend(waffleJest);
const betterexpect = (<any>expect); // TODO: better typing for waffleJest

import { summon, create, getSharedProvider, getSharedSigners, 
  parseAddr, parseBool, parseInteger, getLogs,
  encode, decode, increaseTime, BalanceLogger,
  toERC20, toFloat, onChainNow } from "./helper";
import { getAbiArgs, sendEther, parameterizedSpecs } from "./scenarioHelper";
import { State } from './parameterizedSpecs';
import { Severity, Reporter } from "jest-allure/dist/Reporter";
import { suite, test } from '@testdeck/jest'

const FACTORY_ABI = [
    'function deploy(string, address, uint, bytes)',
    'function addTemplate(string, address)',
    'function withdraw(address, uint)',
    'function templates(string) view returns (address)',
    'event Deployed(address indexed, address indexed, address indexed, bytes);'
];
const SampleToken_ABI = [
    "function balanceOf(address) view returns (uint)",
    "function transfer(address, uint256) returns (bool)",
    "function approve(address, uint)"
];
const BULKSALEV1_ABI = [
    "function claim(address, address)",
    "function withdrawProvidedETH()",
    "function withdrawERC20Onsale()",
    "function withdrawUnclaimedERC20OnSale()",
    "function startingAt() view returns (uint)",
    "function closingAt() view returns (uint)",
    "event WithdrawnOnFailed(address, uint)",
    "event WithdrawnAfterLockDuration(address, uint)",
];


/* TestUtil */
describe("BalanceLogger", function(){
    describe(".ltAbsOneBN()", function(){
        let bl;
        beforeAll(()=>{
            bl = new BalanceLogger({}, {}, getSharedProvider(), 'foo');
        })
        it("checks 1", ()=> expect( bl.ltAbsOneBN("1") ).toBe(false) )
        it("checks -1", ()=> expect( bl.ltAbsOneBN("-1") ).toBe(false) )
        it("checks 1*10^18", ()=> expect( bl.ltAbsOneBN(toERC20("1")) ).toBe(false) )
        it("checks -1*10^18", ()=> expect( bl.ltAbsOneBN(toERC20("-1")) ).toBe(false) )
        it("checks 0", ()=> expect( bl.ltAbsOneBN("0") ).toBe(true) )
        it("checks 0.0", ()=> expect( bl.ltAbsOneBN("0.0") ).toBe(true) )
        it("checks 0*10^18", ()=> expect( bl.ltAbsOneBN(toERC20("0")) ).toBe(true) )
        it("checks 0.9", ()=> expect( bl.ltAbsOneBN("0.9") ).toBe(true) )
        it("checks 0.9*10^18", ()=> expect( bl.ltAbsOneBN(toERC20("0.9")) ).toBe(false) )
        it("checks -0.9", ()=> expect( bl.ltAbsOneBN("-0.9") ).toBe(true) )
        it("checks -0.9*10^18", ()=> expect( bl.ltAbsOneBN(toERC20("-0.9")) ).toBe(false) )
        it("checks 9007199254740990", ()=> expect( bl.ltAbsOneBN("9007199254740990") ).toBe(false) )
        it("checks 9007199254740991", ()=> expect( bl.ltAbsOneBN("9007199254740991") ).toBe(false) )
        it("checks 300000000532312999532312999", ()=> expect( bl.ltAbsOneBN("300000000532312999532312999") ).toBe(false) )
        it("checks 18159105037311609774740371", ()=> expect( bl.ltAbsOneBN("18159105037311609774740371") ).toBe(false) )
        it("checks -18159105037311609774740371.000000000000001", ()=> expect( bl.ltAbsOneBN("-18159105037311609774740371.000000000000001") ).toBe(false) )
        it("checks 115,792,089,237,316,195,423,570,985,008,687,907,853,269,984,‌​665,640,564,039,457", ()=> expect( bl.ltAbsOneBN("115,792,089,237,316,195,423,570,985,008,687,907,853,269,984,‌​665,640,564,039,457".replace(/,/,'')) ).toBe(false) )     
    });
});

/* Parameterized Test (Testcases are in /test/parameterizedSpecs.ts) */
describe("Factory", function() {
    const {
        paramsSet,
        addTemplateSpecs,
        approveSpecs,
        deploySpecs,
        depositSpecs,
        claimSpecs,
        deployerWithdrawalSpecs,
        foundationWithdrawalSpecs,
        endSpecs
     } = parameterizedSpecs();
    let provider;

    paramsSet.map(($p,i)=>{
        const templateName = $p.templateName;
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
                /* `create()`: New token, every time. */
                const SampleToken = await create("SampleToken", SampleToken_ABI, [TOTAL_ISSUANCE], deployer);
                const BulksaleV1 = await summon("BulksaleV1", BULKSALEV1_ABI, [], foundation);
                if (!provider) provider = getSharedProvider();

                const bl = new BalanceLogger({SampleToken}, {foundation,Factory,deployer,BulksaleV1,alice,bob,carl,david,eve,fin,george}, provider, `${templateName}:${i}th-${$p.title}`);

                await bl.log();
                if(isDebug) await bl.dump();


                /* 3. Exec scenario */
                const tokenAddr = SampleToken.address;
                const bulksaleAddr = BulksaleV1.address;
                const argsForClone = getAbiArgs(templateName, {
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

                /* Deployment begins */
                if( await Factory.templates(templateName) === "0x0000000000000000000000000000000000000000" ) {
                    await Promise.all(addTemplateSpecs[i].map(async assertion => await assertion(<State>{bl,Factory,BulksaleV1,SampleToken,signer:foundation,args:[templateName, bulksaleAddr]}) ));
                    try {
                        await ( await Factory.connect(foundation).addTemplate(templateName, bulksaleAddr) ).wait();
                    } catch (e) { if(isDebug) console.log(e.message) }
                }

                await Promise.all(approveSpecs[i].map(async assertion => await assertion(<State>{bl,Factory,BulksaleV1,SampleToken,signer:deployer, args: [Factory.address, SELLING_AMOUNT] }) ));
                try {
                    await ( await SampleToken.connect(deployer).approve(Factory.address, SELLING_AMOUNT) ).wait();
                } catch (e) { if(isDebug) console.log(e.message) }

                await Promise.all(deploySpecs[i].map(async assertion => await assertion(<State>{bl,Factory,BulksaleV1,SampleToken,signer:deployer, args: [templateName, tokenAddr, SELLING_AMOUNT, argsForClone] }) ));
                try {
                    await ( await Factory.connect(deployer).deploy(templateName, tokenAddr, SELLING_AMOUNT, argsForClone) ).wait();
                } catch (e) { if(isDebug) console.log(e.message) }
                /* Deployment ended */


                /* Time flies */
                await increaseTime($p.timetravel1);
                /* Time flies */


                /* Session begins */
                let deployResult = await getLogs(Factory, 'Deployed', null);
                let latestBulksaleCloneAddr = deployResult[deployResult.length-1].args[2];
                const BulksaleClone = (new ethers.Contract(latestBulksaleCloneAddr, BULKSALEV1_ABI, provider));

                await Promise.all(depositSpecs[i].map(async assertion => await assertion(<State>{bl,Factory,BulksaleV1,BulksaleClone,SampleToken,signer,args:[$p.lots.a, alice]}) ));
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
                await Promise.all(claimSpecs[i].map(async assertion => assertion(<State>{bl,Factory,BulksaleV1,BulksaleClone,SampleToken,signer:alice,args:[alice.address, alice.address]}) ));
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
                await Promise.all(deployerWithdrawalSpecs[i].map(async assertion => await assertion(<State>{bl,Factory,BulksaleV1,BulksaleClone,SampleToken,signer:deployer,args:[]}) ));
                try {
                    await (await BulksaleClone.connect(deployer).withdrawProvidedETH()).wait();
                } catch (e) { if(isDebug) console.log(e.message) }

                /* Platform withdraws fee */
                await bl.log();
                await Promise.all(foundationWithdrawalSpecs[i].map(async assertion => await assertion(<State>{bl,Factory,BulksaleV1,BulksaleClone,SampleToken,signer:foundation,args:[foundation.address, bl.get('Factory', 'eth')]}) ));
                try {
                    await (await Factory.connect(foundation).withdraw(foundation.address, bl.get('Factory', 'eth') )).wait();
                } catch (e) { if(isDebug) console.log(e.message) }

                await increaseTime($p.timetravel3);
                await bl.log();
                await bl.dump();

                /* 4. Verify  */
                await Promise.all(endSpecs[i].map(async assertion => await assertion(<State>{bl,Factory,BulksaleV1,BulksaleClone,SampleToken,signer:foundation,args:[]}) ));
            });
        })
    });
});
