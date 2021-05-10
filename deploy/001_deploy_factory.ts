import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {parseEther} from 'ethers/lib/utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const { foundation, deployer } = await getNamedAccounts();

  await deploy('Factory', {
    from: foundation,
    args: [foundation],
    log: true,
  });
};
export default func;
func.tags = ['Factory'];