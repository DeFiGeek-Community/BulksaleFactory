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
        ==========================================
        === Template Idiom Declarations Begins ===
        ==========================================
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

    /* States in the deployment initialization */
    uint public START = 1620212324;
    uint public END = START + 7 days;
    uint public TOTAL_DISTRIBUTE_AMOUNT = 90_360_300e18;
    uint public MINIMAL_PROVIDE_AMOUNT = 700 ether;
    uint public LOCK_DURATION = 30 days;
    uint public EXPIRATION_DURATION = 180 days;
    IERC20 public ERC20ONSALE;
    /* States END */

    struct Args {
        address token;
        uint start;
        uint eventDuration;
        uint lockDuration;
        uint expirationDuration;
        uint totalDistributeAmount;
        uint minimalProvideAmount;
    }
    function initialize(bytes memory abiBytes) public onlyOnce onlyFactory override returns (bool) {
        Args memory args = abi.decode(abiBytes, (Args));
        ERC20ONSALE = IERC20(args.token);
        START = args.start;
        END = args.start + args.eventDuration;
        TOTAL_DISTRIBUTE_AMOUNT = args.totalDistributeAmount;
        MINIMAL_PROVIDE_AMOUNT = args.minimalProvideAmount;
        LOCK_DURATION = args.lockDuration;
        EXPIRATION_DURATION = args.expirationDuration;
        emit Initialized(abiBytes);
        initialized = true;
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
        === Template Idiom Declarations Ends ===
        ========================================
    */




    /*
        Let's go core logics :)
    */
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

    function claim(address contributor, address recipient) external /* Original Hegic doesn't have it but take care for Reentrancy if you modify this entire fund flow. */ {
        require(block.timestamp > END, "Early to claim. Sale is not finished.");
        require(provided[contributor] > 0, "You don't have any contribution.");

        uint userShare = provided[contributor];
        provided[contributor] = 0;

        if(totalProvided >= MINIMAL_PROVIDE_AMOUNT && block.timestamp < START + EXPIRATION_DURATION) {
            uint tokenAmount = TOTAL_DISTRIBUTE_AMOUNT * (userShare/totalProvided);
            ERC20ONSALE.transfer(recipient, tokenAmount);
            emit Claimed(recipient, userShare, tokenAmount);
        } else if (totalProvided < MINIMAL_PROVIDE_AMOUNT && block.timestamp < START + EXPIRATION_DURATION) {
            payable(recipient).transfer(userShare);
            emit Claimed(recipient, userShare, 0);
        } else {
            revert("Claimable term has been expired.");
        }
    }

    function withdrawProvidedETH() external onlyOwner {
        /*
          Finished, and enough Ether provided.
            
            Owner: Withdraws Ether
            Contributors: Can claim and get their own ERC-20

        */
        require(END < block.timestamp, "The offering must be completed");
        require(
            totalProvided >= MINIMAL_PROVIDE_AMOUNT,
            "The required amount has not been provided!"
        );
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawERC20ONSALE() external onlyOwner {
        /*
          Finished, but the privided token is not enough.
            
            Owner: Withdraws ERC-20
            Contributors: Claim and get back Ether

        */
        require(END < block.timestamp, "The offering must be completed");
        require(
            totalProvided < MINIMAL_PROVIDE_AMOUNT,
            "The required amount has been provided!"
        );
        ERC20ONSALE.transfer(owner(), ERC20ONSALE.balanceOf(address(this)));
    }

    function withdrawUnclaimedERC20ONSALE() external onlyOwner {
        /*
          Finished, passed lock duration, and still there're unsold ERC-20.
            
            Owner: Withdraws ERC-20
            Contributors: Already claimed and getting their own ERC-20

        */
        require(END + LOCK_DURATION < block.timestamp, "Withdrawal unavailable yet");
        ERC20ONSALE.transfer(owner(), ERC20ONSALE.balanceOf(address(this)));
    }
}