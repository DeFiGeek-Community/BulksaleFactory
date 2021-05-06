const { ethers } = require("hardhat");
import { BigNumber } from 'ethers';

const reporter = (<any>global).reporter;
const { waffleJest } = require("@ethereum-waffle/jest");
expect.extend(waffleJest);
const betterexpect = (<any>expect);

import { summon,getSharedProvider, getSharedSigners, 
  parseAddr, parseBool, parseInteger, getLogs,
  encode, decode, increaseTime, BalanceLogger,
  toERC20, toFloat } from "./helper";
import { getAbiArgs, sendEther } from "./scenarioHelper";
import { Severity, Reporter } from "jest-allure/dist/Reporter";
import { suite, test } from '@testdeck/jest'

const FACTORY_ABI = [
    'function predeploy(address, uint)',
    'function deploy(string, address, uint, bytes)',
    'function addTemplate(string, address)',
    'function withdraw(address, uint)'
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

    it("creates a bulksale and success to claim", async function() {

        /* 1. Set test reporter */
        reporter
        .description("")
        .severity(Severity.Critical)
        // .feature(Feature.Betting)
        .story("");

        /* 2. Set signed contracts */
        const [foundation,deployer,alice,bob,carl,david,eve,fin,george] = await getSharedSigners();
        const TOTAL_ISSUANCE:BigNumber = toERC20("1000000000.322288888322288888");
        const SELLING_AMOUNT:BigNumber = toERC20("300000000.532312999532312999");

        const Factory = await summon("Factory", FACTORY_ABI, [foundation.address], foundation);
        const SampleToken = await summon("SampleToken", SampleToken_ABI, [TOTAL_ISSUANCE], deployer);
        const BulksaleV1 = await summon("BulksaleV1", BULKSALEV1_ABI, [], foundation);

        const provider = getSharedProvider();
        const balanceLogger = new BalanceLogger({SampleToken}, {foundation,Factory,deployer,BulksaleV1,alice,bob,carl,david,eve,fin,george}, provider);
        await balanceLogger.dump();


        /* 3. Exec scenario */
        const tokenAddr = SampleToken.address;
        const bulksaleAddr = BulksaleV1.address;
        const templateName = 'Bulksale_DefiGeek_20210505';
        let anHourLater = Math.ceil(Date.now()/1000) + 60*60;
        let sevenDays = 7*24*60*60;
        const argsTokenOnSale = getAbiArgs(templateName, {
            token: tokenAddr,
            start: anHourLater,
            eventDuration: sevenDays,
            lockDuration: sevenDays*4,
            expirationDuration: sevenDays*4*6,
            sellingAmount: SELLING_AMOUNT,
            minEtherTarget:1,
            owner: deployer.address,
            feeRatePerMil: 1
        });

        /* Deployment begins */
        await ( await Factory.connect(foundation).addTemplate(templateName, bulksaleAddr) ).wait();
        await ( await SampleToken.connect(deployer).approve(Factory.address, SELLING_AMOUNT) ).wait();
        await ( await Factory.connect(deployer).deploy(templateName, tokenAddr, SELLING_AMOUNT, argsTokenOnSale) ).wait();
        /* Deployment ended */


        /* Time flies */
        await increaseTime(2*60*60);
        /* Time flies */


        /* Session begins */
        let deployResult = await getLogs(Factory, 'Deployed', deployer.address);
        let logDeployedBulksaleAddr = parseAddr(deployResult[0].topics[3]);
        const BulksaleClone = (new ethers.Contract(logDeployedBulksaleAddr, BULKSALEV1_ABI, provider));

        await sendEther(BulksaleClone.address, "10.345", alice);
        await sendEther(BulksaleClone.address, "10.1322", bob);
        await sendEther(BulksaleClone.address, "20.1322", carl);
        await sendEther(BulksaleClone.address, "30.1322", david);
        await sendEther(BulksaleClone.address, "10.0322", eve);
        await sendEther(BulksaleClone.address, "100.1322", fin);
        /* Session ends */


        /* Time flies */
        await increaseTime(7*24*60*60);
        /* Time flies */


        /* Finalize each own result */
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
        await (await Factory.connect(foundation).withdraw(foundation.address, ethers.utils.parseEther('0.00001'))).wait();

        await increaseTime(60*60);

        let balances = await balanceLogger.getBalances();
        await balanceLogger.dump();




        // /* 4. Verify  */
        betterexpect(balances['deployer']['SampleToken']).toEqBN(TOTAL_ISSUANCE.sub(SELLING_AMOUNT));
        betterexpect(balances['alice']['SampleToken']).toBeGtBN(0);
        betterexpect(balances['bob']['SampleToken']).toBeGtBN(0);
        betterexpect(balances['carl']['SampleToken']).toBeGtBN(0);
        betterexpect(balances['david']['SampleToken']).toBeGtBN(0);
        betterexpect(balances['eve']['SampleToken']).toBeGtBN(0);
        betterexpect(balances['fin']['SampleToken']).toEqBN(0);

        /* Check that no token is stucked in */
        betterexpect(balances['BulksaleV1']['eth']).toEqBN(0);
        /* FeePool */
        betterexpect(balances['foundation']['eth']).toBeGtBN(0);
        betterexpect(balances['Factory']['eth']).toBeGtBN(0);
    });
});

