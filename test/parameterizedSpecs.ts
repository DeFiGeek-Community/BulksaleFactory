import { BigNumber, Signer, Contract } from 'ethers';

import { BalanceLogger, toERC20 } from './helper';

const betterexpect = (<any>expect); // TODO: better typing for waffleJest

type ParamsLots = {
    a: string;
    b: string;
    c: string;
    d: string;
    e: string;
    f: string;
    g: string;
}
type Params = {
    totalIssuance: string;
    sellingAmount: string;
    templateName: string;
    startModification: number;
    eventDuration: number;
    lockDuration: number;
    expirationDuration: number;
    minEtherTarget: string;
    feeRatePerMil: number;
    timetravel1: number;
    timetravel2: number;
    timetravel3: number;
    lots: ParamsLots;
}
type Context = {
    paramsSet:Array<Params>;
    addTemplateSpecs:Array<ParameterizedTestCase>;
    deploySpecs:Array<ParameterizedTestCase>;
    depositSpecs:Array<ParameterizedTestCase>;
    claimSpecs:Array<ParameterizedTestCase>;
    deployerWithdrawalSpecs:Array<ParameterizedTestCase>;
    foundationWithdrawalSpecs:Array<ParameterizedTestCase>;
    endSpecs:Array<ParameterizedTestCase>;
}
type ParameterizedTestCase = Array<Assertion>;
type Assertion = (s:State) => any;
export type State = {
  bl:BalanceLogger;
  Factory: Contract;  
  BulksaleV1: Contract;
  SampleToken: Contract;
  first: Signer;
}





export function successWithModerateSetting(ctx:Context|undefined=undefined):Context{
    if(!ctx) ctx = {
        paramsSet: [],
        addTemplateSpecs: [],
        deploySpecs: [],
        depositSpecs: [],
        claimSpecs: [],
        deployerWithdrawalSpecs: [],
        foundationWithdrawalSpecs: [],
        endSpecs: []
    };

    ctx.paramsSet.push({
        totalIssuance: "1000000000.322288888322288888",
        sellingAmount: "300000000.532312999532312999",
        templateName: "BulksaleV1.sol",
        startModification: 60*60,
        eventDuration: 60*60*24*7,
        lockDuration: 60*60*24*7*4,
        expirationDuration: 60*60*24*7*4*6,
        minEtherTarget: "1",
        feeRatePerMil: 99,
        timetravel1: 60*60*2,
        timetravel2: 60*60*24*7,
        timetravel3: 60*60,
        lots: {
            a: "10.345",
            b: "10.1322",
            c: "10.1322",
            d: "30.1322",
            e: "10.0322",
            f: "100.1322",
            g: "0.0"
        }
    });
    ctx.addTemplateSpecs.push([]);
    ctx.deploySpecs.push([]);
    ctx.depositSpecs.push([]);
    ctx.claimSpecs.push([]);
    ctx.deployerWithdrawalSpecs.push([]);
    ctx.foundationWithdrawalSpecs.push([]);
    ctx.endSpecs.push([
        /* Check that each participants earned accordingly */
        (s:State) => betterexpect(s.bl.diff('alice', 'SampleToken')).toBeGtBN(0), /* alice is for her */
        (s:State) => betterexpect(s.bl.diff('bob', 'SampleToken')).toBeGtBN(0), /* bob is for him */
        (s:State) => betterexpect(s.bl.diff('carl', 'SampleToken')).toBeGtBN(0), /* carl is for him */
        (s:State) => betterexpect(s.bl.diff('david', 'SampleToken')).toBeGtBN(0), /* david is for him */
        (s:State) => betterexpect(s.bl.diff('eve', 'SampleToken')).toBeGtBN(0), /* eve is for her */
        (s:State) => betterexpect(s.bl.diff('fin', 'SampleToken')).toEqBN(0),/* fin is giver */
        (s:State) => betterexpect(s.bl.diff('george', 'SampleToken')).toBeGtBN(0),/* george is taker */

        /* Check that each participants paid accordingly */
        (s:State) => betterexpect(s.bl.diff('alice', 'eth')).toBeLtBN(0), /* alice is for her */
        (s:State) => betterexpect(s.bl.diff('bob', 'eth')).toBeLtBN(0), /* bob is for him */
        (s:State) => betterexpect(s.bl.diff('carl', 'eth')).toBeLtBN(0), /* carl is for him */
        (s:State) => betterexpect(s.bl.diff('david', 'eth')).toBeLtBN(0), /* david is for him */
        (s:State) => betterexpect(s.bl.diff('eve', 'eth')).toBeLtBN(0), /* eve is for her */
        (s:State) => betterexpect(s.bl.diff('fin', 'eth')).toBeLtBN(0),/* fin is giver */
        (s:State) => betterexpect(s.bl.diff('george', 'eth')).toEqBN(0),/* george is taker */

        /* Check that no token is stucked in */
        (s:State) => betterexpect(s.bl.diff('deployer', 'SampleToken')).toBeLtBN(0), /* deployer gives token */
        (s:State) => betterexpect(s.bl.diff('deployer', 'eth')).toBeGtBN(0), /* deployer raises eth  */
        (s:State) => betterexpect(s.bl.diff('BulksaleV1', 'eth')).toEqBN(0),/* BulksaleV1 exhausts all in the end */
        /* Check FeePool */
        (s:State) => betterexpect(s.bl.diff('foundation', 'eth')).toBeGtBN(0), /* foundation gets fee */
        (s:State) => betterexpect(s.bl.diff('Factory', 'eth')).toEqBN(0), /* Factory exhausts all in the end */
    ]);

    return ctx;
}

export function successWithArtNFTScenario(ctx:Context):Context{
    ctx.paramsSet.push({
        totalIssuance: "0.000000000000001",//10^15 (or, 1000 tokens for decimal=0 token)
        sellingAmount: "0.000000000000001",
        templateName: "BulksaleV1.sol",
        startModification: 60*60,
        eventDuration: 60*60*24*5,
        lockDuration: 60*60*24*7*2,
        expirationDuration: 60*60*24*7*4*3,
        minEtherTarget: "100",
        feeRatePerMil: 1,
        timetravel1: 60*60*2,
        timetravel2: 60*60*24*7,
        timetravel3: 60*60,
        lots: {
            a: "100",// Zero-share attack
            b: "0.1",
            c: "0.1",
            d: "0.1",
            e: "0.1",
            f: "0.1",
            g: "0.0"
        }
    });
    ctx.addTemplateSpecs.push([]);
    ctx.deploySpecs.push([]);
    ctx.depositSpecs.push([]);
    ctx.claimSpecs.push([]);
    ctx.deployerWithdrawalSpecs.push([]);
    ctx.foundationWithdrawalSpecs.push([]);
    ctx.endSpecs.push([
        /* Check that each participants earned accordingly */
        (s:State) => betterexpect(s.bl.diff('alice', 'SampleToken')).toBeGtBN(0), /* alice gets token */
        (s:State) => betterexpect(s.bl.diff('bob', 'SampleToken')).toEqBN(0), /* Her share is nearly zero, refunded. */
        (s:State) => betterexpect(s.bl.diff('carl', 'SampleToken')).toEqBN(0), /* Her share is nearly zero, refunded. */
        (s:State) => betterexpect(s.bl.diff('david', 'SampleToken')).toEqBN(0), /* Her share is nearly zero, refunded. */
        (s:State) => betterexpect(s.bl.diff('eve', 'SampleToken')).toEqBN(0), /* Her share is nearly zero, refunded. */
        (s:State) => betterexpect(s.bl.diff('fin', 'SampleToken')).toEqBN(0), /* Her share is nearly zero, refunded. */
        (s:State) => betterexpect(s.bl.diff('george', 'SampleToken')).toEqBN(0), /* Her share is nearly zero, refunded. */

        /* Check that each participants paid accordingly */
        (s:State) => betterexpect(s.bl.diff('alice', 'eth')).toBeLtBN(0), /* alice is for her */
        (s:State) => betterexpect(s.bl.diff('bob', 'eth')).toBeLtBN(0), /* bob is for him */
        (s:State) => betterexpect(s.bl.diff('carl', 'eth')).toBeLtBN(0), /* carl is for him */
        (s:State) => betterexpect(s.bl.diff('david', 'eth')).toBeLtBN(0), /* david is for him */
        (s:State) => betterexpect(s.bl.diff('eve', 'eth')).toBeLtBN(0), /* eve is for her */
        (s:State) => betterexpect(s.bl.diff('fin', 'eth')).toBeLtBN(0),/* fin gets refund */
        (s:State) => betterexpect(s.bl.diff('george', 'eth')).toEqBN(0),/* george shouldn't get refund */

        /* Check that no token is stucked in */
        (s:State) => betterexpect(s.bl.diff('deployer', 'SampleToken')).toBeLtBN(0), /* deployer's ERC-20 balance in EOA */
        (s:State) => betterexpect(s.bl.diff('deployer', 'eth')).toBeGtBN(0), /* deployer's eth balance in EOA */
        (s:State) => betterexpect(s.bl.diff('BulksaleV1', 'eth')).toEqBN(0),/* BulksaleV1 doesn't have eth in the end */
        /* Check FeePool */
        (s:State) => betterexpect(s.bl.diff('foundation', 'eth')).toBeLtBN(0), /* With min fee rate, foundation loose money */
        (s:State) => betterexpect(s.bl.diff('Factory', 'eth')).toEqBN(0), /* Factory has its remaining vault in eth */
    ]);

    return ctx
}



export function successWithUpperBound(ctx:Context):Context{
    ctx.paramsSet.push({
        totalIssuance: "115792089237316195423570985008687907853269984665640564039457",// (2^256-1)/(10^18)
        sellingAmount: "115792089237316195423570985008687907853269984665640564039457",
        templateName: "BulksaleV1.sol",
        startModification: 60*60,
        eventDuration: 60*60*24*5,
        lockDuration: 60*60*24*7*2,
        expirationDuration: 60*60*24*7*4*3,
        minEtherTarget: "0.0000333",
        feeRatePerMil: 99,
        timetravel1: 60*60*2,
        timetravel2: 60*60*24*7,
        timetravel3: 60*60,
        lots: {
            a: "0.0000333",
            b: "0.0000333",
            c: "0.0000333",
            d: "0.0000333",
            e: "0.0000333",
            f: "0.0000333",
            g: "0.0"
        }
    });
    ctx.addTemplateSpecs.push([]);
    ctx.deploySpecs.push([]);
    ctx.depositSpecs.push([]);
    ctx.claimSpecs.push([]);
    ctx.deployerWithdrawalSpecs.push([]);
    ctx.foundationWithdrawalSpecs.push([]);
    ctx.endSpecs.push([
        /* Check that each participants earned accordingly */
        (s:State) => betterexpect(s.bl.diff('alice', 'SampleToken')).toBeGtBN(0), /* alice is for her */
        (s:State) => betterexpect(s.bl.diff('bob', 'SampleToken')).toBeGtBN(0), /* bob is for him */
        (s:State) => betterexpect(s.bl.diff('carl', 'SampleToken')).toBeGtBN(0), /* carl is for him */
        (s:State) => betterexpect(s.bl.diff('david', 'SampleToken')).toBeGtBN(0), /* david is for him */
        (s:State) => betterexpect(s.bl.diff('eve', 'SampleToken')).toBeGtBN(0), /* eve is for her */
        (s:State) => betterexpect(s.bl.diff('fin', 'SampleToken')).toEqBN(0),/* fin is giver */
        (s:State) => betterexpect(s.bl.diff('george', 'SampleToken')).toBeGtBN(0),/* george is taker */

        /* Check that each participants paid accordingly */
        (s:State) => betterexpect(s.bl.diff('alice', 'eth')).toBeLtBN(0), /* alice is for her */
        (s:State) => betterexpect(s.bl.diff('bob', 'eth')).toBeLtBN(0), /* bob is for him */
        (s:State) => betterexpect(s.bl.diff('carl', 'eth')).toBeLtBN(0), /* carl is for him */
        (s:State) => betterexpect(s.bl.diff('david', 'eth')).toBeLtBN(0), /* david is for him */
        (s:State) => betterexpect(s.bl.diff('eve', 'eth')).toBeLtBN(0), /* eve is for her */
        (s:State) => betterexpect(s.bl.diff('fin', 'eth')).toBeLtBN(0),/* fin is giver */
        (s:State) => betterexpect(s.bl.diff('george', 'eth')).toEqBN(0),/* george is taker */

        /* Check that no token is stucked in */
        (s:State) => betterexpect(s.bl.diff('deployer', 'SampleToken')).toEqBN(toERC20(ctx.paramsSet[ctx.paramsSet.length-1].totalIssuance).mul(-1)), /* Use all issuance. */
        (s:State) => betterexpect(s.bl.diff('deployer', 'eth')).toBeLtBN(0), /* deployer lose money and gas is minus */
        (s:State) => betterexpect(s.bl.diff('BulksaleV1', 'eth')).toEqBN(0),/* BulksaleV1 doesn't have eth in the end */
        /* Check FeePool */
        // (s:State) => betterexpect(s.bl.diff('foundation', 'eth')).toBeGtBN(0), /* foundation gets fee but gas can be larger */
        (s:State) => betterexpect(s.bl.diff('Factory', 'eth')).toEqBN(0), /* Factory has its remaining vault in eth */
    ]);

    return ctx
}


