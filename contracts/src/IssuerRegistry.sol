// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/// @title IssuerRegistry
/// @notice Minimal owner-managed registry of authorized credential issuers
contract IssuerRegistry {
    address public owner;
    mapping(address => bool) private authorizedIssuers;

    event OwnerTransferred(address indexed previousOwner, address indexed newOwner);
    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnerTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ZERO_ADDRESS");
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }

    function addIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "ZERO_ADDRESS");
        require(!authorizedIssuers[issuer], "ALREADY_ISSUER");
        authorizedIssuers[issuer] = true;
        emit IssuerAdded(issuer);
    }

    function removeIssuer(address issuer) external onlyOwner {
        require(authorizedIssuers[issuer], "NOT_ISSUER");
        delete authorizedIssuers[issuer];
        emit IssuerRemoved(issuer);
    }

    function isIssuer(address account) external view returns (bool) {
        return authorizedIssuers[account];
    }
}


