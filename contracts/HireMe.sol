pragma solidity 0.4.19;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


// The frontend for this smart contract is a dApp hosted at
// https://hire.kohweijie.com
contract HireMe is Ownable {
    // Data structure representing a single bid
    struct Bid {
        bool exists;         // 0. Whether the bid exists
        uint id;             // 1. The ID of the bid.
        uint timestamp;      // 2. The timestamp of when the bid was made
        address bidder;      // 3. The address of the bidder
        uint amount;         // 4. The amount of ETH in the bid
        string email;        // 5. The bidder's email address
        string organisation; // 6. The bidder's organisation
    }

    event BidMade(uint indexed id, address indexed bidder, uint indexed amount);
    event Reclaimed(address indexed bidder, uint indexed amount);
    event Donated(uint indexed amount);

    Bid[] public bids;
    uint[] public bidIds;
    uint private constant MIN_BID = 1 ether;
    uint private constant BID_STEP = 0.01 ether;
    uint private constant INITIAL_BIDS = 4;

    //uint private constant EXPIRY_DAYS_BEFORE = 7 days;
    //uint private constant EXPIRY_DAYS_AFTER = 3 days;

    uint private constant EXPIRY_DAYS_BEFORE = 1 hours;
    uint private constant EXPIRY_DAYS_AFTER = 1 hours;

    string public constant AUTHORSIGHASH = "8c8b82a2d83a33cb0f45f5f6b22b45c1955f08fc54e7ab4d9e76fb76843c4918";
    bool public donated = false;
    bool public manuallyEnded = false;
    // The Internet Archive's ETH donation address
    address public charityAddress = 0x635599b0ab4b5c6B1392e0a2D1d69cF7d1ddDF02;
    mapping (address => uint) public addressToTotalPaid;

    // Only the contract owner may end this contract if there are 0 bids.
    function manuallyEndAuction () public onlyOwner {
        require(manuallyEnded == false);
        require(bids.length == 0);
        manuallyEnded = true;
    }

    function bid(string _email, string _organisation) public payable {
        address _bidder = msg.sender;
        uint _amount = msg.value;
        uint _id = bids.length;

        // The auction must not be over
        require(!hasExpired() && !manuallyEnded);

        // The bidder must be neither the contract owner nor the charity
        // donation address
        require(_bidder != owner && _bidder != charityAddress);

        // The bidder address, email, and organisation must valid
        require(_bidder != address(0));
        require(bytes(_email).length > 0);
        require(bytes(_organisation).length > 0);

        // Make sure the amount bid is more than the rolling minimum bid
        require(_amount >= calcCurrentMinBid());

        // Update the state with the new bid
        bids.push(Bid(true, _id, now, _bidder, _amount, _email, _organisation));
        bidIds.push(_id);

        // Add, not replace, the state variable which tracks the total amount
        // paid per address, because a bidder may make multiple bids
        addressToTotalPaid[_bidder] = SafeMath.add(addressToTotalPaid[_bidder], _amount);

        // Emit the event
        BidMade(_id, _bidder, _amount);
    }

    function reclaim () public {
        // There must be at least 2 bids. Note that if there is only 1 bid and
        // that bid is the winning bid, it cannot be reclaimed.
        require(bids.length >= 2);

        // The auction must not have been manually ended
        require(!manuallyEnded);

        address _caller = msg.sender;
        uint _amount = calcAmtReclaimable(_caller);

        // Make sure the amount to reclaim is more than 0
        require(_amount > 0);

        // Subtract the calculated amount to be reclaimed from the state
        // variable which tracks the total amount paid per address
        uint _newTotal = SafeMath.sub(addressToTotalPaid[_caller], _amount);

        // The amount must not be negative, or the contract is buggy
        assert(_newTotal >= 0);

        // Update the state to prevent double-spending
        addressToTotalPaid[_caller] = _newTotal;

        // Make the transfer
        _caller.transfer(_amount);

        // Emit the event
        Reclaimed(_caller, _amount);
    }

    function donate () public {
        // donate() can only be called once
        assert(donated == false);

        // Only the contract owner or the charity address may send the funds to
        // charityAddress
        require(msg.sender == owner || msg.sender == charityAddress);

        // The auction must be over
        require(hasExpired());

        // If the auction has been manually ended at this point, the contract
        // is buggy
        assert(!manuallyEnded);

        // There must be at least 1 bid
        assert(bids.length > 0);

        // Transfer the winning bid amount to charity
        uint _amount;
        if (bids.length == 1) {
            // If there is only 1 bid, transfer that amount
            _amount = bids[0].amount;
        } else {
            // If there is more than 1 bid, transfer the second highest bid
            _amount = bids[SafeMath.sub(bids.length, 2)].amount;
        }

        assert(_amount > 0);
        donated = true;

        charityAddress.transfer(_amount);
        Donated(_amount);
    }

    function calcCurrentMinBid () public view returns (uint) {
        if (bids.length == 0) {
            return MIN_BID;
        } else {
            uint _lastBidId = SafeMath.sub(bids.length, 1);
            uint _lastBidAmt = bids[_lastBidId].amount;
            return SafeMath.add(_lastBidAmt, BID_STEP);
        }
    }

    function calcAmtReclaimable (address _bidder) public view returns (uint) {
        // This function calculates the amount that _bidder can get back.

        // A. if the auction is over, and _bidder is the winner, they should
        // get back the total amount bid minus the second highest bid.

        // B. if the auction is not over, and _bidder is not the winner, they
        // should get back the total they had bid

        // C. if the auction is ongoing, and _bidder is the current winner,
        // they should get back the total amount bid minus the top bid.

        // D. if the auction is ongoing, and _bidder is not the current winner,
        // they should get back the total amount they had bid.

        uint _totalAmt = addressToTotalPaid[_bidder];

        if (bids.length == 0) {
            return 0;
        }

        if (bids[SafeMath.sub(bids.length, 1)].bidder == _bidder) {
            // If the bidder is the current winner
            if (hasExpired()) { // scenario A
                uint _secondPrice = bids[SafeMath.sub(bids.length, 2)].amount;

                return SafeMath.sub(_totalAmt, _secondPrice);

            } else { // scenario C
                uint _highestPrice = bids[SafeMath.sub(bids.length, 1)].amount;
                return SafeMath.sub(_totalAmt, _highestPrice);
            }

        } else { // scenarios B and D
            return _totalAmt;
        }
    }

    function getBidIds () public view returns (uint[]) {
        return bidIds;
    }

    // Calcuate the timestamp after which the auction will expire
    function expiryTimestamp () public view returns (uint) {
        uint _numBids = bids.length;

        // There is no expiry if there are no bids
        require(_numBids > 0);

        // The timestamp of the most recent bid
        uint _lastBidTimestamp = bids[SafeMath.sub(_numBids, 1)].timestamp;

        if (_numBids <= INITIAL_BIDS) {
            return SafeMath.add(_lastBidTimestamp, EXPIRY_DAYS_BEFORE);
        } else {
            return SafeMath.add(_lastBidTimestamp, EXPIRY_DAYS_AFTER);
        }
    }

    function hasExpired () public view returns (bool) {
        uint _numBids = bids.length;

        // The auction cannot expire if there are no bids
        if (_numBids == 0) {
            return false;
        } else {
            // Compare with the current time
            return now >= this.expiryTimestamp();
        }
    }
}
