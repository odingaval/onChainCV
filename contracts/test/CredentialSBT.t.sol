// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {IssuerRegistry} from "../src/IssuerRegistry.sol";
import {CredentialSBT} from "../src/CredentialSBT.sol";

contract CredentialSBTTest is Test {
    IssuerRegistry registry;
    CredentialSBT sbt;

    address admin = address(0xA11CE);
    address issuer = address(0x1A5511);
    address user = address(0xB0B);

    function setUp() public {
        vm.prank(admin);
        registry = new IssuerRegistry();
        // admin is owner by default
        vm.prank(admin);
        registry.addIssuer(issuer);

        sbt = new CredentialSBT(address(registry), "OnchainCV Credential", "OCVC");
    }

    function testMintByIssuer() public {
        vm.prank(issuer);
        uint256 tokenId = sbt.mint(user, "bafybeigdyr...cid");

        assertEq(tokenId, 1);
        assertEq(sbt.ownerOf(tokenId), user);
        assertEq(
            keccak256(bytes(sbt.tokenURI(tokenId))),
            keccak256(bytes(string(abi.encodePacked("ipfs://", "bafybeigdyr...cid"))))
        );
    }

    function testMintByNonIssuerReverts() public {
        vm.expectRevert();
        sbt.mint(user, "cid");
    }

    function testTransferReverts() public {
        vm.prank(issuer);
        uint256 tokenId = sbt.mint(user, "cid");

        vm.expectRevert();
        sbt.transferFrom(user, address(0x1234), tokenId);
    }

    function testRevoke() public {
        vm.prank(issuer);
        uint256 tokenId = sbt.mint(user, "cid");

        vm.prank(issuer);
        sbt.revoke(tokenId);

        // second revoke should revert with Revoked
        vm.prank(issuer);
        vm.expectRevert(CredentialSBT.Revoked.selector);
        sbt.revoke(tokenId);
    }

    function testRegistryAccessUpdates() public {
        address newIssuer = address(0xABCD);

        // newIssuer not authorized yet
        vm.expectRevert();
        vm.prank(newIssuer);
        sbt.mint(user, "cid");

        // admin adds newIssuer
        vm.prank(admin);
        registry.addIssuer(newIssuer);

        // now mint should succeed
        vm.prank(newIssuer);
        uint256 tokenId = sbt.mint(user, "cid2");
        assertEq(tokenId, 1); // fresh contract instance means nextId starts at 1 in this test, but we already minted before? Ensure isolation
    }
}


