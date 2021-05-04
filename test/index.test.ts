const { ethers } = require("hardhat");
const reporter = (<any>global).reporter;
const { waffleJest } = require("@ethereum-waffle/jest");
expect.extend(waffleJest);

import { summon, getSharedProvider, getSharedSigners, 
  parseAddr, parseBool, parseInteger, getLogs,
  encode, decode } from "./helper";
import { Severity, Reporter } from "jest-allure/dist/Reporter";
import { suite, test } from '@testdeck/jest'
import { time } from '@openzeppelin/test-helpers';

const FACTORY_ABI = [""];
const BULKSALEV1_ABI = ["function claim()"];


describe("Factory", function() {

    it("creates a bulksale", async function() {

        /* 1. Set test reporter */
        reporter
        .description("")
        .severity(Severity.Critical)
        // .feature(Feature.Betting)
        .story("");

        /* 2. Set signed contracts */
        const [owner] = await getSharedSigners();

        const Factory = await summon("Factory", [
            'function deploy(string, bytes)',
            'function addTemplate(string, address)'
        ], [owner.address]);
        console.log(`Factory.address: ${Factory.address}`);

        const SampleToken = await summon("SampleToken", [], ["1000"]);
        const BulksaleV1 = await summon("BulksaleV1", BULKSALEV1_ABI);


        /* 3. Exec */
        const tokenAddr = SampleToken.address;
        const bulksaleAddr = BulksaleV1.address;
        const templateName = 'Bulksale_DefiGeek_20210505';
        const argsTokenOnSale = encode(["address"], [tokenAddr]);
        let addResult = await ( await Factory.addTemplate(templateName, bulksaleAddr) ).wait();
        let deployResult = await ( await Factory.deploy(templateName, argsTokenOnSale) ).wait();


        // /* 4. Parse event */
        // console.log(deployResult);
        let logTemplateName = deployResult.events[1].topics[1].toString();
        let logTemplateAddr = parseAddr(deployResult.events[1].topics[2]);
        let logDeployedBulksaleAddr = parseAddr(deployResult.events[1].topics[3]);


        const BulksaleClone = (new ethers.Contract(logDeployedBulksaleAddr, BULKSALEV1_ABI, getSharedProvider())).connect(owner);


        let claimResult = await (await BulksaleClone.claim()).wait();

        console.log(claimResult);
        // /* 5. Verify  */
        // expect(logAddr).toEqual("");
    });
});

