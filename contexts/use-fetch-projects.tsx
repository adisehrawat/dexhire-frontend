
import { PDA } from '@/components/data/dexhire-data-access';
import { getDexhireProgram } from '@/components/data/dexhire-exports';
import { useConnection } from '@/components/solana/solana-provider';
import { useAuthorization } from '@/components/solana/use-authorization';
import { Project as ChainProject } from '@/types';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';

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

        let status: ChainProject['status'] = account.isCompleted ? 'completed' :
        account.githubLink ? 'work_submitted' :
        !account.freelancer.equals(PublicKey.default) ? 'in_progress' :
        account.isPublic ? 'approved' : 'created'

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
    refetchInterval: 5_000, // Faster refresh for real-time updates
  });
}