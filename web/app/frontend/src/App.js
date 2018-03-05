import {h, Component} from 'preact'
import { Router, route } from "preact-router";
import Auction from "./routes/auction.js";
import Home from "./routes/home.js";

export default class App extends Component {
	handleRoute = e => {
		this.currentUrl = e.url;

    // Update Google Analytics
    if (typeof window !== "undefined"){
      if (Object.keys(window).indexOf("ga") > -1 &&
          window.ga !== null){
        ga("set", "page", e.url);
        ga("send", "pageview");
      }
    }
	};

  render() {
    return(
      <Router onChange={this.handleRoute}>
        <Home path="/" />
        <Auction path="/auction" />
      </Router>
    );
  }
}
