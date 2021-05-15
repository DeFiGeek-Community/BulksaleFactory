import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {parseEther} from 'ethers/lib/utils';
import {
  recoverFactoryAddress,
  extractEmbeddedFactoryAddress,
  preserveUpstreamFactoryAddress
} from '../src/deployUtil';
import { addTemplate } from '../src/addTemplate';


const codename = "BulksaleV1";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;
  const { foundation, deployer } = await getNamedAccounts();

  // const bytesLib = await deploy("BytesLib", {
  //     from: foundation
  // });
  const bulksaleV1 = await deploy(codename, {
    from: foundation,
    args: [],
    log: true,
    // libraries: {
    //     BytesLib: bytesLib.address
    // }
  });

  await addTemplate(
    codename,
    extractEmbeddedFactoryAddress(codename),
    bulksaleV1.address
  );

  preserveUpstreamFactoryAddress(codename, bulksaleV1.address);

  recoverFactoryAddress(codename);
};
export default func;
func.tags = [codename];