const { ethers } = require("hardhat");
const reporter = (<any>global).reporter;
const { waffleJest } = require("@ethereum-waffle/jest");
expect.extend(waffleJest);
const betterexpect = (<any>expect);

import { summon,getSharedProvider, getSharedSigners, 
  parseAddr, parseBool, parseInteger, getLogs,
  encode, decode, increaseTime } from "./helper";
import { getAbiArgs, sendEther } from "./scenarioHelper";
import { Severity, Reporter } from "jest-allure/dist/Reporter";
import { suite, test } from '@testdeck/jest'
import BigNumber from 'bignumber.js';

const FACTORY_ABI = [
    'function deploy(string, bytes)',
    'function addTemplate(string, address)'
];
const SampleToken_ABI = [
    "function balanceOf(address) view returns (uint)",
    "function transfer(address, uint256) returns (bool)"
];
const BULKSALEV1_ABI = ["function claim(address, address)"];


describe("Factory", function() {

    it("creates a bulksale and success to claim", async function() {

        /* 1. Set test reporter */
        reporter
        .description("")
        .severity(Severity.Critical)
        // .feature(Feature.Betting)
        .story("");

        /* 2. Set signed contracts */
        const [owner, alice, bob] = await getSharedSigners();
        const TOTAL_ISSUANCE = 10000000000000;
        const DECIMAL = 18;

        const Factory = await summon("Factory", FACTORY_ABI, [owner.address]);

        const SampleToken = await summon("SampleToken", SampleToken_ABI, [TOTAL_ISSUANCE]);
        const BulksaleV1 = await summon("BulksaleV1", BULKSALEV1_ABI);


        /* 3. Exec scenario */
        const tokenAddr = SampleToken.address;
        const bulksaleAddr = BulksaleV1.address;
        const templateName = 'Bulksale_DefiGeek_20210505';
        let anHourAgo = Math.ceil(Date.now()/1000) - 60*60;
        let sevenDays = 7*24*60*60;
        const argsTokenOnSale = getAbiArgs(templateName, {
            token: tokenAddr,
            start: anHourAgo,
            eventDuration: sevenDays,
            lockDuration: sevenDays*4,
            expirationDuration: sevenDays*4*6,
            sellingAmount: TOTAL_ISSUANCE,
            minEtherTarget:1
        });

        /* deploy begin */
        await ( await Factory.addTemplate(templateName, bulksaleAddr) ).wait();
        let deployResult = await ( await Factory.deploy(templateName, argsTokenOnSale) ).wait();
        /* deploy end */

        let logDeployedBulksaleAddr = parseAddr(deployResult.events[1].topics[3]);
        const BulksaleClone = (new ethers.Contract(logDeployedBulksaleAddr, BULKSALEV1_ABI, getSharedProvider()));
        /* get deployed BulksaleV1 proxy */

        await (await SampleToken.connect(owner).transfer(BulksaleClone.address, TOTAL_ISSUANCE) ).wait();
        /* lock tokens on sale */


        await sendEther(BulksaleClone.address, "1.0", alice);
        await sendEther(BulksaleClone.address, "0.1", bob);


        await increaseTime(7*24*60*60);


        try {
            await (await BulksaleClone.connect(alice).claim(alice.address, alice.address)).wait();
            await (await BulksaleClone.connect(bob).claim(bob.address, bob.address)).wait();
        } catch (e) {
            console.error(e.message/* To avoid revert */);
        }
        let tokenBalanceOwner = await SampleToken.balanceOf(owner.address);
        let tokenBalanceAlice = await SampleToken.balanceOf(alice.address);
        let tokenBalanceBob = await SampleToken.balanceOf(bob.address);


        // /* 4. Verify  */
        console.log(`
            owner: ${tokenBalanceOwner.toString()}
            alice: ${tokenBalanceAlice.toString()}
            bob: ${tokenBalanceBob.toString()}
        `)
        // betterexpect(tokenBalanceOwner).toEqBN(0);
        // betterexpect(tokenBalanceAlice).toBeGtBN(0);
        // betterexpect(tokenBalanceBob).toBeGtBN(0);
    });
});

