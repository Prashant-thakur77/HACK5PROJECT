// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PoliceWalletManager {
    address public owner;
    mapping(address => bool) public isPolice;
    address[] private policeList;

    event PoliceAdded(address indexed officer);
    event PoliceRemoved(address indexed officer);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function addPolice(address _officer) external onlyOwner {
        require(!isPolice[_officer], "Already police");
        isPolice[_officer] = true;
        policeList.push(_officer);
        emit PoliceAdded(_officer);
    }

    function removePolice(address _officer) external onlyOwner {
        require(isPolice[_officer], "Not police");
        isPolice[_officer] = false;
        
        for (uint i = 0; i < policeList.length; i++) {
            if (policeList[i] == _officer) {
                policeList[i] = policeList[policeList.length - 1];
                policeList.pop();
                break;
            }
        }
        emit PoliceRemoved(_officer);
    }
    function getPoliceList() external view returns (address[] memory) {
        return policeList;
    }

    function getPoliceCount() external view returns (uint) {
        return policeList.length;
    }
}