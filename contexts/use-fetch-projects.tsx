// src/hooks/use-fetch-projects.ts
import { useGetProgram } from '@/components/data/dexhire-data-access';
import { getDexhireProgram } from '@/components/data/dexhire-exports';
import { useConnection } from '@/components/solana/solana-provider';
import { useAuthorization } from '@/components/solana/use-authorization';
import { formatTimeAgo } from '@/components/utils/formatTimeAgo';
import { Project } from '@/types';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';


const PROGRAM_ID = new PublicKey('341BQ4r4HykJSTSr9XKWeR2fDt9d5WCSUCn4VS4q7iyg');


export async function fetchClientDetails(creatorPublicKey: PublicKey) {
    const provider = new AnchorProvider(useConnection(), { publicKey: creatorPublicKey } as any, { commitment: 'processed' });
    const dexhireProgram = getDexhireProgram(provider);
    console.log('[useFetchClientDetails] dexhireProgram:', dexhireProgram);
    if (!dexhireProgram) return null;
    const clientAccount = await dexhireProgram.account.clientProfile.fetchNullable(creatorPublicKey);
    if (!clientAccount) return null;
  
    return {
      id: creatorPublicKey.toBase58(),
      name: clientAccount.name,
      email: clientAccount.email,
      isVerified: true,
      avatar: clientAccount.avatar,
      location: clientAccount.country,
      userType: 'client',
      createdAt: clientAccount.joinedAt.toNumber(),
    };
  };

// src/hooks/use-fetch-projects.ts
export function useFetchProjects() {
    const connection = useConnection();
    const { selectedAccount } = useAuthorization();

    return useQuery<Project[]>({
        queryKey: ['projects', selectedAccount?.publicKey.toBase58()],
        queryFn: async () => {
            if (!selectedAccount) return [];

            const provider = new AnchorProvider(connection, { publicKey: selectedAccount.publicKey } as any, { commitment: 'processed' });
            const program = getDexhireProgram(provider);

            // 1. Try Anchor helper
            try {
                const accounts = await (program.account as any).project?.all();
                if (!accounts) throw new Error('project helper not found');
                console.log('[fetchProjects] accounts:', accounts);

                return accounts.map(({ account, publicKey }: { account: any; publicKey: PublicKey }) => ({
                    id: publicKey.toBase58(),
                    title: account.name,
                    description: account.about,
                    budget: account.price.toNumber(),
                    clientId: account.creator.toBase58(),
                    client: fetchClientDetails(account.creator),
                    status: 'open',
                    createdAt: formatTimeAgo(new Date().toISOString()),
                    deadline: account.deadline.isZero()
                        ? undefined
                        : new Date(account.deadline.toNumber() * 1000).toISOString(),
                    proposals: 0,
                    attachments: [],
                }));
            } catch {
                // 2️⃣  fallback (raw getProgramAccounts) – optional
                const raw = await connection.getProgramAccounts(PROGRAM_ID, { filters: [{ dataSize: 248 }] });
                console.log('[fetchProjects] raw:', raw);
                return raw.map(({ pubkey, account }) => ({
                    id: pubkey.toBase58(),
                    title: account.data.subarray(8, 72).toString().replace(/\0/g, '').trim(),
                    description: account.data.subarray(72, 232).toString().replace(/\0/g, '').trim(),
                    budget: new BN(account.data.subarray(232, 240), 'le').toNumber(),
                    clientId: new PublicKey(account.data.subarray(248, 248 + 32)).toBase58(),
                    client: {
                        id: new PublicKey(account.data.subarray(248, 280)).toBase58(),
                        firstName: 'Client',
                        email: '',
                        isVerified: true,
                        avatar: '',
                        location: '',
                        userType: 'client',
                        createdAt: new Date().toISOString(),
                    },
                    status: 'open',
                    createdAt: new Date().toISOString(),
                    deadline: new BN(account.data.subarray(240, 248), 'le').isZero()
                        ? undefined
                        : new Date(new BN(account.data.subarray(240, 248), 'le').toNumber() * 1000).toISOString(),
                    proposals: 0,
                    attachments: [],
                }));
            }
        },
        enabled: !!selectedAccount,
    });
}