import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
import "hardhat-jest-plugin";
import "hardhat-tracer";
// import "@nomiclabs/hardhat-solpp"; // Error: Cannot find module 'antlr4/index'
import "@nomiclabs/hardhat-solhint";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.3",
  // defaultNetwork: "goerli",
  networks: {
    hardhat: {
    },
    // goerli: {
    //   url: require('fs').readFileSync('./alchemy_url').toString(),
    //   accounts: [require('fs').readFileSync('./goerli_tester_privatekey').toString()]
    // }
  },
};

