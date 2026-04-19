// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ArcRemit is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    struct Remittance {
        address sender;
        address receiver;
        uint256 amount;
        string message;
        uint256 createdAt;
        uint256 expiresAt;
        RemittanceStatus status;
        bool privacyEnabled;
    }

    enum RemittanceStatus { Pending, Claimed, Refunded, Expired }

    mapping(uint256 => Remittance) public remittances;
    uint256 public nextRemittanceId;

    mapping(address => uint256[]) public receiverPendingIds;

    uint256 public feeRateBps = 30;
    address public feeCollector;

    event RemittanceCreated(
        uint256 indexed id,
        address indexed sender,
        address indexed receiver,
        uint256 amount,
        uint256 fee,
        string message,
        uint256 expiresAt
    );
    event RemittanceClaimed(uint256 indexed id, address indexed receiver, uint256 amount);
    event RemittanceRefunded(uint256 indexed id, address indexed sender, uint256 amount);
    event RemittanceExpired(uint256 indexed id);
    event FeeRateUpdated(uint256 oldRate, uint256 newRate);

    constructor(address _usdc, address _feeCollector) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        feeCollector = _feeCollector;
        nextRemittanceId = 1;
    }

    /**
     * @notice Create a new remittance - locks USDC in escrow
     * @param _receiver Address that can claim the funds
     * @param _amount USDC amount (6 decimals)
     * @param _message Optional message
     * @param _expiresInHours Hours until the remittance expires (0 = no expiry)
     */
    function createRemittance(
        address _receiver,
        uint256 _amount,
        string calldata _message,
        uint256 _expiresInHours
    ) external nonReentrant returns (uint256 remittanceId) {
        require(_receiver != address(0), "Invalid receiver");
        require(_receiver != msg.sender, "Cannot send to self");
        require(_amount > 0, "Amount must be > 0");
        require(_expiresInHours <= 720, "Max expiry: 30 days");

        uint256 fee = (_amount * feeRateBps) / 10000;
        uint256 totalRequired = _amount + fee;
        uint256 expiresAt = _expiresInHours == 0 ? 0 : block.timestamp + (_expiresInHours * 3600);

        remittanceId = nextRemittanceId++;
        remittances[remittanceId] = Remittance({
            sender: msg.sender,
            receiver: _receiver,
            amount: _amount,
            message: _message,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            status: RemittanceStatus.Pending,
            privacyEnabled: false
        });

        receiverPendingIds[_receiver].push(remittanceId);

        usdc.safeTransferFrom(msg.sender, address(this), totalRequired);

        if (fee > 0) {
            usdc.safeTransfer(feeCollector, fee);
        }

        emit RemittanceCreated(remittanceId, msg.sender, _receiver, _amount, fee, _message, expiresAt);
    }

    /**
     * @notice Claim a pending remittance - receiver calls this
     */
    function claimRemittance(uint256 _id) external nonReentrant {
        Remittance storage r = remittances[_id];
        require(r.receiver == msg.sender, "Not the receiver");
        require(r.status == RemittanceStatus.Pending, "Not pending");
        require(r.expiresAt == 0 || block.timestamp <= r.expiresAt, "Expired");

        r.status = RemittanceStatus.Claimed;
        usdc.safeTransfer(msg.sender, r.amount);

        emit RemittanceClaimed(_id, msg.sender, r.amount);
    }

    /**
     * @notice Refund an expired remittance - sender calls this
     */
    function refundRemittance(uint256 _id) external nonReentrant {
        Remittance storage r = remittances[_id];
        require(r.sender == msg.sender, "Not the sender");
        require(r.status == RemittanceStatus.Pending, "Not pending");
        require(r.expiresAt > 0 && block.timestamp > r.expiresAt, "Not expired yet");

        r.status = RemittanceStatus.Refunded;
        usdc.safeTransfer(msg.sender, r.amount);

        emit RemittanceRefunded(_id, msg.sender, r.amount);
    }

    /**
     * @notice Get pending remittances for a receiver
     */
    function getPendingRemittances(address _receiver) external view returns (uint256[] memory) {
        uint256[] storage ids = receiverPendingIds[_receiver];
        uint256 count = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (remittances[ids[i]].status == RemittanceStatus.Pending) {
                count++;
            }
        }
        uint256[] memory result = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (remittances[ids[i]].status == RemittanceStatus.Pending) {
                result[idx++] = ids[i];
            }
        }
        return result;
    }

    /**
     * @notice Admin: update fee rate
     */
    function setFeeRate(uint256 _newRateBps) external onlyOwner {
        require(_newRateBps <= 100, "Max fee: 1%");
        emit FeeRateUpdated(feeRateBps, _newRateBps);
        feeRateBps = _newRateBps;
    }

    /**
     * @notice Emergency: withdraw stuck tokens
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}
