
// import {
//     PublicKey,
//     SystemProgram,
//     TransactionMessage,
//     VersionedTransaction
// } from "@solana/web3.js";

// import { AnchorProvider } from "@coral-xyz/anchor";
// import { useMemo } from "react";

// import { useMobileWallet } from '@/components/solana/use-mobile-wallet';
// import { useMutation, useQuery } from "@tanstack/react-query";
// import { DEXHIRE_PROGRAM_ID, getDexhireProgram } from '../../dexhire/src/dexhire-exports';
// import { useConnection } from "../solana/solana-provider";
// import { useAuthorization } from "../solana/use-authorization";
// import { useCluster } from "../cluster/cluster-provider";
// import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
// import { ClusterNetwork } from "../cluster/cluster-network";


// interface CreateFreelancerArgs { name: string; email: string; }
// interface UpdateFreelancerArgs {
//     name: string;
//     email: string;
//     country: string;
//     linkedin: string;
//     authority: PublicKey;
// }
// interface DeleteFreelancerArgs {
//     name: string;
//     authority: PublicKey;

// }

// const createMobileAnchorWallet = (selectedAccount: any): any => {
//     return {
//         publicKey: selectedAccount.publicKey,
//         signTransaction: async () => {
//             throw new Error("signTransaction is not implemented by mobile wallet");
//         },
//         signAllTransactions: async () => {
//             throw new Error("signAllTransactions is not implemented by mobile wallet");
//         },
//     };
// };

// export function useDexhireProgram() {
//     const connection = useConnection();
//     const cluster = useCluster();
//     const { selectedAccount } = useAuthorization();
//     const { connect, signAndSendTransaction } = useMobileWallet();
//     let account = async () => await connect();
//     const dexhireProgramId = useMemo(() => {
//         return new PublicKey(DEXHIRE_PROGRAM_ID);
//     }, []);
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
//         return getDexhireProgram(provider, dexhireProgramId);
//     }, [provider, dexhireProgramId]);

//     const accounts = useQuery({
//         queryKey: ['dexhire', 'all', { cluster }],
//         queryFn: () => dexhireProgram?.account.freelancerProfile.all(),
//     });

//     const getDexhireProgramAccount = useQuery({
//         queryKey: ['get-dexhireProgram-account', { cluster }],
//         queryFn: () => connection.getParsedAccountInfo(dexhireProgramId),
//     });

//     // createFreelancer mutation
//     const createFreelancer = useMutation<string, Error, CreateFreelancerArgs>({
//         mutationKey: ['create-freelancer'],
//         mutationFn: async ({ name, email }) => {
//             if (!dexhireProgram || !connection) throw new Error('Wallet, program, or connection not initialized');
//             try {
//                 const publicKey = await account();
//                 console.log(`Public Key: ${publicKey}`);
//                 const [freelancerProfilePDA] = PublicKey.findProgramAddressSync(
//                     [Buffer.from('freelancer'), Buffer.from(name), publicKey.publicKey.toBuffer()],
//                     dexhireProgramId
//                 );
//                 console.log(`freelancer key: ${freelancerProfilePDA.toBase58()}`);
//                 const ix = await dexhireProgram?.methods
//                     .createFreelanceProfile(name, email)
//                     .accountsStrict({
//                         freelanceprofile: freelancerProfilePDA,
//                         owner: publicKey.publicKey,
//                         systemProgram: SystemProgram.programId,
//                     }).instruction();
//                 console.log("Instruction done:", JSON.stringify(ix, null, 2));
//                 const {
//                     context: { slot: minContextSlot },
//                     value: { blockhash, lastValidBlockHeight },
//                 } = await connection.getLatestBlockhashAndContext('confirmed');
//                 console.log(" Fetched latest blockhash. Last Valid Height:", lastValidBlockHeight);
//                 const messageV0 = new TransactionMessage({
//                     payerKey: publicKey.publicKey,
//                     recentBlockhash: blockhash,
//                     instructions: [ix],
//                 }).compileToV0Message();
//                 console.log(" Compiled Transaction Message");
//                 const transaction = new VersionedTransaction(messageV0);
//                 const txid = await signAndSendTransaction(transaction, minContextSlot);
//                 console.log('Transaction sent:', txid);
//                 console.log(' Transaction Succesfully Confirmed!', '\n', `https://explorer.solana.com/tx/${txid}?cluster=devnet`);
//                 return txid;
//                 // console.log("✅ - Created Versioned Transaction");
//                 // console.log("Transaction:", JSON.stringify(transaction, null, 2));
//                 // const txid = await signAndSendTransaction(transaction, minContextSlot);
//                 // await connection.confirmTransaction({
//                 //     signature: txid,
//                 //     blockhash,
//                 //     lastValidBlockHeight
//                 // });
//                 // console.log(" Transaction Signed");
//                 // console.log(" Transaction sent to network");
//                 // console.log(' Transaction Succesfully Confirmed!', '\n', `https://explorer.solana.com/tx/${txid}?cluster=devnet`);
//                 // return txid;

//             } catch (error) {
//                 console.error('Error creating freelancer profile:', error);
//                 throw error;
//             }
//         },
//         onSuccess: () => {
//             accounts.refetch(); // 👈 Ensure account list updates after create
//         }
//     });



//     return {
//         createFreelancer,
//         accounts,
//         getDexhireProgramAccount,
//         dexhireProgram,
//         dexhireProgramId,
//     };
// }

// export function useDexhireProgramAccount({ account }: { account: PublicKey }) {
//     const cluster = useCluster();
//     const { dexhireProgram, dexhireProgramId, accounts } = useDexhireProgram();
//     const { selectedAccount } = useAuthorization();
//     const { connect, signAndSendTransaction } = useMobileWallet();
//     const connection = useConnection();

//     const accountQuery = useQuery({
//         queryKey: ['dexhire', 'fetch', { cluster, account }],
//         queryFn: () => dexhireProgram?.account.freelancerProfile.fetch(account),
//     });

//     const updateFreelancerProfile = useMutation<string, Error, UpdateFreelancerArgs>({
//         mutationKey: ['freelancer-profile', 'update-profile', { cluster }],
//         mutationFn: async ({ name, email, country, linkedin, authority }) => {
//             try {
//                 const publicKey =  account;
//                 console.log(`Public Key: ${publicKey}`);

//                 const [freelancerProfilePDA] = PublicKey.findProgramAddressSync(
//                     [Buffer.from('freelancer'), Buffer.from(name), publicKey.toBuffer()],
//                     dexhireProgramId
//                 );
//                 console.log(`freelancer key: ${freelancerProfilePDA.toBase58()}`);
//                 const ix = await dexhireProgram?.methods.updateFreelanceProfile(name, email, country, linkedin, authority)
//                     .accountsStrict({
//                         freelanceprofile: freelancerProfilePDA,
//                         owner: publicKey,
//                         systemProgram: SystemProgram.programId,
//                     }).instruction();
//                 if (!ix) {
//                     throw new Error('Instruction is undefined');
//                 }
//                 console.log(`Instruction done: ${ix}`);

//                 const { context, value } = await connection.getLatestBlockhashAndContext();
//                 const { blockhash, lastValidBlockHeight } = value;
//                 const messageV0 = new TransactionMessage({
//                     payerKey: publicKey,
//                     recentBlockhash: blockhash,
//                     instructions: [ix],
//                 }).compileToV0Message();
//                 console.log(`messagevo done: ${messageV0}`);

//                 const versionedTx = new VersionedTransaction(messageV0);
//                 console.log(`versionedtx done: ${versionedTx}`);

//                 // Send and sign transaction using mobile wallet
//                 const signature = await signAndSendTransaction(versionedTx, context.slot);
//                 console.log(`signature done: ${signature}`);
//                 await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });

//                 return signature;

//             } catch (error) {
//                 console.error('Error updating freelancer profile:', error);
//                 throw error;
//             }
//         },
//         onSuccess: () => {
//             accounts.refetch();
//         },
//     });

//     const deleteFreelancerProfile = useMutation<string, Error, DeleteFreelancerArgs>({
//         mutationKey: ['freelancer-profile', 'delete-profile', { cluster }],
//         mutationFn: async ({ authority }) => {
//             try {
//                 const account = await connect(); // from useMobileWallet
//                 const publicKey = account.publicKey;
//                 console.log(`Public Key: ${publicKey}`);

//                 const [freelancerProfilePDA] = PublicKey.findProgramAddressSync(
//                     [Buffer.from('freelancer'), Buffer.from(name), publicKey.toBuffer()],
//                     dexhireProgramId
//                 );
//                 console.log(`freelancer key: ${freelancerProfilePDA.toBase58()}`);
//                 const ix = await dexhireProgram?.methods.deleteFreelanceProfile(authority, name)
//                     .accountsStrict({
//                         freelanceprofile: freelancerProfilePDA,
//                         owner: publicKey,
//                         systemProgram: SystemProgram.programId,
//                     }).instruction();
//                 if (!ix) {
//                     throw new Error('Instruction is undefined');
//                 }
//                 console.log(`Instruction done: ${ix}`);

//                 const { context, value } = await connection.getLatestBlockhashAndContext();
//                 const { blockhash, lastValidBlockHeight } = value;
//                 const messageV0 = new TransactionMessage({
//                     payerKey: publicKey,
//                     recentBlockhash: blockhash,
//                     instructions: [ix],
//                 }).compileToV0Message();
//                 console.log(`messagevo done: ${messageV0}`);

//                 const versionedTx = new VersionedTransaction(messageV0);
//                 console.log(`versionedtx done: ${versionedTx}`);

//                 // Send and sign transaction using mobile wallet
//                 const signature = await signAndSendTransaction(versionedTx, context.slot);
//                 console.log(`signature done: ${signature}`);
//                 await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });

//                 return signature;

//             } catch (error) {
//                 console.error('Error deleting freelancer profile:', error);
//                 throw error;
//             }
//         }
//     });

//     return {
//         accountQuery,
//         updateFreelancerProfile,
//         deleteFreelancerProfile,
//     };
// }


// import {
//     PublicKey,
//     SystemProgram,
//     TransactionMessage,
//     TransactionSignature,
//     VersionedTransaction
// } from "@solana/web3.js";

// import { AnchorProvider } from "@coral-xyz/anchor";
// import { useMemo } from "react";
// import { useMobileWallet } from '@/components/solana/use-mobile-wallet';
// import { useMutation, useQuery } from "@tanstack/react-query";
// import {
//     DEXHIRE_PROGRAM_ID,
//     getDexhireProgram
// } from '../../dexhire/src/dexhire-exports';
// import { useConnection } from "../solana/solana-provider";
// import { useAuthorization } from "../solana/use-authorization";
// import { useCluster } from "../cluster/cluster-provider";
// import { useWalletUi } from '@/components/solana/use-wallet-ui';

// interface CreateFreelancerArgs {
//     name: string;
//     email: string;
// }

// interface UpdateFreelancerArgs {
//     name: string;
//     email: string;
//     country: string;
//     linkedin: string;
//     authority: PublicKey;
// }

// interface DeleteFreelancerArgs {
//     name: string;
//     authority: PublicKey;
// }

// const createMobileAnchorWallet = (selectedAccount: any): any => ({
//     publicKey: selectedAccount.publicKey,
//     signTransaction: async () => {
//         throw new Error("signTransaction is not implemented by mobile wallet");
//     },
//     signAllTransactions: async () => {
//         throw new Error("signAllTransactions is not implemented by mobile wallet");
//     },
// });

// export function useDexhireProgram() {
//     const connection = useConnection();
//     const cluster = useCluster();
//     const { selectedAccount } = useAuthorization();
//     const { signAndSendTransaction } = useWalletUi();
//     const { account: walletUiAccount } = useWalletUi();
//     const { connect } = useMobileWallet();
//     const dexhireProgramId = useMemo(() => new PublicKey(DEXHIRE_PROGRAM_ID), []);

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
//         return getDexhireProgram(provider, dexhireProgramId);
//     }, [provider, dexhireProgramId]);

//     const accounts = useQuery({
//         queryKey: ['dexhire', 'all', { cluster }],
//         queryFn: () => dexhireProgram?.account.freelancerProfile.all(),
//     });

//     const getDexhireProgramAccount = useQuery({
//         queryKey: ['get-dexhireProgram-account', { cluster }],
//         queryFn: () => connection.getParsedAccountInfo(dexhireProgramId),
//     });

//     const createFreelancer = useMutation<string, Error, CreateFreelancerArgs>({
//         mutationKey: ['create-freelancer'],
//         mutationFn: async ({ name, email }) => {
//             if (!dexhireProgram || !connection) throw new Error("Wallet, program, or connection not initialized");
//             try {
//                 // Use walletUiAccount if available, otherwise connect
//                 let publicKey;
//                 if (walletUiAccount && walletUiAccount.publicKey) {
//                     publicKey = walletUiAccount.publicKey;
//                 } else {
//                     const mobileAccount = await connect();
//                     publicKey = mobileAccount.publicKey;
//                 }
//                 const [freelancerProfilePDA] = PublicKey.findProgramAddressSync(
//                     [Buffer.from('freelancer'), Buffer.from(name), publicKey.toBuffer()],
//                     dexhireProgramId
//                 );
//                 const ix = await dexhireProgram.methods
//                     .createFreelanceProfile(name, email)
//                     .accountsStrict({
//                         freelanceprofile: freelancerProfilePDA,
//                         owner: publicKey,
//                         systemProgram: SystemProgram.programId,
//                     }).instruction();
//                 const {
//                     context: { slot: minContextSlot },
//                     value: { blockhash, lastValidBlockHeight },
//                 } = await connection.getLatestBlockhashAndContext("confirmed");
//                 const messageV0 = new TransactionMessage({
//                     payerKey: publicKey,
//                     recentBlockhash: blockhash,
//                     instructions: [ix],
//                 }).compileToV0Message();
//                 console.log("messageV0", messageV0);
//                 const transaction = new VersionedTransaction(messageV0);
//                 console.log("transaction", transaction);
//                 try {
//                     const txid = await signAndSendTransaction(transaction, minContextSlot);
//                     console.log("txid", txid);
//                     await connection.confirmTransaction({ signature: txid, blockhash, lastValidBlockHeight });
//                     console.log("confirmed");
//                     return txid;
//                 } catch (err: any) {
//                     let msg = err?.message || String(err);
//                     if (msg.includes('auth error') || msg.includes('not authorized')) {
//                         throw new Error('Authorization error: Please open your wallet app and approve the transaction, or reconnect your wallet.');
//                     } else if (msg.includes('host error') || msg.includes('network') || msg.includes('ECONNREFUSED')) {
//                         throw new Error('Network error: Please check your internet connection or try again later.');
//                     } else {
//                         throw new Error('Transaction failed: ' + msg);
//                     }
//                 }
//             } catch (error: any) {
//                 let msg = error?.message || String(error);
//                 if (msg.includes('auth error') || msg.includes('not authorized')) {
//                     throw new Error('Authorization error: Please open your wallet app and approve the transaction, or reconnect your wallet.');
//                 } else if (msg.includes('host error') || msg.includes('network') || msg.includes('ECONNREFUSED')) {
//                     throw new Error('Network error: Please check your internet connection or try again later.');
//                 } else {
//                     throw new Error('Error creating freelancer profile: ' + msg);
//                 }
//             }
//         },
//         onSuccess: () => {
//             accounts.refetch();
//         }
//     });

//     return {
//         createFreelancer,
//         accounts,
//         getDexhireProgramAccount,
//         dexhireProgram,
//         dexhireProgramId,
//     };
// }

// export function useDexhireProgramAccount({ account }: { account: PublicKey }) {
//     const cluster = useCluster();
//     const { dexhireProgram, dexhireProgramId, accounts } = useDexhireProgram();
//     const connection = useConnection();
//     const { connect, signAndSendTransaction } = useMobileWallet();

//     const accountQuery = useQuery({
//         queryKey: ['dexhire', 'fetch', { cluster, account }],
//         queryFn: () => dexhireProgram?.account.freelancerProfile.fetch(account),
//     });

//     const updateFreelancerProfile = useMutation<string, Error, UpdateFreelancerArgs>({
//         mutationKey: ['freelancer-profile', 'update-profile', { cluster }],
//         mutationFn: async ({ name, email, country, linkedin, authority }) => {
//             if (!dexhireProgram) throw new Error("Program not loaded");

//             const [freelancerProfilePDA] = PublicKey.findProgramAddressSync(
//                 [Buffer.from('freelancer'), Buffer.from(name), authority.toBuffer()],
//                 dexhireProgramId
//             );

//             const ix = await dexhireProgram.methods
//                 .updateFreelanceProfile(name, email, country, linkedin, authority)
//                 .accountsStrict({
//                     freelanceprofile: freelancerProfilePDA,
//                     owner: authority,
//                     systemProgram: SystemProgram.programId,
//                 }).instruction();

//             const {
//                 context: { slot: minContextSlot },
//                 value: { blockhash, lastValidBlockHeight },
//             } = await connection.getLatestBlockhashAndContext("confirmed");

//             const messageV0 = new TransactionMessage({
//                 payerKey: authority,
//                 recentBlockhash: blockhash,
//                 instructions: [ix],
//             }).compileToV0Message();
//             console.log("messageV0", messageV0);
//             const versionedTx = new VersionedTransaction(messageV0);
//             console.log("versionedTx", versionedTx);
//             const txid = await signAndSendTransaction(versionedTx, minContextSlot);
//             console.log("txid", txid);
//             await connection.confirmTransaction({ signature: txid, blockhash, lastValidBlockHeight });
//             console.log("confirmed");

//             return txid;
//         },
//         onSuccess: () => {
//             accounts.refetch();
//         },
//     });

//     const deleteFreelancerProfile = useMutation<string, Error, DeleteFreelancerArgs>({
//         mutationKey: ['freelancer-profile', 'delete-profile', { cluster }],
//         mutationFn: async ({ name, authority }) => {
//             if (!dexhireProgram) throw new Error("Program not loaded");

//             const mobileAccount = await connect();
//             const publicKey = mobileAccount.publicKey;

//             const [freelancerProfilePDA] = PublicKey.findProgramAddressSync(
//                 [Buffer.from('freelancer'), Buffer.from(name), publicKey.toBuffer()],
//                 dexhireProgramId
//             );

//             const ix = await dexhireProgram.methods
//                 .deleteFreelanceProfile(authority, name)
//                 .accountsStrict({
//                     freelanceprofile: freelancerProfilePDA,
//                     owner: publicKey,
//                     systemProgram: SystemProgram.programId,
//                 }).instruction();

//             const {
//                 context: { slot: minContextSlot },
//                 value: { blockhash, lastValidBlockHeight },
//             } = await connection.getLatestBlockhashAndContext("confirmed");

//             const messageV0 = new TransactionMessage({
//                 payerKey: publicKey,
//                 recentBlockhash: blockhash,
//                 instructions: [ix],
//             }).compileToV0Message();

//             const versionedTx = new VersionedTransaction(messageV0);
//             const signature = await signAndSendTransaction(versionedTx, minContextSlot);
//             await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });

//             return signature;
//         },
//         onSuccess: () => {
//             accounts.refetch();
//         },
//     });

//     return {
//         accountQuery,
//         updateFreelancerProfile,
//         deleteFreelancerProfile,
//     };
// }
