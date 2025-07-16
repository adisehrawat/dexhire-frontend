import { useCluster } from "@/components/cluster/cluster-provider";
import { useConnection } from "@/components/solana/solana-provider";
import { useAuthorization } from '@/components/solana/use-authorization';
import { AnchorProvider } from '@coral-xyz/anchor';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {
    Cluster, PublicKey, SystemProgram, Transaction,
    TransactionMessage,
    VersionedTransaction
} from "@solana/web3.js";
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
    getDexhireProgram,
    getDexhireProgramId
} from '../../dexhire/src/dexhire-exports';
import { useMobileWallet } from '../solana/use-mobile-wallet';


interface CreateFreelancerArgs {
    name: string;
    email: string;
    bio: string;
    linkedin: string;
    country: string;
    skills: string[];
    avatar: string;
    authority: PublicKey;
}
interface UpdateFreelancerArgs {
    name: string;
    email: string;
    bio: string;
    linkedin: string;
    country: string;
    skills: string[];
    avatar: string;
    authority: PublicKey;
}

interface ClientArgs {
    name: string;
    email: string;
    bio: string;
    linkedin: string;
    country: string;
    avatar: string;
    authority: PublicKey;
}


export function useDexhireProgram() {
    const connection = useConnection();
    const { selectedCluster } = useCluster();
    const { selectedAccount } = useAuthorization();
    // const mobileWallet = useMobileWallet();
    const { connect } = useMobileWallet();
    const wallet = useMemo(() => {
        if (!selectedAccount) return null;
        return {
            publicKey: selectedAccount.publicKey,
            async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> { return tx; },
            async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> { return txs; },
            async signTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> { return txs; },
        };
    }, [selectedAccount]);


    useMemo(() => {
        console.log('Solana connection:', connection);
    }, [connection]);

    const cluster = useMemo(() => {
        return selectedCluster;
    }, [selectedCluster]);

    const provider = useMemo(() => {
        if (!wallet || !connection) {
            console.error('Provider not initialized: wallet or connection missing', { wallet, connection });
            return null;
        }
        return new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    }, [connection, wallet]);


    const programId = useMemo(
        () => getDexhireProgramId(cluster.network as Cluster),
        [cluster]
    );

    const program = useMemo(() => {
        if (!provider) return null;
        return getDexhireProgram(provider, programId);
    }, [provider, programId]);

    const getProgram = useMemo(() => {
        return program;
    }, [program]);

    const getProgramId = useMemo(() => {
        return programId;
    }, [programId]);

    const accounts = useMemo(() => {
        if (!wallet) return null;
        return {
            freelanceprofile: PublicKey.findProgramAddressSync(
                [Buffer.from('freelanceprofile'), wallet.publicKey.toBuffer()],
                getProgramId
            )[0],
            clientprofile: PublicKey.findProgramAddressSync(
                [Buffer.from('clientprofile'), wallet.publicKey.toBuffer()],
                getProgramId
            )[0],

        }
    }, [getProgramId, wallet]);

    const createFreelancer = useMutation<string, Error, CreateFreelancerArgs>({
        mutationKey: ['create-freelancer'],
        mutationFn: async ({ name, email }) => {
            if (!wallet || !getProgram || !connection) throw new Error('Wallet, program, or connection not initialized');
            try {
                const [freelancerProfilePDA] = PublicKey.findProgramAddressSync(
                    [Buffer.from('freelancer'), wallet.publicKey.toBuffer()],
                    getProgramId
                );
                const ix = await getProgram.methods
                    .createFreelanceProfile(name, email)
                    .accountsStrict({
                        freelanceprofile: freelancerProfilePDA,
                        owner: wallet.publicKey,
                        systemProgram: SystemProgram.programId,
                    })
                    .instruction();

                // Get latest blockhash
                const latestBlockhash = await connection.getLatestBlockhash('finalized');

                // Build VersionedTransaction
                const messageV0 = new TransactionMessage({
                    payerKey: wallet.publicKey,
                    recentBlockhash: latestBlockhash.blockhash,
                    instructions: [ix],
                }).compileToV0Message();
                const unsignedTx = new VersionedTransaction(messageV0);

                // Always call connect and check for errors
                try {
                    await connect();
                } catch (err) {
                    throw new Error('Wallet authorization failed. Please reconnect your wallet.');
                }

                // Sign using SMS
                const signedTx = await transact(async (walletAdapter) => {
                    const signedTxs = await walletAdapter.signTransactions({
                        transactions: [unsignedTx],
                    });
                    return signedTxs[0];
                });

                // Send the signed transaction
                const txSignature = await connection.sendTransaction(signedTx, {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                });

                // Confirm the transaction
                const confirmationResult = await connection.confirmTransaction(
                    {
                        signature: txSignature,
                        blockhash: latestBlockhash.blockhash,
                        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
                    },
                    'confirmed'
                );
                if (confirmationResult.value.err) {
                    throw new Error(JSON.stringify(confirmationResult.value.err));
                }
                return txSignature;
            } catch (error) {
                console.error('Error creating freelancer profile:', error);
                throw error;
            }
        }
    });
    const createClient = useMutation<string, Error, ClientArgs>({
        mutationKey: ['create-client', 'create', { cluster }],
        mutationFn: async ({ name, email }) => {
            if (!wallet || !getProgram || !connection) throw new Error('Wallet, program, or connection not initialized');
            try {
                const [clientProfilePDA] = PublicKey.findProgramAddressSync(
                    [Buffer.from('clientprofile'), wallet.publicKey.toBuffer()],
                    getProgramId
                );
                const ix = await getProgram.methods
                    .createClientProfile(name, email)
                    .accountsStrict({
                        clientprofile: clientProfilePDA,
                        owner: wallet.publicKey,
                        systemProgram: SystemProgram.programId,
                    })
                    .instruction();

                // Get latest blockhash
                const latestBlockhash = await connection.getLatestBlockhash('finalized');

                // Build VersionedTransaction
                const messageV0 = new TransactionMessage({
                    payerKey: wallet.publicKey,
                    recentBlockhash: latestBlockhash.blockhash,
                    instructions: [ix],
                }).compileToV0Message();
                const unsignedTx = new VersionedTransaction(messageV0);

                await connect(); // Ensure wallet is authorized
                // Sign using SMS
                const signedTx = await transact(async (walletAdapter) => {
                    const signedTxs = await walletAdapter.signTransactions({
                        transactions: [unsignedTx],
                    });
                    return signedTxs[0];
                });

                // Send the signed transaction
                const txSignature = await connection.sendTransaction(signedTx, {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                });

                // Confirm the transaction
                const confirmationResult = await connection.confirmTransaction(
                    {
                        signature: txSignature,
                        blockhash: latestBlockhash.blockhash,
                        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
                    },
                    'confirmed'
                );
                if (confirmationResult.value.err) {
                    throw new Error(JSON.stringify(confirmationResult.value.err));
                }
                return txSignature;
            } catch (error) {
                console.error('Error creating client profile:', error);
                throw error;
            }
        }
    });

    return {
        createFreelancer,
        createClient,
        getProgram,
        program,
        getProgramId,
        accounts,
    }
}

export function useDexhireProgramAccount({ account }: { account: PublicKey }) {
    // const { connection } = useConnection();
    const cluster = useCluster();
    const { selectedAccount } = useAuthorization();

    const wallet = useMemo(() => {
        if (!selectedAccount) return null;
        return {
            publicKey: selectedAccount.publicKey,
            async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> { return tx; },
            async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> { return txs; },
            async signTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> { return txs; },
        };
    }, [selectedAccount]);

    const { getProgram, getProgramId } = useDexhireProgram();

    // const provider = useMemo(() => {
    //     return new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    // }, [connection, wallet]);

    // const accountInfo = useQuery({
    //     queryKey: ['account-info', account.toBase58()],
    //     queryFn: async () => {
    //         const accountInfo = await connection.getAccountInfo(account);
    //         return accountInfo;
    //     },
    //     enabled: !!account,
    // });
    const freelancerQuery = useQuery({
        queryKey: ["freelanceprofile", "fetch", { cluster, account }],
        queryFn: () => {
            if (!getProgram) throw new Error('Program not initialized');
            return getProgram.account.freelancerProfile.fetch(account);
        },
    });
    const clientQuery = useQuery({
        queryKey: ["clientprofile", "fetch", { cluster, account }],
        queryFn: () => {
            if (!getProgram) throw new Error('Program not initialized');
            return getProgram.account.clientProfile.fetch(account);
        },
    });


    const updateFreelancer = useMutation<string, Error, UpdateFreelancerArgs>({
        mutationKey: ['update-freelancer', 'update', { cluster }],
        mutationFn: async ({ name, email, bio, linkedin, country, skills, avatar }) => {
            if (!wallet || !getProgram) throw new Error('Wallet or program not initialized');
            try {
                const [freelancerProfilePDA] = PublicKey.findProgramAddressSync(
                    [Buffer.from('freelanceprofile'), wallet.publicKey.toBuffer()],
                    getProgramId
                );
                const tx = await getProgram.methods
                    .updateFreelanceProfile(name, email, bio, skills.map(skill => ({ name: skill })), country, linkedin)
                    .accountsStrict({
                        freelanceprofile: freelancerProfilePDA,
                        owner: wallet.publicKey,
                        systemProgram: SystemProgram.programId,
                    })
                    .rpc();
                return tx;
            } catch (error) {
                console.error('Error updating freelancer profile:', error);
                throw error;
            }
        }
    });

    const updateClient = useMutation<string, Error, ClientArgs>({
        mutationKey: ['update-client', 'update', { cluster }],
        mutationFn: async ({ name, email, bio, linkedin, country }) => {
            if (!wallet || !getProgram) throw new Error('Wallet or program not initialized');
            try {
                const [clientProfilePDA] = PublicKey.findProgramAddressSync(
                    [Buffer.from('clientprofile'), wallet.publicKey.toBuffer()],
                    getProgramId
                );
                const tx = await getProgram.methods
                    .updateClientProfile(name, email, bio, country, linkedin)
                    .accountsStrict({
                        clientprofile: clientProfilePDA,
                        owner: wallet.publicKey,
                        systemProgram: SystemProgram.programId,
                    })
                    .rpc();
                return tx;
            } catch (error) {
                console.error('Error updating client profile:', error);
                throw error;
            }
        }
    })

    const deleteFreelancer = useMutation<string, Error, { account: PublicKey }>({
        mutationKey: ['delete-freelancer', 'delete', { cluster }],
        mutationFn: async ({ account }) => {
            if (!wallet || !getProgram) throw new Error('Wallet or program not initialized');
            try {
                const tx = await getProgram.methods
                    .deleteFreelanceProfile()
                    .accountsStrict({
                        freelanceprofile: account,
                        owner: wallet.publicKey,
                        systemProgram: SystemProgram.programId,
                    })
                    .rpc();
                return tx;
            } catch (error) {
                console.error('Error deleting freelancer profile:', error);
                throw error;
            }
        }
    });

    const deleteClient = useMutation<string, Error, { account: PublicKey }>({
        mutationKey: ['delete-client', 'delete', { cluster }],
        mutationFn: async ({ account }) => {
            if (!wallet || !getProgram) throw new Error('Wallet or program not initialized');
            try {
                const tx = await getProgram.methods
                    .deleteClientProfile()
                    .accountsStrict({
                        clientprofile: account,
                        owner: wallet.publicKey,
                        systemProgram: SystemProgram.programId,
                    })
                    .rpc();
                return tx;
            } catch (error) {
                console.error('Error deleting client profile:', error);
                throw error;
            }
        }
    });

    return {
        freelancerQuery,
        clientQuery,
        updateFreelancer,
        updateClient,
        deleteFreelancer,
        deleteClient,
    }



}