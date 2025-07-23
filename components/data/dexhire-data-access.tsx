import {
    PublicKey,
    SystemProgram,
    Transaction,
    Connection,
    VersionedTransaction,
    TransactionMessage
} from "@solana/web3.js";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { useConnection } from "../solana/solana-provider";
import { useMutation } from "@tanstack/react-query";
import { DEXHIRE_PROGRAM_ID, getDexhireProgram } from '@/components/data/dexhire-exports';
import { useMobileWallet } from '@/components/solana/use-mobile-wallet';
import { useWalletUi } from '@/components/solana/use-wallet-ui';
import { useMemo } from "react";
import { useAuthorization } from "../solana/use-authorization";
import { useCluster } from "../cluster/cluster-provider";

export const PROGRAM_ID = DEXHIRE_PROGRAM_ID;

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

    proposal: (project: PublicKey, freelancer: PublicKey) =>
        PublicKey.findProgramAddressSync(
            [Buffer.from('proposal'), project.toBuffer(), freelancer.toBuffer()],
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
    const dexhireProgramId = useMemo(() => new PublicKey(DEXHIRE_PROGRAM_ID), []);
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
            const clientPDA = PDA.clientProfile(publicKey);
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
    const cluster = useCluster();
    const { selectedAccount } = useAuthorization();
    const dexhireProgramId = useMemo(() => new PublicKey(DEXHIRE_PROGRAM_ID), []);
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
    const dexhireProgramId = useMemo(() => new PublicKey(DEXHIRE_PROGRAM_ID), []);
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

    return useMutation<string, Error, {}>({
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
    const dexhireProgramId = useMemo(() => new PublicKey(DEXHIRE_PROGRAM_ID), []);
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
    const cluster = useCluster();
    const { selectedAccount } = useAuthorization();
    const dexhireProgramId = useMemo(() => new PublicKey(DEXHIRE_PROGRAM_ID), []);
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
    const dexhireProgramId = useMemo(() => new PublicKey(DEXHIRE_PROGRAM_ID), []);

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
    const cluster = useCluster();
    const { selectedAccount } = useAuthorization();
    const dexhireProgramId = useMemo(() => new PublicKey(DEXHIRE_PROGRAM_ID), []);
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
            let publicKey;
            if (walletUiAccount && walletUiAccount.publicKey) {
                publicKey = walletUiAccount.publicKey;
            } else {
                const mobileAccount = await connect();
                publicKey = mobileAccount.publicKey;
            }
            if (!publicKey) throw new Error("Wallet not initialized");
            const clientPDA = PDA.clientProfile(publicKey);
            const projectPDA = PDA.project(name, clientPDA, publicKey);
            const vaultPDA = PDA.vault(projectPDA);

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
            const {
                context: { slot: minContextSlot },
            } = await connection.getLatestBlockhashAndContext('confirmed');
            const tx = await buildLegacyTx(connection, [ix], publicKey);
            const txid = await signAndSendTransaction(tx, minContextSlot);
            return txid;
        },
        onSuccess: () => {
            console.log("Project created successfully");
        }
    });
}

export function useFundProject() {
    const connection = useConnection();
    const { signAndSendTransaction } = useMobileWallet();
    const { account: walletUiAccount } = useWalletUi();
    const { connect } = useMobileWallet();
    const cluster = useCluster();
    const { selectedAccount } = useAuthorization();
    const dexhireProgramId = useMemo(() => new PublicKey(DEXHIRE_PROGRAM_ID), []);
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

    return useMutation<string, Error, { lamports: BN; projectPDA: PublicKey; vaultPDA: PublicKey }>({
        mutationKey: ['fund-project'],
        mutationFn: async ({ lamports, projectPDA, vaultPDA }) => {
            let publicKey;
            if (walletUiAccount && walletUiAccount.publicKey) {
                publicKey = walletUiAccount.publicKey;
            } else {
                const mobileAccount = await connect();
                publicKey = mobileAccount.publicKey;
            }
            if (!publicKey) throw new Error("Wallet not initialized");
            const ix = await dexhireProgram?.methods
                .fundProject(lamports)
                .accountsStrict({ client: publicKey, project: projectPDA, vault: vaultPDA, systemProgram: SystemProgram.programId, })
                .instruction();
            const {
                context: { slot: minContextSlot },
            } = await connection.getLatestBlockhashAndContext('confirmed');
            const tx = await buildLegacyTx(connection, [ix], publicKey);
            const txid = await signAndSendTransaction(tx, minContextSlot);
            return txid;
        },
        onSuccess: () => {
            console.log("Project funded successfully");
        }
    });
}

export function useApproveProject() {
    const connection = useConnection();
    const { signAndSendTransaction } = useMobileWallet();
    const { account: walletUiAccount } = useWalletUi();
    const { connect } = useMobileWallet();
    const { selectedAccount } = useAuthorization();
    const dexhireProgramId = useMemo(() => new PublicKey(DEXHIRE_PROGRAM_ID), []);
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

    return useMutation<string, Error, { name: string }>({
        mutationKey: ['approve-project'],
        mutationFn: async ({ name }) => {
            let publicKey;
            if (walletUiAccount && walletUiAccount.publicKey) {
                publicKey = walletUiAccount.publicKey;
            } else {
                const mobileAccount = await connect();
                publicKey = mobileAccount.publicKey;
            }
            if (!publicKey) throw new Error("Wallet not initialized");
            const clientPDA = PDA.clientProfile(publicKey);
            const projectPDA = PDA.project(name, clientPDA, publicKey);
            const ix = await dexhireProgram?.methods
                .approveProject(name)
                .accountsStrict({ project: projectPDA, owner: publicKey, client: clientPDA, systemProgram: SystemProgram.programId, })
                .instruction();
            const {
                context: { slot: minContextSlot },
            } = await connection.getLatestBlockhashAndContext('confirmed');
            const tx = await buildLegacyTx(connection, [ix], publicKey);
            const txid = await signAndSendTransaction(tx, minContextSlot);
            return txid;
        },
        onSuccess: () => {
            console.log("Project approved successfully");
        }
    });
}
