// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract ArcRemit is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    // ==================== CORE REMITTANCE ====================

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

    uint256 public feeRateBps = 30; // 0.3% default
    address public feeCollector;

    // ==================== RECURRING SCHEDULES ====================

    struct PaymentSchedule {
        address sender;
        address receiver;
        uint256 amountPerCycle;
        uint256 cycleInterval; // seconds (e.g., 30 days = 2592000)
        uint256 totalCycles;
        uint256 cyclesCompleted;
        uint256 nextExecution;
        bool active;
    }

    mapping(uint256 => PaymentSchedule) public schedules;
    uint256 public nextScheduleId;

    // ==================== CONTACT BOOK ====================

    // owner => contact => nickname
    mapping(address => mapping(address => string)) public nicknames;

    // ==================== REFERRAL SYSTEM ====================

    mapping(address => address) public referrerOf; // user => referrer
    mapping(address => uint256) public referralEarnings; // referrer => earnings
    mapping(address => uint256) public referralCount; // referrer => number of referrals

    uint256 public referralFeeDiscountBps = 20; // 0.2% discount (0.1% vs 0.3%)
    uint256 public referrerRewardPercent = 10; // 10% of fees goes to referrer

    // ==================== TEMPLATES ====================

    struct Template {
        address receiver;
        uint256 amount;
        string description;
    }

    mapping(address => Template[]) public templates;

    // ==================== EVENTS ====================

    // Core events
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

    // Batch events
    event BatchRemittanceCreated(
        address indexed sender,
        uint256 count,
        uint256 totalAmount
    );

    // Schedule events
    event ScheduleCreated(
        uint256 indexed scheduleId,
        address indexed sender,
        address indexed receiver,
        uint256 amountPerCycle,
        uint256 totalCycles
    );
    event ScheduleExecuted(uint256 indexed scheduleId, uint256 remittanceId);
    event ScheduleCancelled(uint256 indexed scheduleId);

    // Contact book events
    event NicknameSet(address indexed owner, address indexed contact, string nickname);

    // Referral events
    event ReferrerSet(address indexed user, address indexed referrer);
    event ReferralRewardClaimed(address indexed referrer, uint256 amount);

    // Template events
    event TemplateSaved(address indexed user, uint256 templateId);
    event TemplateUsed(address indexed user, uint256 templateId);
    event TemplateDeleted(address indexed user, uint256 templateId);

    // Analytics events
    event RemittanceVolumeUpdated(address indexed sender, uint256 totalVolume);

    // Pause events
    event PausedChanged(bool paused);

    // ==================== CONSTRUCTOR ====================

    constructor(address _usdc, address _feeCollector) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        feeCollector = _feeCollector;
        nextRemittanceId = 1;
        nextScheduleId = 1;
    }

    // ==================== CORE REMITTANCE ====================

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
    ) external nonReentrant whenNotPaused returns (uint256 remittanceId) {
        require(_receiver != address(0), "Invalid receiver");
        require(_receiver != msg.sender, "Cannot send to self");
        require(_amount > 0, "Amount must be > 0");
        require(_expiresInHours <= 720, "Max expiry: 30 days");

        uint256 effectiveRate = _getEffectiveFeeRate(msg.sender);
        uint256 fee = (_amount * effectiveRate) / 10000;
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
            _distributeFees(msg.sender, fee);
        }

        emit RemittanceCreated(remittanceId, msg.sender, _receiver, _amount, fee, _message, expiresAt);
        emit RemittanceVolumeUpdated(msg.sender, _amount);
    }

    /**
     * @notice Claim a pending remittance - receiver calls this
     */
    function claimRemittance(uint256 _id) external nonReentrant whenNotPaused {
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
    function refundRemittance(uint256 _id) external nonReentrant whenNotPaused {
        Remittance storage r = remittances[_id];
        require(r.sender == msg.sender, "Not the sender");
        require(r.status == RemittanceStatus.Pending, "Not pending");
        require(r.expiresAt > 0 && block.timestamp > r.expiresAt, "Not expired yet");

        r.status = RemittanceStatus.Refunded;
        usdc.safeTransfer(msg.sender, r.amount);

        emit RemittanceRefunded(_id, msg.sender, r.amount);
    }

    // ==================== BATCH REMITTANCES ====================

    /**
     * @notice Create multiple remittances in a single transaction
     * @param _receivers Array of receiver addresses
     * @param _amounts Array of USDC amounts
     * @param _messages Array of messages
     * @param _expiresInHours Hours until expiry (0 = no expiry)
     */
    function batchCreateRemittances(
        address[] calldata _receivers,
        uint256[] calldata _amounts,
        string[] calldata _messages,
        uint256 _expiresInHours
    ) external nonReentrant whenNotPaused returns (uint256[] memory remittanceIds) {
        uint256 len = _receivers.length;
        require(len > 0, "Empty arrays");
        require(len == _amounts.length, "Array length mismatch");
        require(len == _messages.length, "Array length mismatch");
        require(_expiresInHours <= 720, "Max expiry: 30 days");

        uint256 totalAmount;
        uint256 totalFees;

        // Calculate total requirements
        for (uint256 i = 0; i < len; i++) {
            require(_receivers[i] != address(0), "Invalid receiver");
            require(_receivers[i] != msg.sender, "Cannot send to self");
            require(_amounts[i] > 0, "Amount must be > 0");
            totalAmount += _amounts[i];
            totalFees += (_amounts[i] * _getEffectiveFeeRate(msg.sender)) / 10000;
        }

        uint256 totalRequired = totalAmount + totalFees;
        usdc.safeTransferFrom(msg.sender, address(this), totalRequired);

        remittanceIds = new uint256[](len);
        uint256 expiresAt = _expiresInHours == 0 ? 0 : block.timestamp + (_expiresInHours * 3600);

        for (uint256 i = 0; i < len; i++) {
            uint256 remittanceId = nextRemittanceId++;
            remittanceIds[i] = remittanceId;

            uint256 fee = (_amounts[i] * _getEffectiveFeeRate(msg.sender)) / 10000;

            remittances[remittanceId] = Remittance({
                sender: msg.sender,
                receiver: _receivers[i],
                amount: _amounts[i],
                message: _messages[i],
                createdAt: block.timestamp,
                expiresAt: expiresAt,
                status: RemittanceStatus.Pending,
                privacyEnabled: false
            });

            receiverPendingIds[_receivers[i]].push(remittanceId);

            if (fee > 0) {
                _distributeFees(msg.sender, fee);
            }

            emit RemittanceCreated(remittanceId, msg.sender, _receivers[i], _amounts[i], fee, _messages[i], expiresAt);
        }

        emit BatchRemittanceCreated(msg.sender, len, totalAmount);
        emit RemittanceVolumeUpdated(msg.sender, totalAmount);
    }

    // ==================== RECURRING SCHEDULES ====================

    /**
     * @notice Create a recurring payment schedule
     * @param _receiver Receiver address
     * @param _amountPerCycle Amount per cycle (USDC)
     * @param _intervalSeconds Seconds between cycles (e.g., 2592000 for 30 days)
     * @param _totalCycles Total number of cycles (0 = infinite)
     */
    function createSchedule(
        address _receiver,
        uint256 _amountPerCycle,
        uint256 _intervalSeconds,
        uint256 _totalCycles
    ) external whenNotPaused returns (uint256 scheduleId) {
        require(_receiver != address(0), "Invalid receiver");
        require(_receiver != msg.sender, "Cannot send to self");
        require(_amountPerCycle > 0, "Amount must be > 0");
        require(_intervalSeconds >= 1 hours, "Min interval: 1 hour");

        scheduleId = nextScheduleId++;
        schedules[scheduleId] = PaymentSchedule({
            sender: msg.sender,
            receiver: _receiver,
            amountPerCycle: _amountPerCycle,
            cycleInterval: _intervalSeconds,
            totalCycles: _totalCycles,
            cyclesCompleted: 0,
            nextExecution: block.timestamp + _intervalSeconds,
            active: true
        });

        emit ScheduleCreated(scheduleId, msg.sender, _receiver, _amountPerCycle, _totalCycles);
    }

    /**
     * @notice Execute a scheduled payment (anyone can call)
     * @param _scheduleId Schedule ID to execute
     */
    function executeSchedule(uint256 _scheduleId) external nonReentrant whenNotPaused {
        PaymentSchedule storage s = schedules[_scheduleId];
        require(s.active, "Schedule not active");
        require(block.timestamp >= s.nextExecution, "Not ready for execution");

        if (s.totalCycles > 0) {
            require(s.cyclesCompleted < s.totalCycles, "All cycles completed");
        }

        s.cyclesCompleted++;
        s.nextExecution = block.timestamp + s.cycleInterval;

        // Create remittance directly
        uint256 effectiveRate = _getEffectiveFeeRate(s.sender);
        uint256 fee = (s.amountPerCycle * effectiveRate) / 10000;
        uint256 totalRequired = s.amountPerCycle + fee;
        usdc.safeTransferFrom(s.sender, address(this), totalRequired);

        uint256 remittanceId = nextRemittanceId++;
        remittances[remittanceId] = Remittance({
            sender: s.sender,
            receiver: s.receiver,
            amount: s.amountPerCycle,
            message: "Scheduled payment",
            createdAt: block.timestamp,
            expiresAt: block.timestamp + (72 * 3600), // 72 hour claim window
            status: RemittanceStatus.Pending,
            privacyEnabled: false
        });

        receiverPendingIds[s.receiver].push(remittanceId);

        if (fee > 0) {
            _distributeFees(s.sender, fee);
        }

        emit RemittanceCreated(remittanceId, s.sender, s.receiver, s.amountPerCycle, fee, "Scheduled payment", block.timestamp + (72 * 3600));
        emit ScheduleExecuted(_scheduleId, remittanceId);
        emit RemittanceVolumeUpdated(s.sender, s.amountPerCycle);

        // Deactivate if all cycles done
        if (s.totalCycles > 0 && s.cyclesCompleted >= s.totalCycles) {
            s.active = false;
        }
    }

    /**
     * @notice Cancel a payment schedule (only sender)
     * @param _scheduleId Schedule ID to cancel
     */
    function cancelSchedule(uint256 _scheduleId) external {
        PaymentSchedule storage s = schedules[_scheduleId];
        require(s.sender == msg.sender, "Not the sender");
        require(s.active, "Schedule not active");

        s.active = false;
        emit ScheduleCancelled(_scheduleId);
    }

    // ==================== CONTACT BOOK ====================

    /**
     * @notice Set a nickname for a contact
     * @param _contact Address of the contact
     * @param _nickname Nickname to assign
     */
    function setNickname(address _contact, string calldata _nickname) external {
        require(_contact != address(0), "Invalid contact");
        require(bytes(_nickname).length > 0, "Empty nickname");
        nicknames[msg.sender][_contact] = _nickname;
        emit NicknameSet(msg.sender, _contact, _nickname);
    }

    /**
     * @notice Get nickname for a contact (your own)
     * @param _contact Contact address
     */
    function getNickname(address _contact) external view returns (string memory) {
        return nicknames[msg.sender][_contact];
    }

    // ==================== REFERRAL SYSTEM ====================

    /**
     * @notice Set who referred you (one-time only)
     * @param _referrer Address of the referrer
     */
    function setReferrer(address _referrer) external {
        require(_referrer != address(0), "Invalid referrer");
        require(_referrer != msg.sender, "Cannot refer yourself");
        require(referrerOf[msg.sender] == address(0), "Already set referrer");

        referrerOf[msg.sender] = _referrer;
        referralCount[_referrer]++;
        emit ReferrerSet(msg.sender, _referrer);
    }

    /**
     * @notice Get referral stats for a referrer
     * @param _referrer Referrer address
     * @return count Number of referrals
     * @return earnings Total earnings from referrals
     */
    function getReferralStats(address _referrer) external view returns (uint256 count, uint256 earnings) {
        return (referralCount[_referrer], referralEarnings[_referrer]);
    }

    /**
     * @notice Claim accumulated referral earnings
     */
    function claimReferralEarnings() external nonReentrant whenNotPaused {
        uint256 earnings = referralEarnings[msg.sender];
        require(earnings > 0, "No earnings to claim");

        referralEarnings[msg.sender] = 0;
        usdc.safeTransfer(msg.sender, earnings);

        emit ReferralRewardClaimed(msg.sender, earnings);
    }

    // ==================== TEMPLATES ====================

    /**
     * @notice Save a remittance template for reuse
     * @param _receiver Receiver address
     * @param _amount Amount to send
     * @param _description Description of the template
     */
    function saveTemplate(
        address _receiver,
        uint256 _amount,
        string calldata _description
    ) external returns (uint256 templateId) {
        require(_receiver != address(0), "Invalid receiver");
        require(_amount > 0, "Amount must be > 0");

        templateId = templates[msg.sender].length;
        templates[msg.sender].push(Template({
            receiver: _receiver,
            amount: _amount,
            description: _description
        }));

        emit TemplateSaved(msg.sender, templateId);
    }

    /**
     * @notice Create a remittance from a saved template
     * @param _templateId Template ID
     * @param _message Message for the remittance
     * @param _expiresInHours Hours until expiry
     */
    function createFromTemplate(
        uint256 _templateId,
        string calldata _message,
        uint256 _expiresInHours
    ) external nonReentrant whenNotPaused returns (uint256 remittanceId) {
        require(_templateId < templates[msg.sender].length, "Invalid template");

        Template storage t = templates[msg.sender][_templateId];
        require(t.receiver != address(0), "Template deleted");

        uint256 effectiveRate = _getEffectiveFeeRate(msg.sender);
        uint256 fee = (t.amount * effectiveRate) / 10000;
        uint256 totalRequired = t.amount + fee;
        uint256 expiresAt = _expiresInHours == 0 ? 0 : block.timestamp + (_expiresInHours * 3600);

        remittanceId = nextRemittanceId++;
        remittances[remittanceId] = Remittance({
            sender: msg.sender,
            receiver: t.receiver,
            amount: t.amount,
            message: _message,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            status: RemittanceStatus.Pending,
            privacyEnabled: false
        });

        receiverPendingIds[t.receiver].push(remittanceId);

        usdc.safeTransferFrom(msg.sender, address(this), totalRequired);

        if (fee > 0) {
            _distributeFees(msg.sender, fee);
        }

        emit RemittanceCreated(remittanceId, msg.sender, t.receiver, t.amount, fee, _message, expiresAt);
        emit TemplateUsed(msg.sender, _templateId);
        emit RemittanceVolumeUpdated(msg.sender, t.amount);
    }

    /**
     * @notice Delete a saved template
     * @param _templateId Template ID to delete
     */
    function deleteTemplate(uint256 _templateId) external {
        require(_templateId < templates[msg.sender].length, "Invalid template");
        require(templates[msg.sender][_templateId].receiver != address(0), "Already deleted");

        // Mark as deleted by zeroing receiver
        templates[msg.sender][_templateId].receiver = address(0);
        templates[msg.sender][_templateId].amount = 0;
        templates[msg.sender][_templateId].description = "";

        emit TemplateDeleted(msg.sender, _templateId);
    }

    // ==================== ADMIN / PAUSE ====================

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
     * @notice Admin: set referral discount in basis points
     */
    function setReferralDiscount(uint256 _discountBps) external onlyOwner {
        require(_discountBps <= feeRateBps, "Discount > fee rate");
        referralFeeDiscountBps = _discountBps;
    }

    /**
     * @notice Admin: set referrer reward percentage
     */
    function setReferrerRewardPercent(uint256 _percent) external onlyOwner {
        require(_percent <= 100, "Max 100%");
        referrerRewardPercent = _percent;
    }

    /**
     * @notice Emergency: pause all operations
     */
    function pause() external onlyOwner {
        _pause();
        emit PausedChanged(true);
    }

    /**
     * @notice Emergency: unpause all operations
     */
    function unpause() external onlyOwner {
        _unpause();
        emit PausedChanged(false);
    }

    /**
     * @notice Emergency: withdraw stuck tokens (works even when paused)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    // ==================== INTERNAL HELPERS ====================

    function _getEffectiveFeeRate(address _sender) internal view returns (uint256) {
        address referrer = referrerOf[_sender];
        if (referrer != address(0) && feeRateBps > referralFeeDiscountBps) {
            return feeRateBps - referralFeeDiscountBps;
        }
        return feeRateBps;
    }

    function _calculateFee(uint256 _amount) internal view returns (uint256 fee, uint256 totalRequired) {
        fee = (_amount * feeRateBps) / 10000;
        totalRequired = _amount + fee;
    }

    function _calculateFeeWithReferral(address _sender, uint256 _amount) internal view returns (uint256 fee, uint256 totalRequired, uint256 referrerShare) {
        uint256 effectiveRate = _getEffectiveFeeRate(_sender);
        fee = (_amount * effectiveRate) / 10000;
        totalRequired = _amount + fee;

        address referrer = referrerOf[_sender];
        if (referrer != address(0) && fee > 0) {
            referrerShare = (fee * referrerRewardPercent) / 100;
        }
    }

    function _distributeFees(address _sender, uint256 _fee) internal {
        address referrer = referrerOf[_sender];
        if (referrer != address(0) && _fee > 0) {
            uint256 referrerShare = (_fee * referrerRewardPercent) / 100;
            uint256 collectorShare = _fee - referrerShare;

            if (referrerShare > 0) {
                referralEarnings[referrer] += referrerShare;
            }
            if (collectorShare > 0) {
                usdc.safeTransfer(feeCollector, collectorShare);
            }
        } else if (_fee > 0) {
            usdc.safeTransfer(feeCollector, _fee);
        }
    }
}
