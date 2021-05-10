import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {parseEther} from 'ethers/lib/utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const { foundation, deployer } = await getNamedAccounts();

  await deploy('SampleToken', {
    from: deployer,
    args: [parseEther('115792089237316195423570985008687907853269984665640564039457')],
    log: true,
  });
};
export default func;
func.tags = ['SampleToken'];