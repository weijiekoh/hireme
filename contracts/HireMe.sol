pragma solidity 0.4.19;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


contract HireMe is Ownable {
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
    uint private constant minBid = 1 ether;
    uint private constant step = 0.01 ether;
    uint private constant initialBids = 4;
    uint private constant expiryDaysBefore = 7 days;
    uint private constant expiryDaysAfter = 3 days;
    string public constant HASHEDSIGNATURE = "";
    // The Internet Archive's ETH donation address
    address public charityAddress = 0x635599b0ab4b5c6B1392e0a2D1d69cF7d1ddDF02;
    mapping (address => uint) public addressToTotalPaid;

    function bid(string _email, string _organisation) public payable {
        address _bidder = msg.sender;
        uint _amount = msg.value;
        uint _id = bids.length;

        // The auction must not be over
        require(!hasExpired());

        // The bidder must be neither the contract owner nor the charity
        // donation address
        require(_bidder != owner && _bidder != charityAddress);

        // The amount, bidder address, email, and organisation must be neither
        // 0 nor blank
        require(_amount > 0);
        require(_bidder != address(0));
        require(bytes(_email).length > 0);
        require(bytes(_organisation).length > 0);

        if (bids.length == 0) {
            // For the first bid, make sure that the amount bid is geq the
            // minimum bid
            require(_amount >= minBid);
        } else {
            // For subsequent bids, check whether the amount bid
            // is geq (the previous bid plus the step amount)
            uint _prevBidId = SafeMath.sub(_id, 1);
            uint _lastBidAmt = bids[_prevBidId].amount;
            require(_amount >= SafeMath.add(_lastBidAmt, step));

            // This will not fail if the contract works as expected
            assert(_amount > minBid);
        }

        // Update the state with the new bid
        bids.push(Bid(true, _id, now, _bidder, _amount, _email, _organisation));
        bidIds.push(_id);
        addressToTotalPaid[_bidder] = SafeMath.add(addressToTotalPaid[_bidder], _amount);

        // Emit the event
        BidMade(_id, _bidder, _amount);
    }

    function reclaim () public {
        address _bidder = msg.sender;
        uint _amount = addressToTotalPaid[_bidder];

        // The auction must be over
        require(hasExpired());

        // There must be at least 2 bids. Note that if there is only 1 bid and
        // the auction expires, that bid is the winning bid, and cannot be
        // reclaimed.
        require(bids.length >= 2);

        // The amount and bidder address must be valid
        require(_amount > 0);
        require(_bidder != address(0));

        // Update the state to prevent double-spending
        addressToTotalPaid[_bidder] = 0;

        // The highest bidder's address is the last item in the bids array
        address highestBidder = bids[SafeMath.sub(bids.length, 1)].bidder;

        if (_bidder == highestBidder) {
            // The highest bidder pays the second highest bid
            uint _secondPrice = bids[SafeMath.sub(bids.length, 2)].amount;
            _amount = SafeMath.sub(_amount, _secondPrice);
        }

        _bidder.transfer(_amount);

        // Emit the event
        Reclaimed(_bidder, _amount);
    }

    function donate () public {
        // Only the contract owner or the charity address may send the funds to
        // charityAddress
        require(msg.sender == owner || msg.sender == charityAddress);

        // The auction must be over
        require(hasExpired());

        // There must be at least 1 bid
        assert(bids.length > 0);

        // Transfer the winning bid amount to charity
        uint _amount;
        if (bids.length == 1) {
            // If there is only 1 bid, it is the winner
            _amount = bids[0].amount;
        } else {
            // If there is more than 1 bid, transfer the second highest bid
            _amount = bids[SafeMath.sub(bids.length, 2)].amount;
        }

        charityAddress.transfer(_amount);
        Donated(_amount);
    }

    function getBidIds () public view returns (uint[]) {
        return bidIds;
    }

    function hasExpired () public view returns (bool) {
        uint _numBids = bids.length;

        // The auction cannot expire if there are no bids
        if (_numBids == 0) {
            return false;
        }

        // The timestamp of the most recent bid
        uint _lastBidTimestamp = bids[SafeMath.sub(_numBids, 1)].timestamp;

        // The expiry period depends on how many bids there are.
        if (_numBids <= initialBids) {
            // The first *initialBids* bids enjoy a
            // *expiryDaysBefore* days expiry time
            return now >= SafeMath.add(_lastBidTimestamp, expiryDaysBefore);

        } else {
            // The subsequent bids have a
            // *expiryDaysAfter* days expiry time
            return now >= SafeMath.add(_lastBidTimestamp, expiryDaysAfter);
        }
    }
}
