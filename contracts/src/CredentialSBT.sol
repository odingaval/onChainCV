// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IssuerRegistry} from "./IssuerRegistry.sol";

/// @title CredentialSBT
/// @notice Minimal non-transferable credential token with IPFS metadata CID
/// @dev ERC721-like surface for compatibility; all transfer/approval ops revert
contract CredentialSBT {
    // ERC165 interface id for ERC165 itself
    bytes4 private constant _INTERFACE_ID_ERC165 = 0x01ffc9a7;
    // ERC165 interface id for ERC721 (partial compatibility)
    bytes4 private constant _INTERFACE_ID_ERC721 = 0x80ac58cd;

    string public name;
    string public symbol;

    IssuerRegistry public immutable issuerRegistry;

    struct CredentialData {
        address issuer;
        address subject;
        string cid; // IPFS CID
        uint64 issuedAt;
        bool revoked;
    }

    uint256 private _nextId = 1;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => CredentialData) private _credentialOf;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event CredentialIssued(uint256 indexed tokenId, address indexed issuer, address indexed subject, string cid);
    event CredentialRevoked(uint256 indexed tokenId, address indexed issuer);

    error NotIssuer();
    error NonExistentToken();
    error Revoked();
    error NonTransferable();

    modifier onlyIssuer() {
        if (!IssuerRegistry(issuerRegistry).isIssuer(msg.sender)) revert NotIssuer();
        _;
    }

    constructor(address _issuerRegistry, string memory _name, string memory _symbol) {
        issuerRegistry = IssuerRegistry(_issuerRegistry);
        name = _name;
        symbol = _symbol;
    }

    // --- Views ---
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == _INTERFACE_ID_ERC165 || interfaceId == _INTERFACE_ID_ERC721;
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner_ = _owners[tokenId];
        if (owner_ == address(0)) revert NonExistentToken();
        return owner_;
    }

    function balanceOf(address owner_) external view returns (uint256) {
        require(owner_ != address(0), "ZERO_ADDRESS");
        return _balances[owner_];
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        if (_owners[tokenId] == address(0)) revert NonExistentToken();
        return string(abi.encodePacked("ipfs://", _credentialOf[tokenId].cid));
    }

    function credential(uint256 tokenId) external view returns (CredentialData memory) {
        if (_owners[tokenId] == address(0)) revert NonExistentToken();
        return _credentialOf[tokenId];
    }

    // --- Issuance ---
    function mint(address to, string memory cid) external onlyIssuer returns (uint256 tokenId) {
        require(to != address(0), "ZERO_ADDRESS");

        tokenId = _nextId++;
        _owners[tokenId] = to;
        _balances[to] += 1;

        _credentialOf[tokenId] = CredentialData({
            issuer: msg.sender,
            subject: to,
            cid: cid,
            issuedAt: uint64(block.timestamp),
            revoked: false
        });

        emit Transfer(address(0), to, tokenId);
        emit CredentialIssued(tokenId, msg.sender, to, cid);
    }

    function revoke(uint256 tokenId) external onlyIssuer {
        if (_owners[tokenId] == address(0)) revert NonExistentToken();
        CredentialData storage data = _credentialOf[tokenId];
        if (data.revoked) revert Revoked();
        data.revoked = true;
        emit CredentialRevoked(tokenId, msg.sender);
    }

    // --- Non-transferability ---
    function approve(address /*to*/, uint256 /*tokenId*/) external pure {
        revert NonTransferable();
    }

    function getApproved(uint256 /*tokenId*/) external pure returns (address) {
        return address(0);
    }

    function setApprovalForAll(address /*operator*/, bool /*approved*/) external pure {
        revert NonTransferable();
    }

    function isApprovedForAll(address /*owner_*/, address /*operator*/) external pure returns (bool) {
        return false;
    }

    function transferFrom(address /*from*/, address /*to*/, uint256 /*tokenId*/) external pure {
        revert NonTransferable();
    }

    function safeTransferFrom(address /*from*/, address /*to*/, uint256 /*tokenId*/) external pure {
        revert NonTransferable();
    }

    function safeTransferFrom(address /*from*/, address /*to*/, uint256 /*tokenId*/, bytes calldata /*data*/) external pure {
        revert NonTransferable();
    }
}


