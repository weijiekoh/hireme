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

  it("manuallyEndAuction() should throw if called by anyone other than the owner", async () => {
    let hm = await HireMe.new();
    assert.isFalse(await expectThrow(hm.manuallyEndAuction()));
  });

  it("manuallyEndAuction() should throw if called after a bid is made", async () => {
    let hm = await HireMe.new();
    await hm.bid("email", "organisation", { value: web3.toWei(1, "ether"), from: bidder });
    assert.isTrue(await expectThrow(hm.manuallyEndAuction()));
  });

  it("manuallyEndAuction() should prevent new bids", async () => {
    let hm = await HireMe.new();
    await expectThrow(hm.manuallyEndAuction());
    assert.isTrue(await expectThrow(hm.bid("email", "organisation", { value: web3.toWei(1, "ether"), from: bidder })));
  });
});
