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
import { Severity, Reporter } from "jest-allure/dist/Reporter";
import { suite, test } from '@testdeck/jest'

const FACTORY_ABI = [
    'function predeploy(address, uint)',
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
    "function withdrawProvidedETH()"
];


describe("Factory", function() {
    const { paramsSet, testcases } = parameterizedSpecs();
    let provider;

    paramsSet.map(($p,i)=>{
        const templateName = $p.templateName;
        it(`creates a ${templateName} bulksale
            with ${$p.sellingAmount}/${$p.totalIssuance}
            and try a claim`, async function() {

            /* 1. Set test reporter */
            reporter
            .description("")
            .severity(Severity.Critical)
            // .feature(Feature.Betting)
            .story("");

            /* 2. Set signed contracts */
            const [foundation,deployer,alice,bob,carl,david,eve,fin,george] = await getSharedSigners();
            const TOTAL_ISSUANCE:BigNumber = toERC20($p.totalIssuance);
            const SELLING_AMOUNT:BigNumber = toERC20($p.sellingAmount);
            const MIN_ETHER_TARGET:BigNumber = toERC20($p.minEtherTarget);

            /* `summon()`: Singleton contracts. */
            const Factory = await summon("Factory", FACTORY_ABI, [foundation.address], foundation);
            /* `create()`: New token, every time. */
            const SampleToken = await create("SampleToken", SampleToken_ABI, [TOTAL_ISSUANCE], deployer);
            const BulksaleV1 = await summon("BulksaleV1", BULKSALEV1_ABI, [], foundation);
            if (!provider) provider = getSharedProvider();

            const bl = new BalanceLogger({SampleToken}, {foundation,Factory,deployer,BulksaleV1,alice,bob,carl,david,eve,fin,george}, provider, `${templateName}:${i}`);

            await bl.log();
            await bl.dump();


            /* 3. Exec scenario */
            const tokenAddr = SampleToken.address;
            const bulksaleAddr = BulksaleV1.address;
            const argsTokenOnSale = getAbiArgs(templateName, {
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
                await ( await Factory.connect(foundation).addTemplate(templateName, bulksaleAddr) ).wait();
            }
            await ( await SampleToken.connect(deployer).approve(Factory.address, SELLING_AMOUNT) ).wait();
            await ( await Factory.connect(deployer).deploy(templateName, tokenAddr, SELLING_AMOUNT, argsTokenOnSale) ).wait();
            /* Deployment ended */


            /* Time flies */
            await increaseTime($p.timetravel1);
            /* Time flies */


            /* Session begins */
            let deployResult = await getLogs(Factory, 'Deployed', deployer.address);
            let latestBulksaleCloneAddr = parseAddr(deployResult[deployResult.length-1].topics[3]);
            const BulksaleClone = (new ethers.Contract(latestBulksaleCloneAddr, BULKSALEV1_ABI, provider));

            if(parseFloat($p.lots.a) !== 0) await sendEther(BulksaleClone.address, $p.lots.a, alice);
            if(parseFloat($p.lots.b) !== 0) await sendEther(BulksaleClone.address, $p.lots.b, bob);
            if(parseFloat($p.lots.c) !== 0) await sendEther(BulksaleClone.address, $p.lots.c, carl);
            if(parseFloat($p.lots.d) !== 0) await sendEther(BulksaleClone.address, $p.lots.d, david);
            if(parseFloat($p.lots.e) !== 0) await sendEther(BulksaleClone.address, $p.lots.e, eve);
            if(parseFloat($p.lots.f) !== 0) await sendEther(BulksaleClone.address, $p.lots.f, fin);
            if(parseFloat($p.lots.g) !== 0) await sendEther(BulksaleClone.address, $p.lots.g, george);
            /* Session ends */


            /* Time flies */
            await increaseTime($p.timetravel2);
            /* Time flies */


            /*
                Finalize each own result
            */
            /* Simply for themselves */
            await (await BulksaleClone.connect(alice).claim(alice.address, alice.address)).wait();
            await (await BulksaleClone.connect(bob).claim(bob.address, bob.address)).wait();
            await (await BulksaleClone.connect(carl).claim(carl.address, carl.address)).wait();
            await (await BulksaleClone.connect(david).claim(david.address, david.address)).wait();

            /* alice claims for gas-less-eve */
            await (await BulksaleClone.connect(alice).claim(eve.address, eve.address)).wait();

            /* fin gives his contribution to gas-less-george */
            await (await BulksaleClone.connect(fin).claim(fin.address, george.address)).wait();

            /* withdraw the raised fund */
            await (await BulksaleClone.connect(deployer).withdrawProvidedETH()).wait();

            /* Platform withdraws fee */
            await bl.log();
            await (await Factory.connect(foundation).withdraw(foundation.address, bl.get('Factory', 'eth') )).wait();

            await increaseTime($p.timetravel3);
            await bl.log();
            await bl.dump();

            /* 4. Verify  */
            testcases[i].map(assertion=> assertion(bl) );
        });
    });
});

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
    });
});