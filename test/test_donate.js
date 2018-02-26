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
  const days = 60 * 60 * 24;
  const expiryDaysBefore = 7 * days;
  const expiryDaysAfter = 3 * days;

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
});
