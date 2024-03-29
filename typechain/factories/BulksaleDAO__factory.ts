/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { BulksaleDAO, BulksaleDAOInterface } from "../BulksaleDAO";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_basicPlugin",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "BasicPlugin",
    outputs: [
      {
        internalType: "contract IBasicPlugin",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "upgrade",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b5060405161038c38038061038c83398181016040528101906100329190610096565b600160008190555080600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050610108565b600081519050610090816100f1565b92915050565b6000602082840312156100a857600080fd5b60006100b684828501610081565b91505092915050565b60006100ca826100d1565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6100fa816100bf565b811461010557600080fd5b50565b610275806101176000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063279cc8821461003b578063d55ec69714610059575b600080fd5b610043610077565b60405161005091906101bd565b60405180910390f35b61006161009d565b60405161006e91906101a2565b60405180910390f35b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663d55ec6976040518163ffffffff1660e01b8152600401602060405180830381600087803b15801561010957600080fd5b505af115801561011d573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610141919061015b565b905090565b60008151905061015581610228565b92915050565b60006020828403121561016d57600080fd5b600061017b84828501610146565b91505092915050565b61018d816101d8565b82525050565b61019c81610204565b82525050565b60006020820190506101b76000830184610184565b92915050565b60006020820190506101d26000830184610193565b92915050565b60008115159050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061020f82610216565b9050919050565b6000610221826101e4565b9050919050565b610231816101d8565b811461023c57600080fd5b5056fea264697066735822122009717b42bff4e6c4f6dc3e4882655bb0b815b4b4d78da48d884acc0f9ebba66864736f6c63430008030033";

export class BulksaleDAO__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    _basicPlugin: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<BulksaleDAO> {
    return super.deploy(_basicPlugin, overrides || {}) as Promise<BulksaleDAO>;
  }
  getDeployTransaction(
    _basicPlugin: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_basicPlugin, overrides || {});
  }
  attach(address: string): BulksaleDAO {
    return super.attach(address) as BulksaleDAO;
  }
  connect(signer: Signer): BulksaleDAO__factory {
    return super.connect(signer) as BulksaleDAO__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): BulksaleDAOInterface {
    return new utils.Interface(_abi) as BulksaleDAOInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): BulksaleDAO {
    return new Contract(address, _abi, signerOrProvider) as BulksaleDAO;
  }
}
