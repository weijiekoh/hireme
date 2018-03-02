//var Migrations = artifacts.require("./Migrations.sol");

//module.exports = function(deployer) {
  //deployer.deploy(Migrations);
//};

var HireMe = artifacts.require("HireMe");

module.exports = function(deployer) {
  deployer.deploy(HireMe);
}
