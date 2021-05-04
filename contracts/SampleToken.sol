pragma solidity ^0.8.3;

/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @author 0xMotoko
 * @title SampleToken
 * @notice No feature, for test.
 */
contract SampleToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("SampleToken", "SMPL") {
        _mint(msg.sender, initialSupply);
    }
}