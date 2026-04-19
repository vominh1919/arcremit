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

  const USDC_DECIMALS = 6;
  const ONE_HUNDRED_USDC = 100n * 10n ** BigInt(USDC_DECIMALS);
  const FIFTY_USDC = 50n * 10n ** BigInt(USDC_DECIMALS);
  const TEN_USDC = 10n * 10n ** BigInt(USDC_DECIMALS);
  const FEE_RATE_BPS = 30n; // 0.3%

  beforeEach(async function () {
    [owner, sender, receiver, feeCollector] = await ethers.getSigners();

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
  });

  describe("createRemittance", function () {
    it("Should create a remittance successfully", async function () {
      const message = "For mom's birthday";
      const expiresInHours = 24;

      await expect(
        arcRemit.connect(sender).createRemittance(
          receiver.address,
          TEN_USDC,
          message,
          expiresInHours
        )
      )
        .to.emit(arcRemit, "RemittanceCreated")
        .withArgs(
          1,
          sender.address,
          receiver.address,
          TEN_USDC,
          (TEN_USDC * FEE_RATE_BPS) / 10000n,
          message,
          (await ethers.provider.getBlock("latest"))!.timestamp + expiresInHours * 3600 + 1
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
      // Create a remittance with 1 hour expiry
      await arcRemit.connect(sender).createRemittance(
        receiver.address,
        TEN_USDC,
        "Short expiry",
        1
      );

      // Fast forward 2 hours
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
      // Fast forward past expiry
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
      // Create no-expiry remittance
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
      // Create 3 remittances
      await arcRemit.connect(sender).createRemittance(receiver.address, TEN_USDC, "1", 24);
      await arcRemit.connect(sender).createRemittance(receiver.address, TEN_USDC, "2", 24);
      await arcRemit.connect(sender).createRemittance(receiver.address, TEN_USDC, "3", 1);

      // Claim the first one
      await arcRemit.connect(receiver).claimRemittance(1);

      // Fast forward third one to expire and refund it
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
      // Send some USDC directly to contract (bypassing createRemittance)
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
        1n * 10n ** BigInt(USDC_DECIMALS),    // 1 USDC
        100n * 10n ** BigInt(USDC_DECIMALS),   // 100 USDC
        10000n * 10n ** BigInt(USDC_DECIMALS), // 10000 USDC
      ];

      for (const amount of testAmounts) {
        const expectedFee = (amount * FEE_RATE_BPS) / 10000n;
        const totalRequired = amount + expectedFee;

        // Mint enough for this test
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
});
