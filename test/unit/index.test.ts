import { ethers } from 'hardhat'
import { smockit } from '@eth-optimism/smock'
import { BigNumber } from 'ethers';

const reporter = (<any>global).reporter;
const { waffleJest } = require("@ethereum-waffle/jest");
expect.extend(waffleJest);
const betterexpect = (<any>expect); // TODO: better typing for waffleJest
import { summon, create, getSharedProvider, getSharedSigners, 
  parseAddr, parseBool, parseInteger, getLogs,
  encode, decode, increaseTime,
  toERC20, toFloat, onChainNow } from "@test/param/helper";
import { getBulksaleAbiArgs, getTokenAbiArgs, sendEther } from "@test/param/scenarioHelper";
import { State } from '@test/param/parameterizedSpecs';
import { parameterizedSpecs } from '@test/param/paramSpecEntrypoint';
import { Severity, Reporter } from "jest-allure/dist/Reporter";
import { suite, test } from '@testdeck/jest'
import fs from 'fs';
import { BalanceLogger } from '@src/BalanceLogger';
import { BulksaleDAO, BasicPlugin } from '../../typechain'; 

import { genABI } from '@src/genABI';

const FACTORY_ABI = genABI('Factory');
const BULKSALEDAO_ABI = genABI('BulksaleDAO');
const BASICPLUGIN_ABI = genABI('BasicPlugin');
const SAMPLE_TOKEN_ABI = genABI('SampleToken');
const BULKSALEV1_ABI = genABI('BulksaleV1');



/* Parameterized Test (Testcases are in /test/parameterizedSpecs.ts) */
describe("", function() {
    let provider;
    it(``, async function() {
        /* 1. Set test reporter */
        reporter
        .description("")
        .severity(Severity.Critical)
        // .feature(Feature.Betting)
        .story("");

        /* 2. Set signed contracts */
        const [foundation,deployer,alice,bob,carl,david,eve,fin,george] = await getSharedSigners();
        const signer = foundation;
        if (!provider) provider = getSharedProvider();


        const unsignedBasicPlugin:BasicPlugin = await summon<BasicPlugin>("BasicPlugin", BASICPLUGIN_ABI, [], foundation);
        const BasicPlugin:BasicPlugin = unsignedBasicPlugin.connect(signer);

        const unsignedBulksaleDAO:BulksaleDAO = await summon<BulksaleDAO>("BulksaleDAO", BULKSALEDAO_ABI, [BasicPlugin.address], foundation);
        const BulksaleDAO:BulksaleDAO = unsignedBulksaleDAO.connect(signer);


        const BasicPluginMock = await smockit(BasicPlugin)
        BasicPluginMock.smocked.upgrade.will.return.with(true);
        await BulksaleDAO.upgrade();
        betterexpect(BasicPluginMock.smocked.upgrade.calls.length).toEqual(1);
    });
});