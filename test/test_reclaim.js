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
  const bid2Amt = web3.toWei(1.1, "ether");
  const bid3Amt = web3.toWei(1.2, "ether");
  const bid4Amt = web3.toWei(1.3, "ether");
  const bid5Amt = web3.toWei(1.4, "ether");
  const bid6Amt = web3.toWei(1.5, "ether");
  const gasPrice = web3.toBigNumber(10000000000);
  const days = 60 * 60 * 24;
  const expiryDaysBefore = 7 * days;
  const expiryDaysAfter = 3 * days;

  it("reclaim() should throw if there are no bids", async () => {
    let hm = await HireMe.new();
    const result = await expectThrow(hm.reclaim());
    assert.isTrue(result);
  });

  it("reclaim() should throw if the caller is not a bidder", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    let result = await expectThrow(hm.reclaim({ from: bidder2 }));
    assert.isTrue(result);

    await increaseTime(expiryDaysBefore);

    result = await expectThrow(hm.reclaim({ from: bidder2 }));
    assert.isTrue(result);
  });

  it("if there is only 1 bidder, reclaim() should not work after expiry", async () => {
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

  it("reclaim() should work correctly for the current winner before the auction ends", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await hm.bid("email", "organisation", { value: bid2Amt, from: bidder2 });
    await hm.bid("email", "organisation", { value: bid3Amt, from: bidder4 });
    await hm.bid("email", "organisation", { value: bid4Amt, from: bidder3 });
    await hm.bid("email", "organisation", { value: bid5Amt, from: bidder4 });

    assert.isFalse(await hm.hasExpired());

    const balanceBefore = await web3.eth.getBalance(bidder4);

    const x = (await hm.calcAmtReclaimable(bidder4)).toNumber();

    assert.equal(x, bid3Amt);

    const transaction = await hm.reclaim({ from: bidder4, gasPrice: gasPrice });

    const balanceAfter = await web3.eth.getBalance(bidder4);

    const gasUsed = web3.toBigNumber(transaction.receipt.gasUsed);
    const gasPaid = gasUsed.times(gasPrice);

    const diff = balanceAfter.minus(balanceBefore).plus(gasPaid);

    assert.equal(diff.toNumber(), bid3Amt);
  });

  it("reclaim() should work correctly for the current winner after the auction ends", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await hm.bid("email", "organisation", { value: bid2Amt, from: bidder2 });
    await hm.bid("email", "organisation", { value: bid3Amt, from: bidder4 });
    await hm.bid("email", "organisation", { value: bid4Amt, from: bidder3 });
    await hm.bid("email", "organisation", { value: bid5Amt, from: bidder4 });

    assert.isFalse(await hm.hasExpired());
    await increaseTime(expiryDaysAfter);
    assert.isTrue(await hm.hasExpired());

    const balanceBefore = await web3.eth.getBalance(bidder4);
    const transaction = await hm.reclaim({ from: bidder4, gasPrice: gasPrice });

    const balanceAfter = await web3.eth.getBalance(bidder4);

    const gasUsed = web3.toBigNumber(transaction.receipt.gasUsed);
    const gasPaid = gasUsed.times(gasPrice);

    const diff = balanceAfter.minus(balanceBefore).plus(gasPaid);

    const reclaimableAmt = web3.toBigNumber(bid5Amt).minus(web3.toBigNumber(bid4Amt)).plus(web3.toBigNumber(bid3Amt)).toNumber();
    assert.equal(diff.toNumber(), reclaimableAmt);
  });

  it("reclaim() should work correctly for more than 1 bidder before the auction ends", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await hm.bid("email", "organisation", { value: bid2Amt, from: bidder2 });
    await hm.bid("email", "organisation", { value: bid3Amt, from: bidder4 });
    await hm.bid("email", "organisation", { value: bid4Amt, from: bidder3 });
    await hm.bid("email", "organisation", { value: bid5Amt, from: bidder4 });

    assert.isFalse(await hm.hasExpired());

    const bidder1BalanceBefore = web3.eth.getBalance(bidder);
    const transaction1 = await hm.reclaim({ from: bidder, gasPrice: gasPrice });
    const gasPaid1 = web3.toBigNumber(transaction1.receipt.gasUsed).times(gasPrice);
    const bidder1BalanceAfter = web3.eth.getBalance(bidder);
    const diff1 = bidder1BalanceAfter.minus(bidder1BalanceBefore).plus(gasPaid1);
    assert.equal(diff1.toNumber(), minBid);

    assert.isTrue(await expectThrow(hm.reclaim({from: bidder})));
    assert.isFalse(await hm.hasExpired());

    const bidder2BalanceBefore = web3.eth.getBalance(bidder2);
    const transaction2 = await hm.reclaim({ from: bidder2, gasPrice: gasPrice });
    const gasPaid2 = web3.toBigNumber(transaction2.receipt.gasUsed).times(gasPrice);
    const bidder2BalanceAfter = web3.eth.getBalance(bidder2);
    const diff2 = bidder2BalanceAfter.minus(bidder2BalanceBefore).plus(gasPaid2);
    assert.equal(diff2.toNumber(), bid2Amt);

    assert.isTrue(await expectThrow(hm.reclaim({from: bidder2})));
    assert.isFalse(await hm.hasExpired());

    const bidder3BalanceBefore = web3.eth.getBalance(bidder3);
    const transaction3 = await hm.reclaim({ from: bidder3, gasPrice: gasPrice });
    const gasPaid3 = web3.toBigNumber(transaction3.receipt.gasUsed).times(gasPrice);
    const bidder3BalanceAfter = web3.eth.getBalance(bidder3);
    const diff3 = bidder3BalanceAfter.minus(bidder3BalanceBefore).plus(gasPaid3);
    assert.equal(diff3.toNumber(), bid4Amt);

    assert.isTrue(await expectThrow(hm.reclaim({from: bidder3})));
    assert.isFalse(await hm.hasExpired());

    const bidder4BalanceBefore = web3.eth.getBalance(bidder4);
    const transaction4 = await hm.reclaim({ from: bidder4, gasPrice: gasPrice });
    const gasPaid4 = web3.toBigNumber(transaction4.receipt.gasUsed).times(gasPrice);
    const bidder4BalanceAfter = web3.eth.getBalance(bidder4);

    const diff4 = bidder4BalanceAfter.minus(bidder4BalanceBefore).plus(gasPaid4);

    assert.equal(diff4.toNumber(), bid3Amt);
  });

  it("reclaim() should work correctly before and after the auction ends", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await hm.bid("email", "organisation", { value: bid2Amt, from: bidder2 });
    await hm.bid("email", "organisation", { value: bid3Amt, from: bidder4 });
    await hm.bid("email", "organisation", { value: bid4Amt, from: bidder3 });
    await hm.bid("email", "organisation", { value: bid5Amt, from: bidder4 });

    // Before the auction expires
    assert.isFalse(await hm.hasExpired());

    // bidder calls reclaim()
    let bidderBalanceBefore = web3.eth.getBalance(bidder);
    let transaction = await hm.reclaim({ from: bidder, gasPrice: gasPrice });
    let bidderBalanceAfter = web3.eth.getBalance(bidder);

    let gasUsed = web3.toBigNumber(transaction.receipt.gasUsed);
    let gasPaid = gasUsed.times(gasPrice);

    let diff = bidderBalanceAfter.minus(bidderBalanceBefore).plus(gasPaid);

    // bidder gets their bid amount back except the winning bid
    assert.equal(diff.toNumber(), minBid);

    // bidder4 calls reclaim()
    let bidder4BalanceBefore = web3.eth.getBalance(bidder4);
    transaction = await hm.reclaim({ from: bidder4, gasPrice: gasPrice });
    let bidder4BalanceAfter = web3.eth.getBalance(bidder4);

    gasUsed = web3.toBigNumber(transaction.receipt.gasUsed);
    gasPaid = gasUsed.times(gasPrice);

    diff = bidder4BalanceAfter.minus(bidder4BalanceBefore).plus(gasPaid);

    // bidder4 gets their bid amount back except the winning bid
    assert.equal(diff.toNumber(), bid3Amt);

    // After the auction expires
    await increaseTime(expiryDaysAfter);
    assert.isTrue(await hm.hasExpired());

    bidder4BalanceBefore = web3.eth.getBalance(bidder4);
    let transaction2 = await hm.reclaim({ from: bidder4, gasPrice: gasPrice });
    bidder4BalanceAfter = web3.eth.getBalance(bidder4);

    let gasUsed2 = web3.toBigNumber(transaction2.receipt.gasUsed);
    let gasPaid2 = gasUsed2.times(gasPrice);

    // bidder4 gets the winning bid price minus the second bid price
    let diff2 = bidder4BalanceAfter.minus(bidder4BalanceBefore).plus(gasPaid2);
    let amt = web3.toBigNumber(bid5Amt).minus(bid4Amt).toNumber();
    assert.equal(diff2.toNumber(), amt);
  });

  it("reclaim() should work correctly in between bids", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await hm.bid("email", "organisation", { value: bid2Amt, from: bidder2 });
    await hm.bid("email", "organisation", { value: bid3Amt, from: bidder4 });
    await hm.bid("email", "organisation", { value: bid4Amt, from: bidder3 });

    // bidder4 calls reclaim()
    const beforeFirstReclaim = web3.eth.getBalance(bidder4);
    const t1 = await hm.reclaim({from: bidder4, gasPrice: gasPrice});
    const gas1 = web3.toBigNumber(t1.receipt.gasUsed).times(gasPrice);
    const afterFirstReclaim = web3.eth.getBalance(bidder4);

    assert.equal(afterFirstReclaim.minus(beforeFirstReclaim).plus(gas1), bid3Amt);

    // bidder4 makes a winning bid
    const t2 = await hm.bid("email", "organisation", { value: bid5Amt, from: bidder4 });
    const afterSecondBid = web3.eth.getBalance(bidder4);
    const gas2 = web3.toBigNumber(t2.receipt.gasUsed).times(gasPrice);

    // auction expires
    assert.isFalse(await hm.hasExpired());
    await increaseTime(expiryDaysAfter);
    assert.isTrue(await hm.hasExpired());

    // bidder4 calls reclaim() again
    const t3 = await hm.reclaim({from: bidder4, gasPrice: gasPrice});
    const gas3 = web3.toBigNumber(t3.receipt.gasUsed).times(gasPrice);
    const afterSecondReclaim = web3.eth.getBalance(bidder4);

    const bidDiff = web3.toBigNumber(bid5Amt).minus(bid4Amt);
    const balanceDiff = afterSecondReclaim.minus(afterSecondBid);
    assert.equal(balanceDiff.plus(gas3).toNumber(), bidDiff.toNumber());
  });
});
