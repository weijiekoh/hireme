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
  const days = 60 * 60 * 24;
  const expiryDaysBefore = 7 * days;
  const expiryDaysAfter = 3 * days;

  it("A fresh contract should have no bids", async () => {
    let hm = await HireMe.new();
    const bidIds = (await hm.getBidIds()).map(x => x.toNumber());
    assert.equal(bidIds.length, 0);
  });

  it("bidder should successfully place a bid", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: web3.toWei(1, "ether"), from: bidder });
    const bidIds = (await hm.getBidIds()).map(x => x.toNumber());
    assert.isTrue(bidIds[0] == 0);
  });

  it("3 bidders should successfully place bids", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: web3.toWei(1, "ether"), from: bidder });
    let bidIds = (await hm.getBidIds()).map(x => x.toNumber());
    assert.isTrue(bidIds[0] == 0);

    await hm.bid("email2", "organisation2", { value: web3.toWei(1.01, "ether"), from: bidder2 });
    await hm.bid("email3", "organisation3", { value: web3.toWei(1.02, "ether"), from: bidder3 });
    bidIds = (await hm.getBidIds()).map(x => x.toNumber());
    assert.isTrue(bidIds.length == 3);
    assert.isTrue(bidIds[0] == 0);
    assert.isTrue(bidIds[1] == 1);
    assert.isTrue(bidIds[2] == 2);
  });

  it("Empty email and/or organisation names should be rejected", async () => {
    let hm = await HireMe.new();
    const result = await expectThrow(hm.bid("", "", { value: web3.toWei(1, "ether"), from: bidder}));
    assert.isTrue(result);
  });

  it("The contract creator should not be able to place a bid", async () => {
    let hm = await HireMe.new();
    const result = await expectThrow(hm.bid("email", "organisation", { value: web3.toWei(1, "ether"), from: creator}));
    assert.isTrue(result);
  });

  it("The first bid must be sufficiently large", async () => {
    let hm = await HireMe.new();
    const result = await expectThrow(hm.bid("email", "organisation", { value: web3.toWei(0.9, "ether"), from: bidder}));
    assert.isTrue(result);
  });

  it("The second and successive bids must be sufficiently large", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: web3.toWei(1, "ether"), from: bidder });
    const result = await expectThrow(hm.bid("email", "organisation", { value: web3.toWei(1, "ether"), from: bidder}));
    assert.isTrue(result);
  });

  it("Auction should expire some time after the first bid", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: web3.toWei(1, "ether"), from: bidder });
    expired = await hm.hasExpired();
    assert.isFalse(expired);

    await increaseTime(expiryDaysBefore);

    expired = await hm.hasExpired();
    assert.isTrue(expired);
  });

  it("Auction should expire some time after the second bid", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: web3.toWei(1, "ether"), from: bidder });
    await hm.bid("email", "organisation", { value: web3.toWei(1.01, "ether"), from: bidder2 });
    expired = await hm.hasExpired();
    assert.isFalse(expired);

    await increaseTime(expiryDaysBefore);

    expired = await hm.hasExpired();
    assert.isTrue(expired);
  });

  it("Auction should expire some time after the fourth bid", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: web3.toWei(1, "ether"), from: bidder });
    await hm.bid("email", "organisation", { value: web3.toWei(1.01, "ether"), from: bidder2 });
    await hm.bid("email", "organisation", { value: web3.toWei(1.02, "ether"), from: bidder3 });
    await hm.bid("email", "organisation", { value: web3.toWei(1.03, "ether"), from: bidder4 });
    expired = await hm.hasExpired();
    assert.isFalse(expired);

    await increaseTime(expiryDaysBefore);

    expired = await hm.hasExpired();
    assert.isTrue(expired);
  });

  it("Auction should expire in a shorter time after the fifth bid", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: web3.toWei(1, "ether"), from: bidder });
    await hm.bid("email", "organisation", { value: web3.toWei(1.01, "ether"), from: bidder2 });
    await hm.bid("email", "organisation", { value: web3.toWei(1.02, "ether"), from: bidder3 });
    await hm.bid("email", "organisation", { value: web3.toWei(1.03, "ether"), from: bidder4 });
    await hm.bid("email", "organisation", { value: web3.toWei(1.04, "ether"), from: bidder5 });
    let expired = await hm.hasExpired();
    assert.isFalse(expired);

    await increaseTime(expiryDaysAfter);

    expired = await hm.hasExpired();
    assert.isTrue(expired);
  });

  it("Auction expiry should be rolling", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: web3.toWei(1, "ether"), from: bidder });
    await hm.bid("email", "organisation", { value: web3.toWei(1.01, "ether"), from: bidder2 });
    await hm.bid("email", "organisation", { value: web3.toWei(1.02, "ether"), from: bidder3 });
    await hm.bid("email", "organisation", { value: web3.toWei(1.03, "ether"), from: bidder4 });

    await increaseTime(1);
    expired = await hm.hasExpired();
    assert.isFalse(expired);

    await hm.bid("email", "organisation", { value: web3.toWei(1.04, "ether"), from: bidder5 });

    await increaseTime(1);
    expired = await hm.hasExpired();
    assert.isFalse(expired);

    await increaseTime(expiryDaysAfter);

    expired = await hm.hasExpired();
    assert.isTrue(expired);
  });
});
