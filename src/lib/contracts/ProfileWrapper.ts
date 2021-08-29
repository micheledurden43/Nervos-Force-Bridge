import Web3 from 'web3';
import * as ProfileJSON from '../../../build/contracts/Profile.json';
import { Profile } from '../../types/Profile';
import { values } from '../../ui/values';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class ProfileWrapper {
    web3: Web3;

    contract: Profile;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.address = values.DEPLOYED_CONTRACT_ADDRESS;
        this.contract = new web3.eth.Contract(ProfileJSON.abi as any) as any;
        this.contract.options.address = values.DEPLOYED_CONTRACT_ADDRESS;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getAllProfiles(fromAddress: string) {
        const workers = await this.contract.methods.getAllWorkers().call({ from: fromAddress });

        return workers;
    }

    async getTotalProfile(fromAddress: string) {
        const workers = await this.contract.methods.totalWorker().call({ from: fromAddress });

        return parseInt(workers, 10);
    }

    async createNewProfile(name: string, title: string, description: string, fromAddress: string) {
        const tx = await this.contract.methods.createNewProfile(name, title, description).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    async likeProfile(id: number, fromAddress: string) {
        const tx = await this.contract.methods.likeProfile(id).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    async deploy(fromAddress: string) {
        const tx = this.contract
            .deploy({
                data: ProfileJSON.bytecode,
                arguments: []
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress
            });

        let transactionHash: string = null;
        tx.on('transactionHash', (hash: string) => {
            transactionHash = hash;
        });

        const contract = await tx;

        this.useDeployed(contract.options.address);

        return transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
