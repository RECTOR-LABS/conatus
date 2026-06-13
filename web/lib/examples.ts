export type Severity = "high" | "med" | "low";

export interface Example {
  id: string; // stable key + chip aria id
  name: string; // "Vault" — also pre-fills the contract-name field on click
  descriptor: string; // "reentrancy" — visible chip text, colored by severity
  severity: Severity; // drives the chip's accent COLOR only — never a displayed score
  source: string; // self-contained single-file Solidity (no imports)
}

const VAULT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Vault — intentionally vulnerable demo (reentrancy)
contract Vault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "insufficient");
        (bool ok, ) = msg.sender.call{value: amount}(""); // interaction before effect
        require(ok, "transfer failed");
        balances[msg.sender] -= amount;                   // state updated AFTER call -> reentrancy
    }

    function totalAssets() external view returns (uint256) {
        return address(this).balance;
    }
}
`;

const CROWDSALE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Crowdsale — intentionally flawed demo (broken access control)
contract Crowdsale {
    address public owner;
    uint256 public rate; // tokens credited per wei
    mapping(address => uint256) public credited;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(uint256 _rate) {
        owner = msg.sender;
        rate = _rate;
    }

    function buy() external payable {
        require(msg.value > 0, "no value");
        credited[msg.sender] += msg.value * rate;
    }

    function setRate(uint256 _rate) external onlyOwner {
        rate = _rate;
    }

    // BUG: missing onlyOwner — anyone can drain the proceeds
    function withdrawFunds(address payable to) external {
        to.transfer(address(this).balance);
    }
}
`;

const ESCROW = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Escrow — a deliberately well-guarded demo (minimal findings expected)
contract Escrow {
    address public immutable buyer;
    address public immutable seller;
    address public immutable arbiter;
    bool public released;
    bool public refunded;

    constructor(address _seller, address _arbiter) payable {
        require(_seller != address(0) && _arbiter != address(0), "zero addr");
        buyer = msg.sender;
        seller = _seller;
        arbiter = _arbiter;
    }

    function release() external {
        require(msg.sender == arbiter, "only arbiter");
        require(!released && !refunded, "already settled");
        released = true; // effects before interaction
        (bool ok, ) = seller.call{value: address(this).balance}("");
        require(ok, "transfer failed");
    }

    function refund() external {
        require(msg.sender == arbiter, "only arbiter");
        require(!released && !refunded, "already settled");
        refunded = true;
        (bool ok, ) = payable(buyer).call{value: address(this).balance}("");
        require(ok, "transfer failed");
    }
}
`;

export const EXAMPLES: readonly Example[] = [
  { id: "vault", name: "Vault", descriptor: "reentrancy", severity: "high", source: VAULT },
  { id: "crowdsale", name: "Crowdsale", descriptor: "access-control", severity: "med", source: CROWDSALE },
  { id: "escrow", name: "Escrow", descriptor: "well-guarded", severity: "low", source: ESCROW },
];
