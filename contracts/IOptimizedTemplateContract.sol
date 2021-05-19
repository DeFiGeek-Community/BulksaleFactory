pragma solidity ^0.8.3;

/**
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

interface IOptimizedTemplateContract {
    event Initialized(bytes indexed abiBytes);

    function initialize(bytes32[2] memory _payloads) external returns (bool);
}