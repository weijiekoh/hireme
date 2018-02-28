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
  const minBid = web3.toWei(1, "ether");
  const bid2Amt = web3.toWei(1.1, "ether");
  const days = 60 * 60 * 24;
  const expiryDaysBefore = 7 * days;
  const expiryDaysAfter = 3 * days;

  it("donate() should only work after the auction is over", async () => {
    let hm = await HireMe.new();
    let result = await expectThrow(hm.donate({ from: creator }));
    assert.isTrue(result);

    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await hm.bid("email", "organisation", { value: bid2Amt, from: bidder2 });

    assert.isFalse(await hm.hasExpired());

    result = await expectThrow(hm.donate({ from: creator }));
    assert.isTrue(result);

    await increaseTime(expiryDaysBefore);
    assert.isTrue(await hm.hasExpired());

    result = await expectThrow(hm.donate({ from: creator }));
    assert.isFalse(result);
  });

  it("donate() should not work more than once", async () => {
    let hm = await HireMe.new();

    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await hm.bid("email", "organisation", { value: bid2Amt, from: bidder2 });

    assert.isFalse(await hm.hasExpired());
    await increaseTime(expiryDaysBefore);
    assert.isTrue(await hm.hasExpired());

    await hm.donate({ from: creator });
    await hm.donate({ from: creator });

    result = await expectThrow(hm.donate({ from: creator }));
    assert.isTrue(result);
  });

  it("A bidder must not be able to call donate()", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await increaseTime(expiryDaysBefore);
    const result = await expectThrow(hm.donate({ from: bidder }));
    assert.isTrue(result);
  });

  it("donate() should increase the donation address balance", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await increaseTime(expiryDaysBefore);

    const charityAddress = await hm.charityAddress();
    const initialBalance = web3.eth.getBalance(charityAddress);
    await hm.donate({ from: creator });
    const postBalance = web3.eth.getBalance(charityAddress);
    assert.equal(postBalance.minus(initialBalance).toNumber(), minBid);
  });

  it("If there is only 1 bidder, reclaim() should not work after expiry but donate() should work", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: minBid, from: bidder });
    await increaseTime(expiryDaysBefore);

    let result = await hm.hasExpired();
    assert.isTrue(result);

    result = await expectThrow(hm.reclaim({ from: bidder }));
    assert.isTrue(result);

    const charityAddress = await hm.charityAddress();
    const initialBalance = web3.eth.getBalance(charityAddress);
    await hm.donate({ from: creator });
    const postBalance = web3.eth.getBalance(charityAddress);
    assert.equal(postBalance.minus(initialBalance).toNumber(), minBid);
  });
});
