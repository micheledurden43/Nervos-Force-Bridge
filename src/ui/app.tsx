/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { CSSProperties, useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';

import { ProfileWrapper } from '../lib/contracts/ProfileWrapper';
import { CONFIG } from '../config';
import Profile from './Profile';
import { values } from './values';
import { getContractBalance } from './utils';

const divStyle: CSSProperties = {
    border: '1px solid black',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
};

const addressStyle: CSSProperties = {
    overflowWrap: 'break-word',
    wordWrap: 'break-word',
    width: '20vw'
};
async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

interface IProfile {
    id: number;
    name: string;
    title: string;
    description: string;
    likes: number;
}
export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<ProfileWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [title, setTitle] = useState<string>();
    const [name, setName] = useState<string>();
    const [description, setDescription] = useState<string>();
    const [profiles, setProfiles] = useState<IProfile[]>();

    const [loading, setLoading] = useState<boolean>(false);

    const [ckEthBalance, setCkethBalance] = useState<string>();
    const [depositAddress, setDepositAddress] = useState<string>();
    const [sudtBalance, setSudtBalance] = useState<string>();

    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    useEffect(() => {
        if (contract && polyjuiceAddress) {
            getUserLatestBalance();
        }
    }, [contract, polyjuiceAddress]);

    const getUserLatestBalance = async () => {
        setCkethBalance(undefined);
        setSudtBalance(undefined);
        setL2Balance(undefined);
        const _ckEthBalance = await getContractBalance('ckEth', web3, polyjuiceAddress, account);
        const _sudtBalance = await getContractBalance('sudt', web3, polyjuiceAddress, account);
        setCkethBalance(_ckEthBalance);
        setSudtBalance(_sudtBalance);
        await getCkbBalance();
    };

    const getL2DepositAddress = async () => {
        const addressTranslator = new AddressTranslator();

        const _depositAddress = await addressTranslator.getLayer2DepositAddress(
            web3,
            accounts?.[0]
        );
        setDepositAddress(_depositAddress.addressString);
    };

    async function getCkbBalance() {
        const _l2Balance = BigInt(await web3.eth.getBalance(accounts?.[0]));
        setL2Balance(_l2Balance);
    }

    async function getAllProfiles() {
        setLoading(true);
        const unModifidContractProfiles = await contract.getAllProfiles(account);

        const newProfiles = [];
        for (const profile of unModifidContractProfiles) {
            const newProfile = {
                id: parseInt(profile[0], 10),
                name: profile[1],
                title: profile[2],
                description: profile[3],
                likes: parseInt(profile[4], 10)
            };
            newProfiles.push(newProfile);
        }
        setProfiles(newProfiles);
        setLoading(false);
        toast('Successfully read all the profile.', { type: 'success' });
    }

    async function createNewProfile() {
        try {
            setTransactionInProgress(true);
            await contract.createNewProfile(name, title, description, account);
            toast(`Successfully created ${name} profile`, { type: 'success' });
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function likeProfile(id: number) {
        try {
            setTransactionInProgress(true);
            await contract.likeProfile(id, account);
            toast(`Successfully liked a developer profile. Reaload profiles to see updates`, {
                type: 'success'
            });
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });
            const _contract = new ProfileWrapper(_web3);
            setContract(_contract);

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
            }
        })();
    });

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div className="main">
            <h1>Nervos Developer Profiles</h1>
            <small>🔱 Add your profile to Nervos Blockchain and like other profiles</small>
            <br />
            <br />
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            <br />
            Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
            <br />
            <br />
            Deployed contract address: <b>{contract?.address || '-'}</b> <br />
            <br />
            <br />
            <br />
            <br />
            <div style={{ ...divStyle }}>
                <h3>Manage Your Balances</h3>
                Nervos Layer 2 balance:{' '}
                <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
                <br />
                <br />
                <br />
                ckEth balance:{' '}
                <b>{ckEthBalance ? (ckEthBalance as string) : <LoadingIndicator />} ckETH</b>
                <br />
                <br />
                SUDT balance: <b>{l2Balance ? (sudtBalance as string) : <LoadingIndicator />}</b>
                <br />
                <br />
                <br />
                <button onClick={getUserLatestBalance}>Get Latest Balance</button>
                <small>
                    🔱 Do you want to deposit your Layer2 Address? If yes, click the button below
                </small>
                <br />
                <br />
                <br />
                <div>
                    <button onClick={getL2DepositAddress}>Transfer to L2 Address</button>
                    <br />
                    <br />
                    {depositAddress && (
                        <div>
                            {' '}
                            <p
                                style={{
                                    ...addressStyle
                                }}
                            >
                                {depositAddress}
                            </p>
                            <br />
                            <br />
                            <p>
                                {' '}
                                Get your address and go to <b>Force Bridge</b>
                            </p>
                            <br />
                            <br />
                            <button onClick={() => window.open(values.FORCE_BRIDGE_URL, '_blank')}>
                                FORCE BRIDGE
                            </button>
                        </div>
                    )}
                    <hr />
                </div>
            </div>
            <br />
            <br />
            <br />
            <br />
            <div style={{ ...divStyle }}>
                <h4>Create New Profile</h4>
                <b>Name</b>{' '}
                <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                <br />
                <br />
                <b>Title</b>{' '}
                <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
                <br />
                <br />
                <b>Description</b>{' '}
                <input
                    placeholder="Description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
                <br />
                <br />
                <button onClick={createNewProfile}>Create New Profile</button>
                <br />
                <br />
            </div>
            <br />
            <br />
            <button onClick={getAllProfiles}>Load Profiles</button>
            <br />
            <br />
            {loading && <LoadingIndicator />}
            {profiles?.map(profile => (
                <Profile
                    id={profile.id}
                    key={profile.id}
                    name={profile.name}
                    title={profile.title}
                    description={profile.description}
                    likes={profile.likes}
                    likeProfile={likeProfile}
                />
            ))}
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <ToastContainer />
        </div>
    );
}
