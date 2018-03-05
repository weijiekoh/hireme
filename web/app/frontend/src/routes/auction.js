import {h, Component} from 'preact'
import countdown from "countdown";
import contract from 'truffle-contract'
import HireMeContract from '../../../../../build/contracts/HireMe.json';
var Promise = require("bluebird");
var Web3 = require("web3");

const extLink = (
  <svg width="20" height="20" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1408 928v320q0 119-84.5 203.5t-203.5 84.5h-832q-119 0-203.5-84.5t-84.5-203.5v-832q0-119 84.5-203.5t203.5-84.5h704q14 0 23 9t9 23v64q0 14-9 23t-23 9h-704q-66 0-113 47t-47 113v832q0 66 47 113t113 47h832q66 0 113-47t47-113v-320q0-14 9-23t23-9h64q14 0 23 9t9 23zm384-864v512q0 26-19 45t-45 19-45-19l-176-176-652 652q-10 10-23 10t-23-10l-114-114q-10-10-10-23t10-23l652-652-176-176q-19-19-19-45t19-45 45-19h512q26 0 45 19t19 45z" fill="#fff" /></svg>
);

const spinner = (
  <div class="spinner">
    <div class="double-bounce1" />
    <div class="double-bounce2" />
  </div>
);

const pendingPrompt = (
  <p>
    Transaction underway. {spinner}
  </p>
);

const FETCHBIDSINT = 5000;

export default class Auction extends Component {
  web3StatusCodes = { 
    missing: 0, locked: 1, unlocked: 2,
    wrongNet: 3, unknown: 4
  };

  constructor(props) {
    super(props);

    this.state = {
      bids: null,
      disableReclaimButton: true,
      manuallyEnded: false,
      web3Status: typeof web3 === "undefined" ? this.web3StatusCodes.missing : null,
      email: "",
      amount: "",
      organisation: "",
      timestampNow: Date.now(),
    };
  }


  populateMinBid = () => {
    this.setState({
      amount: this.formatEth(this.state.minBid),
    });
  }


  handleEmailChange = e => { this.setState({ email: e.target.value }); }
  handleAmountChange = e => { this.setState({ amount: e.target.value }); }
  handleOrganisationChange = e => { 
    this.setState({ organisation: e.target.value }); 
  }


  handleFormKeyDown = e => {
    if (e.keyCode === 13){
      this.handleBidButtonClick();
    }
  }


  updateWeb3 = () => {
    let web3Status = this.web3StatusCodes.unknown;

    if (typeof web3 !== "undefined") {
      web3 = new Web3(web3.currentProvider); 
      window.web3 = web3;

      web3.eth.net.getNetworkType().then(networkType => {
        //if (networkType === "private" || networkType === "ropsten"){
        if (networkType === "main"){
          return web3.eth.getAccounts((err, accounts) => {
            if (err) {
              console.error(err);
            }
            else {
              if (this.hireme && !this.fetchBidsViaW3Interval){
                this.fetchBidsViaW3Interval = setInterval(this.fetchBidsViaW3, FETCHBIDSINT);
              }

              if (typeof accounts === "undefined" ||
                accounts == null || accounts.length == 0) {

                web3Status = this.web3StatusCodes.locked;
                if (this.state.web3Status !== web3Status){
                  this.setState({
                    web3Status: web3Status,
                    balance: null,
                    address: null,
                  });
                }
              }
              else{
                web3Status = this.web3StatusCodes.unlocked;

                web3.eth.getBalance(accounts[0], (error, balance) => {
                  if (this.state.web3Status === web3Status &&
                      (this.state.balance !== balance || this.state.address !== accounts[0])){

                    this.setState({
                      balance: balance,
                      address: accounts[0],
                    });
                  }
                  else if (this.state.web3Status !== web3Status) {
                    this.setState({
                      web3Status: web3Status,
                      balance: balance,
                      address: accounts[0],
                    });
                  }

                  if (this.hireme){
                    this.hireme.calcAmtReclaimable(accounts[0]).then(reclaimable => {
                      if (this.state.amtReclaimable !== reclaimable.valueOf()){
                        this.setState({
                         amtReclaimable: reclaimable.valueOf(),
                        });
                      }
                    });
                  }
                });
              }
            }
          });
        }
        else{
          this.setState({
            web3Status: this.web3StatusCodes.wrongNet,
          }, () => {
            if (this.state.lastFetchBidFallbackTime == null ||
                this.state.lastFetchBidFallbackTime + FETCHBIDSINT < Date.now()){
              this.setState({
                lastFetchBidFallbackTime: Date.now()
              }, this.fetchBids);
            };
          });
        }
      });
    }
  }


  updateTimestamp = () => {
    this.setState({ timestampNow: Date.now() });
  }


  componentWillMount = () => {
    this.updateTimestamp();
    this.updateTimestampInterval = setInterval(this.updateTimestamp, 1000);

    if (typeof web3 !== "undefined") {
      let meta = contract(HireMeContract);
      meta.setProvider(web3.currentProvider);

      this.updateWeb3();
      this.updateInterval = setInterval(this.updateWeb3, 1000);

      meta.deployed().then(instance => {
        this.hireme = instance;
        window.hireme = instance;

        this.hireme.manuallyEnded().then(manuallyEnded => {
          if (manuallyEnded){
            this.setState({manuallyEnded});
          }
          else{
            this.hireme.hasExpired().then(hasExpired => {
              if (hasExpired){
                this.setState({ hasExpired }, this.fetchBidsViaW3);
              }
              else{
                this.hireme.charityAddress().then(charityAddress => {
                  this.hireme.owner().then(owner => {
                    this.hireme.calcCurrentMinBid().then(minBid => {
                      const m = minBid.toNumber();
                      this.setState({
                        charityAddress: charityAddress,
                        owner: owner,
                        hasExpired: hasExpired,
                        minBid: m
                      }, () => {
                        this.fetchBidsViaW3();
                      });
                    });
                  });
                });
              }
            });
          }
        });

      }).catch(err => {
        console.error(err);
        this.setState({
          web3Status: this.web3StatusCodes.wrongNet,
        });
      });
    }
    else{
      this.fetchBids();
      this.fetchBidInterval = setInterval(this.fetchBids, FETCHBIDSINT);
    }
  }


  fetchBidsViaW3 = () => {
    this.hireme.getBidIds().then(bidIds => {
      let promises = bidIds.map(bidId => {
        return this.hireme.bids(bidId).then(bid => {
          return {
            timestamp: bid[2].toNumber(),
            bidder: bid[3],
            amount: bid[4].toNumber(),
            organisation: bid[6]
          }
        });
      });

      Promise.all(promises).then(bids => {
        bids.sort(this.comparer);

        let expiryTimestamp = null;

        if (bids.length > 0){
          const latestUtcTimestamp = bids[0].timestamp;
          if (this.state.bids == null || 
              this.state.bids.length < bids.length){

            this.hireme.expiryTimestamp().then(timestamp => {
              const expiryTimestamp = timestamp.toNumber();
              this.setState({ bids, expiryTimestamp });
            })

          }
        }
        else{
          this.setState({ bids });
        }
      });
    });
  }


  fetchBids = () => {
    fetch("/bids").then(response => {
      if (response.ok) {
        response.json().then(json => {
          if (json.manuallyEnded){
            this.setState({ 
              manuallyEnded: true,
            });
          }
          else{
            this.setState({ 
              bids: json.bids.sort(this.comparer),
              expiryTimestamp: json.expiryTimestamp
            });
          }
        });
      }
      else{
        if (typeof this.hireme !== "undefined"){
          this.fetchBidsViaW3();
        }
      }
    }).catch(err => {
      console.err(err);
    });
  }


  componentWillUnmount = () => {
    clearInterval(this.updateInterval);
    clearInterval(this.fetchBidInterval);
    clearInterval(this.updateTimestampInterval);
    clearInterval(this.fetchBidsViaW3Interval);
  }


  formatDate = timestamp => {
    const months = ["Jan", "Feb", "Mar", 
                    "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep",
                    "Oct", "Nov", "Dec"];

    const d = new Date(timestamp * 1000);
    const year = d.getFullYear().toString().substr(-2);
    const month = months[d.getMonth()];
    const day = d.getDate().toString();
    const hour = d.getHours();
    const minute = d.getMinutes();
    const seconds = d.getSeconds();

    return day + " " + month + " '" + year + 
      " " + hour + ":" + minute + ":" + seconds;
  }


  comparer = (a, b) => {
    return b.amount - a.amount;
  }


  formatEth = eth => {
    return Web3.utils.fromWei(eth.toString());
  }


  validateAmount = (amount, min, max) => {
    // Reject null or empty values
    if (amount == null || amount.trim().length == 0){
      return false;
    }

    // Reject hex values
    if (amount.toString().startsWith("0x")){
      return false;
    }

    // Reject non-numeric values
    if (!isFinite(amount)){
      return false;
    }

    // Reject negative values
    const parsedAmt = parseFloat(amount, 10);
    if (parsedAmt <= 0){
      return false;
    }

    // Reject amounts smaller than the minimum
    if (parsedAmt < parseFloat(min)){
      return false;
    }

    if (parsedAmt > parseFloat(max)){
      return false;
    }

    return true;
  }


  validate = (amount, email, organisation, minAmount, maxAmount) => {
    const min = parseFloat(web3.utils.fromWei(minAmount.toString()));
    const max = parseFloat(web3.utils.fromWei(maxAmount.toString()));

    const validAmount = this.validateAmount(amount, min, max);
    const orgLength = organisation.trim().length;
    const validOrganisation = orgLength > 4 && orgLength < 31;
    const validEmail = email.search("@") > -1 && email.trim().length > 4;

    // 000
    let errorMsg = null;

    // 111
    if (!validAmount && !validOrganisation && !validEmail){
      errorMsg = "Please enter a valid bid price, organisation name, and email address.";
    }

    // 110
    if (!validAmount && !validOrganisation && validEmail){
      errorMsg = "Please enter a valid bid price and organisation name.";
    }

    // 101
    if (!validAmount && validOrganisation && !validEmail){
      errorMsg = "Please enter a valid bid price and email address.";
    }

    // 100
    if (!validAmount && validOrganisation && validEmail){
      errorMsg = "Please enter a valid bid price.";
    }

    // 011
    if (validAmount && !validOrganisation && !validEmail){
      errorMsg = "Please enter a valid organisation name and email address.";
    }

    // 010
    if (validAmount && !validOrganisation && validEmail){
      errorMsg = "Please enter a valid organisation name.";
    }

    // 001
    if (validAmount && validOrganisation && !validEmail){
      errorMsg = "Please enter a valid email address.";
    }

    return {
      errorMsg: errorMsg,
      validFields: {
        email: validEmail,
        organisation: validOrganisation,
        amount: validAmount,
      }
    }
  }


  handleReclaimButtonClick = () => {
    this.setState({
      showPendingReclaim: true,
    }, () => {
      this.hireme.reclaim({ from: this.state.address })
      .then(transaction => {
        this.setState({
          showPendingReclaim: false,
        });
      }).catch(err => {
        console.error(err);
        this.setState({
          showPendingReclaim: false,
        });
      });
    });
  }


  handleBidButtonClick = () => {
    const amount = this.state.amount;
    const email = this.state.email;
    const organisation = this.state.organisation;

    const {errorMsg, validFields} = 
      this.validate(amount, email, organisation, this.state.minBid, this.state.balance);

    if (errorMsg == null){
      this.setState({
        valid: true,
        errorMsg: null,
        validFields: validFields,
        showPendingBid: true
      }, () => {
        this.makeBid(amount, email, organisation, this.state.address);
      })
    }
    else{
      this.setState({
        valid: false,
        errorMsg: errorMsg,
        validFields: validFields,
        showPendingBid: false,
      });
    }
  }


  makeBid = (amount, email, organisation, address) => {
    const amountWei = web3.utils.toWei(amount, "ether");
    const fetchBidsMulti = () => {
      Promise.delay(2000).then(this.fetchBidsViaW3).then(() => {
        Promise.delay(3000).then(this.fetchBidsViaW3).then(() => {
          Promise.delay(3500).then(this.fetchBidsViaW3).then(() => {
            Promise.delay(2500).then(this.fetchBidsViaW3);
          });
        });
      });
    };

    this.hireme.bid(email, organisation, { value: amountWei, from: address })
      .then(transaction => {
        this.setState({
          email: "",
          amount: "",
          errorMsg: null,
          organisation: "",
          bidComplete: true,
          validFields: null,
          showPendingBid: false,
        }, fetchBidsMulti);
      }).catch(error => {
        this.setState({ showPendingBid: false }, this.fetchBidsViaW3);
      });
  }


  renderAuctionTable() {
    const esUrl = address => {
      return "https://etherscan.io/address/" + address;
    }

    return (
      <table class="pure-table">
        <thead>
          <th>Rank</th>
          <th>Amount (ETH)</th>
          <th>Bidder</th>
          <th>Address</th>
        </thead>

        <tbody>
          {this.state.bids == null && 
            <tr>
              <td colspan="4" class="loading_bids">
                <p>
                  Loading bids... {spinner}
                </p>
              </td>
            </tr>
          }

          {this.state.bids != null && this.state.bids.length == 0 && 
            <tr>
              <td colspan="4" class="no_bids">
                <p>
                  There are no bids yet. You can be the first!
                </p>
              </td>
            </tr>
          }

          {this.state.bids !== null && this.state.bids.map((bid, i) => {
            let rowClass = "";
            if (bid.bidder && this.state.address &&
                bid.bidder.toUpperCase() === this.state.address.toUpperCase()){
              rowClass = "highlight"
            }
            return (
              <tr class={rowClass}>
                <td>{i + 1}</td>
                <td>{this.formatEth(bid.amount.toString())}</td>
                <td>{bid.organisation} </td>
                <td>
                  <a class="svg"
                    href={esUrl(bid.bidder)} target="_blank">
                    {extLink}
                  </a>
                </td>
              </tr>
            )}
          )}
        </tbody>
      </table>
    )
  }

  renderReclaimButton = () => {
    if (this.state.amtReclaimable != null && this.state.amtReclaimable > 0){
      return (
        <div class="button_container">
          <p>
            <button 
              disabled={this.state.showPendingReclaim}
              class="reclaimBtn"
              onClick={this.handleReclaimButtonClick}>
              Reclaim your past bids: {this.formatEth(this.state.amtReclaimable)} ETH
            </button>
          </p>
          {this.state.showPendingReclaim && pendingPrompt}
        </div>
      );
    }
  }


  renderTimeLeft = timestamp => {
    let now = this.state.timestampNow;
    if (now == null){
      now = Date.now();
    }
    if (now < timestamp * 1000){
      const diff = countdown(now, timestamp * 1000);
      return (
        <span>{diff.toString()}</span>
      );
    }
    else{
      return (
        <span>0 seconds</span>
      );
    }
  }

  render() {
    let emailClass = "";
    let organisationClass = "";
    let amountClass = "";

    if (!this.state.valid && this.state.validFields != null){
      if (!this.state.validFields.email){
        emailClass = "invalid";
      }
      if (!this.state.validFields.organisation){
        organisationClass = "invalid";
      }
      if (!this.state.validFields.amount){
        amountClass = "invalid";
      }
    }

    const isOwner = typeof this.state.owner !== "undefined" && 
      typeof this.state.address !== "undefined" &&
      this.state.address != null &&
      this.state.balance != null &&
      this.state.owner.toUpperCase() === this.state.address.toUpperCase();

    const isCharity = typeof this.state.charityAddress !== "undefined" && 
      typeof this.state.address !== "undefined" &&
      this.state.address != null &&
      this.state.charityAddress != null &&
      this.state.charityAddress.toUpperCase() === this.state.address.toUpperCase();

    const winMsg = this.state.hasExpired ? 
      "You've won the auction. Thank you for participating. I will be in touch."
      : 
      "Your bid is currently the highest, but you may get outbid before the auction ends." 

    return (
      <div class="auction">
        <p>
          <a href="/">
            <button class="secondary">
              ⬅ About this auction
            </button>
          </a>
        </p>

        {this.state.expiryTimestamp != null && !this.state.hasExpired &&
          this.state.expiryTimestamp < Date.now() &&
          <h3>Time remaining: {this.renderTimeLeft(this.state.expiryTimestamp)}</h3>
        }

        {this.state.manuallyEnded && 
          <p>
            Due to unforeseen reasons, I have disabled this auction. No bids
            have been placed. I will reopen the auction as soon as possible.
          </p>
        }

        {!this.state.manuallyEnded && this.renderAuctionTable() }

        {this.state.bids &&
          this.state.bids.length > 0 &&
          this.state.address &&
          this.state.bids[0].bidder.toUpperCase() === this.state.address.toUpperCase() &&
          <p>{winMsg}</p>
        }

        {!this.state.manuallyEnded && 
          (this.state.web3Status === null ||
          this.state.web3Status === this.web3StatusCodes.missing) &&
          <p>
            You'll need the <a target="_blank" 
              href="https://metamask.io/">MetaMask browser extension</a> to make a bid.
          </p>
        }

        {this.state.web3Status === this.web3StatusCodes.locked &&
          <p>
            Please unlock your MetaMask browser extension.
          </p>
        }

        {this.state.web3Status === this.web3StatusCodes.wrongNet &&
          <p>
            {/*Please connect to the Ropsten network in MetaMask.*/}
            Please connect to the main network in MetaMask.
          </p>
        }

        {this.state.web3Status === this.web3StatusCodes.unlocked &&
          this.state.hasExpired &&
            <div>
              <p>Thanks for your interest. The auction is over.</p>
              {this.renderReclaimButton()}
            </div>
        }

        {isOwner &&
          <p>As the owner of this contract, you may not make a bid.</p>
        }

        {isCharity &&
          <p>
            As the owner of the Internet Archive donation address, you may not
            make a bid.
          </p>
        }

        {this.state.bidComplete && 
          <div class="complete">
            <p>
              Thank you for participating in this auction. I will get in touch
              with you. If you have any questions about this auction, 
              please <a href="/">click here</a> or email me 
              at <a target="_blank"
              href="mailto:contact@kohweijie.com">contact@kohweijie.com</a>.
            </p>
            {this.renderReclaimButton()}
          </div>
        }

        {this.state.web3Status === this.web3StatusCodes.unlocked &&
         typeof this.state.address !== "undefined" &&
         typeof this.state.owner !== "undefined" &&
         this.state.owner.toUpperCase() !== this.state.address.toUpperCase() &&
         this.state.balance &&
         this.state.minBid &&
         !this.state.bidComplete &&
         !this.state.hasExpired &&

          <div class="bidform pure-form">
            {this.renderReclaimButton()}
            <div class="pure-u-1-1">
              <p>Your address: <pre>{this.state.address}</pre></p>
              <p>You have: {this.formatEth(this.state.balance)} ETH</p>
              <p>Minimum bid: <a onClick={this.populateMinBid}>
                <pre>{this.formatEth(this.state.minBid)}</pre> ETH
                </a>
              </p>
            </div>

            <div class="pure-u-1-1">
              <label>Bid price (ETH):</label>
              <input type="number" 
                class={amountClass}
                value={this.state.amount}
                onChange={this.handleAmountChange}
                onInput={this.handleAmountChange}
                onKeyDown={this.handleFormKeyDown}
              />
            </div>

            <div class="pure-u-1-1">
              <label>Your organisation (5 - 30 characters):</label>
              <input type="text"
                class={organisationClass}
                value={this.state.organisation}
                onChange={this.handleOrganisationChange}
                onInput={this.handleOrganisationChange}
                onKeyDown={this.handleFormKeyDown}
              />
            </div>

            <div class="pure-u-1-1">
              <label>Your email address:</label>
              <input type="text"
                class={emailClass}
                value={this.state.email}
                onChange={this.handleEmailChange}
                onInput={this.handleEmailChange}
                onKeyDown={this.handleFormKeyDown}
              />
            </div>

            <div class="error">
              {this.state.errorMsg != null ?
                <p>{this.state.errorMsg}</p>
                  :
                <p>&nbsp;</p>
              }
            </div>

            <p>
              Note that the information you submit will be forever visible on
              the blockchain.
            </p>

            <div class="pure-u-md-2-3 pure-u-sm-1-1">
              {this.state.showPendingBid && pendingPrompt }

            </div>
            <div class="button_container pure-u-md-1-3 pure-u-sm-1-1">
              <button 
                disabled={this.state.showPendingBid}
                onKeyDown={this.handleFormKeyDown}
                onClick={this.handleBidButtonClick} >
                Make a bid
              </button>
            </div>
          </div>
        }
      </div>
    );
  }
}
