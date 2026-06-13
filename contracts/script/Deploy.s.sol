// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AuditAttestation} from "../src/AuditAttestation.sol";

/// @notice Deploys AuditAttestation, setting the attester to ATTESTER_ADDRESS if provided,
///         otherwise to the deployer (AGENT_PRIVATE_KEY) address. No secrets are hardcoded.
contract Deploy is Script {
    function run() external returns (AuditAttestation att) {
        uint256 pk = vm.envUint("AGENT_PRIVATE_KEY");
        address attester = vm.envOr("ATTESTER_ADDRESS", vm.addr(pk));
        vm.startBroadcast(pk);
        att = new AuditAttestation(attester);
        vm.stopBroadcast();
        console2.log("AuditAttestation:", address(att));
        console2.log("attester:", attester);
    }
}
