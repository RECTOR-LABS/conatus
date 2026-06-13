// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AuditAttestation
/// @notice Minimal on-chain registry of AI-produced smart-contract audit verdicts for Mantle.
/// @dev Binds an audited-source hash to an IPFS findings URI, a 0-100 risk score, and the
///      auditing agent's ERC-8004 identity (agentId). Writes are restricted to the authorized
///      Conatus agent wallet to prevent third parties spoofing or overwriting verdicts.
contract AuditAttestation {
    struct Attestation {
        uint8 riskScore; // 0-100, mirrors ERC-8004 score convention
        uint256 agentId; // ERC-8004 IdentityRegistry tokenId of the auditor
        uint256 timestamp; // block time the verdict was written
        string findingsURI; // IPFS URI of the full findings report
    }

    /// @notice The only address permitted to write attestations (the Conatus agent wallet).
    address public immutable attester;

    mapping(bytes32 => Attestation) private _attestations;

    event Attested(bytes32 indexed targetHash, uint256 indexed agentId, uint8 riskScore, string findingsURI);

    error ZeroAttester();
    error NotAttester(address caller);
    error InvalidRiskScore(uint8 riskScore);
    error EmptyFindingsURI();
    error InvalidTargetHash();

    constructor(address attester_) {
        if (attester_ == address(0)) revert ZeroAttester();
        attester = attester_;
    }

    modifier onlyAttester() {
        if (msg.sender != attester) revert NotAttester(msg.sender);
        _;
    }

    /// @notice Write (or re-audit/overwrite) the verdict for `targetHash`.
    function attest(bytes32 targetHash, string calldata findingsURI, uint8 riskScore, uint256 agentId)
        external
        onlyAttester
    {
        if (targetHash == bytes32(0)) revert InvalidTargetHash();
        if (riskScore > 100) revert InvalidRiskScore(riskScore);
        if (bytes(findingsURI).length == 0) revert EmptyFindingsURI();

        _attestations[targetHash] =
            Attestation({riskScore: riskScore, agentId: agentId, timestamp: block.timestamp, findingsURI: findingsURI});

        emit Attested(targetHash, agentId, riskScore, findingsURI);
    }

    /// @notice Read the latest verdict for `targetHash`. Returns zero-values if none exists.
    function getAttestation(bytes32 targetHash)
        external
        view
        returns (uint8 riskScore, string memory findingsURI, uint256 agentId, uint256 timestamp)
    {
        Attestation memory a = _attestations[targetHash];
        return (a.riskScore, a.findingsURI, a.agentId, a.timestamp);
    }
}
