pragma solidity ^0.8.3;

/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * Yamato
 * Copyright (C) 2021 Yamato Protocol (DeFiGeek Community Japan)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ITemplateContract.sol";

/**
 * @author 0xMotoko
 * @title BulksaleV1
 * @notice Minimal Proxy Platform-ish fork of the HegicInitialOffering.sol
 */
contract BulksaleV1 is Ownable, ITemplateContract {
    /*
        ========================================
        === Template Idiom Declations Begins ===
        ========================================
    */
    bool initialized = false;

    address public constant factory = address(0x5FbDB2315678afecb367f032d93F642f64180aa3);

    /*
        You can't use constructor
        because the minimal proxy is really minimal.
        
        Proxy is minimal
        = no constructor
        = You can't access the Proxy constructor's SSTORE slot
        from implementation constructor's SLOAD slot.

        === DEFINE YOUR OWN ARGS BELOW ===

    */
    struct Args {
        address token;
    }
    IERC20 public ERC20ONSALE;
    function initialize(bytes memory abiBytes) public onlyOnce onlyFactory override returns (bool) {
        Args memory args = abi.decode(abiBytes, (Args));
        ERC20ONSALE = IERC20(args.token);
        emit Initialized(abiBytes);
        return true;
    }
    modifier onlyOnce {
        require(!initialized, "This contract has already been initialized");
        _;
    }
    modifier onlyFactory {
        require(msg.sender == factory, "You are not the Factory.");
        _;
    }
    /*
        ========================================
        === Template Idiom Declations Ends ===
        ========================================
    */




    /*
        Let's go core logics :)
    */
    uint public constant START = 1599678000;
    uint public constant END = START + 3 days;
    uint public constant TOTAL_DISTRIBUTE_AMOUNT = 90_360_300e18;
    uint public constant MINIMAL_PROVIDE_AMOUNT = 700 ether;
    uint public totalProvided = 0;
    mapping(address => uint) public provided;

    event Claimed(address indexed account, uint userShare, uint tokenAmount);
    event Received(address indexed account, uint amount);

    receive() external payable {
        require(START <= block.timestamp, "The offering has not started yet");
        require(block.timestamp <= END, "The offering has already ended");
        totalProvided += msg.value;
        provided[msg.sender] += msg.value;
        emit Received(msg.sender, msg.value);
    }

    function claim() external /* Original Hegic doesn't have it but take care for Reentrancy if you modify this entire fund flow. */ {
        console.log('=== Running until here ===');
        require(block.timestamp > END);
        require(provided[msg.sender] > 0);

        uint userShare = provided[msg.sender];
        provided[msg.sender] = 0;

        if(totalProvided >= MINIMAL_PROVIDE_AMOUNT) {
            uint tokenAmount = TOTAL_DISTRIBUTE_AMOUNT * (userShare/totalProvided);
            ERC20ONSALE.transfer(msg.sender, tokenAmount);
            emit Claimed(msg.sender, userShare, tokenAmount);
        } else {
            payable(msg.sender).transfer(userShare);
            emit Claimed(msg.sender, userShare, 0);
        }
    }

    function withdrawProvidedETH() external onlyOwner {
        require(END < block.timestamp, "The offering must be completed");
        require(
            totalProvided >= MINIMAL_PROVIDE_AMOUNT,
            "The required amount has not been provided!"
        );
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawERC20ONSALE() external onlyOwner {
        require(END < block.timestamp, "The offering must be completed");
        require(
            totalProvided < MINIMAL_PROVIDE_AMOUNT,
            "The required amount has been provided!"
        );
        ERC20ONSALE.transfer(owner(), ERC20ONSALE.balanceOf(address(this)));
    }

    function withdrawUnclaimedERC20ONSALE() external onlyOwner {
        require(END + 30 days < block.timestamp, "Withdrawal unavailable yet");
        ERC20ONSALE.transfer(owner(), ERC20ONSALE.balanceOf(address(this)));
    }
}