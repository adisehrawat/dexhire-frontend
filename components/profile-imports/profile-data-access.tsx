
import {
    PublicKey,
    SystemProgram,
    TransactionMessage,
    VersionedTransaction
} from "@solana/web3.js";

import { AnchorProvider } from "@coral-xyz/anchor";
import { useMemo } from "react";

import { useMobileWallet } from '@/components/solana/use-mobile-wallet';
import { useMutation, useQuery } from "@tanstack/react-query";
import { DEXHIRE_PROGRAM_ID, getDexhireProgram } from '../../dexhire/src/dexhire-exports';
import { useConnection } from "../solana/solana-provider";
import { useAuthorization } from "../solana/use-authorization";


interface CreateFreelancerArgs { name: string; email: string; }
interface CreateClientArgs { name: string; email: string; }

export function useDexhireAccounts() {
    const { selectedAccount } = useAuthorization();
    const dexhireProgramId = useMemo(() => {
        return new PublicKey(DEXHIRE_PROGRAM_ID);
    }, []);

    const accounts = useMemo(() => {
        if (!selectedAccount) return null;

        const userPublicKey = selectedAccount.publicKey;

        const [freelancerProfilePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('freelancer'), userPublicKey.toBuffer()],
            dexhireProgramId
        );

        const [clientProfilePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('client'), userPublicKey.toBuffer()],
            dexhireProgramId
        );

        return {
            freelancerProfilePDA,
            clientProfilePDA,
        };
    }, [selectedAccount, dexhireProgramId]);

    return accounts;
}

const createMobileAnchorWallet = (selectedAccount: any): any => {
    return {
        publicKey: selectedAccount.publicKey,
        signTransaction: async () => {
            throw new Error("signTransaction is not implemented by mobile wallet");
        },
        signAllTransactions: async () => {
            throw new Error("signAllTransactions is not implemented by mobile wallet");
        },
    };
};

export function useDexhireProgram() {
    const connection = useConnection();
    // const connection  = new Connection(`https://solana-devnet.g.alchemy.com/v2/9S-NPXqlxQYT3q3e4pG2F`,{
    //     commitment: "confirmed",
    // });

    const selectedAccount = useAuthorization();

    const { connect, signAndSendTransaction } = useMobileWallet();

    const dexhireProgramId = useMemo(() => {
        return new PublicKey(DEXHIRE_PROGRAM_ID);
    }, []);

    const provider = useMemo(() => {
        if (!selectedAccount) return null;
        const wallet = createMobileAnchorWallet(selectedAccount);
        return new AnchorProvider(connection, wallet, {
            preflightCommitment: "confirmed",
            commitment: "processed",
        });
    }, [selectedAccount, connection]);


    const dexhireProgram = useMemo(() => {
        if (!provider) return null;
        return getDexhireProgram(provider, dexhireProgramId);
    }, [provider, dexhireProgramId]);


    // createFreelancer mutation
    const createFreelancer = useMutation<string, Error, CreateFreelancerArgs>({
        mutationKey: ['create-freelancer'],
        mutationFn: async ({ name, email }) => {
            if (!dexhireProgram || !connection) throw new Error('Wallet, program, or connection not initialized');
            try {
                const account = await connect(); // from useMobileWallet
                const publicKey = account.publicKey;
                console.log(`Public Key: ${publicKey}`);

                const [freelancerProfilePDA] = PublicKey.findProgramAddressSync(
                    [Buffer.from('freelancer'), publicKey.toBuffer()],
                    dexhireProgramId
                );
                console.log(`freelancer key: ${freelancerProfilePDA.toBase58()}`);
                const ix = await dexhireProgram.methods
                    .createFreelanceProfile(name, email)
                    .accountsStrict({
                        freelanceprofile: freelancerProfilePDA,
                        owner: publicKey,
                        systemProgram: SystemProgram.programId,
                    }).instruction();

                console.log(`Instruction done: ${ix}`);

                const { context, value } = await connection.getLatestBlockhashAndContext();
                const { blockhash, lastValidBlockHeight } = value;
                const messageV0 = new TransactionMessage({
                    payerKey: publicKey,
                    recentBlockhash: blockhash,
                    instructions: [ix],
                }).compileToV0Message();
                console.log(`messagevo done: ${messageV0}`);

                const versionedTx = new VersionedTransaction(messageV0);
                console.log(`versionedtx done: ${versionedTx}`);

                // Send and sign transaction using mobile wallet
                const signature = await signAndSendTransaction(versionedTx, context.slot);
                console.log(`signature done: ${signature}`);
                await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });

                return signature;

            } catch (error) {
                console.error('Error creating freelancer profile:', error);
                throw error;
            }
        }
    });

    // createClient mutation
    const createClient = useMutation<string, Error, CreateClientArgs>({
        mutationKey: ['create-client'], // Fix mutation key
        mutationFn: async ({ name, email }) => {
            if (!dexhireProgram || !connection) throw new Error('Wallet, program, or connection not initialized');
            try {
                const account = await connect(); // from useMobileWallet
                const publicKey = account.publicKey;

                const [clientProfilePDA] = PublicKey.findProgramAddressSync(
                    [Buffer.from('client'), publicKey.toBuffer()],
                    dexhireProgramId
                );
                const ix = await dexhireProgram.methods
                    .createClientProfile(name, email) // Fix method name
                    .accountsStrict({
                        clientprofile: clientProfilePDA, // Fix account name
                        owner: publicKey,
                        systemProgram: SystemProgram.programId,
                    }).instruction();

                const { context, value } = await connection.getLatestBlockhashAndContext();
                const { blockhash, lastValidBlockHeight } = value;
                const messageV0 = new TransactionMessage({
                    payerKey: publicKey,
                    recentBlockhash: blockhash,
                    instructions: [ix],
                }).compileToV0Message();

                const versionedTx = new VersionedTransaction(messageV0);

                // Send and sign transaction using mobile wallet
                const signature = await signAndSendTransaction(versionedTx, context.slot);
                await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });

                return signature;

            } catch (error) {
                console.error('Error creating client profile:', error);
                throw error;
            }
        }
    });

    return {
        createFreelancer,
        createClient,
        provider,
        dexhireProgram,
        dexhireProgramId,
    };
}
export function useFetchProfile() {
    const connection = useConnection();
    const { selectedAccount } = useAuthorization();
    const dexhireProgramId = useMemo(() => new PublicKey(DEXHIRE_PROGRAM_ID), []);
    const dexhireProgram = useDexhireProgram().dexhireProgram;

    return useQuery({
        queryKey: ['fetch-profile', selectedAccount?.publicKey?.toBase58()],
        queryFn: async () => {
            if (!selectedAccount || !dexhireProgram) return null;
            const publicKey = selectedAccount.publicKey;
            // Check freelancer profile
            const [freelancerProfilePDA] = PublicKey.findProgramAddressSync(
                [Buffer.from('freelancer'), publicKey.toBuffer()],
                dexhireProgramId
            );
            try {
                const freelancerProfile = await dexhireProgram.account.freelancerProfile.fetch(freelancerProfilePDA);
                return { ...freelancerProfile, userType: 'freelancer' };
            } catch (e) {
                // Not found, try client
            }
            // Check client profile
            const [clientProfilePDA] = PublicKey.findProgramAddressSync(
                [Buffer.from('client'), publicKey.toBuffer()],
                dexhireProgramId
            );
            try {
                const clientProfile = await dexhireProgram.account.clientProfile.fetch(clientProfilePDA);
                return { ...clientProfile, userType: 'client' };
            } catch (e) {
                // Not found
            }
            return null;
        },
        enabled: !!selectedAccount && !!dexhireProgram,
    });
}
