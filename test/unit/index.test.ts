import { ethers } from 'hardhat'
import { smockit } from '@eth-optimism/smock'
import { summon } from '@test/param/helper'

// const Factory = await summon('Factory');

// const BulksaleV1Factory = await ethers.getContractFactory('BulksaleV1')
// const BulksaleV1 = await BulksaleV1Factory.deploy(...)

// // Smockit!
// const MyMockContract = await smockit(MyContract)

// MyMockContract.smocked.myFunction.will.return.with('Some return value!')

// // Assuming that MyOtherContract.myOtherFunction calls MyContract.myFunction.
// await MyOtherContract.myOtherFunction()

// console.log(MyMockContract.smocked.myFunction.calls.length) // 1