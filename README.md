# Bulksale

## Spec
- It should hold an [initial bonding curve offering](https://github.com/hegic/initial-bonding-curve-offering/blob/master/contracts/InitialOffering/HegicInitialOffering.sol) session.
  - It should have a IBCOFactory
- It should lock a bulk of ERC-20 tokens beforehand.
- It should accept deposits of ETH during predefined term.
- It should deny accepting depoits if it's out of date.
- As per one's own share, that locked ERC-20 will be allocated accordingly.


## Rinkeby

```
deploying "Factory" (tx: 0x2a7c77bd8dc4a97eae88417cfaa43b49449d5605a9d48db85e33e2c07ca46d92)...: deployed at 0xC54Cd792103bF4DdAE80570bEB7842Cb29ED2238 with 1630459 gas

deploying "SampleToken" (tx: 0xc96b730b301c775e0c0a798a3e81fe11db01cc57f2bab60c67c25de0320ab589)...: deployed at 0xcED433a29F5D400F11f12469cDc16BBb5bE04b2e with 1348059 gas

deploying "BulksaleV1" (tx: 0xee405ad727ef095e6476ec01cb4a1b5a9f531a2b587b72751d3bf32db2bd5659)...: deployed at 0xFF3B1A13eceff8e564a59d2BdF13BF4567771c92 with 2658083 gas
```