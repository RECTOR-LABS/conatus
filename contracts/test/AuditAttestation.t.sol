// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AuditAttestation} from "../src/AuditAttestation.sol";

contract AuditAttestationTest is Test {
    AuditAttestation internal att;
    address internal attester = address(0xA11CE);
    address internal stranger = address(0xBEEF);

    bytes32 internal constant TARGET = keccak256("contract-source-v1");
    string internal constant URI = "ipfs://bafyTestCid";
    uint256 internal constant AGENT_ID = 42;

    event Attested(bytes32 indexed targetHash, uint256 indexed agentId, uint8 riskScore, string findingsURI);

    function setUp() public {
        att = new AuditAttestation(attester);
    }

    function test_constructor_setsAttester() public view {
        assertEq(att.attester(), attester);
    }

    function test_constructor_revertsOnZeroAttester() public {
        vm.expectRevert(AuditAttestation.ZeroAttester.selector);
        new AuditAttestation(address(0));
    }

    function test_attest_storesAndEmits() public {
        vm.expectEmit(true, true, false, true);
        emit Attested(TARGET, AGENT_ID, 73, URI);

        vm.prank(attester);
        att.attest(TARGET, URI, 73, AGENT_ID);

        (uint8 risk, string memory uri, uint256 agentId, uint256 ts) = att.getAttestation(TARGET);
        assertEq(risk, 73);
        assertEq(uri, URI);
        assertEq(agentId, AGENT_ID);
        assertEq(ts, block.timestamp);
    }

    function test_attest_revertsWhenNotAttester() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(AuditAttestation.NotAttester.selector, stranger));
        att.attest(TARGET, URI, 10, AGENT_ID);
    }

    function test_attest_revertsOnRiskScoreAbove100() public {
        vm.prank(attester);
        vm.expectRevert(abi.encodeWithSelector(AuditAttestation.InvalidRiskScore.selector, uint8(101)));
        att.attest(TARGET, URI, 101, AGENT_ID);
    }

    function test_attest_allowsRiskScore100() public {
        vm.prank(attester);
        att.attest(TARGET, URI, 100, AGENT_ID);
        (uint8 risk,,,) = att.getAttestation(TARGET);
        assertEq(risk, 100);
    }

    function test_attest_revertsOnEmptyURI() public {
        vm.prank(attester);
        vm.expectRevert(AuditAttestation.EmptyFindingsURI.selector);
        att.attest(TARGET, "", 10, AGENT_ID);
    }

    function test_attest_revertsOnZeroTargetHash() public {
        vm.prank(attester);
        vm.expectRevert(AuditAttestation.InvalidTargetHash.selector);
        att.attest(bytes32(0), URI, 10, AGENT_ID);
    }

    function test_attest_reauditOverwrites() public {
        vm.startPrank(attester);
        att.attest(TARGET, URI, 50, AGENT_ID);
        att.attest(TARGET, "ipfs://newCid", 20, AGENT_ID);
        vm.stopPrank();
        (uint8 risk, string memory uri,,) = att.getAttestation(TARGET);
        assertEq(risk, 20);
        assertEq(uri, "ipfs://newCid");
    }

    function test_getAttestation_unknownReturnsZero() public view {
        (uint8 risk, string memory uri, uint256 agentId, uint256 ts) = att.getAttestation(keccak256("unknown"));
        assertEq(risk, 0);
        assertEq(bytes(uri).length, 0);
        assertEq(agentId, 0);
        assertEq(ts, 0);
    }
}
