import { getDexhireProgram } from '@/components/data/dexhire-exports';
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

export interface OnChainProfile {
    name: string;
    email: string;
    bio: string;
    country: string;
    linkedin: string;
    authority: PublicKey;
    bump: number;
}

export async function fetchProfile(owner: PublicKey, provider: AnchorProvider) {
    const program = getDexhireProgram(provider);
    console.log('[fetchProfile] program loaded', program.programId.toString());

    // 1. try client
    const [clientPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('client'), owner.toBuffer()],
        program.programId
    );
    console.log('[fetchProfile] clientPDA', clientPDA.toString());
    const clientAcc = await program.account.clientProfile.fetchNullable(clientPDA).catch(e => {
        console.error('[fetchProfile] client fetch failed', e);
        return null;
    });
    console.log('[fetchProfile] clientAcc exists?', !!clientAcc);
    if (clientAcc) return { ...clientAcc, userType: 'client' };

    // 2. try freelancer
    const [freelancerPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('freelancer'), owner.toBuffer()],
        program.programId
    );
    console.log('[fetchProfile] freelancerPDA', freelancerPDA.toString());
    const freelancerAcc = await program.account.freelancerProfile.fetchNullable(freelancerPDA).catch(e => {
        console.error('[fetchProfile] freelancer fetch failed', e);
        return null;
    });
    console.log('[fetchProfile] freelancerAcc exists?', !!freelancerAcc);
    if (freelancerAcc) return { ...freelancerAcc, userType: 'freelancer' };

    return null;
}