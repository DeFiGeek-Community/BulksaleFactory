import { BigNumber } from 'ethers';

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
    testcases:Array<ParameterizedTestCase>;
}
type ParameterizedTestCase = Array<Assertion>;
type Assertion = (bl:BalanceLogger) => any;






export function successWithModerateSetting(ctx:Context|undefined=undefined):Context{
    if(!ctx) ctx = { paramsSet: [], testcases: [] };

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
    ctx.testcases.push([
        /* Check that each participants earned accordingly */
        (bl) => betterexpect(bl.diff('alice', 'SampleToken')).toBeGtBN(0), /* alice is for her */
        (bl) => betterexpect(bl.diff('bob', 'SampleToken')).toBeGtBN(0), /* bob is for him */
        (bl) => betterexpect(bl.diff('carl', 'SampleToken')).toBeGtBN(0), /* carl is for him */
        (bl) => betterexpect(bl.diff('david', 'SampleToken')).toBeGtBN(0), /* david is for him */
        (bl) => betterexpect(bl.diff('eve', 'SampleToken')).toBeGtBN(0), /* eve is for her */
        (bl) => betterexpect(bl.diff('fin', 'SampleToken')).toEqBN(0),/* fin is giver */
        (bl) => betterexpect(bl.diff('george', 'SampleToken')).toBeGtBN(0),/* george is taker */

        /* Check that each participants paid accordingly */
        (bl) => betterexpect(bl.diff('alice', 'eth')).toBeLtBN(0), /* alice is for her */
        (bl) => betterexpect(bl.diff('bob', 'eth')).toBeLtBN(0), /* bob is for him */
        (bl) => betterexpect(bl.diff('carl', 'eth')).toBeLtBN(0), /* carl is for him */
        (bl) => betterexpect(bl.diff('david', 'eth')).toBeLtBN(0), /* david is for him */
        (bl) => betterexpect(bl.diff('eve', 'eth')).toBeLtBN(0), /* eve is for her */
        (bl) => betterexpect(bl.diff('fin', 'eth')).toBeLtBN(0),/* fin is giver */
        (bl) => betterexpect(bl.diff('george', 'eth')).toEqBN(0),/* george is taker */

        /* Check that no token is stucked in */
        (bl) => betterexpect(bl.diff('deployer', 'SampleToken')).toBeLtBN(0), /* deployer gives token */
        (bl) => betterexpect(bl.diff('deployer', 'eth')).toBeGtBN(0), /* deployer raises eth  */
        (bl) => betterexpect(bl.diff('BulksaleV1', 'eth')).toEqBN(0),/* BulksaleV1 exhausts all in the end */
        /* Check FeePool */
        (bl) => betterexpect(bl.diff('foundation', 'eth')).toBeGtBN(0), /* foundation gets fee */
        (bl) => betterexpect(bl.diff('Factory', 'eth')).toEqBN(0), /* Factory exhausts all in the end */
    ]);

    return ctx;
}

export function successWithModerateSetting2(ctx:Context):Context{
    ctx.paramsSet.push({
        totalIssuance: "1000",
        sellingAmount: "500",
        templateName: "BulksaleV1.sol",
        startModification: 60*60,
        eventDuration: 60*60*24*5,
        lockDuration: 60*60*24*7*2,
        expirationDuration: 60*60*24*7*4*3,
        minEtherTarget: "100",
        feeRatePerMil: 50,
        timetravel1: 60*60*2,
        timetravel2: 60*60*24*7,
        timetravel3: 60*60,
        lots: {
            a: "1.345",
            b: "6.1322",
            c: "30.1322",
            d: "50.1322",
            e: "10.0322",
            f: "20.1322",
            g: "0.0"
        }
    });
    ctx.testcases.push([
        /* Check that each participants earned accordingly */
        (bl) => betterexpect(bl.diff('alice', 'SampleToken')).toBeGtBN(0), /* alice is for her */
        (bl) => betterexpect(bl.diff('bob', 'SampleToken')).toBeGtBN(0), /* bob is for him */
        (bl) => betterexpect(bl.diff('carl', 'SampleToken')).toBeGtBN(0), /* carl is for him */
        (bl) => betterexpect(bl.diff('david', 'SampleToken')).toBeGtBN(0), /* david is for him */
        (bl) => betterexpect(bl.diff('eve', 'SampleToken')).toBeGtBN(0), /* eve is for her */
        (bl) => betterexpect(bl.diff('fin', 'SampleToken')).toEqBN(0),/* fin is giver */
        (bl) => betterexpect(bl.diff('george', 'SampleToken')).toBeGtBN(0),/* george is taker */

        /* Check that each participants paid accordingly */
        (bl) => betterexpect(bl.diff('alice', 'eth')).toBeLtBN(0), /* alice is for her */
        (bl) => betterexpect(bl.diff('bob', 'eth')).toBeLtBN(0), /* bob is for him */
        (bl) => betterexpect(bl.diff('carl', 'eth')).toBeLtBN(0), /* carl is for him */
        (bl) => betterexpect(bl.diff('david', 'eth')).toBeLtBN(0), /* david is for him */
        (bl) => betterexpect(bl.diff('eve', 'eth')).toBeLtBN(0), /* eve is for her */
        (bl) => betterexpect(bl.diff('fin', 'eth')).toBeLtBN(0),/* fin is giver */
        (bl) => betterexpect(bl.diff('george', 'eth')).toEqBN(0),/* george is taker */

        /* Check that no token is stucked in */
        (bl) => betterexpect(bl.diff('deployer', 'SampleToken')).toBeLtBN(0), /* deployer's ERC-20 balance in EOA */
        (bl) => betterexpect(bl.diff('deployer', 'eth')).toBeGtBN(0), /* deployer's eth balance in EOA */
        (bl) => betterexpect(bl.diff('BulksaleV1', 'eth')).toEqBN(0),/* BulksaleV1 doesn't have eth in the end */
        /* Check FeePool */
        (bl) => betterexpect(bl.diff('foundation', 'eth')).toBeGtBN(0), /* foundation gets fee */
        (bl) => betterexpect(bl.diff('Factory', 'eth')).toEqBN(0), /* Factory has its remaining vault in eth */
    ]);

    return ctx
}



export function successWithExtremeSetting1(ctx:Context):Context{
    ctx.paramsSet.push({
        totalIssuance: "9999999999999999",
        sellingAmount: "9999999999999999",
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
    ctx.testcases.push([
        /* Check that each participants earned accordingly */
        (bl) => betterexpect(bl.diff('alice', 'SampleToken')).toBeGtBN(0), /* alice is for her */
        (bl) => betterexpect(bl.diff('bob', 'SampleToken')).toBeGtBN(0), /* bob is for him */
        (bl) => betterexpect(bl.diff('carl', 'SampleToken')).toBeGtBN(0), /* carl is for him */
        (bl) => betterexpect(bl.diff('david', 'SampleToken')).toBeGtBN(0), /* david is for him */
        (bl) => betterexpect(bl.diff('eve', 'SampleToken')).toBeGtBN(0), /* eve is for her */
        (bl) => betterexpect(bl.diff('fin', 'SampleToken')).toEqBN(0),/* fin is giver */
        (bl) => betterexpect(bl.diff('george', 'SampleToken')).toBeGtBN(0),/* george is taker */

        /* Check that each participants paid accordingly */
        (bl) => betterexpect(bl.diff('alice', 'eth')).toBeLtBN(0), /* alice is for her */
        (bl) => betterexpect(bl.diff('bob', 'eth')).toBeLtBN(0), /* bob is for him */
        (bl) => betterexpect(bl.diff('carl', 'eth')).toBeLtBN(0), /* carl is for him */
        (bl) => betterexpect(bl.diff('david', 'eth')).toBeLtBN(0), /* david is for him */
        (bl) => betterexpect(bl.diff('eve', 'eth')).toBeLtBN(0), /* eve is for her */
        (bl) => betterexpect(bl.diff('fin', 'eth')).toBeLtBN(0),/* fin is giver */
        (bl) => betterexpect(bl.diff('george', 'eth')).toEqBN(0),/* george is taker */

        /* Check that no token is stucked in */
        (bl) => betterexpect(bl.diff('deployer', 'SampleToken')).toEqBN(toERC20(ctx.paramsSet[ctx.paramsSet.length-1].totalIssuance).mul(-1)), /* Use all issuance. */
        (bl) => betterexpect(bl.diff('deployer', 'eth')).toBeLtBN(0), /* deployer lose money and gas is minus */
        (bl) => betterexpect(bl.diff('BulksaleV1', 'eth')).toEqBN(0),/* BulksaleV1 doesn't have eth in the end */
        /* Check FeePool */
        // (bl) => betterexpect(bl.diff('foundation', 'eth')).toBeGtBN(0), /* foundation gets fee but gas can be larger */
        (bl) => betterexpect(bl.diff('Factory', 'eth')).toEqBN(0), /* Factory has its remaining vault in eth */
    ]);

    return ctx
}
