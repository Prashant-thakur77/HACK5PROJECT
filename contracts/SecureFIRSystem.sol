// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SecureFIRSystem {
    address public owner;
    
    struct FIR {
        uint256 id;
        string title;
        string description;
        string complainantName;
        string complainantContact;
        uint256 incidentDate;
        string incidentLocation;
        string category;
        string status;
        address complainantAddress;
        address assignedOfficer;
        bool isResolved;
        string[] updates;
        string[] evidenceCids;
        address[] authorizedParties;
    }

    mapping(uint256 => FIR) private firs;
    mapping(address => bool) public policeOfficers;
    uint256 private nextFIRId = 1;

    event FIRCreated(uint256 indexed id, address indexed complainant);
    event FIRAssigned(uint256 indexed id, address indexed officer);
    event FIRResolved(uint256 indexed id);
    event FIRUpdated(uint256 indexed id, string update);
    event EvidenceAdded(uint256 indexed firId, string cid);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthorized(uint256 firId) {
        require(isAuthorizedForFIR(firId, msg.sender), "Unauthorized access");
        _;
    }

    modifier onlyPolice() {
        require(policeOfficers[msg.sender], "Not authorized officer");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addPoliceOfficer(address officer) external onlyOwner {
        policeOfficers[officer] = true;
    }

    function removePoliceOfficer(address officer) external onlyOwner {
        policeOfficers[officer] = false;
    }

    function createFIR(
        string memory _title,
        string memory _description,
        string memory _complainantName,
        string memory _complainantContact,
        uint256 _incidentDate,
        string memory _incidentLocation,
        string memory _category,
        bool _includeComplainantAccess,
        string[] memory _evidenceCids
    ) external {
        FIR storage newFIR = firs[nextFIRId];
        newFIR.id = nextFIRId;
        newFIR.title = _title;
        newFIR.description = _description;
        newFIR.complainantName = _complainantName;
        newFIR.complainantContact = _complainantContact;
        newFIR.incidentDate = _incidentDate;
        newFIR.incidentLocation = _incidentLocation;
        newFIR.category = _category;
        newFIR.status = "Registered";
        newFIR.complainantAddress = msg.sender;
        newFIR.isResolved = false;
        newFIR.evidenceCids = _evidenceCids;
        
        newFIR.authorizedParties.push(owner);
        if (_includeComplainantAccess) {
            newFIR.authorizedParties.push(msg.sender);
        }

        emit FIRCreated(nextFIRId, msg.sender);
        nextFIRId++;
    }

    function assignOfficerToFIR(uint256 firId, address officer) external onlyOwner onlyAuthorized(firId) {
        require(policeOfficers[officer], "Invalid police officer");
        FIR storage fir = firs[firId];
        fir.assignedOfficer = officer;
        fir.authorizedParties.push(officer);
        emit FIRAssigned(firId, officer);
    }

    function addFIRUpdate(uint256 firId, string memory update) external onlyAuthorized(firId) {
        FIR storage fir = firs[firId];
        require(!fir.isResolved, "FIR is resolved");
        fir.updates.push(update);
        emit FIRUpdated(firId, update);
    }

    function addEvidence(uint256 firId, string memory cid) external onlyAuthorized(firId) {
        require(bytes(cid).length > 0, "Invalid CID");
        FIR storage fir = firs[firId];
        require(!fir.isResolved, "FIR is resolved");
        fir.evidenceCids.push(cid);
        emit EvidenceAdded(firId, cid);
    }

    function resolveFIR(uint256 firId) external onlyAuthorized(firId) {
        FIR storage fir = firs[firId];
        require(fir.assignedOfficer == msg.sender || msg.sender == owner, "Unauthorized");
        fir.isResolved = true;
        fir.status = "Resolved";
        emit FIRResolved(firId);
    }

    function getFIRDetails(uint256 firId) external view onlyAuthorized(firId) returns (
        string memory title,
        string memory status,
        address assignedOfficer,
        string[] memory updates
    ) {
        FIR storage fir = firs[firId];
        return (
            fir.title,
            fir.status,
            fir.assignedOfficer,
            fir.updates
        );
    }

    function getSensitiveFIRDetails(uint256 firId) external view onlyAuthorized(firId) returns (
        string memory description,
        string memory complainantName,
        string memory complainantContact,
        string memory incidentLocation,
        string memory category,
        string[] memory evidenceCids
    ) {
        FIR storage fir = firs[firId];
        return (
            fir.description,
            fir.complainantName,
            fir.complainantContact,
            fir.incidentLocation,
            fir.category,
            fir.evidenceCids
        );
    }

    function isAuthorizedForFIR(uint256 firId, address _address) private view returns (bool) {
        FIR storage fir = firs[firId];
        for (uint i = 0; i < fir.authorizedParties.length; i++) {
            if (fir.authorizedParties[i] == _address) {
                return true;
            }
        }
        return false;
    }
}