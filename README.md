# Bulksale

## Spec
- It should hold an [initial bonding curve offering](https://github.com/hegic/initial-bonding-curve-offering/blob/master/contracts/InitialOffering/HegicInitialOffering.sol) session.
  - It should have a IBCOFactory
- It should lock a bulk of ERC-20 tokens beforehand.
- It should accept deposits of ETH during predefined term.
- It should deny accepting depoits if it's out of date.
- As per one's own share, that locked ERC-20 will be allocated accordingly.