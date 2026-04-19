import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ArcRemit, MockUSDC } from "../typechain-types";

describe("ArcRemit", function () {
  let arcRemit: ArcRemit;
  let usdc: MockUSDC;
  let owner: SignerWithAddress;
  let sender: SignerWithAddress;
  let receiver: SignerWithAddress;
  let feeCollector: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  const USDC_DECIMALS = 6;
  const ONE_HUNDRED_USDC = 100n * 10n ** BigInt(USDC_DECIMALS);
  const FIFTY_USDC = 50n * 10n ** BigInt(USDC_DECIMALS);
  const TEN_USDC = 10n * 10n ** BigInt(USDC_DECIMALS);
  const FEE_RATE_BPS = 30n; // 0.3%

  beforeEach(async function () {
    [owner, sender, receiver, feeCollector, user1, user2, user3] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    // Deploy ArcRemit
    const ArcRemit = await ethers.getContractFactory("ArcRemit");
    arcRemit = await ArcRemit.deploy(await usdc.getAddress(), feeCollector.address);

    // Mint USDC to sender
    await usdc.mint(sender.address, ONE_HUNDRED_USDC);

    // Approve ArcRemit to spend sender's USDC
    await usdc.connect(sender).approve(await arcRemit.getAddress(), ONE_HUNDRED_USDC);
  });

  describe("Deployment", function () {
    it("Should set the correct USDC address", async function () {
      expect(await arcRemit.usdc()).to.equal(await usdc.getAddress());
    });

    it("Should set the correct fee collector", async function () {
      expect(await arcRemit.feeCollector()).to.equal(feeCollector.address);
    });

    it("Should set the correct owner", async function () {
      expect(await arcRemit.owner()).to.equal(owner.address);
    });

    it("Should initialize nextRemittanceId to 1", async function () {
      expect(await arcRemit.nextRemittanceId()).to.equal(1);
    });

    it("Should set default fee rate to 0.3%", async function () {
      expect(await arcRemit.feeRateBps()).to.equal(30);
    });

    it("Should initialize nextScheduleId to 1", async function () {
      expect(await arcRemit.nextScheduleId()).to.equal(1);
    });
  });

  describe("createRemittance", function () {
    it("Should create a remittance successfully", async function () {
      const message = "For mom's birthday";
      const expiresInHours = 24;

      const tx = await arcRemit.connect(sender).createRemittance(
        receiver.address,
        TEN_USDC,
        message,
        expiresInHours
      );

      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(arcRemit, "RemittanceCreated")
        .withArgs(
          1,
          sender.address,
          receiver.address,
          TEN_USDC,
          (TEN_USDC * FEE_RATE_BPS) / 10000n,
          message,
          block!.timestamp + expiresInHours * 3600
        );

      expect(await arcRemit.nextRemittanceId()).to.equal(2);
    });

    it("Should transfer USDC (amount + fee) from sender", async function () {
      const fee = (TEN_USDC * FEE_RATE_BPS) / 10000n;
      const totalRequired = TEN_USDC + fee;

      const senderBalanceBefore = await usdc.balanceOf(sender.address);

      await arcRemit.connect(sender).createRemittance(
        receiver.address,
        TEN_USDC,
        "Test",
        24
      );

      const senderBalanceAfter = await usdc.balanceOf(sender.address);
      expect(senderBalanceBefore - senderBalanceAfter).to.equal(totalRequired);
    });

    it("Should send fee to fee collector", async function () {
      const fee = (TEN_USDC * FEE_RATE_BPS) / 10000n;

      const feeCollectorBalanceBefore = await usdc.balanceOf(feeCollector.address);

      await arcRemit.connect(sender).createRemittance(
        receiver.address,
        TEN_USDC,
        "Test",
        24
      );

      const feeCollectorBalanceAfter = await usdc.balanceOf(feeCollector.address);
      expect(feeCollectorBalanceAfter - feeCollectorBalanceBefore).to.equal(fee);
    });

    it("Should hold amount in contract escrow", async function () {
      await arcRemit.connect(sender).createRemittance(
        receiver.address,
        TEN_USDC,
        "Test",
        24
      );

      const contractBalance = await usdc.balanceOf(await arcRemit.getAddress());
      expect(contractBalance).to.equal(TEN_USDC);
    });

    it("Should store correct remittance data", async function () {
      const message = "Test message";
      const expiresInHours = 48;

      await arcRemit.connect(sender).createRemittance(
        receiver.address,
        FIFTY_USDC,
        message,
        expiresInHours
      );

      const remittance = await arcRemit.remittances(1);
      expect(remittance.sender).to.equal(sender.address);
      expect(remittance.receiver).to.equal(receiver.address);
      expect(remittance.amount).to.equal(FIFTY_USDC);
      expect(remittance.message).to.equal(message);
      expect(remittance.status).to.equal(0); // Pending
    });

    it("Should add ID to receiver's pending list", async function () {
      await arcRemit.connect(sender).createRemittance(
        receiver.address,
        TEN_USDC,
        "Test",
        24
      );

      const pendingIds = await arcRemit.getPendingRemittances(receiver.address);
      expect(pendingIds.length).to.equal(1);
      expect(pendingIds[0]).to.equal(1);
    });

    it("Should emit RemittanceVolumeUpdated event", async function () {
      await expect(
        arcRemit.connect(sender).createRemittance(
          receiver.address,
          TEN_USDC,
          "Test",
          24
        )
      ).to.emit(arcRemit, "RemittanceVolumeUpdated").withArgs(sender.address, TEN_USDC);
    });

    it("Should revert with zero address receiver", async function () {
      await expect(
        arcRemit.connect(sender).createRemittance(
          ethers.ZeroAddress,
          TEN_USDC,
          "Test",
          24
        )
      ).to.be.revertedWith("Invalid receiver");
    });

    it("Should revert when sending to self", async function () {
      await expect(
        arcRemit.connect(sender).createRemittance(
          sender.address,
          TEN_USDC,
          "Test",
          24
        )
      ).to.be.revertedWith("Cannot send to self");
    });

    it("Should revert with zero amount", async function () {
      await expect(
        arcRemit.connect(sender).createRemittance(
          receiver.address,
          0,
          "Test",
          24
        )
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("Should revert with expiry > 30 days", async function () {
      await expect(
        arcRemit.connect(sender).createRemittance(
          receiver.address,
          TEN_USDC,
          "Test",
          721 // > 720 hours (30 days)
        )
      ).to.be.revertedWith("Max expiry: 30 days");
    });

    it("Should allow no expiry (0 hours)", async function () {
      await arcRemit.connect(sender).createRemittance(
        receiver.address,
        TEN_USDC,
        "No expiry",
        0
      );

      const remittance = await arcRemit.remittances(1);
      expect(remittance.expiresAt).to.equal(0);
    });
  });

  describe("claimRemittance", function () {
    beforeEach(async function () {
      await arcRemit.connect(sender).createRemittance(
        receiver.address,
        TEN_USDC,
        "Claim test",
        24
      );
    });

    it("Should allow receiver to claim funds", async function () {
      const receiverBalanceBefore = await usdc.balanceOf(receiver.address);

      await expect(arcRemit.connect(receiver).claimRemittance(1))
        .to.emit(arcRemit, "RemittanceClaimed")
        .withArgs(1, receiver.address, TEN_USDC);

      const receiverBalanceAfter = await usdc.balanceOf(receiver.address);
      expect(receiverBalanceAfter - receiverBalanceBefore).to.equal(TEN_USDC);
    });

    it("Should update remittance status to Claimed", async function () {
      await arcRemit.connect(receiver).claimRemittance(1);

      const remittance = await arcRemit.remittances(1);
      expect(remittance.status).to.equal(1); // Claimed
    });

    it("Should revert if not called by receiver", async function () {
      await expect(
        arcRemit.connect(sender).claimRemittance(1)
      ).to.be.revertedWith("Not the receiver");
    });

    it("Should revert if already claimed", async function () {
      await arcRemit.connect(receiver).claimRemittance(1);

      await expect(
        arcRemit.connect(receiver).claimRemittance(1)
      ).to.be.revertedWith("Not pending");
    });

    it("Should revert if expired", async function () {
      await arcRemit.connect(sender).createRemittance(
        receiver.address,
        TEN_USDC,
        "Short expiry",
        1
      );

      await ethers.provider.send("evm_increaseTime", [7200]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        arcRemit.connect(receiver).claimRemittance(2)
      ).to.be.revertedWith("Expired");
    });
  });

  describe("refundRemittance", function () {
    beforeEach(async function () {
      await arcRemit.connect(sender).createRemittance(
        receiver.address,
        TEN_USDC,
        "Refund test",
        1 // 1 hour expiry
      );
    });

    it("Should allow sender to refund expired remittance", async function () {
      await ethers.provider.send("evm_increaseTime", [7200]);
      await ethers.provider.send("evm_mine", []);

      const senderBalanceBefore = await usdc.balanceOf(sender.address);

      await expect(arcRemit.connect(sender).refundRemittance(1))
        .to.emit(arcRemit, "RemittanceRefunded")
        .withArgs(1, sender.address, TEN_USDC);

      const senderBalanceAfter = await usdc.balanceOf(sender.address);
      expect(senderBalanceAfter - senderBalanceBefore).to.equal(TEN_USDC);
    });

    it("Should update status to Refunded", async function () {
      await ethers.provider.send("evm_increaseTime", [7200]);
      await ethers.provider.send("evm_mine", []);

      await arcRemit.connect(sender).refundRemittance(1);

      const remittance = await arcRemit.remittances(1);
      expect(remittance.status).to.equal(2); // Refunded
    });

    it("Should revert if not called by sender", async function () {
      await ethers.provider.send("evm_increaseTime", [7200]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        arcRemit.connect(receiver).refundRemittance(1)
      ).to.be.revertedWith("Not the sender");
    });

    it("Should revert if not yet expired", async function () {
      await expect(
        arcRemit.connect(sender).refundRemittance(1)
      ).to.be.revertedWith("Not expired yet");
    });

    it("Should revert if remittance has no expiry", async function () {
      await arcRemit.connect(sender).createRemittance(
        receiver.address,
        TEN_USDC,
        "No expiry",
        0
      );

      await ethers.provider.send("evm_increaseTime", [999999]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        arcRemit.connect(sender).refundRemittance(2)
      ).to.be.revertedWith("Not expired yet");
    });
  });

  describe("getPendingRemittances", function () {
    it("Should return only pending remittances", async function () {
      await arcRemit.connect(sender).createRemittance(receiver.address, TEN_USDC, "1", 24);
      await arcRemit.connect(sender).createRemittance(receiver.address, TEN_USDC, "2", 24);
      await arcRemit.connect(sender).createRemittance(receiver.address, TEN_USDC, "3", 1);

      await arcRemit.connect(receiver).claimRemittance(1);

      await ethers.provider.send("evm_increaseTime", [7200]);
      await ethers.provider.send("evm_mine", []);
      await arcRemit.connect(sender).refundRemittance(3);

      const pendingIds = await arcRemit.getPendingRemittances(receiver.address);
      expect(pendingIds.length).to.equal(1);
      expect(pendingIds[0]).to.equal(2);
    });

    it("Should return empty array if no pending", async function () {
      const pendingIds = await arcRemit.getPendingRemittances(receiver.address);
      expect(pendingIds.length).to.equal(0);
    });
  });

  describe("setFeeRate", function () {
    it("Should allow owner to update fee rate", async function () {
      await expect(arcRemit.setFeeRate(50))
        .to.emit(arcRemit, "FeeRateUpdated")
        .withArgs(30, 50);

      expect(await arcRemit.feeRateBps()).to.equal(50);
    });

    it("Should revert if fee rate > 1%", async function () {
      await expect(
        arcRemit.setFeeRate(101)
      ).to.be.revertedWith("Max fee: 1%");
    });

    it("Should revert if not owner", async function () {
      await expect(
        arcRemit.connect(sender).setFeeRate(50)
      ).to.be.revertedWithCustomError(arcRemit, "OwnableUnauthorizedAccount");
    });
  });

  describe("emergencyWithdraw", function () {
    it("Should allow owner to withdraw stuck tokens", async function () {
      await usdc.mint(await arcRemit.getAddress(), FIFTY_USDC);

      const ownerBalanceBefore = await usdc.balanceOf(owner.address);

      await arcRemit.emergencyWithdraw(await usdc.getAddress(), FIFTY_USDC);

      const ownerBalanceAfter = await usdc.balanceOf(owner.address);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(FIFTY_USDC);
    });

    it("Should revert if not owner", async function () {
      await expect(
        arcRemit.connect(sender).emergencyWithdraw(await usdc.getAddress(), 100)
      ).to.be.revertedWithCustomError(arcRemit, "OwnableUnauthorizedAccount");
    });
  });

  describe("Fee Calculation", function () {
    it("Should calculate correct fee for various amounts", async function () {
      const testAmounts = [
        1n * 10n ** BigInt(USDC_DECIMALS),
        100n * 10n ** BigInt(USDC_DECIMALS),
        10000n * 10n ** BigInt(USDC_DECIMALS),
      ];

      for (const amount of testAmounts) {
        const expectedFee = (amount * FEE_RATE_BPS) / 10000n;
        const totalRequired = amount + expectedFee;

        await usdc.mint(sender.address, totalRequired);
        await usdc.connect(sender).approve(await arcRemit.getAddress(), totalRequired);

        const feeCollectorBefore = await usdc.balanceOf(feeCollector.address);

        await arcRemit.connect(sender).createRemittance(
          receiver.address,
          amount,
          "Fee test",
          24
        );

        const feeCollectorAfter = await usdc.balanceOf(feeCollector.address);
        expect(feeCollectorAfter - feeCollectorBefore).to.equal(expectedFee);
      }
    });
  });

  // ==================== FEATURE 1: BATCH REMITTANCES ====================

  describe("Feature 1: Batch Remittances", function () {
    it("Should create multiple remittances in one transaction", async function () {
      const receivers = [receiver.address, user1.address, user2.address];
      const amounts = [TEN_USDC, TEN_USDC, TEN_USDC];
      const messages = ["Pay 1", "Pay 2", "Pay 3"];

      await expect(
        arcRemit.connect(sender).batchCreateRemittances(
          receivers,
          amounts,
          messages,
          24
        )
      )
        .to.emit(arcRemit, "BatchRemittanceCreated")
        .withArgs(sender.address, 3, TEN_USDC * 3n);

      expect(await arcRemit.nextRemittanceId()).to.equal(4);

      // Check each remittance was created
      for (let i = 1; i <= 3; i++) {
        const r = await arcRemit.remittances(i);
        expect(r.status).to.equal(0); // Pending
      }
    });

    it("Should transfer correct total amount (sum + fees)", async function () {
      const receivers = [receiver.address, user1.address];
      const amounts = [TEN_USDC, TEN_USDC];
      const messages = ["Pay 1", "Pay 2"];

      const totalAmount = TEN_USDC * 2n;
      const totalFee = (totalAmount * FEE_RATE_BPS) / 10000n;
      const totalRequired = totalAmount + totalFee;

      const senderBalanceBefore = await usdc.balanceOf(sender.address);

      await arcRemit.connect(sender).batchCreateRemittances(
        receivers,
        amounts,
        messages,
        24
      );

      const senderBalanceAfter = await usdc.balanceOf(sender.address);
      expect(senderBalanceBefore - senderBalanceAfter).to.equal(totalRequired);
    });

    it("Should add IDs to each receiver's pending list", async function () {
      const receivers = [receiver.address, user1.address];
      const amounts = [TEN_USDC, TEN_USDC];
      const messages = ["Pay 1", "Pay 2"];

      await arcRemit.connect(sender).batchCreateRemittances(
        receivers,
        amounts,
        messages,
        24
      );

      const pendingReceiver = await arcRemit.getPendingRemittances(receiver.address);
      const pendingUser1 = await arcRemit.getPendingRemittances(user1.address);

      expect(pendingReceiver.length).to.equal(1);
      expect(pendingUser1.length).to.equal(1);
    });

    it("Should emit individual RemittanceCreated events", async function () {
      const receivers = [receiver.address, user1.address];
      const amounts = [TEN_USDC, TEN_USDC];
      const messages = ["Pay 1", "Pay 2"];

      const tx = await arcRemit.connect(sender).batchCreateRemittances(
        receivers,
        amounts,
        messages,
        24
      );

      await expect(tx).to.emit(arcRemit, "RemittanceCreated");
    });

    it("Should revert with empty arrays", async function () {
      await expect(
        arcRemit.connect(sender).batchCreateRemittances([], [], [], 24)
      ).to.be.revertedWith("Empty arrays");
    });

    it("Should revert with mismatched array lengths", async function () {
      await expect(
        arcRemit.connect(sender).batchCreateRemittances(
          [receiver.address],
          [TEN_USDC, TEN_USDC],
          ["Pay"],
          24
        )
      ).to.be.revertedWith("Array length mismatch");
    });

    it("Should revert with zero address in receivers", async function () {
      await expect(
        arcRemit.connect(sender).batchCreateRemittances(
          [ethers.ZeroAddress],
          [TEN_USDC],
          ["Pay"],
          24
        )
      ).to.be.revertedWith("Invalid receiver");
    });

    it("Should apply referral discount for batch payments", async function () {
      // Set up referral: sender referred by user1
      await arcRemit.connect(sender).setReferrer(user1.address);

      const receivers = [receiver.address];
      const amounts = [TEN_USDC];
      const messages = ["Referral batch"];

      // With discount: effective rate = 30 - 20 = 10 bps = 0.1%
      const effectiveFee = (TEN_USDC * 10n) / 10000n;
      const totalRequired = TEN_USDC + effectiveFee;

      const senderBalanceBefore = await usdc.balanceOf(sender.address);

      await arcRemit.connect(sender).batchCreateRemittances(
        receivers,
        amounts,
        messages,
        24
      );

      const senderBalanceAfter = await usdc.balanceOf(sender.address);
      expect(senderBalanceBefore - senderBalanceAfter).to.equal(totalRequired);
    });
  });

  // ==================== FEATURE 2: RECURRING SCHEDULES ====================

  describe("Feature 2: Recurring Schedules", function () {
    it("Should create a payment schedule", async function () {
      const interval = 30 * 24 * 3600; // 30 days

      await expect(
        arcRemit.connect(sender).createSchedule(
          receiver.address,
          TEN_USDC,
          interval,
          3
        )
      )
        .to.emit(arcRemit, "ScheduleCreated")
        .withArgs(1, sender.address, receiver.address, TEN_USDC, 3);

      const schedule = await arcRemit.schedules(1);
      expect(schedule.sender).to.equal(sender.address);
      expect(schedule.receiver).to.equal(receiver.address);
      expect(schedule.amountPerCycle).to.equal(TEN_USDC);
      expect(schedule.cycleInterval).to.equal(interval);
      expect(schedule.totalCycles).to.equal(3);
      expect(schedule.cyclesCompleted).to.equal(0);
      expect(schedule.active).to.equal(true);
    });

    it("Should execute a scheduled payment", async function () {
      const interval = 3600; // 1 hour (minimum)

      await arcRemit.connect(sender).createSchedule(
        receiver.address,
        TEN_USDC,
        interval,
        2
      );

      // Fast forward past the interval
      await ethers.provider.send("evm_increaseTime", [interval + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(arcRemit.connect(user1).executeSchedule(1))
        .to.emit(arcRemit, "ScheduleExecuted");

      const schedule = await arcRemit.schedules(1);
      expect(schedule.cyclesCompleted).to.equal(1);
      expect(schedule.active).to.equal(true);
    });

    it("Should auto-deactivate after all cycles complete", async function () {
      const interval = 3600;

      await arcRemit.connect(sender).createSchedule(
        receiver.address,
        TEN_USDC,
        interval,
        1
      );

      await ethers.provider.send("evm_increaseTime", [interval + 1]);
      await ethers.provider.send("evm_mine", []);

      await arcRemit.connect(user1).executeSchedule(1);

      const schedule = await arcRemit.schedules(1);
      expect(schedule.active).to.equal(false);
    });

    it("Should allow sender to cancel schedule", async function () {
      await arcRemit.connect(sender).createSchedule(
        receiver.address,
        TEN_USDC,
        3600,
        5
      );

      await expect(arcRemit.connect(sender).cancelSchedule(1))
        .to.emit(arcRemit, "ScheduleCancelled")
        .withArgs(1);

      const schedule = await arcRemit.schedules(1);
      expect(schedule.active).to.equal(false);
    });

    it("Should revert execution before interval", async function () {
      await arcRemit.connect(sender).createSchedule(
        receiver.address,
        TEN_USDC,
        3600,
        5
      );

      await expect(
        arcRemit.connect(user1).executeSchedule(1)
      ).to.be.revertedWith("Not ready for execution");
    });

    it("Should revert cancel by non-sender", async function () {
      await arcRemit.connect(sender).createSchedule(
        receiver.address,
        TEN_USDC,
        3600,
        5
      );

      await expect(
        arcRemit.connect(receiver).cancelSchedule(1)
      ).to.be.revertedWith("Not the sender");
    });

    it("Should revert schedule with self as receiver", async function () {
      await expect(
        arcRemit.connect(sender).createSchedule(
          sender.address,
          TEN_USDC,
          3600,
          5
        )
      ).to.be.revertedWith("Cannot send to self");
    });

    it("Should revert schedule with interval < 1 hour", async function () {
      await expect(
        arcRemit.connect(sender).createSchedule(
          receiver.address,
          TEN_USDC,
          3599, // < 1 hour
          5
        )
      ).to.be.revertedWith("Min interval: 1 hour");
    });
  });

  // ==================== FEATURE 3: CONTACT BOOK ====================

  describe("Feature 3: Contact Book", function () {
    it("Should set a nickname for a contact", async function () {
      await expect(
        arcRemit.connect(sender).setNickname(receiver.address, "Mom")
      )
        .to.emit(arcRemit, "NicknameSet")
        .withArgs(sender.address, receiver.address, "Mom");

      const nickname = await arcRemit.nicknames(sender.address, receiver.address);
      expect(nickname).to.equal("Mom");
    });

    it("Should get own nickname for a contact", async function () {
      await arcRemit.connect(sender).setNickname(receiver.address, "Mom");

      const nickname = await arcRemit.connect(sender).getNickname(receiver.address);
      expect(nickname).to.equal("Mom");
    });

    it("Should allow different users to set different nicknames", async function () {
      await arcRemit.connect(sender).setNickname(receiver.address, "Mom");
      await arcRemit.connect(user1).setNickname(receiver.address, "Boss");

      const nick1 = await arcRemit.nicknames(sender.address, receiver.address);
      const nick2 = await arcRemit.nicknames(user1.address, receiver.address);

      expect(nick1).to.equal("Mom");
      expect(nick2).to.equal("Boss");
    });

    it("Should revert with zero address contact", async function () {
      await expect(
        arcRemit.connect(sender).setNickname(ethers.ZeroAddress, "Nobody")
      ).to.be.revertedWith("Invalid contact");
    });

    it("Should revert with empty nickname", async function () {
      await expect(
        arcRemit.connect(sender).setNickname(receiver.address, "")
      ).to.be.revertedWith("Empty nickname");
    });
  });

  // ==================== FEATURE 4: REFERRAL SYSTEM ====================

  describe("Feature 4: Referral System", function () {
    it("Should set a referrer", async function () {
      await expect(arcRemit.connect(sender).setReferrer(user1.address))
        .to.emit(arcRemit, "ReferrerSet")
        .withArgs(sender.address, user1.address);

      expect(await arcRemit.referrerOf(sender.address)).to.equal(user1.address);
      expect(await arcRemit.referralCount(user1.address)).to.equal(1);
    });

    it("Should apply fee discount for referred users", async function () {
      await arcRemit.connect(sender).setReferrer(user1.address);

      // Default fee: 0.3%, discount: 0.2%, effective: 0.1%
      const fee = (TEN_USDC * 10n) / 10000n; // 0.1%
      const totalRequired = TEN_USDC + fee;

      const senderBalanceBefore = await usdc.balanceOf(sender.address);

      await arcRemit.connect(sender).createRemittance(
        receiver.address,
        TEN_USDC,
        "Referred",
        24
      );

      const senderBalanceAfter = await usdc.balanceOf(sender.address);
      expect(senderBalanceBefore - senderBalanceAfter).to.equal(totalRequired);
    });

    it("Should accumulate referral earnings for referrer", async function () {
      await arcRemit.connect(sender).setReferrer(user1.address);

      // Send remittance
      await arcRemit.connect(sender).createRemittance(
        receiver.address,
        TEN_USDC,
        "Referred",
        24
      );

      // Calculate expected referral earnings:
      // Fee at 0.1% = TEN_USDC * 0.001
      // Referrer gets 10% of that fee
      const fee = (TEN_USDC * 10n) / 10000n;
      const referrerEarnings = (fee * 10n) / 100n; // 10% of fee

      expect(await arcRemit.referralEarnings(user1.address)).to.equal(referrerEarnings);
    });

    it("Should allow referrer to claim earnings", async function () {
      await arcRemit.connect(sender).setReferrer(user1.address);
      await arcRemit.connect(sender).createRemittance(
        receiver.address,
        TEN_USDC,
        "Referred",
        24
      );

      const fee = (TEN_USDC * 10n) / 10000n;
      const referrerEarnings = (fee * 10n) / 100n;

      const user1BalanceBefore = await usdc.balanceOf(user1.address);

      await expect(arcRemit.connect(user1).claimReferralEarnings())
        .to.emit(arcRemit, "ReferralRewardClaimed")
        .withArgs(user1.address, referrerEarnings);

      const user1BalanceAfter = await usdc.balanceOf(user1.address);
      expect(user1BalanceAfter - user1BalanceBefore).to.equal(referrerEarnings);
      expect(await arcRemit.referralEarnings(user1.address)).to.equal(0);
    });

    it("Should return referral stats", async function () {
      await arcRemit.connect(sender).setReferrer(user1.address);
      await arcRemit.connect(user2).setReferrer(user1.address);

      const [count, earnings] = await arcRemit.getReferralStats(user1.address);
      expect(count).to.equal(2);
    });

    it("Should revert if setting referrer twice", async function () {
      await arcRemit.connect(sender).setReferrer(user1.address);

      await expect(
        arcRemit.connect(sender).setReferrer(user2.address)
      ).to.be.revertedWith("Already set referrer");
    });

    it("Should revert if referring yourself", async function () {
      await expect(
        arcRemit.connect(sender).setReferrer(sender.address)
      ).to.be.revertedWith("Cannot refer yourself");
    });

    it("Should revert claiming with no earnings", async function () {
      await expect(
        arcRemit.connect(user1).claimReferralEarnings()
      ).to.be.revertedWith("No earnings to claim");
    });
  });

  // ==================== FEATURE 5: EMERGENCY PAUSE ====================

  describe("Feature 5: Emergency Pause", function () {
    it("Should allow owner to pause", async function () {
      await expect(arcRemit.pause())
        .to.emit(arcRemit, "PausedChanged")
        .withArgs(true);

      expect(await arcRemit.paused()).to.equal(true);
    });

    it("Should allow owner to unpause", async function () {
      await arcRemit.pause();

      await expect(arcRemit.unpause())
        .to.emit(arcRemit, "PausedChanged")
        .withArgs(false);

      expect(await arcRemit.paused()).to.equal(false);
    });

    it("Should block createRemittance when paused", async function () {
      await arcRemit.pause();

      await expect(
        arcRemit.connect(sender).createRemittance(
          receiver.address,
          TEN_USDC,
          "Test",
          24
        )
      ).to.be.revertedWithCustomError(arcRemit, "EnforcedPause");
    });

    it("Should block claimRemittance when paused", async function () {
      await arcRemit.connect(sender).createRemittance(
        receiver.address,
        TEN_USDC,
        "Test",
        24
      );

      await arcRemit.pause();

      await expect(
        arcRemit.connect(receiver).claimRemittance(1)
      ).to.be.revertedWithCustomError(arcRemit, "EnforcedPause");
    });

    it("Should block refundRemittance when paused", async function () {
      await arcRemit.connect(sender).createRemittance(
        receiver.address,
        TEN_USDC,
        "Test",
        1
      );

      await ethers.provider.send("evm_increaseTime", [7200]);
      await ethers.provider.send("evm_mine", []);

      await arcRemit.pause();

      await expect(
        arcRemit.connect(sender).refundRemittance(1)
      ).to.be.revertedWithCustomError(arcRemit, "EnforcedPause");
    });

    it("Should still allow emergencyWithdraw when paused", async function () {
      await usdc.mint(await arcRemit.getAddress(), FIFTY_USDC);
      await arcRemit.pause();

      const ownerBalanceBefore = await usdc.balanceOf(owner.address);

      await arcRemit.emergencyWithdraw(await usdc.getAddress(), FIFTY_USDC);

      const ownerBalanceAfter = await usdc.balanceOf(owner.address);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(FIFTY_USDC);
    });

    it("Should revert pause by non-owner", async function () {
      await expect(
        arcRemit.connect(sender).pause()
      ).to.be.revertedWithCustomError(arcRemit, "OwnableUnauthorizedAccount");
    });

    it("Should allow operations after unpause", async function () {
      await arcRemit.pause();
      await arcRemit.unpause();

      await expect(
        arcRemit.connect(sender).createRemittance(
          receiver.address,
          TEN_USDC,
          "After unpause",
          24
        )
      ).to.emit(arcRemit, "RemittanceCreated");
    });
  });

  // ==================== FEATURE 6: TEMPLATES ====================

  describe("Feature 6: Templates", function () {
    it("Should save a template", async function () {
      await expect(
        arcRemit.connect(sender).saveTemplate(
          receiver.address,
          TEN_USDC,
          "Monthly rent"
        )
      )
        .to.emit(arcRemit, "TemplateSaved")
        .withArgs(sender.address, 0);

      const template = await arcRemit.templates(sender.address, 0);
      expect(template.receiver).to.equal(receiver.address);
      expect(template.amount).to.equal(TEN_USDC);
      expect(template.description).to.equal("Monthly rent");
    });

    it("Should create remittance from template", async function () {
      await arcRemit.connect(sender).saveTemplate(
        receiver.address,
        TEN_USDC,
        "Monthly rent"
      );

      await expect(
        arcRemit.connect(sender).createFromTemplate(0, "Rent payment", 24)
      )
        .to.emit(arcRemit, "TemplateUsed")
        .withArgs(sender.address, 0);

      const remittance = await arcRemit.remittances(1);
      expect(remittance.sender).to.equal(sender.address);
      expect(remittance.receiver).to.equal(receiver.address);
      expect(remittance.amount).to.equal(TEN_USDC);
      expect(remittance.message).to.equal("Rent payment");
    });

    it("Should delete a template", async function () {
      await arcRemit.connect(sender).saveTemplate(
        receiver.address,
        TEN_USDC,
        "Monthly rent"
      );

      await expect(arcRemit.connect(sender).deleteTemplate(0))
        .to.emit(arcRemit, "TemplateDeleted")
        .withArgs(sender.address, 0);

      const template = await arcRemit.templates(sender.address, 0);
      expect(template.receiver).to.equal(ethers.ZeroAddress);
    });

    it("Should revert creating from deleted template", async function () {
      await arcRemit.connect(sender).saveTemplate(
        receiver.address,
        TEN_USDC,
        "Monthly rent"
      );
      await arcRemit.connect(sender).deleteTemplate(0);

      await expect(
        arcRemit.connect(sender).createFromTemplate(0, "Test", 24)
      ).to.be.revertedWith("Template deleted");
    });

    it("Should revert creating from invalid template ID", async function () {
      await expect(
        arcRemit.connect(sender).createFromTemplate(999, "Test", 24)
      ).to.be.revertedWith("Invalid template");
    });

    it("Should revert saving template with zero receiver", async function () {
      await expect(
        arcRemit.connect(sender).saveTemplate(
          ethers.ZeroAddress,
          TEN_USDC,
          "Invalid"
        )
      ).to.be.revertedWith("Invalid receiver");
    });

    it("Should revert saving template with zero amount", async function () {
      await expect(
        arcRemit.connect(sender).saveTemplate(
          receiver.address,
          0,
          "Invalid"
        )
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("Should revert deleting already deleted template", async function () {
      await arcRemit.connect(sender).saveTemplate(
        receiver.address,
        TEN_USDC,
        "Monthly rent"
      );
      await arcRemit.connect(sender).deleteTemplate(0);

      await expect(
        arcRemit.connect(sender).deleteTemplate(0)
      ).to.be.revertedWith("Already deleted");
    });
  });

  // ==================== FEATURE 7: ANALYTICS EVENTS ====================

  describe("Feature 7: Analytics Events", function () {
    it("Should emit RemittanceVolumeUpdated on create", async function () {
      await expect(
        arcRemit.connect(sender).createRemittance(
          receiver.address,
          TEN_USDC,
          "Test",
          24
        )
      ).to.emit(arcRemit, "RemittanceVolumeUpdated").withArgs(sender.address, TEN_USDC);
    });

    it("Should emit RemittanceVolumeUpdated on batch", async function () {
      await expect(
        arcRemit.connect(sender).batchCreateRemittances(
          [receiver.address, user1.address],
          [TEN_USDC, TEN_USDC],
          ["1", "2"],
          24
        )
      ).to.emit(arcRemit, "RemittanceVolumeUpdated").withArgs(sender.address, TEN_USDC * 2n);
    });

    it("Should emit ReferralRewardClaimed on claim", async function () {
      await arcRemit.connect(sender).setReferrer(user1.address);
      await arcRemit.connect(sender).createRemittance(
        receiver.address,
        TEN_USDC,
        "Referred",
        24
      );

      const fee = (TEN_USDC * 10n) / 10000n;
      const referrerEarnings = (fee * 10n) / 100n;

      await expect(arcRemit.connect(user1).claimReferralEarnings())
        .to.emit(arcRemit, "ReferralRewardClaimed")
        .withArgs(user1.address, referrerEarnings);
    });

    it("Should emit ScheduleExecuted on schedule execution", async function () {
      await arcRemit.connect(sender).createSchedule(
        receiver.address,
        TEN_USDC,
        3600,
        2
      );

      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine", []);

      await expect(arcRemit.connect(user1).executeSchedule(1))
        .to.emit(arcRemit, "ScheduleExecuted");
    });

    it("Should emit TemplateUsed on template creation", async function () {
      await arcRemit.connect(sender).saveTemplate(
        receiver.address,
        TEN_USDC,
        "Rent"
      );

      await expect(
        arcRemit.connect(sender).createFromTemplate(0, "Test", 24)
      ).to.emit(arcRemit, "TemplateUsed").withArgs(sender.address, 0);
    });
  });
});
