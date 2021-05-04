pragma solidity ^0.8.3;

/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * Yamato
 * Copyright (C) 2021 Yamato Protocol (DeFiGeek Community Japan)
 *
 * This Factory is a fork of Murray Software's deliverables.
 * And this entire project is including the fork of Hegic Protocol.
 * Hence the license is alinging to the GPL-3.0
*/

/*
The MIT License (MIT)
Copyright (c) 2018 Murray Software, LLC.
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
//solhint-disable max-line-length
//solhint-disable no-inline-assembly

import "./ITemplateContract.sol";

contract Factory {
    mapping(string => address) public templates;
    address public governance;
    event Deployed(string indexed templateName, address indexed templateAddr, address indexed deployedAddr, bytes abiArgs);
    event TemplateAdded(string indexed templateName, address indexed templateAddr, address indexed governer);
    event GovernanceChanged(address indexed oldGoverner, address indexed newGoverner);

    /*
        External Interfaces
    */
    function deploy(string memory templateName, bytes memory abiArgs) public returns (address deployedAddr) {
        address templateAddr = templates[templateName];
        deployedAddr = _createClone(templateAddr);
        bool success = ITemplateContract(deployedAddr).initialize(abiArgs);
        require(success, "Failed to initialize");
        emit Deployed(templateName, templateAddr, deployedAddr, abiArgs);
    }

    function addTemplate(string memory templateName, address templateAddr /* Dear governer; deploy it beforehand. */) public onlyGovernance {
        require(templates[templateName] == address(0), "This template name is already taken.");
        templates[templateName] = templateAddr;
        emit TemplateAdded(templateName, templateAddr, governance);
    }

    modifier onlyGovernance {
        require(msg.sender == governance, "You're not the governer.");
        _;
    }

    constructor(address initialOwner){
        governance = initialOwner;
    }

    function setGovernance(address newGoverner) public onlyGovernance {
        emit GovernanceChanged(governance, newGoverner);
        governance = newGoverner;
    }



    /*
        Internal Helpers
    */
    function _createClone(address target) internal returns (address result) {
        bytes20 targetBytes = bytes20(target);
        assembly {
            let clone := mload(0x40)
            mstore(clone, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(clone, 0x14), targetBytes)
            mstore(add(clone, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            result := create(0, clone, 0x37)
        }
    }

    function isClone(address target, address query) internal view returns (bool result) {
        bytes20 targetBytes = bytes20(target);
        assembly {
            let clone := mload(0x40)
            mstore(clone, 0x363d3d373d3d3d363d7300000000000000000000000000000000000000000000)
            mstore(add(clone, 0xa), targetBytes)
            mstore(add(clone, 0x1e), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)

            let other := add(clone, 0x40)
            extcodecopy(query, other, 0, 0x2d)
            result := and(
            eq(mload(clone), mload(other)),
            eq(mload(add(clone, 0xd)), mload(add(other, 0xd)))
            )
        }
    }
}