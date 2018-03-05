import {h, Component} from 'preact'
import { Router, route } from "preact-router";

export default class Home extends Component {
  render() {
    return (
      <div>
        <div class="box">
          <h1>Hire Wei Jie.</h1>
          <p>
            I'm a software developer based in Singapore, seeking work in the
            cryptocurrency and blockchain space.
          </p>
            
          <p>
            I'm auctioning myself on the Ethereum blockchain. 
          </p>
            
          <p>
            You read that right. If you're hiring, I invite you to bid for me. 
          </p>
        </div>

        <div class="box make_bid">
          <div class="pure-u-md-1-2 pure-u-sm-1-1">
            <p>
              <a href="https://www.linkedin.com/in/kohwj/" target="_blank">
                LinkedIn profile
              </a>
            </p>
            <p>
              <a href="https://kohweijie.com/" target="_blank">
                Technical portfolio and CV
              </a>
            </p>
          </div>

          <div class="button_container pure-u-md-1-2 pure-u-sm-1-1">
            <a href="/auction">
              <button class="secondary">Hire Wei Jie ➡</button>
            </a>
          </div>
        </div>

        <div class="box">
          <p>
            Well, okay, I'm not auctioning <em>myself</em> off.
            To be precise, what I'm auctioning is:
          </p>
          <p>
            <ul>
              <li>
                40 hours of unpaid blockchain-related software development
                work.
              </li>
              <li>
                A commitment to consider to apply to you for a
                blockchain-related software development job.
              </li>
            </ul>

            I will provide the above if your company or organisation fulfils
            the following conditions:

            <ul>
              <li>
                Its product or service ideally <em>requires</em> a
                decentralised and permisssionless blockchain, instead of a
                fully trusted, centralised system.  </li>
              <li>
                It demonstrates strong technical knowledge and/or competence in
                the technologies it works with.
              </li>
              <li>
                It is legitimate, not a scam, and not malicious.
              </li>
              <li>
                It is interested to hire me.
              </li>
            </ul>

            I will not receive any ETH proceeds from this auction, and losing
            bidders may reclaim their funds at any time. If I believe that the
            winner does not fulfil these conditions, I will publish a clear
            explanation as to why I think so.
          </p>
          <p>
            If you made a bid but did not win the auction, I will still
            consider you, although I will prioritise each bidder by their bid
            price.
          </p>
          <p>
            My CV and professional portfolio are available on 
            my <a href="https://kohweijie.com/" target="_blank">website</a> and
            LinkedIn <a 
              target="_blank" href="https://www.linkedin.com/in/kohwj/">profile</a>. If 
            you’re a company in the blockchain space and
            you’re interested in what I have to offer, please place a bid or 
            email me at <a href="mailto:contact@kohweijie.com"
              target="_blank">contact@kohweijie.com</a>.
          </p>
        </div>

        <div class="box">
          <h1>How the auction works</h1>
          <p>
            This open-bid, second-price, timed auction lets you, a prospective
            employer, signal how much you need developers like myself.
            Proceeds from the winning bid will be donated to the <a 
            target="_blank" href="https://archive.org/">Internet Archive</a>, 
            a nonprofit whose mission is to <a href="https://archive.org/about/"
            target="_blank">provide universal access to all knowledge</a>.
            Losing bids can be reclaimed by their respective bidders at any
            time.
          </p>


          <p>
            This dApp makes it easy for anyone with an Ethereum-enabled 
            browser or the <a href="https://metamask.io/" 
              target="_blank">MetaMask</a> extension to participate in
            the auction. The following description, however, is meant for
            advanced users who may wish to interact directly with the smart
            contract, located at the Ethereum address:
          </p>

          <p>
            <a href="https://etherscan.io/address/0x3d9c230381f3cdc913269668dac1bb630827df53" target="_blank">
              <pre>
                0x3D9C230381F3CDC913269668DaC1BB630827df53
              </pre>
            </a>
          </p>

          <p>
            Starting with a from minimum bid <pre>min</pre>, each bidder 
            should send their bid price in Ether to the contract 
            function <pre>bid()</pre>. The bid price must be greater 
            than or equal to the previous bid plus the minimum bid 
            increment <pre>step</pre>.
          </p>
          <p>
            In effect, the first bidder must bid a price of <pre>min</pre> or
            greater, the second bidder must bid (<pre>step</pre> + the
            first bid price) or greater, and so on.
          </p>
          <p>
            <pre>
              min = 1 ETH
            </pre>
            <br />
            <pre>
              step = 0.01 ETH
            </pre>
          </p>

          <p>
            Every call to <pre>bid()</pre> must include a corresponding
            organisation name and email address so that I can get in touch
            with you. Please note that the amount of ETH and data associated
            with each bid will be publicly visible forever on the blockchain,
            and cannot be erased or changed once sent.
          </p>
          <p>
            If there are no bids, the auction will remain open forever, unless I call 
            the <pre>manuallyEndAuction()</pre> function. Otherwise, the
            auction will end after an expiry period <pre>exp</pre> passes from
            the time of the last bid onwards. i.e. if the last bid occurs at
            timestamp <pre>t</pre>, the auction will end at 
            timestamp <pre>t + exp</pre> as 
            long as there are no new bids.
          </p>

          <p>
            <pre>manuallyEndAuction()</pre> will not work if there are one or more bids.
          </p>

          <p>
            The value 
            of <pre>exp</pre> depends on how many bids there currently are.
          </p>

          <p>
            <pre>initialBids = 4</pre>
            <br />
            <pre>if numBids == 0:           exp = ∞ days</pre>
            <br />
            <pre>if numBids &lt;= initialBids: exp = 7 days from now</pre>
            <br />
            <pre>if numBids &gt;  initialBids: exp = 3 days from now</pre>
          </p>

          <p>
            Any bidder may call the <pre>reclaim()</pre> function to get back
            their funds currently stored in the contract. If the current winner
            calls this function before the auction is over, they will receive
            the difference between their total stored funds and their winning
            bid. After the auction, the winner may reclaim the difference
            between their total stored funds and the second-highest bid.
          </p>

          <p><pre>reclaim()</pre> may called any number of times, as long as
            the bidder has funds in the contract. For instance, if you make a
            bid of 1 ETH, and you get outbid, you can reclaim 1 ETH any time
            you want.
          </p>

          <p>
            If the auction ends with only 1 bid, the winner will not be
            able to reclaim any funds.
          </p>

          <p>
            If the auction ends with 2 or more bids, each bidder except
            for the winner may reclaim all their bids. The winning bidder may
            only reclaim the difference between their total amount bid and the
            second-highest bid.
          </p>

          <p>
            For example, if there is only 1 bidder:
          </p>

          <table class="pure-table">
            <thead>
              <tr>
                <th>Bidder</th>
                <th>Bid price (ETH)</th>
                <th>Reclaimable (ETH)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>A (winner)</td>
                <td><pre>1</pre></td>
                <td><pre>0</pre></td>
              </tr>
              <tr>
                <td colspan="3">
                  After the auction ends, <pre>1</pre> ETH will be donated to the Internet
                  Archive.
                </td>
              </tr>
            </tbody>
          </table>

          <p>
            If there are 4 unique bidders:
          </p>

          <table class="pure-table">
            <thead>
              <tr>
                <th>Bidder</th>
                <th>Bid price (ETH)</th>
                <th>Reclaimable (ETH)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>D (winner)</td>
                <td><pre>1</pre>.3</td>
                <td><pre>0</pre>.1</td>
              </tr>
              <tr>
                <td>C</td>
                <td><pre>1</pre>.2</td>
                <td><pre>1</pre>.2</td>
              </tr>
              <tr>
                <td>B</td>
                <td><pre>1</pre>.1</td>
                <td><pre>1</pre>.1</td>
              </tr>
              <tr>
                <td>A</td>
                <td><pre>1</pre></td>
                <td><pre>1</pre></td>
              </tr>
              <tr>
                <td colspan="3">
                  After the auction ends, <pre>1.2</pre> ETH from bidder D will
                  be donated to the Internet Archive. The winner, D, may
                  reclaim <pre>1.3 - 1.2 = 0.1</pre> ETH.
                </td>
              </tr>
            </tbody>
          </table>

          <p>
            If there are 4 bids, 3 unique bidders, and a winner who made 2
            bids:
          </p>

          <p>
            <table class="pure-table">
              <thead>
                <tr>
                  <th>Bidder</th>
                  <th>Bid price (ETH)</th>
                  <th>Reclaimable (ETH)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>B (winner)</td>
                  <td><pre>1</pre>.3</td>
                  <td><pre>0</pre>.1</td>
                </tr>
                <tr>
                  <td>C</td>
                  <td><pre>1</pre>.2</td>
                  <td><pre>1</pre>.2</td>
                </tr>
                <tr>
                  <td>B</td>
                  <td><pre>1</pre>.1</td>
                  <td><pre>1</pre>.1</td>
                </tr>
                <tr>
                  <td>A</td>
                  <td><pre>1</pre></td>
                  <td><pre>1</pre></td>
                </tr>
                <tr>
                  <td colspan="3">
                    After the auction ends, <pre>1.2</pre> ETH will be donated
                    to the Internet Archive. The winner, B, may 
                    reclaim <pre>1.3 + 1.1 - 1.2 = 1.2</pre> ETH.
                  </td>
                </tr>
              </tbody>
            </table>
          </p>

          <p>
            The second-highest bid amount, or the sole winning bid, will be
            transferred to the ETH <a href="https://archive.org/donate/bitcoin.php" 
              target="_blank">donation address</a> (<pre>charityAddress</pre>) of 
            the Internet Archive if and only if the contract
            owner (who is me) or the owner of the private key 
            of <pre>charityAddress</pre> runs 
            the <pre>donate()</pre> function.
          </p>

          <p>
            <pre>charityAddress = 0x635599b0ab4b5c6B1392e0a2D1d69cF7d1ddDF02</pre>
          </p>

          <p>
            An attacker may make a bid only to dissuade genuine bidders,
            and not hire me. Nevertheless, this attack only makes sense if the
            attacker is prepared to win the bid and thereby lose at 
            least <pre>min</pre> ETH. As such, even in this scenario,
            the Internet Archive will receive a donation.
          </p>
        </div>

        <div class="box faq">
          <a class="anchor" name="faq" />
          <h1>Frequently asked questions</h1>

          <em>
            Where's the source code?
          </em>

          <p>
            The source code for this dApp and the smart contract can be 
            found <a href="https://github.com/weijiekoh/hireme" target="_blank">here</a>. The verified 
            contract source code can be found 
            on <a href="https://etherscan.io/address/0x3d9c230381f3cdc913269668dac1bb630827df53" target="_blank">Etherscan</a>.
          </p>

          <em>
            I don’t like that you’re doing this. What makes you think you’re
            worth bidding for in the first place?
          </em>

          <p>
            Yes, by creating this smart contract and website, I am saying that
            what I can offer is worth your consideration. But anyone who sends
            their CV to a prospective employer, creates a LinkedIn profile, or
            builds a professional portfolio page implicitly says the same
            thing. All I have done is to create a mechanism allowing the open
            market to answer this question.
          </p>

          <p>
            Besides, other developers looking for jobs can also benefit from
            the information revealed by the auction. For example, a developer
            with similar qualifications may learn, from the bids placed here,
            what sort of companies would be interested in hiring them.
          </p>

          <em>
            I’m interested, but I don’t want to bid in this auction.
          </em>
          <p>
            Although I will prioritise bidders, I am open to conversations
            about job opportunities. Please email me at <a target="_blank"
              href="contact@kohweijie.com">contact@kohweijie.com</a>.
          </p>
          <em>
            Are the funds safe in the smart contract?
          </em>
          <p>
            Yes, but don't just trust my word for it. The best way to verify
            this is to examine the source code yourself.
          </p>
          <em>
            Why are you doing this?
          </em>
          <p>
            A job search is a Pareto-inefficient process because the actors
            involved have incomplete information about one another. In other
            words, prospective employers only know about some potential hires,
            who in turn only know about some prospective employers. As such, at
            least some prospective employers and some jobseekers will end up
            with less-than-ideal results.
          </p>
          <p>
            As I am looking for a job in the blockchain space, I made this
            auction to increase the amount of information I have about
            potential employers, and also make information about myself
            available to as many potential employers as possible. If it goes
            well, I will arrive at a better outcome than if I had not run this
            auction at all.
          </p>
          <p>
            Moreover, what better way to land a smart contract job, than to build
            a smart contract to do so?
          </p>
          <em>
            How is this better than traditional job-seeking methods, like sending
            your CV to lots of employers, or networking?
          </em>
          <p>
            An auction provides information that I would not gain if I were to
            only use traditional methods. As potential employers have to bid
            against one another, I will be able to determine how much each
            employer is interested, relative to all other employers.
          </p>

          <em>
            Isn’t it dehumanising to put yourself up for auction?
          </em>
          <p>
            I am not literally putting myself up for sale. I use the term “auction”
            merely out of semantic convenience. In fact, this <em>increases</em> the 
            amount of agency I may have in this job search.
          </p>

          <em>
            What will you do with the proceeds?
          </em>

          <p>
            I will receive exactly zero ETH from this smart contract. You can
            verify this by examining the source code. At the end of the day,
            only the Internet Archive will make a net gain from the smart
            contract.
          </p>

          <em>
            If I win the auction, how can I be sure that you will contact me?
          </em>

          <p>
            I promise to email you through the email address you sent to 
            the <pre>bid()</pre> function when you made the winning bid. If the
            email bounces, I will use the organisation name you provide to find
            an alternative way to contract you.
          </p>

          <em>
            How do I know that you are who you say you are?
          </em>

          <p>
            The contract source code includes a constant state 
            variable, <pre>AUTHORSIGHASH</pre> which contains: 
          </p>
          <p>
            <pre>
              8c8b82a2d83a33cb0f45f5f6b22b45c1955f08fc54e7ab4d9e76fb76843c4918
            </pre>
          </p>
          <p>
            This is the SHA256 checksum of a <a
            href="https://github.com/weijiekoh/hireme/blob/master/AUTHOR.asc"
            target="_blank">GPG signature</a> of <a
            href="https://github.com/weijiekoh/hireme/blob/master/AUTHOR"
            target="_blank">a file</a> containing the following string:
          </p>
          <p>
            <pre>
              Koh Wei Jie &lt;contact@kohweijie.com&gt;
            </pre>
          </p>

          <p>
            This SIGNATUre file was signed by my GPG 
            key <pre>0x90DB43617CCC1632</pre>, whose fingerprint 
            is <pre>55B4 84D5 C359 852C 4EBF AB40 90DB 4361 7CCC
              1632</pre>, which is in turn visible on my website 
            and LinkedIn profile.  My full GPG public key can be found 
            on <a 
              href="https://pgp.mit.edu/pks/lookup?search=contact%40kohweijie.com&op=index" 
              target="_blank">various</a> <a 
              href="https://keyserver.ubuntu.com/pks/lookup?op=vindex&search=contact%40kohweijie.com&fingerprint=on"
              target="_blank">keyservers</a>.
          </p>

          <p>
            Since <pre>AUTHORSIGHASH</pre> is constant and embedded in the
            contract source code, and it can be verified as a cryptographic
            checksum of a cryptographic signature of my name and email address,
            this contract is guaranteed to have been written by whoever owns my
            GPG key.
          </p>

          <em>
            Why not return the winning bid to the winner?
          </em>
          <p>
            This auction will only be useful if bidders are serious. Potential
            employers can only prove that they have skin in the game if they
            spend funds to make a bid. If the winning bid, along with losing
            bids, returns to the bidders, I will have no way to tell which
            bidders are genuine.
          </p>

          <em>
            Why is the contract designed to donate the winning bid to the
            Internet Archive?
          </em>

          <p>
            This demonstrates that I am running this auction not to make money,
            but to find a promising employer who is not only blockchain-savvy,
            but who also supports the mission of the Internet Archive. 
          </p>
          <p>
            Another reason is that I was unable to find any other nonprofits or
            charities which accept donations in ETH. Nevertheless, I support
            what the Internet Archive does and am more than happy to help it.
          </p>
          <em>
            How exactly will funds be donated to the Internet Archive?
          </em>
          <p>
            After the auction is over, I will run 
            the <pre>donate()</pre> function of the smart contract, which will
            cause the second-price bid to be transferred to the Internet
            Archive’s donation address. In the event that I do not do so, the
            Internet Archive may run the <pre>donate()</pre> function by
            themselves. The contract is built in a way such that the contract
            owner (me) or the owner of the private key of the Internet
            Archive’s donation address may successfully run this function.
          </p>

          <p>
            Since this mechanism is baked into the smart contract, I cannot
            renege on this donation.
          </p>

          <em>
            Will you consider bidders which did not win the auction? I lost the
            auction, but I believe that I am your best choice. Will you
            consider my organisation?
          </em>

          <p>
            Yes. As described above, the objective of this auction is to increase
            information available to me and potential employers, not force me to only
            consider the highest bidder. The auction data will be very helpful in
            making my final decision, but it is not binding, since I naturally have
            to consider a range of factors such as remuneration and logistics. That said,
            I will prioritise bidders by bid price.
          </p>

          <em>
            The dApp uses data from this web service endpoint: <a href="/bids" 
              target="_blank"><pre>{window.location.href}bids</pre></a>. Why should I trust it,
            since it's a centralised source of data?</em>

          <p>
            This endpoint allows users who do not have MetaMask installed to
            view the list of bidders in the auction.
          </p>
          <p>
            When this dApp accesses the <pre>/bids</pre> endpoint, the web
            server that hosts this dApp will connect to an Ethereum node hosted
            by <a href="https://infura.io/">Infura</a>, run 
            the <pre>getBidIds()</pre> and <pre>bids()</pre> functions of the
            smart contract, and respond with a list of bidders. 
          </p>
          <p>
            Yes, this is a centralised solution. However, if you have MetaMask
            installed in your browser, the dApp will not 
            call <pre>/bids</pre>, but will do so through the local or remote
            Ethereum node which MetaMask is configured to use. So if you don't
            trust the data from this source, please install MetaMask,
            connect it to an Ethereum RPC server which you trust, and use
            this dApp as usual.
          </p>
        </div>
      </div>
    );
  }
}
