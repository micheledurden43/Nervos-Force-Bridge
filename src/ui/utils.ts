import Web3 from 'web3';
import { values } from './values';
import * as CompiledContractArtifact from '../../build/contracts/ERC20.json';

const formatCkethBalance = (number: string, ndecimals: number) => {
    if (number.length > ndecimals) {
        return `${number.substring(0, number.length - ndecimals)}.${number
            .substring(number.length - ndecimals)
            .replace(/0+/, '')}`;
    }
    const nzeros = ndecimals - number.length;
    const newnumber = `0.${String('0').repeat(nzeros)}${number.replace(/0+/, '')}`;
    return newnumber;
};

const getContractBalance = async (
    type: 'sudt' | 'ckEth',
    web3: Web3,
    polyjuiceAddress: string,
    account: string
) => {
    const _contract = new web3.eth.Contract(
        CompiledContractArtifact.abi as any,
        type === 'sudt' ? values.SUDT_CONTRACT_ADDRESS : values.CKETH_CONTRACT_ADDRESS
    );

    const _balance = await _contract.methods.balanceOf(polyjuiceAddress).call({
        from: account
    });

    return type === 'ckEth' ? formatCkethBalance(_balance, 18) : _balance;
};

export { formatCkethBalance, getContractBalance };
