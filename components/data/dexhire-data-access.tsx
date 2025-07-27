import { DEXHIRE_PROGRAM_ID, getDexhireProgram } from '@/components/data/dexhire-exports';
import { useMobileWallet } from '@/components/solana/use-mobile-wallet';
import { useWalletUi } from '@/components/solana/use-wallet-ui';
import { Project as ChainProject } from '@/types';
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import {
    Connection,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionMessage,
    VersionedTransaction
} from "@solana/web3.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useConnection } from "../solana/solana-provider";
import { useAuthorization } from "../solana/use-authorization";

export const PROGRAM_ID = DEXHIRE_PROGRAM_ID;


export function useGetProgram() {
    const connection = useConnection();
    const { selectedAccount } = useAuthorization();
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
        return getDexhireProgram(provider);
    }, [provider]);
    return dexhireProgram;
}
/* ------------------------------------------------------------------ */
/* 1.  PDA Helpers                                                    */
/* ------------------------------------------------------------------ */
export const PDA = {
    clientProfile: (owner: PublicKey) =>
        PublicKey.findProgramAddressSync([Buffer.from('client'), owner.toBuffer()], PROGRAM_ID)[0],

    freelancerProfile: (owner: PublicKey) =>
        PublicKey.findProgramAddressSync([Buffer.from('freelancer'), owner.toBuffer()], PROGRAM_ID)[0],

    project: (name: string, client: PublicKey, owner: PublicKey) =>
        PublicKey.findProgramAddressSync(
            [Buffer.from('project'), Buffer.from(name), client.toBuffer(), owner.toBuffer()],
            PROGRAM_ID,
        )[0],

    vault: (project: PublicKey) =>
        PublicKey.findProgramAddressSync([Buffer.from('vault'), project.toBuffer()], PROGRAM_ID)[0],

    proposal: (msg: string, project: PublicKey, client: PublicKey) =>
        PublicKey.findProgramAddressSync(
            [Buffer.from('proposal'), Buffer.from(msg), project.toBuffer(), client.toBuffer()],
            PROGRAM_ID,
        )[0],
};

/* ------------------------------------------------------------------ */
/* 2.  Legacy-Transaction Builder                                     */
/* ------------------------------------------------------------------ */
async function buildLegacyTx(
    connection: Connection,
    instructions: any[],
    feePayer: PublicKey,
    signers: any[] = [],
): Promise<Transaction> {
    const tx = new Transaction().add(...instructions);
    tx.feePayer = feePayer;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    if (signers.length) tx.partialSign(...signers);
    return tx;
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

/* ------------------------------------------------------------------ */
/* 3.  Instruction Wrappers                                           */
/* ------------------------------------------------------------------ */

export function useCreateClientProfile() {
    const connection = useConnection();
    const { signAndSendTransaction } = useMobileWallet();
    const { account: walletUiAccount } = useWalletUi();
    const { connect } = useMobileWallet();
    const { selectedAccount } = useAuthorization();
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
        return getDexhireProgram(provider);
    }, [provider]);

    return useMutation<string, Error, { name: string; email: string }>({
        mutationKey: ['create-client-profile'],
        mutationFn: async ({ name, email }) => {
            let publicKey;
            if (walletUiAccount && walletUiAccount.publicKey) {
                publicKey = walletUiAccount.publicKey;
            } else {
                const mobileAccount = await connect();
                publicKey = mobileAccount.publicKey;
            }
            const ix = await dexhireProgram?.methods
                .createClientProfile(name, email)
                .accounts({ owner: publicKey })
                .instruction();
            const {
                context: { slot: minContextSlot },
            } = await connection.getLatestBlockhashAndContext('confirmed');
            const tx = await buildLegacyTx(connection, [ix], publicKey);
            const txid = await signAndSendTransaction(tx, minContextSlot);
            return txid;
        },
        onSuccess: () => {
            console.log("Client profile created successfully");
        }
    });
}

export function useUpdateClientProfile() {
    const connection = useConnection();
    const { signAndSendTransaction } = useMobileWallet();
    const { account: walletUiAccount } = useWalletUi();
    const { connect } = useMobileWallet();
    const { selectedAccount } = useAuthorization();
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
        return getDexhireProgram(provider);
    }, [provider]);

    return useMutation<string, Error, { name: string; email: string; bio: string; country: string; linkedin: string; authority: PublicKey }>({
        mutationKey: ['update-client-profile'],
        mutationFn: async ({ name, email, bio, country, linkedin, authority }) => {
            let publicKey;
            if (walletUiAccount && walletUiAccount.publicKey) {
                publicKey = walletUiAccount.publicKey;
            } else {
                const mobileAccount = await connect();
                publicKey = mobileAccount.publicKey;
            }
            if (!publicKey) throw new Error("Wallet not initialized");
            const clientPDA = PDA.clientProfile(publicKey);
            const ix = await dexhireProgram?.methods
                .updateClientProfile(name, email, bio, country, linkedin, authority)
                .accounts({ clientProfile: clientPDA, owner: publicKey })
                .instruction();
            const {
                context: { slot: minContextSlot },
            } = await connection.getLatestBlockhashAndContext('confirmed');
            const tx = await buildLegacyTx(connection, [ix], publicKey);
            const txid = await signAndSendTransaction(tx, minContextSlot);
            return txid;
        },
        onSuccess: () => {
            console.log("Client profile updated successfully");
        }
    });
}

export function useDeleteClientProfile() {
    const connection = useConnection();
    const { signAndSendTransaction } = useMobileWallet();
    const { account: walletUiAccount } = useWalletUi();
    const { connect } = useMobileWallet();
    const { selectedAccount } = useAuthorization();
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
        return getDexhireProgram(provider);
    }, [provider]);

    return useMutation<string, Error, Record<string, never>>({
        mutationKey: ['delete-client-profile'],
        mutationFn: async () => {
            try {
                let publicKey;
                if (walletUiAccount && walletUiAccount.publicKey) {
                    publicKey = walletUiAccount.publicKey;
                } else {
                    const mobileAccount = await connect();
                    publicKey = mobileAccount.publicKey;
                }
                if (!publicKey) throw new Error("Wallet not initialized");
                const clientPDA = PDA.clientProfile(publicKey);
                const ix = await dexhireProgram?.methods
                    .deleteClientProfile()
                    .accounts({ clientProfile: clientPDA, owner: publicKey })
                    .instruction();
                const {
                    context: { slot: minContextSlot },
                } = await connection.getLatestBlockhashAndContext('confirmed');
                const tx = await buildLegacyTx(connection, [ix], publicKey);
                const txid = await signAndSendTransaction(tx, minContextSlot);
                return txid;
            } catch (err: any) {
                console.error('[DELETE RAW ERROR]', err);   // <-- this line
                throw err;
            }
        },
        onSuccess: () => {
            console.log("Client profile deleted successfully");
        }
    });
}

export function useCreateFreelancerProfile() {
    const connection = useConnection();
    const { signAndSendTransaction } = useMobileWallet();
    const { account: walletUiAccount } = useWalletUi();
    const { connect } = useMobileWallet();
    const { selectedAccount } = useAuthorization();
    const provider = useMemo(() => {
        if (!selectedAccount) return null;
        const wallet = createMobileAnchorWallet(selectedAccount);
        return new AnchorProvider(connection, wallet, {
            preflightCommitment: 'confirmed',
            commitment: 'processed',
        });
    }, [selectedAccount, connection]);
    const dexhireProgram = useMemo(() => {
        if (!provider) return null;
        return getDexhireProgram(provider);
    }, [provider]);

    return useMutation<string, Error, { name: string; email: string }>({
        mutationKey: ['create-freelancer-profile'],
        mutationFn: async ({ name, email }) => {
            try {
                console.log('[createFreelancerProfile] starting…');

                // 1. resolve publicKey
                let publicKey: PublicKey;
                if (walletUiAccount && walletUiAccount.publicKey) {
                    publicKey = walletUiAccount.publicKey;
                    console.log('[createFreelancerProfile] using wallet-ui key:', publicKey.toString());
                } else {
                    const mobileAccount = await connect();
                    if (!mobileAccount?.publicKey) throw new Error('Wallet not connected');
                    publicKey = mobileAccount.publicKey;
                    console.log('[createFreelancerProfile] using mobile-wallet key:', publicKey.toString());
                }

                // 2. build PDA
                const freelancerPDA = PDA.freelancerProfile(publicKey);
                console.log('[createFreelancerProfile] freelancerPDA:', freelancerPDA.toString());

                // 3. build instruction
                if (!dexhireProgram) throw new Error('Program not ready');
                const ix = await dexhireProgram.methods
                    .createFreelancerProfile(name, email)
                    .accounts({ owner: publicKey })
                    .instruction();
                console.log('[createFreelancerProfile] instruction built');

                // 4. versioned transaction
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
                const messageV0 = new TransactionMessage({
                    payerKey: publicKey,
                    recentBlockhash: blockhash,
                    instructions: [ix],
                }).compileToV0Message();
                const tx = new VersionedTransaction(messageV0);
                console.log('[deleteFreelancerProfile] versioned tx built');

                // 5. sign & send
                const txid = await signAndSendTransaction(tx, lastValidBlockHeight);
                console.log('[deleteFreelancerProfile] tx sent:', txid);
                return txid;
            } catch (err: any) {
                console.error('[createFreelancerProfile] ERROR:', err);
                throw err; // bubble up to react-query
            }
        },
        onSuccess: (txid) => {
            console.log('[createFreelancerProfile] SUCCESS:', txid);
        },
    });
}

export function useUpdateFreelancerProfile() {
    const connection = useConnection();
    const { signAndSendTransaction } = useMobileWallet();
    const { account: walletUiAccount } = useWalletUi();
    const { connect } = useMobileWallet();
    const { selectedAccount } = useAuthorization();
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
        return getDexhireProgram(provider);
    }, [provider]);

    return useMutation<string, Error, { name: string; email: string; bio: string; country: string; linkedin: string; authority: PublicKey }>({
        mutationKey: ['update-freelancer-profile'],
        mutationFn: async ({ name, email, bio, country, linkedin, authority }) => {
            let publicKey;
            if (walletUiAccount && walletUiAccount.publicKey) {
                publicKey = walletUiAccount.publicKey;
            } else {
                const mobileAccount = await connect();
                publicKey = mobileAccount.publicKey;
            }
            if (!publicKey) throw new Error("Wallet not initialized");
            const freelancerPDA = PDA.freelancerProfile(publicKey);
            const ix = await dexhireProgram?.methods
                .updateFreelancerProfile(name, email, bio, country, linkedin, authority)
                .accounts({ freelancerProfile: freelancerPDA, owner: publicKey })
                .instruction();
            const {
                context: { slot: minContextSlot },
            } = await connection.getLatestBlockhashAndContext('confirmed');
            const tx = await buildLegacyTx(connection, [ix], publicKey);
            const txid = await signAndSendTransaction(tx, minContextSlot);
            return txid;
        },
        onSuccess: () => {
            console.log("Freelancer profile updated successfully");
        }
    });
}

export function useDeleteFreelancerProfile() {
    const connection = useConnection();
    const { signAndSendTransaction } = useMobileWallet();
    const { account: walletUiAccount } = useWalletUi();
    const { connect } = useMobileWallet();
    const { selectedAccount } = useAuthorization();

    const provider = useMemo(() => {
        if (!selectedAccount) return null;
        const wallet = createMobileAnchorWallet(selectedAccount);
        return new AnchorProvider(connection, wallet, {
            preflightCommitment: 'confirmed',
            commitment: 'processed',
        });
    }, [selectedAccount, connection]);

    const dexhireProgram = useMemo(() => {
        if (!provider) return null;
        return getDexhireProgram(provider);
    }, [provider]);

    return useMutation<string, Error, Record<string, never>>({
        mutationKey: ['delete-freelancer-profile'],
        mutationFn: async () => {
            try {
                console.log('[deleteFreelancerProfile] starting…');

                // 1. resolve publicKey
                let publicKey: PublicKey;
                if (walletUiAccount && walletUiAccount.publicKey) {
                    publicKey = walletUiAccount.publicKey;
                } else {
                    const mobileAccount = await connect();
                    if (!mobileAccount?.publicKey) throw new Error('Wallet not connected');
                    publicKey = mobileAccount.publicKey;
                }
                console.log('[deleteFreelancerProfile] owner:', publicKey.toString());

                // 2. PDA
                const freelancerPDA = PDA.freelancerProfile(publicKey);
                console.log('[deleteFreelancerProfile] PDA:', freelancerPDA.toString());

                // 3. instruction
                if (!dexhireProgram) throw new Error('Program not ready');
                const ix = await dexhireProgram.methods
                    .deleteFreelancerProfile()
                    .accounts({ freelancerProfile: freelancerPDA, owner: publicKey })
                    .instruction();
                console.log('[deleteFreelancerProfile] instruction built');

                // 4. versioned transaction
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
                const messageV0 = new TransactionMessage({
                    payerKey: publicKey,
                    recentBlockhash: blockhash,
                    instructions: [ix],
                }).compileToV0Message();
                const tx = new VersionedTransaction(messageV0);
                console.log('[deleteFreelancerProfile] versioned tx built');

                // 5. sign & send
                const txid = await signAndSendTransaction(tx, lastValidBlockHeight);
                console.log('[deleteFreelancerProfile] tx sent:', txid);
                return txid;
            } catch (err: any) {
                console.error('[deleteFreelancerProfile] ERROR:', err);
                throw err;
            }
        },
        onSuccess: (txid) => {
            console.log('[deleteFreelancerProfile] SUCCESS:', txid);
        },
    });
}

export function useCreateProject() {
    const connection = useConnection();
    const { signAndSendTransaction } = useMobileWallet();
    const { account: walletUiAccount } = useWalletUi();
    const { connect } = useMobileWallet();
    const { selectedAccount } = useAuthorization();
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
        return getDexhireProgram(provider);
    }, [provider]);

    return useMutation<string, Error, { name: string; about: string; price: BN; deadline: BN }>({
        mutationKey: ['create-project'],
        mutationFn: async ({ name, about, price, deadline }) => {
            try {
                console.log('[createProject] starting…');

                let publicKey: PublicKey;
                if (walletUiAccount && walletUiAccount.publicKey) {
                    publicKey = walletUiAccount.publicKey;
                } else {
                    const mobileAccount = await connect();
                    if (!mobileAccount?.publicKey) throw new Error('Wallet not connected');
                    publicKey = mobileAccount.publicKey;
                }
                console.log('[createProject] owner:', publicKey.toString());

                const clientPDA = PDA.clientProfile(publicKey);
                const projectPDA = PDA.project(name, clientPDA, publicKey);
                const vaultPDA = PDA.vault(projectPDA);
                console.log('[createProject] projectPDA:', projectPDA.toString());
                console.log('[createProject] vaultPDA:', vaultPDA.toString());

                if (!dexhireProgram) throw new Error('Program not ready');
                const ix = await dexhireProgram?.methods
                    .createProject(name, about, price, deadline)
                    .accountsStrict({
                        project: projectPDA,
                        owner: publicKey,
                        client: clientPDA,
                        vault: vaultPDA,
                        systemProgram: SystemProgram.programId,
                    })
                    .instruction();
                console.log('[createProject] instruction built');

                // 4. versioned transaction
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
                const messageV0 = new TransactionMessage({
                    payerKey: publicKey,
                    recentBlockhash: blockhash,
                    instructions: [ix],
                }).compileToV0Message();
                const tx = new VersionedTransaction(messageV0);
                console.log('[createProject] versioned tx built');

                // 5. sign & send
                const txid = await signAndSendTransaction(tx, lastValidBlockHeight);
                console.log('[createProject] tx sent:', txid);
                return txid;
            } catch (err: any) {
                console.error('[createProject] ERROR:', err);
                throw err;
            }
        },
        onSuccess: (txid) => {
            console.log('[createProject] SUCCESS:', txid);
        },
    });
}


// export function useFundProject() {
//     const connection = useConnection();
//     const { signAndSendTransaction } = useMobileWallet();
//     const { account: walletUiAccount } = useWalletUi();
//     const { connect } = useMobileWallet();
//     const { selectedAccount } = useAuthorization();
//     const provider = useMemo(() => {
//         if (!selectedAccount) return null;
//         const wallet = createMobileAnchorWallet(selectedAccount);
//         return new AnchorProvider(connection, wallet, {
//             preflightCommitment: "confirmed",
//             commitment: "processed",
//         });
//     }, [selectedAccount, connection]);
//     const dexhireProgram = useMemo(() => {
//         if (!provider) return null;
//         return getDexhireProgram(provider);
//     }, [provider]);

//     return useMutation<string, Error, { lamports: BN; projectPDA: PublicKey; vaultPDA: PublicKey }>({
//         mutationKey: ['fund-project'],
//         mutationFn: async ({ lamports, projectPDA, vaultPDA }) => {
//             let publicKey;
//             if (walletUiAccount && walletUiAccount.publicKey) {
//                 publicKey = walletUiAccount.publicKey;
//             } else {
//                 const mobileAccount = await connect();
//                 publicKey = mobileAccount.publicKey;
//             }
//             if (!publicKey) throw new Error("Wallet not initialized");
//             const ix = await dexhireProgram?.methods
//                 .fundProject(lamports)
//                 .accountsStrict({ client: publicKey, project: projectPDA, vault: vaultPDA, systemProgram: SystemProgram.programId, })
//                 .instruction();
//             const {
//                 context: { slot: minContextSlot },
//             } = await connection.getLatestBlockhashAndContext('confirmed');
//             const tx = await buildLegacyTx(connection, [ix], publicKey);
//             const txid = await signAndSendTransaction(tx, minContextSlot);
//             return txid;
//         },
//         onSuccess: () => {
//             console.log("Project funded successfully");
//         }
//     });
// }


export function useSubmitProposal() {
    const connection = useConnection();
    const { signAndSendTransaction } = useMobileWallet();
    const { account: walletUiAccount } = useWalletUi();
    const { connect } = useMobileWallet();
    const { selectedAccount } = useAuthorization();

    const provider = useMemo(() => {
        if (!selectedAccount) return null;
        const wallet = createMobileAnchorWallet(selectedAccount);
        return new AnchorProvider(connection, wallet, {
            preflightCommitment: 'confirmed',
            commitment: 'processed',
        });
    }, [selectedAccount, connection]);

    const dexhireProgram = useMemo(() => {
        if (!provider) return null;
        return getDexhireProgram(provider);
    }, [provider]);

    return useMutation<string, Error, { projectName: string; message: string; project: PublicKey }>({
        mutationKey: ['submit-proposal'],
        mutationFn: async ({ projectName, message, project }) => {
            try {
                console.log('[submitProposal] starting…');

                // 1. resolve publicKey
                let publicKey: PublicKey;
                if (walletUiAccount && walletUiAccount.publicKey) {
                    publicKey = walletUiAccount.publicKey;
                } else {
                    const mobileAccount = await connect();
                    if (!mobileAccount?.publicKey) throw new Error('Wallet not connected');
                    publicKey = mobileAccount.publicKey;
                }
                console.log('[submitProposal] freelancer:', publicKey.toString());

                // 2. PDAs
                const freelancerPDA = PDA.freelancerProfile(publicKey);
                // The proposal PDA requires the client PDA for its seeds.
                // We need to fetch the project account to get the creator's public key.
                if (!dexhireProgram) throw new Error('Program not ready');
                const projectAccount = await dexhireProgram.account.project.fetch(project);
                const clientPDA = PDA.clientProfile(projectAccount.creator);

                const proposalPDA = PDA.proposal(message, project, clientPDA);
                console.log('[submitProposal] proposalPDA:', proposalPDA.toString());

                // 3. instruction
                const ix = await dexhireProgram.methods
                    .submitProposal(projectName, message)
                    .accountsStrict({
                        proposal: proposalPDA,
                        freelancerSigner: publicKey,
                        freelancer: freelancerPDA,
                        project: project,
                        client: clientPDA,
                        systemProgram: SystemProgram.programId,
                    })
                    .instruction();
                console.log('[submitProposal] instruction built');

                // 4. versioned transaction
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
                const messageV0 = new TransactionMessage({
                    payerKey: publicKey,
                    recentBlockhash: blockhash,
                    instructions: [ix],
                }).compileToV0Message();
                const tx = new VersionedTransaction(messageV0);
                console.log('[submitProposal] versioned tx built');

                // 5. sign & send
                const txid = await signAndSendTransaction(tx, lastValidBlockHeight);
                console.log('[submitProposal] tx sent:', txid);
                return txid;
            } catch (err: any) {
                console.error('[submitProposal] ERROR:', err);
                throw err;
            }
        },
        onSuccess: (txid) => {
            console.log('[submitProposal] SUCCESS:', txid);
        },
    });
}
export function useRespondToProposal() {
    const connection = useConnection();
    const { signAndSendTransaction } = useMobileWallet();
    const { account: walletUiAccount } = useWalletUi();
    const { connect } = useMobileWallet();
    const { selectedAccount } = useAuthorization();
    const queryClient = useQueryClient();
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
        return getDexhireProgram(provider);
    }, [provider]);

    return useMutation<string, Error, { proposalPDA: PublicKey; projectPDA: PublicKey; freelancerPDA: PublicKey; accept: boolean; message: string }>({
        mutationKey: ['respond-to-proposal'],
        mutationFn: async ({ proposalPDA, projectPDA, freelancerPDA, accept, message }) => {
            let publicKey;
            if (walletUiAccount && walletUiAccount.publicKey) {
                publicKey = walletUiAccount.publicKey;
            } else {
                const mobileAccount = await connect();
                publicKey = mobileAccount.publicKey;
            }
            if (!publicKey) throw new Error("Wallet not initialized");

            const clientPDA = PDA.clientProfile(publicKey);

            const ix = await dexhireProgram?.methods
                .respondToProposal(accept, message)
                .accountsStrict({
                    proposal: proposalPDA,
                    clientSigner: publicKey,
                    project: projectPDA,
                    freelancer: freelancerPDA,
                    clientProfile: clientPDA,
                })
                .instruction();

            const {
                context: { slot: minContextSlot },
            } = await connection.getLatestBlockhashAndContext('confirmed');
            const tx = await buildLegacyTx(connection, [ix], publicKey);
            const txid = await signAndSendTransaction(tx, minContextSlot);
            return txid;
        },
        onSuccess: async () => {
            console.log("Proposal response sent successfully");

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['proposals'] }),
                queryClient.invalidateQueries({ queryKey: ['projects'] }),
                queryClient.invalidateQueries({ queryKey: ['user-projects'] }),
                queryClient.invalidateQueries({ queryKey: ['conversations'] }),
            ]);
        }
    });
}
export function useSubmitWork() {
    const connection = useConnection();
    const { signAndSendTransaction } = useMobileWallet();
    const { account: walletUiAccount } = useWalletUi();
    const { connect } = useMobileWallet();
    const { selectedAccount } = useAuthorization();
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
        return getDexhireProgram(provider);
    }, [provider]);

    return useMutation<string, Error, { projectPDA: PublicKey; githubLink: string }>({
        mutationKey: ['submit-work'],
        mutationFn: async ({ projectPDA, githubLink }) => {
            let publicKey;
            if (walletUiAccount && walletUiAccount.publicKey) {
                publicKey = walletUiAccount.publicKey;
            } else {
                const mobileAccount = await connect();
                publicKey = mobileAccount.publicKey;
            }
            if (!publicKey) throw new Error("Wallet not initialized");

            const ix = await dexhireProgram?.methods
                .submitWork(githubLink)
                .accountsStrict({
                    project: projectPDA,
                    freelancer: publicKey,
                })
                .instruction();

            const {
                context: { slot: minContextSlot },
            } = await connection.getLatestBlockhashAndContext('confirmed');
            const tx = await buildLegacyTx(connection, [ix], publicKey);
            const txid = await signAndSendTransaction(tx, minContextSlot);
            return txid;
        },
        onSuccess: () => {
            console.log("Work submitted successfully");
        }
    });
}

export function useApproveWorkAndPay() {
    const connection = useConnection();
    const { signAndSendTransaction } = useMobileWallet();
    const { account: walletUiAccount } = useWalletUi();
    const { connect } = useMobileWallet();
    const { selectedAccount } = useAuthorization();
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
        return getDexhireProgram(provider);
    }, [provider]);

    return useMutation<string, Error, { projectPDA: PublicKey; proposalPDA: PublicKey; freelancerPDA: PublicKey; vaultPDA: PublicKey }>({
        mutationKey: ['approve-work-and-pay'],
        mutationFn: async ({ projectPDA, proposalPDA, freelancerPDA, vaultPDA }) => {
            let publicKey;
            if (walletUiAccount && walletUiAccount.publicKey) {
                publicKey = walletUiAccount.publicKey;
            } else {
                const mobileAccount = await connect();
                publicKey = mobileAccount.publicKey;
            }
            if (!publicKey) throw new Error("Wallet not initialized");

            const ix = await dexhireProgram?.methods
                .approveWorkAndPay()
                .accountsStrict({
                    project: projectPDA,
                    proposal: proposalPDA,
                    freelancer: freelancerPDA,
                    client: publicKey,
                    vault: vaultPDA,
                    systemProgram: SystemProgram.programId,
                })
                .instruction();

            const {
                context: { slot: minContextSlot },
            } = await connection.getLatestBlockhashAndContext('confirmed');
            const tx = await buildLegacyTx(connection, [ix], publicKey);
            const txid = await signAndSendTransaction(tx, minContextSlot);
            return txid;
        },
        onSuccess: () => {
            console.log("Work approved and payment sent successfully");
        }
    });
}

export function useCompleteProject() {
    const connection = useConnection();
    const { signAndSendTransaction } = useMobileWallet();
    const { account: walletUiAccount } = useWalletUi();
    const { connect } = useMobileWallet();
    const { selectedAccount } = useAuthorization();
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
        return getDexhireProgram(provider);
    }, [provider]);

    return useMutation<string, Error, { projectPDA: PublicKey; projectName: string; creator: PublicKey }>({
        mutationKey: ['complete-project'],
        mutationFn: async ({ projectPDA, projectName, creator }) => {
            let publicKey;
            if (walletUiAccount && walletUiAccount.publicKey) {
                publicKey = walletUiAccount.publicKey;
            } else {
                const mobileAccount = await connect();
                publicKey = mobileAccount.publicKey;
            }
            if (!publicKey) throw new Error("Wallet not initialized");

            const clientPDA = PDA.clientProfile(publicKey);

            const ix = await dexhireProgram?.methods
                .completeProject(creator, projectName)
                .accountsStrict({
                    project: projectPDA,
                    owner: publicKey,
                    client: clientPDA,
                    systemProgram: SystemProgram.programId,
                })
                .instruction();

            const {
                context: { slot: minContextSlot },
            } = await connection.getLatestBlockhashAndContext('confirmed');
            const tx = await buildLegacyTx(connection, [ix], publicKey);
            const txid = await signAndSendTransaction(tx, minContextSlot);
            return txid;
        },
        onSuccess: () => {
            console.log("Project completed successfully");
        }
    });
}



export function useFetchProjects() {
    const dexhireProgram = useGetProgram();
    const { selectedAccount } = useAuthorization();

    return useQuery({
        queryKey: ['projects', selectedAccount?.publicKey?.toString()],
        enabled: !!selectedAccount && !!dexhireProgram,
        staleTime: 10_000,
        async queryFn() {
            if (!selectedAccount || !dexhireProgram) return [];

            try {
                const all = await dexhireProgram.account.project.all();
                if (!Array.isArray(all)) return [];

                return all
                    .filter(({ account }) =>
                        account.creator.equals(selectedAccount.publicKey) ||
                        account.freelancer.equals(selectedAccount.publicKey),
                    )
                    .map(({ publicKey, account }) => ({
                        id: publicKey.toString(),
                        title: account.name,
                        description: account.about,
                        clientId: account.creator.toString(),
                        freelancerId: account.freelancer.toString(),
                        budget: Number(account.price),
                        deadline: account.deadline.toNumber() * 1000,
                        isCompleted: account.isCompleted,
                        status: account.isCompleted
                            ? 'completed'
                            : account.freelancer.equals(PublicKey.default)
                                ? 'open'
                                : 'active',
                    }));
            } catch (err) {
                console.error('useFetchProjects error:', err);
                return [];
            }
        },
    });
}

export function useFetchClientProjects() {
    const connection = useConnection();
    const { selectedAccount } = useAuthorization();

    return useQuery({
        queryKey: ['client-projects', selectedAccount?.publicKey?.toString()],
        queryFn: async () => {
            if (!selectedAccount) return [];

            const { AnchorProvider } = await import('@coral-xyz/anchor');
            const provider = new AnchorProvider(
                connection,
                { publicKey: selectedAccount.publicKey, signTransaction: () => { throw new Error() }, signAllTransactions: () => { throw new Error() } },
                { commitment: 'confirmed' }
            );
            const program = getDexhireProgram(provider);

            // 1. fetch ALL projects
            const rawProjects = await program.account.project.all();

            // 2. keep ONLY the ones I CREATED
            const clientProjects = rawProjects.filter(
                ({ account }) => account.creator.equals(selectedAccount.publicKey)
            );

            // 3. collect unique creators (only me, but reuse same batch logic)
            const creatorSet = new Set([selectedAccount.publicKey.toString()]);
            const clientProfiles = await Promise.all(
                Array.from(creatorSet).map(async pk => {
                    const clientPDA = PDA.clientProfile(new PublicKey(pk));
                    try {
                        const acc = await program.account.clientProfile.fetch(clientPDA);
                        return { pubkey: pk, name: acc.name, avatar: acc.avatar };
                    } catch {
                        return { pubkey: pk, name: 'Anonymous', avatar: '' };
                    }
                })
            );
            const profileMap = Object.fromEntries(
                clientProfiles.map(p => [p.pubkey, { name: p.name, avatar: p.avatar }])
            );

            // 4. map to UI shape
            return clientProjects.map(({ publicKey, account }) => {
                const profile = profileMap[account.creator.toString()] || { name: 'Anonymous', avatar: '' };

                let status: ChainProject['status'] = account.isCompleted ? 'completed'
                    : account.githubLink ? 'work_submitted'
                        : !account.freelancer.equals(PublicKey.default) ? 'in_progress'
                            : account.isPublic ? 'approved' : 'created';

                return {
                    id: publicKey.toString(),
                    title: account.name,
                    description: account.about,
                    budget: account.price.toNumber(),
                    clientId: account.creator.toString(),
                    clientWallet: account.creator.toString(),
                    client: {
                        id: account.creator.toString(),
                        name: profile.name,
                        avatar: profile.avatar,
                        isVerified: false,
                        email: '',
                        userType: 'client',
                        createdAt: new Date().toISOString(),
                    },
                    status,
                    createdAt: new Date(account.start * 1000).toISOString(),
                    deadline: account.deadline ? new Date(account.deadline * 1000).toISOString() : undefined,
                    proposals: account.proposal.toNumber(),
                    attachments: [],
                    isPublic: account.isPublic,
                    freelancerId: !account.freelancer.equals(PublicKey.default) ? account.freelancer.toString() : undefined,
                    githubLink: account.githubLink || undefined,
                    workSubmittedAt: account.workSubmittedAt ? new Date(account.workSubmittedAt * 1000).toISOString() : undefined,
                    isCompleted: account.isCompleted,
                } as ChainProject;
            });
        },
        enabled: !!selectedAccount,
        refetchInterval: 5_000,
    });
}

export function useFetchAllPublicProjects() {
    const connection = useConnection();
    const { selectedAccount } = useAuthorization();

    return useQuery({
        queryKey: ['all-public-projects'],
        queryFn: async () => {
            if (!selectedAccount) return [];

            const { AnchorProvider } = await import('@coral-xyz/anchor');
            const provider = new AnchorProvider(
                connection,
                { publicKey: selectedAccount.publicKey, signTransaction: () => { throw new Error() }, signAllTransactions: () => { throw new Error() } },
                { commitment: 'confirmed' }
            );
            const program = getDexhireProgram(provider);

            // 1. fetch ALL projects
            const rawProjects = await program.account.project.all();

            // 2. keep ONLY public projects that are approved and don't have a freelancer assigned
            const publicProjects = rawProjects.filter(
                ({ account }) =>
                    account.isPublic &&
                    !account.freelancer.equals(PublicKey.default) === false && // No freelancer assigned
                    !account.isCompleted // Not completed
            );

            // 3. collect unique creators
            const creatorSet = new Set<string>();
            publicProjects.forEach(({ account }) => {
                creatorSet.add(account.creator.toString());
            });

            // 4. fetch client profiles
            const clientProfiles = await Promise.all(
                Array.from(creatorSet).map(async pk => {
                    const clientPDA = PDA.clientProfile(new PublicKey(pk));
                    try {
                        const acc = await program.account.clientProfile.fetch(clientPDA);
                        return { pubkey: pk, name: acc.name, avatar: acc.avatar };
                    } catch {
                        return { pubkey: pk, name: 'Anonymous', avatar: '' };
                    }
                })
            );
            const profileMap = Object.fromEntries(
                clientProfiles.map(p => [p.pubkey, { name: p.name, avatar: p.avatar }])
            );

            // 5. map to UI shape
            return publicProjects.map(({ publicKey, account }) => {
                const profile = profileMap[account.creator.toString()] || { name: 'Anonymous', avatar: '' };

                let status: ChainProject['status'] = account.isCompleted ? 'completed'
                    : account.githubLink ? 'work_submitted'
                        : !account.freelancer.equals(PublicKey.default) ? 'in_progress'
                            : account.isPublic ? 'approved' : 'created';

                return {
                    id: publicKey.toString(),
                    title: account.name,
                    description: account.about,
                    budget: account.price.toNumber(),
                    clientId: account.creator.toString(),
                    clientWallet: account.creator.toString(),
                    client: {
                        id: account.creator.toString(),
                        name: profile.name,
                        avatar: profile.avatar,
                        isVerified: false,
                        email: '',
                        userType: 'client',
                        createdAt: new Date().toISOString(),
                    },
                    status,
                    createdAt: new Date(account.start * 1000).toISOString(),
                    deadline: account.deadline ? new Date(account.deadline * 1000).toISOString() : undefined,
                    proposals: account.proposal.toNumber(),
                    attachments: [],
                    isPublic: account.isPublic,
                    freelancerId: !account.freelancer.equals(PublicKey.default) ? account.freelancer.toString() : undefined,
                    githubLink: account.githubLink || undefined,
                    workSubmittedAt: account.workSubmittedAt ? new Date(account.workSubmittedAt * 1000).toISOString() : undefined,
                    isCompleted: account.isCompleted,
                } as ChainProject;
            });
        },
        enabled: !!selectedAccount,
        refetchInterval: 5_000,
    });
}

export function useFetchClientProposals() {
    const connection = useConnection();
    const { selectedAccount } = useAuthorization();

    return useQuery({
        queryKey: ['client-proposals', selectedAccount?.publicKey?.toString()],
        queryFn: async () => {
            if (!selectedAccount) return [];

            const { AnchorProvider } = await import('@coral-xyz/anchor');
            const provider = new AnchorProvider(
                connection,
                { publicKey: selectedAccount.publicKey, signTransaction: () => { throw new Error() }, signAllTransactions: () => { throw new Error() } },
                { commitment: 'confirmed' }
            );
            const program = getDexhireProgram(provider);

            // 1. fetch ALL proposals
            const rawProposals = await program.account.proposal.all();

            // 2. get client PDA to filter proposals for this client's projects
            const clientPDA = PDA.clientProfile(selectedAccount.publicKey);
            console.log('client profile fetched from proposal context',clientPDA.toBase58());

            // 3. keep ONLY the proposals for projects I CREATED
            const clientProposals = rawProposals.filter(
                ({ account }) => account.client.equals(clientPDA)
            );
            console.log('client proposals fetched from proposal context',clientProposals.length);
            console.log('client proposals',clientProposals);

            // 4. collect unique freelancers to fetch their profiles
            const freelancerSet = new Set<string>();
            clientProposals.forEach(({ account }) => {
                freelancerSet.add(account.freelancerSigner.toString());
            });

            // 5. fetch freelancer profiles
            const freelancerProfiles = await Promise.all(
                Array.from(freelancerSet).map(async pk => {
                    const freelancerPDA = PDA.freelancerProfile(new PublicKey(pk));
                    try {
                        const acc = await program.account.freelancerProfile.fetch(freelancerPDA);
                        return { pubkey: pk, name: acc.name, avatar: acc.avatar, email: acc.email };
                    } catch {
                        return { pubkey: pk, name: 'Anonymous', avatar: '', email: '' };
                    }
                })
            );
            const profileMap = Object.fromEntries(
                freelancerProfiles.map(p => [p.pubkey, { name: p.name, avatar: p.avatar, email: p.email }])
            );

            // 6. map to UI shape
            return clientProposals.map(({ publicKey, account }) => {
                const freelancerProfile = profileMap[account.freelancerSigner.toString()] || {
                    name: 'Anonymous',
                    avatar: '',
                    email: ''
                };

                let status: 'pending' | 'accepted' | 'rejected' = 'pending';
                if (account.isAccepted) {
                    status = 'accepted';
                } else if (account.isRejected) {
                    status = 'rejected';
                }

                return {
                    id: publicKey.toString(),
                    projectId: account.project.toString(),
                    freelancerId: account.freelancerSigner.toString(),
                    freelancer: {
                        id: account.freelancerSigner.toString(),
                        name: freelancerProfile.name,
                        avatar: freelancerProfile.avatar,
                        email: freelancerProfile.email,
                        isVerified: false,
                        userType: 'freelancer' as const,
                        createdAt: new Date().toISOString(),
                    },
                    coverLetter: account.message,
                    proposedRate: 0, // This might need to be fetched from a different source or calculated
                    estimatedDuration: 'Not specified', // This might need to be fetched from a different source
                    status,
                    createdAt: new Date().toISOString(), // You might want to add a timestamp field to the proposal account
                };
            });
        },
        enabled: !!selectedAccount,
        refetchInterval: 5_000,
    });
}

export function useFetchProposal(proposalPDA: PublicKey) {
    const dexhireProgram = useGetProgram();
    const { selectedAccount } = useAuthorization();
    return useQuery({
        queryKey: ['proposal', proposalPDA.toString()],
        queryFn: async () => {
            if (!dexhireProgram || !proposalPDA || !selectedAccount) return null;
            // fecthing proposal
            const allProposal = await dexhireProgram.account.proposal.all();

            const clientPDA = PDA.clientProfile(selectedAccount.publicKey);

            const clientProposals = allProposal.filter(
                ({ account }) => account.client.equals(clientPDA)
            );

            const proposal = clientProposals.find(
                ({ publicKey }) => publicKey.equals(proposalPDA)
            );

            return proposal;
        }
    })
}