require('dotenv').config();

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
import "hardhat-jest-plugin";
import "hardhat-tracer";
// import "@nomiclabs/hardhat-solpp"; // Error: Cannot find module 'antlr4/index'
import "@nomiclabs/hardhat-solhint";
import "hardhat-deploy";
import "hardhat-deploy-ethers";


module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  // the following will only deploy "GenericMetaTxProcessor" if the contract was never deployed or if the code changed since last deployment
  await deploy('GenericMetaTxProcessor', {
    from: deployer,
    gasLimit: 4000000,
    args: [],
  });
};

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.3",
  // defaultNetwork: "goerli",
  networks: {
    hardhat: {
    },
    rinkeby: {
      url: process.env.ALCHEMY_URL,
      accounts: [process.env.FOUNDATION_PRIVATE_KEY, process.env.DEPLOYER_PRIVATE_KEY],
      live: true,
      saveDeployments: true,
      tags: ["staging"]
    }
  },
  namedAccounts: {
    foundation: {
      default: 1,
      "mainnet": "0xdAe503Fd260358b8f344D136160c299530006170",
      "rinkeby": "0xdAe503Fd260358b8f344D136160c299530006170"
    },
    deployer: {
      default: 2,
      "mainnet": "0xD2dd063B77cdB7b2823297a305195128eF2C300c",
      "rinkeby": "0xD2dd063B77cdB7b2823297a305195128eF2C300c"
    }
  }
};

