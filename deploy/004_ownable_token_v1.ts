import { BigNumber, Wallet, getDefaultProvider, Contract } from 'ethers';
import { genABI } from '../src/genABI';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {parseEther} from 'ethers/lib/utils';
import {
  deploy,
  goToEmbededMode,
  hardcodeFactoryAddress,
  singletonProvider,
  getFoundation,
  getDeployer,
  extractEmbeddedFactoryAddress,
  recoverFactoryAddress,
  setProvider,
  isInitMode,
  isEmbeddedMode,
  backToInitMode,
} from '../src/deployUtil';
import { addTemplate } from '../src/addTemplate';
import {
    getSaleTemplateKey,
    setSaleTemplateKey,
    cloneTokenAndSale,
} from '../src/cloneTester';


const codename = "OwnableToken";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if( !isEmbeddedMode() ) return;
  const { ethers } = hre;
  const {
    getDefaultProvider, getContractFactory,
    Contract, BigNumber, Signer, getSigners,
  } = ethers;
  setProvider({getDefaultProvider});
  const foundation = getFoundation();
  const deployer = getDeployer();
  const factoryAddr = extractEmbeddedFactoryAddress(codename);

  console.log(`${codename} is deploying with factory=${factoryAddr}...`);
  const OwnableTokenV1 = await deploy(codename, {
    from: foundation,
    args: [],
    log: true,
    getContractFactory
  });

  let _tokenTemplateKey;
  try {
    _tokenTemplateKey = await addTemplate(
      codename,
      factoryAddr,
      OwnableTokenV1.address
    );
  } catch (e) {
    console.trace(e.message);
  }

  const Factory = (new Contract(factoryAddr, genABI('Factory'), singletonProvider()));
  cloneTokenAndSale(Factory, deployer, _tokenTemplateKey, getSaleTemplateKey());
  backToInitMode();
};
export default func;
func.tags = [codename];