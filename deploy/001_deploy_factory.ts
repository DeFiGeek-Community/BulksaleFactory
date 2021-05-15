import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {parseEther} from 'ethers/lib/utils';
import {
  preserveLocalFactoryAddress,
  preserveUpstreamFactoryAddress,
  hardcodeFactoryAddress
} from '../src/deployUtil';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const { foundation, deployer } = await getNamedAccounts();

  const factory = await deploy('Factory', {
    from: foundation,
    args: [foundation],
    log: true,
  });

  preserveLocalFactoryAddress("BulksaleV1");
  hardcodeFactoryAddress("BulksaleV1", factory.address);
  hardcodeFactoryAddress("OwnableToken", factory.address);
  preserveUpstreamFactoryAddress("BulksaleV1");
};
export default func;
func.tags = ['Factory'];


