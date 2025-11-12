// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import {IssuerRegistry} from "../src/IssuerRegistry.sol";
import {CredentialSBT} from "../src/CredentialSBT.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address initialIssuer;
        // Make INITIAL_ISSUER optional; default to address(0) if not provided or invalid
        try vm.envAddress("INITIAL_ISSUER") returns (address parsed) {
            initialIssuer = parsed;
        } catch {
            initialIssuer = address(0);
        }

        vm.startBroadcast(deployerKey);

        IssuerRegistry registry = new IssuerRegistry();
        if (initialIssuer != address(0)) {
            registry.addIssuer(initialIssuer);
        }

        CredentialSBT sbt = new CredentialSBT(address(registry), "OnchainCV Credential", "OCVC");

        vm.stopBroadcast();

        console2.log("IssuerRegistry:", address(registry));
        console2.log("CredentialSBT:", address(sbt));
    }
}


