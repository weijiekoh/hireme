const HireMe = artifacts.require("./HireMe.sol");
const increaseTime = require("./increaseTime.js");
const expectThrow = require("./expectThrow.js");

contract('HireMe', accounts => {
  const creator = accounts[0];
  const bidder = accounts[1];
  const bidder2 = accounts[2];
  const bidder3 = accounts[3];
  const bidder4 = accounts[4];
  const bidder5 = accounts[5];
  const bidder6 = accounts[6];
  const minBid = web3.toWei(1, "ether");
  const gasPrice = web3.toBigNumber(10000000000);
  const days = 60 * 60 * 24;
  const expiryDaysBefore = 7 * days;
  const expiryDaysAfter = 3 * days;

  it("reclaim() should throw if there are no bids", async () => {
    let hm = await HireMe.new();
    const result = await expectThrow(hm.reclaim());
    assert.isTrue(result);
  });

  it("reclaim() should throw if there are bids but the auction is not over", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    const result = await expectThrow(hm.reclaim());
    assert.isTrue(result);
  });

  it("reclaim() should throw if the auction is over but the caller is not a bidder", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await increaseTime(expiryDaysBefore);
    const result = await expectThrow(hm.reclaim({ from: bidder2 }));
    assert.isTrue(result);
  });

  it("If there is only 1 bidder, reclaim() should not work after expiry", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await increaseTime(expiryDaysBefore);

    let result = await hm.hasExpired();
    assert.isTrue(result);

    result = await expectThrow(hm.reclaim({ from: bidder }));
    assert.isTrue(result);
  });

  it("reclaim() should not double-spend", async () => {
    let hm = await HireMe.new();
    const winningBidAmt = minBid * 2;

    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await hm.bid("email", "organisation", { value: winningBidAmt, from: bidder2 });

    await increaseTime(expiryDaysBefore);

    const result = await expectThrow(hm.reclaim({ from: bidder, gasPrice: gasPrice }));
    assert.isFalse(result);

    const result2 = await expectThrow(hm.reclaim({ from: bidder, gasPrice: gasPrice }));
    assert.isTrue(result2);
  });

  it("reclaim() should return the correct amount of ETH to the winner (2 bids)", async () => {
    let hm = await HireMe.new();
    const winningBidAmt = minBid * 2;

    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await hm.bid("email", "organisation", { value: winningBidAmt, from: bidder2 });

    const balanceBefore = await web3.eth.getBalance(bidder2);

    await increaseTime(expiryDaysBefore);
    const transaction = await hm.reclaim({ from: bidder2, gasPrice: gasPrice });

    const balanceAfter = await web3.eth.getBalance(bidder2);

    const gasUsed = web3.toBigNumber(transaction.receipt.gasUsed);
    const gasPaid = gasUsed.times(gasPrice);

    const diff = balanceAfter.minus(balanceBefore).plus(gasPaid);
    assert.equal(diff.toNumber(), winningBidAmt - minBid);
  });

  it("reclaim() should return the correct amount of ETH to the winner (5 bids)", async () => {
    let hm = await HireMe.new();
    const winningBidAmt = minBid * 3;

    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await hm.bid("email", "organisation", { value: minBid * 1.1, from: bidder2 });
    await hm.bid("email", "organisation", { value: minBid * 1.2, from: bidder3 });
    await hm.bid("email", "organisation", { value: winningBidAmt, from: bidder4 });

    const balanceBefore = await web3.eth.getBalance(bidder4);

    await increaseTime(expiryDaysBefore);
    const transaction = await hm.reclaim({ from: bidder4, gasPrice: gasPrice });

    const balanceAfter = await web3.eth.getBalance(bidder4);

    const gasUsed = web3.toBigNumber(transaction.receipt.gasUsed);
    const gasPaid = gasUsed.times(gasPrice);

    const diff = balanceAfter.minus(balanceBefore).plus(gasPaid);
    assert.equal(diff.toNumber(), winningBidAmt - (minBid * 1.2));
  });

  it("reclaim() should return the correct amount of ETH to a non-winner who made 2 bids", async () => {
    let hm = await HireMe.new();
    const winningBidAmt = minBid * 2;

    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await hm.bid("email", "organisation", { value: minBid * 1.5, from: bidder });
    await hm.bid("email", "organisation", { value: winningBidAmt, from: bidder2 });

    const balanceBefore = await web3.eth.getBalance(bidder);

    await increaseTime(expiryDaysBefore);
    const transaction = await hm.reclaim({ from: bidder, gasPrice: gasPrice });

    const balanceAfter = await web3.eth.getBalance(bidder);

    const gasUsed = web3.toBigNumber(transaction.receipt.gasUsed);
    const gasPaid = gasUsed.times(gasPrice);

    const diff = balanceAfter.minus(balanceBefore).plus(gasPaid);
    const totalBid = web3.toBigNumber(minBid).times(2.5);
    assert.equal(diff.toNumber(), totalBid.toNumber());
  });

  it("reclaim() should return the correct amount of ETH to a non-winner", async () => {
    let hm = await HireMe.new();
    const winningBidAmt = minBid * 2;

    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await hm.bid("email", "organisation", { value: winningBidAmt, from: bidder2 });

    const balanceBefore = await web3.eth.getBalance(bidder);

    await increaseTime(expiryDaysBefore);
    const transaction = await hm.reclaim({ from: bidder, gasPrice: gasPrice });

    const balanceAfter = await web3.eth.getBalance(bidder);

    const gasUsed = web3.toBigNumber(transaction.receipt.gasUsed);
    const gasPaid = gasUsed.times(gasPrice);

    const diff = balanceAfter.minus(balanceBefore).plus(gasPaid);
    assert.equal(diff.toNumber(), minBid);
  });

  it("the contract should have a correct balance before and after reclaim() and donate()", async () => {
    let hm = await HireMe.new();
    const initialBalance = web3.eth.getBalance(hm.address);
    const bid2Amt = web3.toWei(1.1, "ether");
    const bid3Amt = web3.toWei(1.2, "ether");
    const bid4Amt = web3.toWei(1.3, "ether");
    const bid5Amt = web3.toWei(1.4, "ether");
    const bid6Amt = web3.toWei(1.5, "ether");

    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await hm.bid("email", "organisation", { value: bid2Amt, from: bidder2 });
    await hm.bid("email", "organisation", { value: bid3Amt, from: bidder3 });
    await hm.bid("email", "organisation", { value: bid4Amt, from: bidder4 });
    await hm.bid("email", "organisation", { value: bid5Amt, from: bidder5 });
    await hm.bid("email", "organisation", { value: bid6Amt, from: bidder6 });

    const correctBalance = [minBid, bid2Amt, bid3Amt, bid4Amt, bid5Amt, bid6Amt].map(web3.toBigNumber).reduce((x, y) => x.plus(y));
    const contractBalance = web3.eth.getBalance(hm.address);
    assert.equal(correctBalance.toNumber(), contractBalance.toNumber());

    await increaseTime(expiryDaysAfter);
    await hm.reclaim({ from: bidder });
    await hm.reclaim({ from: bidder2 });
    await hm.reclaim({ from: bidder3 });
    await hm.reclaim({ from: bidder4 });
    await hm.reclaim({ from: bidder5 });
    await hm.reclaim({ from: bidder6 });
    await hm.donate({ from: creator });
    assert.equal(web3.eth.getBalance(hm.address).toNumber(), initialBalance.toNumber());
  });
});
