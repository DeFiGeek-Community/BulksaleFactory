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
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ITemplateContract.sol";
import "./IOptimizedTemplateContract.sol";

/**
 * @author 0xMotoko
 * @title BulksaleV1
 * @notice Minimal Proxy Platform-ish fork of the HegicInitialOffering.sol
 */
contract BulksaleV1 is IOptimizedTemplateContract, ReentrancyGuard {
    /*
        ==========================================
        === Template Idiom Declarations Begins ===
        ==========================================
    */
    bool initialized = false;

    address public constant factory = address(0x5FbDB2315678afecb367f032d93F642f64180aa3);


    uint private constant posStartingAtOfs = 0;
    uint private constant posStartingAtLen = 3;
    // 5min=1fr, 2021-06-01-2180-06-01=FFFFFF

    uint private constant posEventDurationOfs = posStartingAtOfs+posStartingAtLen;
    uint private constant posEventDurationLen = 1;
    // 1day=1fr. 1 byte = 256 days
 
    uint private constant posLockDurationOfs = posEventDurationOfs+posEventDurationLen;
    uint private constant posLockDurationLen = 1;
    // 1day=1fr. 1 byte = 256 days

    uint private constant posExpirationDurationOfs = posLockDurationOfs+posLockDurationLen;
    uint private constant posExpirationDurationLen = 1;
    // 1day=1fr. 1 byte = 256 days

    uint private constant posFeeRatePerMilOfs = posExpirationDurationOfs+posExpirationDurationLen;
    uint private constant posFeeRatePerMilLen = 1;
    // 1bytes

    uint private constant posMinimalProvideAmountOfs = posFeeRatePerMilOfs+posFeeRatePerMilLen;
    uint private constant posMinimalProvideAmountLen = 8;
    // decimal=3, numeric space is 256^8=1.8*10^18, value range is 0.001~1.8*10^15

    uint private constant posOwnerOfs = posMinimalProvideAmountOfs+posMinimalProvideAmountLen;
    uint private constant posOwnerLen = 20;
    // 20 bytes

    uint private constant posProvidingToken1Ofs = posOwnerOfs+posOwnerLen;
    uint private constant posProvidingToken1Len = 20;
    // 20 bytes

    uint private constant posTotalDistributeAmountOfProvidingToken1Ofs = posProvidingToken1Ofs+posProvidingToken1Len;
    uint private constant posTotalDistributeAmountOfProvidingToken1Len = 8;
    // decimal=0, numeric space is 256^8=1.8*10^18, value range is 0~1.8*10^18

    /*
        You can't use constructor
        because the minimal proxy is really minimal.
        
        Proxy is minimal
        = no constructor
        = You can't access the Proxy constructor's SSTORE slot
        from implementation constructor's SLOAD slot.

        === DEFINE YOUR OWN ARGS BELOW ===

    */

    bytes32[2] private payloads;
    function initialize(bytes32[2] memory _payloads) public onlyOnce onlyFactory override returns (bool) {
        console.log("gasleft():%s", gasleft());
        payloads = _payloads;
        console.log("gasleft():%s", gasleft());
        console.log("startingAt():%s, eventDuration():%s, expirationDuration():%s", startingAt(), eventDuration(), expirationDuration());
        console.log("feeRatePerMil():%s", feeRatePerMil());
        console.log("minimalProvideAmount():%s",minimalProvideAmount());
        console.log("owner():%s",owner());
        console.log("providingToken1():%s", providingToken1()); 
        console.log("totalDistributeAmountOfProvidingToken1():%s", totalDistributeAmountOfProvidingToken1());

        require(block.timestamp <= startingAt(), "startingAt must be in the future");
        require(eventDuration() >= 1 days, "event duration is too short");
        require(lockDuration() >= 0, "lock duration is invalid");
        require(expirationDuration() >= 30 days, "expiration duration must be more than 30 days");
        require(1 <= feeRatePerMil() && feeRatePerMil() < 100, "fee rate is out of range");
        require(minimalProvideAmount() > 0, "minimal provide amount is invalid");
        require(owner() != address(0), "owner must be there");
        require(providingToken1() != address(0), "token must be there");
        require(totalDistributeAmountOfProvidingToken1() > 0, "distribution amount is invalid");

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
    modifier onlyOwner() {
        require(msg.sender == owner(), "You are not the owner.");
        _;
    }
    function startingAt() public view returns (uint) {
        bytes memory payload = concat(payloads[0], payloads[1]);
        return 1621397607 + bytes2uint(slice(payload, posStartingAtOfs, posStartingAtOfs+posStartingAtLen)) * (60 * 5);
        /* 2021-05-19 13:13:27 + 5min * frames */
    }
    function eventDuration() public view returns (uint) {
        bytes memory payload = concat(payloads[0], payloads[1]);
        return bytes2uint(slice(payload, posEventDurationOfs, posEventDurationOfs+posEventDurationLen)) * (60 * 60 * 24);
    }
    function closingAt() public view returns (uint) {
        return startingAt() + eventDuration();
    }
    function lockDuration() public view returns (uint) {
        bytes memory payload = concat(payloads[0], payloads[1]);
        return bytes2uint(slice(payload, posLockDurationOfs, posLockDurationOfs+posLockDurationLen)) * (60 * 60 * 24);
    }
    function lockUntil() public view returns (uint) {
        return closingAt() + lockDuration();
    }
    function expirationDuration() public view returns (uint) {
        bytes memory payload = concat(payloads[0], payloads[1]);
        return bytes2uint(slice(payload, posExpirationDurationOfs, posExpirationDurationOfs+posExpirationDurationLen)) * (60 * 60 * 24);
    }
    function expiredAt() public view returns (uint) {
        return startingAt() + expirationDuration();
    }
    function feeRatePerMil() public view returns (uint) {
        bytes memory payload = concat(payloads[0], payloads[1]);
        return bytes2uint(slice(payload, posFeeRatePerMilOfs, posFeeRatePerMilOfs+posFeeRatePerMilLen));
    }
    function minimalProvideAmount() public view returns (uint) {
        bytes memory payload = concat(payloads[0], payloads[1]);
        return bytes2uint(slice(payload, posMinimalProvideAmountOfs, posMinimalProvideAmountOfs+posMinimalProvideAmountLen)) * (10**18);
    }
    function owner() public view returns (address payable) {
        bytes memory payload = concat(payloads[0], payloads[1]);
        return payable(bytesToAddress(slice(payload, posOwnerOfs, posOwnerOfs+posOwnerLen)));
    }
    function providingToken1() public view returns (address payable) {
        bytes memory payload = concat(payloads[0], payloads[1]);
        return payable(bytesToAddress(slice(payload, posProvidingToken1Ofs, posProvidingToken1Ofs+posProvidingToken1Len)));
    }
    function totalDistributeAmountOfProvidingToken1() public view returns (uint) {
        bytes memory payload = concat(payloads[0], payloads[1]);
        return bytes2uint(slice(payload, posTotalDistributeAmountOfProvidingToken1Ofs, posTotalDistributeAmountOfProvidingToken1Ofs+posTotalDistributeAmountOfProvidingToken1Len)) * (10**18);
    }
    function bytes2uint(bytes memory b) private pure returns (uint){
        uint256 number;
        for(uint i=0;i<b.length;i++){
            number = number + uint(uint8(b[i]))*(2**(8*(b.length-(i+1))));
        }
        return number;
    }
    function slice(bytes memory _bytes, uint startIndex, uint endIndex) private view returns (bytes memory) {
        bytes memory result = new bytes(endIndex-startIndex);
        for(uint i = startIndex; i < endIndex; i++) {
            result[i-startIndex] = _bytes[i];
        }
        return result;
    }
    function bytesToAddress (bytes memory b) private pure returns (address) {
        uint160 result = 0;
        for (uint i = 0; i < b.length; i++) {
            uint160 c = uint160(uint8(b[i]));
            if (c >= 48 && c <= 57) {
                result = result * 16 + (c - 48);
            }
            if(c >= 65 && c<= 90) {
                result = result * 16 + (c - 55);
            }
            if(c >= 97 && c<= 122) {
                result = result * 16 + (c - 87);
            }
        }
        return address(result);
    }
    function concat(bytes32 b1, bytes32 b2) pure public returns (bytes memory)
    {
        bytes memory result = new bytes(64);
        assembly {
            mstore(add(result, 32), b1)
            mstore(add(result, 64), b2)
        }
        return result;
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

    event Claimed(address indexed account, uint userShare, uint erc20allocation);
    event Received(address indexed account, uint amount);
    event WithdrawnOnFailed(address indexed sender, uint balance);
    event WithdrawnAfterLockDuration(address indexed sender, uint balance);

    receive() external payable {
        require(startingAt() <= block.timestamp, "The offering has not started yet");
        require(block.timestamp <= closingAt(), "The offering has already ended");
        totalProvided += msg.value;
        provided[msg.sender] += msg.value;
        emit Received(msg.sender, msg.value);
    }

    function claim(address contributor, address recipient) external nonReentrant {
        require(block.timestamp > closingAt(), "Early to claim. Sale is not finished.");
        require(provided[contributor] > 0, "You don't have any contribution.");

        uint userShare = provided[contributor];
        provided[contributor] = 0;

        uint erc20allocation = _calculateAllocation(userShare, totalProvided, totalDistributeAmountOfProvidingToken1());
        bool isNotExpiredYet = block.timestamp < expiredAt();
        bool isTargetReached = totalProvided*1000 >= minimalProvideAmount();//MPA is decimal=3
        bool allocationNearlyZero = erc20allocation == 0;
        if(
            isNotExpiredYet && isTargetReached && !allocationNearlyZero
        ) {
            if( 
                /* claiming for oneself */
                (msg.sender == contributor && contributor == recipient)
                ||                
                /* claiming for someone other */
                (msg.sender != contributor && contributor == recipient)
                ||
                /* giving her contribution to someone other by her own will */
                (msg.sender == contributor && contributor != recipient) ){
                IERC20(providingToken1()).transfer(recipient, erc20allocation);
                emit Claimed(recipient, userShare, erc20allocation);
            } else {
                revert("sender is claiming someone other's fund for someone other.");
            }
        } else if (
            (isNotExpiredYet && !isTargetReached)
            ||
            (isNotExpiredYet && allocationNearlyZero)
        ) {
            /* Refund process */
            (bool success,) = payable(contributor).call{value:userShare}("");
            require(success, "transfer failed");
            emit Claimed(contributor, userShare, 0);
        } else {
            /* Expired. No refund. */
            revert("Claimable term has been expired.");
        }
    }
    function _calculateAllocation(uint us, uint tp, uint tda) internal pure returns (uint al){
        /* us<tp is always true and so us/tp is always zero */
        /* tda can be 1 to (2^256-1)/10^18 */
        /* (us x tda) can overflow */
        /* tda/tp can be zero */

        if(tda<tp) {
        /* 
        For a sale such that accumulates many ETH, and selling token is a few (e.g., Art NFTs),
        if the claimer depoited only a few ETH, then allocation is 0 and will be refunded.
        That would be acceptable behavior.
        */
            al = (us*tda)/tp;
        } else {
        /* sender's share is very tiny and so calculate tda/tp first */
            al = (tda/tp)*us;
        }

    }


    function ceil(uint a, uint m) internal pure returns (uint ) {
        return ((a + m - 1) / m) * m;
    }

    function withdrawProvidedETH() external onlyOwner nonReentrant {
        /*
          Finished, and enough Ether provided.
            
            Owner: Withdraws Ether
            Contributors: Can claim and get their own ERC-20

        */
        require(closingAt() < block.timestamp, "The offering must be finished first.");
        require(
            totalProvided*1000 >= minimalProvideAmount(),
            "The required amount has not been provided!"
        );

        (bool success1,) = payable(owner()).call{value: address(this).balance*(1000-feeRatePerMil())/1000}("");
        require(success1,"transfer failed");
        (bool success2,) = payable(factory).call{value: address(this).balance*feeRatePerMil()/1000, gas: 25000}("");
        require(success2,"transfer failed");
    }

    function withdrawERC20Onsale() external onlyOwner nonReentrant {
        /*
          Finished, but the privided token is not enough. (Failed sale)
            
            Owner: Withdraws ERC-20
            Contributors: Claim and get back Ether

        */
        require(closingAt() < block.timestamp, "The offering must be completed");
        require(
            totalProvided*1000 < minimalProvideAmount(),
            "The required amount has been provided!"
        );
        uint _balance = IERC20(providingToken1()).balanceOf(address(this));
        IERC20(providingToken1()).transfer(owner(), _balance);
        emit WithdrawnOnFailed(msg.sender, _balance);
    }

    function withdrawUnclaimedERC20OnSale() external onlyOwner nonReentrant {
        /*
          Finished, passed lock duration, and still there're unsold ERC-20.
            
            Owner: Withdraws ERC-20
            Contributors: Already claimed and getting their own ERC-20

        */
        require(lockUntil() < block.timestamp, "Withdrawal unavailable yet.");
        uint _balance = IERC20(providingToken1()).balanceOf(address(this));
        IERC20(providingToken1()).transfer(owner(), _balance);
        emit WithdrawnAfterLockDuration(msg.sender, _balance);
   }
}