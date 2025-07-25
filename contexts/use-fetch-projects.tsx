// // src/hooks/use-fetch-projects.ts
// import { getDexhireProgram } from '@/components/data/dexhire-exports';
// import { useConnection } from '@/components/solana/solana-provider';
// import { useAuthorization } from '@/components/solana/use-authorization';
// import { formatTimeAgo } from '@/components/utils/formatTimeAgo';
// import { Project } from '@/types';
// import { AnchorProvider, BN } from '@coral-xyz/anchor';
// import { PublicKey } from '@solana/web3.js';
// import { useQuery } from '@tanstack/react-query';


// const PROGRAM_ID = new PublicKey('341BQ4r4HykJSTSr9XKWeR2fDt9d5WCSUCn4VS4q7iyg');


// export async function fetchClientDetails(creatorPublicKey: PublicKey) {
//     const provider = new AnchorProvider(useConnection(), { publicKey: creatorPublicKey } as any, { commitment: 'processed' });
//     const dexhireProgram = getDexhireProgram(provider);
//     console.log('[useFetchClientDetails] dexhireProgram:', dexhireProgram);
//     if (!dexhireProgram) return null;
//     const clientAccount = await dexhireProgram.account.clientProfile.fetchNullable(creatorPublicKey);
//     if (!clientAccount) return null;
  
//     return {
//       id: creatorPublicKey.toBase58(),
//       name: clientAccount.name,
//       email: clientAccount.email,
//       isVerified: true,
//       avatar: clientAccount.avatar,
//       location: clientAccount.country,
//       userType: 'client',
//       createdAt: clientAccount.joinedAt.toNumber(),
//     };
//   };

// // src/hooks/use-fetch-projects.ts
// export function useFetchProjects() {
//     const connection = useConnection();
//     const { selectedAccount } = useAuthorization();

//     return useQuery<Project[]>({
//         queryKey: ['projects', selectedAccount?.publicKey.toBase58()],
//         queryFn: async () => {
//             if (!selectedAccount) return [];

//             const provider = new AnchorProvider(connection, { publicKey: selectedAccount.publicKey } as any, { commitment: 'processed' });
//             const program = getDexhireProgram(provider);

//             // 1. Try Anchor helper
//             try {
//                 const accounts = await (program.account as any).project?.all();
//                 if (!accounts) throw new Error('project helper not found');
//                 console.log('[fetchProjects] accounts:', accounts);


//                 return await Promise.all(
//                     (accounts || [])
//                         .filter((acc: any) => acc.account.creator.toBase58() === selectedAccount.publicKey.toBase58())
//                         .map(async (acc: any) => {
//                             let client = await fetchClientDetails(acc.account.creator);
//                             if (!client) {
//                                 client = {
//                                     id: acc.account.creator.toBase58(),
//                                     name: 'Client',
//                                     email: '',
//                                     isVerified: false,
//                                     avatar: '',
//                                     location: '',
//                                     userType: 'client',
//                                     createdAt: new Date().toISOString(),
//                                 };
//                             }

//                             return {
//                                 id: acc.publicKey.toBase58(),
//                                 title: acc.account.name,
//                                 description: acc.account.about,
//                                 budget: acc.account.price.toNumber(),
//                                 clientId: acc.account.creator.toBase58(),
//                                 client,
//                                 status: 'open',
//                                 createdAt: formatTimeAgo(new Date().toISOString()),
//                                 deadline: acc.account.deadline.isZero()
//                                     ? undefined
//                                     : new Date(acc.account.deadline.toNumber() * 1000).toISOString(),
//                                 proposals: 0,
//                                 attachments: [],
//                             };
//                         })
//                 );
//             } catch {
//                 // 2️⃣  fallback (raw getProgramAccounts) – optional
//                 const raw = await connection.getProgramAccounts(PROGRAM_ID, { filters: [{ dataSize: 248 }] });
//                 console.log('[fetchProjects] raw:', raw);
//                 return raw.map(({ pubkey, account }) => ({
//                     id: pubkey.toBase58(),
//                     title: account.data.subarray(8, 72).toString().replace(/\0/g, '').trim(),
//                     description: account.data.subarray(72, 232).toString().replace(/\0/g, '').trim(),
//                     budget: new BN(account.data.subarray(232, 240), 'le').toNumber(),
//                     clientId: new PublicKey(account.data.subarray(248, 248 + 32)).toBase58(),
//                     client: {
//                         id: new PublicKey(account.data.subarray(248, 280)).toBase58(),
//                         firstName: 'Client',
//                         email: '',
//                         isVerified: true,
//                         avatar: '',
//                         location: '',
//                         userType: 'client',
//                         createdAt: new Date().toISOString(),
//                     },
//                     status: 'open',
//                     createdAt: new Date().toISOString(),
//                     deadline: new BN(account.data.subarray(240, 248), 'le').isZero()
//                         ? undefined
//                         : new Date(new BN(account.data.subarray(240, 248), 'le').toNumber() * 1000).toISOString(),
//                     proposals: 0,
//                     attachments: [],
//                 }));
//             }
//         },
//         enabled: !!selectedAccount,
//     });
// }

// src/contexts/use-fetch-projects.ts
import { useQuery } from '@tanstack/react-query';
import { useConnection } from '@/components/solana/solana-provider';
import { useAuthorization } from '@/components/solana/use-authorization';
import { getDexhireProgram } from '@/components/data/dexhire-exports';
import { PublicKey } from '@solana/web3.js';
import { Project as ChainProject } from '@/types';
import { PDA } from '@/components/data/dexhire-data-access';

export function useFetchProjects() {
  const connection = useConnection();
  const { selectedAccount } = useAuthorization();

  return useQuery({
    queryKey: ['projects', selectedAccount?.publicKey?.toString()],
    queryFn: async () => {
      if (!selectedAccount) return [];

      // Anchor provider
      const { AnchorProvider } = await import('@coral-xyz/anchor');
      const provider = new AnchorProvider(
        connection,
        { publicKey: selectedAccount.publicKey, signTransaction: () => { throw new Error() }, signAllTransactions: () => { throw new Error() } },
        { commitment: 'confirmed' }
      );
      const program = getDexhireProgram(provider);

      // 1. fetch all project accounts
      const rawProjects = await program.account.project.all();

      // 2. build array of unique creator pubkeys
      const creatorSet = new Set(rawProjects.map(p => p.account.creator.toString()));
      const creators = Array.from(creatorSet);

      // 3. fetch all client-profile accounts in one batch
      const clientProfiles = await Promise.all(
        creators.map(async pk => {
          const clientPDA = PDA.clientProfile(new PublicKey(pk));
          try {
            const acc = await program.account.clientProfile.fetch(clientPDA);
            return { pubkey: pk, name: acc.name, avatar: acc.avatar };
          } catch {
            return { pubkey: pk, name: 'Anonymous', avatar: '' };
          }
        })
      );
      console.log('client avatar:', clientProfiles[0].avatar);

      // 4. map creator → profile
      const profileMap = Object.fromEntries(
        clientProfiles.map(p => [p.pubkey, { name: p.name, avatar: p.avatar }])
      );

      // 5. merge into final Project objects
      return rawProjects.map(({ publicKey, account }) => {
        const profile = profileMap[account.creator.toString()] || { name: 'Anonymous', avatar: '' };
        return {
          id: publicKey.toString(),
          title: account.name,
          description: account.about,
          budget: account.price.toNumber(),
          clientId: account.creator.toString(),
          client: {
            id: account.creator.toString(),
            name: profile.name,
            avatar: clientProfiles[0].avatar,
            isVerified: false,
            email: '',
            userType: 'client',
            createdAt: new Date().toISOString(),
          },
          status: account.isCompleted ? 'completed' : 'open',
          createdAt: new Date(account.start * 1000).toISOString(),
          deadline: account.deadline ? new Date(account.deadline * 1000).toISOString() : undefined,
          proposals: account.proposal.toNumber(),
          attachments: [],
        } as ChainProject;
      });
    },
    enabled: !!selectedAccount,
    refetchInterval: 15_000,
  });
}